import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import type * as Leaflet from 'leaflet'
import {
  Activity,
  AlertTriangle,
  Crosshair,
  Expand,
  Info,
  LocateFixed,
  Moon,
  Package,
  Plane,
  Search,
  Sun,
  Timer,
  Warehouse,
  X,
} from 'lucide-react'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  prefersReducedMotion,
  useLeaflet,
  type BasemapId,
} from '@/components/map/use-leaflet'
import {
  findHub,
  hubs,
  lanes,
  networkAlerts,
  regions,
  type Hub,
  type Region,
} from '@/lib/site-data'
import {
  flights,
  flightState,
  formatEta,
  packagesInMotion,
  shift,
  totalDailyVolumeK,
  worldShifts,
  type Flight,
} from '@/lib/network-sim'
import { greatCircle } from '@/lib/geo'
import { cn } from '@/lib/utils'

const searchSchema = z.object({ hub: z.string().optional() })

export const Route = createFileRoute('/network')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Live global network — FedEx' }] }),
  component: NetworkPage,
})

type RegionFilter = Region | 'All'
type Layers = { hubs: boolean; lanes: boolean; flights: boolean }

const WORLD_VIEW = { center: [28, 0] as [number, number], zoom: 2 }
const planeSvg =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>'

const inRegion = (h: Hub, r: RegionFilter) => r === 'All' || h.region === r

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [intervalMs])
  return now
}

function NetworkPage() {
  const { hub: hubParam } = Route.useSearch()
  const [selectedHub, setSelectedHub] = useState<string | null>(
    hubParam && findHub(hubParam) ? hubParam : null,
  )
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [follow, setFollow] = useState(false)
  const [region, setRegion] = useState<RegionFilter>('All')
  const [query, setQuery] = useState('')
  const [basemap, setBasemap] = useState<BasemapId>('dark')
  const [layers, setLayers] = useState<Layers>({
    hubs: true,
    lanes: true,
    flights: true,
  })
  const now = useNow()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leaflet = useLeaflet(mapRef, {
    center: WORLD_VIEW.center,
    zoom: WORLD_VIEW.zoom,
    minZoom: 2,
    maxZoom: 9,
    basemap,
  })

  // Imperative layer handles shared between effects.
  const handles = useRef<{
    hubMarkers: Map<string, Leaflet.Marker>
    laneLines: Array<{
      from: string
      to: string
      lines: Array<Leaflet.Polyline>
    }>
    planes: Array<{
      flight: Flight
      markers: Array<Leaflet.Marker>
      shifts: Array<number>
    }>
    groups: {
      hubs: Leaflet.LayerGroup
      lanes: Leaflet.LayerGroup
      flights: Leaflet.LayerGroup
    }
  } | null>(null)
  const visibleFlights = useRef<Set<string>>(new Set(flights.map((f) => f.id)))

  // Build hubs, lanes and planes once the map exists, then animate.
  useEffect(() => {
    if (!leaflet) return
    const { L, map } = leaflet
    const groups = {
      lanes: L.layerGroup().addTo(map),
      flights: L.layerGroup().addTo(map),
      hubs: L.layerGroup().addTo(map),
    }

    const laneLines = lanes.map((lane) => {
      const a = findHub(lane.from)
      const b = findHub(lane.to)
      if (!a || !b) return { from: lane.from, to: lane.to, lines: [] }
      const path = greatCircle([a.lat, a.lng], [b.lat, b.lng], 80)
      const lines = worldShifts(path).map((s) =>
        L.polyline(shift(path, s), {
          className: 'lane-line',
          interactive: false,
        }).addTo(groups.lanes),
      )
      return { from: lane.from, to: lane.to, lines }
    })

    const hubMarkers = new Map<string, Leaflet.Marker>()
    for (const h of hubs) {
      const size =
        h.kind === 'World hub' ? 16 : h.kind === 'Regional hub' ? 12 : 9
      const icon = L.divIcon({
        className: '',
        iconSize: [size, size],
        html: `<div class="hub-marker ${h.kind === 'World hub' ? 'is-world' : ''}" style="width:${size}px;height:${size}px">${
          h.kind === 'World hub' ? '<span class="hub-pulse"></span>' : ''
        }<span class="hub-dot" style="width:${size}px;height:${size}px"></span></div>`,
      })
      const marker = L.marker([h.lat, h.lng], {
        icon,
        title: `${h.city} (${h.code})`,
        keyboard: true,
        riseOnHover: true,
      })
        .bindTooltip(`${h.code} · ${h.city}`, {
          className: 'map-tip',
          direction: 'top',
          offset: [0, -8],
        })
        .on('click', () => {
          setSelectedFlight(null)
          setSelectedHub(h.id)
        })
        .addTo(groups.hubs)
      hubMarkers.set(h.id, marker)
    }

    const planes = flights.map((flight) => {
      const shifts = worldShifts(flight.path)
      const markers = shifts.map(() =>
        L.marker(flight.path[0], {
          icon: L.divIcon({
            className: 'plane-marker',
            html: planeSvg,
            iconSize: [18, 18],
          }),
          title: `${flight.number}: ${flight.from.code} → ${flight.to.code}`,
          keyboard: false,
        })
          .bindTooltip(
            `${flight.number} · ${flight.from.code} → ${flight.to.code}`,
            {
              className: 'map-tip',
              direction: 'top',
              offset: [0, -8],
            },
          )
          .on('click', () => {
            setSelectedHub(null)
            setFollow(false)
            setSelectedFlight(flight.id)
          }),
      )
      return { flight, markers, shifts }
    })

    handles.current = { hubMarkers, laneLines, planes, groups }

    // Animation loop: throttled rAF, or a slow interval for reduced motion.
    const reduced = prefersReducedMotion()
    let raf = 0
    let last = 0
    let interval = 0
    const step = () => {
      const t = Date.now()
      for (const p of planes) {
        const s = flightState(p.flight, t)
        const show = s.airborne && visibleFlights.current.has(p.flight.id)
        p.markers.forEach((m, i) => {
          if (show) {
            if (!groups.flights.hasLayer(m)) groups.flights.addLayer(m)
            m.setLatLng([s.point[0], s.point[1] + p.shifts[i]])
            const svg = m.getElement()?.firstElementChild as HTMLElement | null
            if (svg) svg.style.transform = `rotate(${s.heading - 45}deg)`
          } else if (groups.flights.hasLayer(m)) {
            groups.flights.removeLayer(m)
          }
        })
      }
    }
    const frame = (ts: number) => {
      if (ts - last > 33) {
        last = ts
        step()
      }
      raf = requestAnimationFrame(frame)
    }
    step()
    if (reduced) interval = window.setInterval(step, 3000)
    else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(interval)
      Object.values(groups).forEach((g) => g.remove())
      handles.current = null
    }
  }, [leaflet])

  // Layer toggles and region filter.
  useEffect(() => {
    const h = handles.current
    if (!leaflet || !h) return
    const { map } = leaflet
    for (const [key, group] of Object.entries(h.groups) as Array<
      [keyof Layers, Leaflet.LayerGroup]
    >) {
      if (layers[key] && !map.hasLayer(group)) group.addTo(map)
      if (!layers[key] && map.hasLayer(group)) group.remove()
    }
    for (const hub of hubs) {
      const m = h.hubMarkers.get(hub.id)
      if (!m) continue
      const show = inRegion(hub, region)
      if (show && !h.groups.hubs.hasLayer(m)) h.groups.hubs.addLayer(m)
      if (!show && h.groups.hubs.hasLayer(m)) h.groups.hubs.removeLayer(m)
    }
    const touches = (a: string, b: string) => {
      const ha = findHub(a)
      const hb = findHub(b)
      return !!ha && !!hb && (inRegion(ha, region) || inRegion(hb, region))
    }
    for (const lane of h.laneLines) {
      const show = touches(lane.from, lane.to)
      lane.lines.forEach((l) => {
        if (show && !h.groups.lanes.hasLayer(l)) h.groups.lanes.addLayer(l)
        if (!show && h.groups.lanes.hasLayer(l)) h.groups.lanes.removeLayer(l)
      })
    }
    visibleFlights.current = new Set(
      flights.filter((f) => touches(f.from.id, f.to.id)).map((f) => f.id),
    )
  }, [leaflet, layers, region])

  // Fit the view to the chosen region.
  useEffect(() => {
    if (!leaflet) return
    if (region === 'All') {
      leaflet.map.flyTo(WORLD_VIEW.center, WORLD_VIEW.zoom, { duration: 0.8 })
      return
    }
    const pts = hubs
      .filter((h) => h.region === region)
      .map((h) => [h.lat, h.lng] as [number, number])
    leaflet.map.flyToBounds(pts, {
      padding: [60, 60],
      maxZoom: 5,
      duration: 0.8,
    })
  }, [leaflet, region])

  // Highlight the selected hub and its lanes.
  useEffect(() => {
    const h = handles.current
    if (!leaflet || !h) return
    for (const [id, m] of h.hubMarkers) {
      m.getElement()?.firstElementChild?.classList.toggle(
        'is-active',
        id === selectedHub,
      )
    }
    for (const lane of h.laneLines) {
      const connected =
        !!selectedHub && (lane.from === selectedHub || lane.to === selectedHub)
      lane.lines.forEach((l) => {
        const el = l.getElement()
        el?.classList.toggle('is-connected', connected)
        el?.classList.toggle('is-dim', !!selectedHub && !connected)
        if (connected) l.bringToFront()
      })
    }
    const hub = selectedHub ? findHub(selectedHub) : undefined
    if (hub)
      leaflet.map.flyTo(
        [hub.lat, hub.lng],
        Math.max(leaflet.map.getZoom(), 4),
        { duration: 0.9 },
      )
  }, [leaflet, selectedHub])

  // Draw the selected flight's route: flown (solid) and ahead (dotted).
  const flight = selectedFlight
    ? flights.find((f) => f.id === selectedFlight)
    : undefined
  const flightNow = flight && now ? flightState(flight, now) : undefined
  const progressBucket = flightNow ? Math.round(flightNow.t * 40) : 0
  useEffect(() => {
    if (!leaflet || !flight) return
    const { L, map } = leaflet
    const s = flightState(flight, Date.now())
    const cut = Math.max(1, Math.round(s.t * (flight.path.length - 1)))
    const group = L.layerGroup().addTo(map)
    for (const sh of worldShifts(flight.path)) {
      L.polyline(shift(flight.path.slice(0, cut + 1), sh), {
        className: 'flight-path',
        interactive: false,
      }).addTo(group)
      L.polyline(shift(flight.path.slice(cut), sh), {
        className: 'flight-path is-ahead',
        interactive: false,
      }).addTo(group)
    }
    for (const p of handles.current?.planes ?? []) {
      p.markers.forEach((m) =>
        m
          .getElement()
          ?.classList.toggle('is-active', p.flight.id === flight.id),
      )
    }
    return () => {
      group.remove()
    }
  }, [leaflet, flight, progressBucket])

  // Follow mode keeps the selected aircraft centred.
  const following = follow && !!flight
  useEffect(() => {
    if (!leaflet || !following || !flightNow?.airborne) return
    leaflet.map.panTo(flightNow.point, { animate: true, duration: 0.9 })
  }, [leaflet, following, flightNow?.airborne, flightNow?.point])

  const hubList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return hubs.filter(
      (h) =>
        inRegion(h, region) &&
        (!q ||
          [h.city, h.code, h.country, h.kind]
            .join(' ')
            .toLowerCase()
            .includes(q)),
    )
  }, [query, region])

  const airborne = now
    ? flights.filter((f) => flightState(f, now).airborne).length
    : null
  const hub = selectedHub ? findHub(selectedHub) : undefined

  const resetView = () => {
    setSelectedHub(null)
    setSelectedFlight(null)
    setRegion('All')
    leaflet?.map.flyTo(WORLD_VIEW.center, WORLD_VIEW.zoom, { duration: 0.8 })
  }

  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  return (
    <>
      {/* Header band with live counters */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-content px-4 py-10 sm:px-6 md:py-14">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-accent uppercase">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Global network · Live
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
            The whole network, moving in real time
          </h1>
          <p className="mt-4 max-w-reading text-lg text-primary-foreground/75">
            Pan, zoom and click across a live world map of hubs, air lanes and
            aircraft. Pick a hub to see its lanes light up, or follow a flight
            across an ocean.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <LiveStat
              icon={Timer}
              label="Network time (UTC)"
              value={
                now ? new Date(now).toISOString().slice(11, 19) : '––:––:––'
              }
            />
            <LiveStat
              icon={Plane}
              label="Aircraft airborne"
              value={
                airborne === null ? '–' : `${airborne} / ${flights.length}`
              }
            />
            <LiveStat
              icon={Package}
              label="Packages in motion"
              value={now ? packagesInMotion(now).toLocaleString('en-US') : '–'}
            />
            <LiveStat
              icon={Activity}
              label="Network on-time"
              value={`${(hubs.reduce((s, h) => s + h.onTime, 0) / hubs.length).toFixed(1)}%`}
            />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          {/* Sidebar */}
          <aside className="space-y-5 lg:order-none">
            <div className="rounded-xl border bg-card p-4">
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Label htmlFor="hub-search" className="sr-only">
                  Search hubs
                </Label>
                <Input
                  id="hub-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, code or country"
                  className="pl-9"
                />
              </div>

              <div
                className="mt-4 flex flex-wrap gap-1.5"
                role="group"
                aria-label="Region"
              >
                {(['All', ...regions] as Array<RegionFilter>).map((r) => (
                  <Button
                    key={r}
                    size="xs"
                    variant={region === r ? 'default' : 'outline'}
                    aria-pressed={region === r}
                    onClick={() => setRegion(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>

              <fieldset className="mt-5 space-y-3 border-t pt-4">
                <legend className="sr-only">Map layers</legend>
                {(
                  [
                    ['hubs', 'Hubs & gateways'],
                    ['lanes', 'Air lanes'],
                    ['flights', 'Live aircraft'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`layer-${key}`} className="font-medium">
                      {label}
                    </Label>
                    <Switch
                      id={`layer-${key}`}
                      checked={layers[key]}
                      onCheckedChange={(v) =>
                        setLayers((l) => ({ ...l, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </fieldset>
            </div>

            <div className="rounded-xl border bg-card">
              <p className="border-b px-4 py-3 text-sm font-bold">
                {hubList.length} {hubList.length === 1 ? 'hub' : 'hubs'}
              </p>
              <ul
                className="max-h-[26rem] overflow-y-auto p-2"
                aria-label="Hubs"
              >
                {hubList.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">
                    No hubs match “{query}”.
                  </li>
                )}
                {hubList.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFlight(null)
                        setSelectedHub(h.id)
                      }}
                      aria-pressed={selectedHub === h.id}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary motion-reduce:transition-none',
                        selectedHub === h.id &&
                          'bg-secondary ring-1 ring-primary/30',
                      )}
                    >
                      <span className="w-10 font-mono text-xs font-bold text-primary">
                        {h.code}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {h.city}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {h.kind}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.dailyVolume}k/day
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Map */}
          <div
            ref={wrapperRef}
            className="relative isolate h-[70vh] min-h-[28rem] overflow-hidden rounded-xl border bg-foreground shadow-lg"
          >
            <div
              ref={mapRef}
              className="absolute inset-0"
              role="region"
              aria-label="Interactive world map of the shipping network"
            />
            {!leaflet && (
              <div className="absolute inset-0 grid place-items-center text-sm text-background/70">
                <span className="flex items-center gap-2">
                  <Plane
                    className="size-4 animate-pulse motion-reduce:animate-none"
                    aria-hidden
                  />{' '}
                  Loading live map…
                </span>
              </div>
            )}

            {/* Map toolbar */}
            <div className="absolute top-3 right-3 z-[1000] flex gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                className="shadow"
                onClick={() =>
                  setBasemap((b) => (b === 'dark' ? 'light' : 'dark'))
                }
              >
                {basemap === 'dark' ? <Sun /> : <Moon />}
                {basemap === 'dark' ? 'Streets' : 'Night'}
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                className="shadow"
                aria-label="Reset view"
                onClick={resetView}
              >
                <LocateFixed />
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                className="shadow"
                aria-label="Toggle full screen"
                onClick={toggleFullscreen}
              >
                <Expand />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute top-3 left-3 z-[1000] hidden rounded-lg bg-background/90 px-3 py-2 text-xs shadow backdrop-blur sm:block">
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="size-3 rounded-full border-2 border-white bg-[oklch(0.6_0.2_303)]" />{' '}
                  World hub
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full border-2 border-white bg-accent" />{' '}
                  Regional hub / gateway
                </li>
                <li className="flex items-center gap-2">
                  <Plane className="size-3" aria-hidden /> Aircraft in flight
                </li>
              </ul>
            </div>

            {/* Detail panel */}
            {(hub || flight) && (
              <div className="absolute bottom-3 left-3 z-[1000] w-[min(22rem,calc(100%-4.5rem))] rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  aria-label="Close details"
                  onClick={() => {
                    setSelectedHub(null)
                    setSelectedFlight(null)
                  }}
                >
                  <X />
                </Button>
                {hub && (
                  <HubDetail hub={hub} now={now} onSelectHub={setSelectedHub} />
                )}
                {flight && (
                  <FlightDetail
                    flight={flight}
                    state={flightNow}
                    follow={following}
                    onFollow={setFollow}
                    onSelectHub={(id) => {
                      setSelectedFlight(null)
                      setSelectedHub(id)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" aria-hidden />
          Live map tiles from OpenStreetMap and Esri. Hubs, volumes and flights
          are an illustrative simulation — one second on screen is ten minutes
          in the air.
        </p>
      </section>

      {/* Alerts + regions */}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Network advisories
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Proactive alerts, before customers have to ask.
            </p>
            <ul className="mt-5 space-y-3">
              {networkAlerts.map((a) => {
                const h = findHub(a.hub)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFlight(null)
                        setRegion('All')
                        setSelectedHub(a.hub)
                        wrapperRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        })
                      }}
                      className="flex w-full gap-3 rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md motion-reduce:transition-none"
                    >
                      {a.level === 'watch' ? (
                        <AlertTriangle
                          className="size-5 shrink-0 text-accent"
                          aria-hidden
                        />
                      ) : (
                        <Info
                          className="size-5 shrink-0 text-primary"
                          aria-hidden
                        />
                      )}
                      <span>
                        <span className="block text-sm font-bold">
                          {h?.city} ({h?.code})
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {a.text}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              By region
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a region to fly the map there.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {regions.map((r) => {
                const rh = hubs.filter((h) => h.region === r)
                const vol = rh.reduce((s, h) => s + h.dailyVolume, 0)
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedHub(null)
                      setSelectedFlight(null)
                      setRegion(r)
                      wrapperRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      })
                    }}
                    className="rounded-xl border bg-card p-5 text-left transition-shadow hover:shadow-md motion-reduce:transition-none"
                  >
                    <p className="text-xs font-bold tracking-widest text-accent uppercase">
                      {r}
                    </p>
                    <p className="mt-2 font-display text-2xl font-extrabold text-primary">
                      {(vol / 1000).toFixed(1)}M
                      <span className="text-sm font-semibold text-muted-foreground">
                        {' '}
                        /day
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rh.length} hubs ·{' '}
                      {Math.round((vol / totalDailyVolumeK) * 100)}% of volume
                    </p>
                    <Progress
                      value={(vol / totalDailyVolumeK) * 100}
                      className="mt-3 h-1.5"
                      aria-label={`${r} share of volume`}
                    />
                  </button>
                )
              })}
            </div>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/locations">
                <Warehouse /> Find a drop-off location near you
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

function LiveStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/70">
        <Icon className="size-3.5 text-accent" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 font-mono text-xl font-bold tabular-nums md:text-2xl">
        {value}
      </dd>
    </div>
  )
}

function HubDetail({
  hub,
  now,
  onSelectHub,
}: {
  hub: Hub
  now: number | null
  onSelectHub: (id: string) => void
}) {
  const connected = lanes
    .filter((l) => l.from === hub.id || l.to === hub.id)
    .map((l) => ({
      id: l.from === hub.id ? l.to : l.from,
      perDay: l.flightsPerDay,
    }))
  const inbound = now
    ? flights.filter((f) => f.to.id === hub.id && flightState(f, now).airborne)
        .length
    : 0
  const outbound = now
    ? flights.filter(
        (f) => f.from.id === hub.id && flightState(f, now).airborne,
      ).length
    : 0

  return (
    <div>
      <div className="flex items-center gap-2 pr-8">
        <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-xs font-bold text-primary-foreground">
          {hub.code}
        </span>
        <Badge variant="outline">{hub.kind}</Badge>
      </div>
      <h2 className="mt-2 text-lg font-bold">{hub.city}</h2>
      <p className="text-xs text-muted-foreground">
        {hub.country} · {hub.region}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Daily sort', `${hub.dailyVolume}k`],
          ['On-time', `${hub.onTime}%`],
          ['Gates', String(hub.gates)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-secondary p-2">
            <dt className="text-[11px] text-muted-foreground">{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Sort capacity in use</span>
          <span className="font-semibold">{hub.sortCapacity}%</span>
        </div>
        <Progress
          value={hub.sortCapacity}
          className="mt-1 h-1.5"
          aria-label="Sort capacity in use"
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{inbound}</span> inbound
        · <span className="font-semibold text-foreground">{outbound}</span>{' '}
        outbound in the air now
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {connected.map((c) => {
          const h = findHub(c.id)
          return (
            <Button
              key={c.id}
              size="xs"
              variant="outline"
              onClick={() => onSelectHub(c.id)}
            >
              {h?.code}{' '}
              <span className="text-muted-foreground">{c.perDay}/day</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function FlightDetail({
  flight,
  state,
  follow,
  onFollow,
  onSelectHub,
}: {
  flight: Flight
  state: ReturnType<typeof flightState> | undefined
  follow: boolean
  onFollow: (v: boolean) => void
  onSelectHub: (id: string) => void
}) {
  const pct = state ? Math.round(state.t * 100) : 0
  return (
    <div>
      <p className="flex items-center gap-1.5 pr-8 text-xs font-bold tracking-widest text-accent uppercase">
        <Plane className="size-3.5" aria-hidden /> {flight.number}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-left"
          onClick={() => onSelectHub(flight.from.id)}
        >
          <span className="block font-mono text-2xl font-extrabold text-primary">
            {flight.from.code}
          </span>
          <span className="block text-xs text-muted-foreground">
            {flight.from.city}
          </span>
        </button>
        <Plane className="size-5 text-muted-foreground" aria-hidden />
        <button
          type="button"
          className="text-right"
          onClick={() => onSelectHub(flight.to.id)}
        >
          <span className="block font-mono text-2xl font-extrabold text-primary">
            {flight.to.code}
          </span>
          <span className="block text-xs text-muted-foreground">
            {flight.to.city}
          </span>
        </button>
      </div>
      <Progress
        value={pct}
        className="mt-3 h-1.5"
        aria-label="Flight progress"
      />
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-secondary p-2">
          <dt className="text-[11px] text-muted-foreground">Progress</dt>
          <dd className="font-bold">
            {state?.airborne ? `${pct}%` : 'Landed'}
          </dd>
        </div>
        <div className="rounded-lg bg-secondary p-2">
          <dt className="text-[11px] text-muted-foreground">Remaining</dt>
          <dd className="font-bold">
            {state
              ? `${Math.round(state.remainingKm).toLocaleString('en-US')} km`
              : '–'}
          </dd>
        </div>
        <div className="rounded-lg bg-secondary p-2">
          <dt className="text-[11px] text-muted-foreground">ETA</dt>
          <dd className="font-bold">{state ? formatEta(state.etaMin) : '–'}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between rounded-lg border p-2.5">
        <Label
          htmlFor="follow-flight"
          className="flex items-center gap-1.5 text-sm"
        >
          <Crosshair className="size-4 text-accent" aria-hidden /> Follow this
          aircraft
        </Label>
        <Switch
          id="follow-flight"
          checked={follow}
          onCheckedChange={onFollow}
          disabled={!state?.airborne}
        />
      </div>
    </div>
  )
}
