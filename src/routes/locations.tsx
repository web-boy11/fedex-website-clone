import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import { createFileRoute } from '@tanstack/react-router'
import { Clock, LocateFixed, MapPin, Navigation, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHero } from '@/components/site/page-hero'
import { useLeaflet } from '@/components/map/use-leaflet'
import { locations, type Location } from '@/lib/site-data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/locations')({
  head: () => ({ meta: [{ title: 'Find a location — FedEx' }] }),
  component: LocationsPage,
})

const types: Array<Location['type'] | 'All'> = [
  'All',
  'Office',
  'Ship Center',
  'Drop Box',
  'Partner Retail',
]

function LocationsPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<(typeof types)[number]>('All')
  const [selected, setSelected] = useState<string>(locations[0].id)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return locations.filter(
      (l) =>
        (type === 'All' || l.type === type) &&
        (!q ||
          [l.name, l.address, l.city, l.zip, ...l.services]
            .join(' ')
            .toLowerCase()
            .includes(q)),
    )
  }, [query, type])

  return (
    <>
      <PageHero
        eyebrow="Locations"
        title="Drop off, pick up, print and pack — nearby"
        description="Search offices, ship centres, drop boxes and retail partners. Sample results are centred on Midtown Manhattan, on a live street map."
      >
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="loc-search" className="sr-only">
            Search by address, ZIP or service
          </label>
          <Input
            id="loc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Address, ZIP, or service (e.g. printing)"
            className="h-12 bg-background pl-10 text-base text-foreground"
          />
        </div>
      </PageHero>

      <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Location type">
          {types.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? 'default' : 'outline'}
              aria-pressed={type === t}
              onClick={() => setType(t)}
            >
              {t}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[26rem_1fr]">
          <ul className="space-y-3" aria-label={`${results.length} locations`}>
            {results.length === 0 && (
              <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No locations match. Try a different search or type.
              </li>
            )}
            {results.map((l, i) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelected(l.id)}
                  className={cn(
                    'w-full rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/40 motion-reduce:transition-none',
                    selected === l.id && 'border-primary ring-2 ring-primary/15',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground',
                        selected === l.id && 'bg-accent text-accent-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold">{l.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {l.address}, {l.city} {l.zip}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">{l.distance}</span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs">
                    <Clock className="size-3.5 text-emerald-600" aria-hidden />
                    <span className="font-semibold text-emerald-700">Open</span>
                    <span className="text-muted-foreground">· closes {l.closesAt}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{l.type}</Badge>
                    {l.services.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <LocationMap results={results} selected={selected} onSelect={setSelected} />
        </div>
      </section>
    </>
  )
}

function LocationMap({
  results,
  selected,
  onSelect,
}: {
  results: Array<Location>
  selected: string
  onSelect: (id: string) => void
}) {
  const active = results.find((l) => l.id === selected) ?? results[0]
  const mapRef = useRef<HTMLDivElement>(null)
  const leaflet = useLeaflet(mapRef, {
    center: [40.7484, -73.9857],
    zoom: 13,
    minZoom: 3,
    basemap: 'light',
  })
  const markers = useRef(new Map<string, Leaflet.Marker>())
  const [you, setYou] = useState<[number, number] | null>(null)

  // Draw a numbered pin for each visible result and fit the view to them.
  useEffect(() => {
    if (!leaflet) return
    const { L, map } = leaflet
    const group = L.layerGroup().addTo(map)
    markers.current.clear()
    results.forEach((l, i) => {
      const m = L.marker([l.lat, l.lng], {
        title: `${l.name}, ${l.address}`,
        riseOnHover: true,
        icon: L.divIcon({
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          html: `<div class="pin-marker" style="width:30px;height:30px"><span>${i + 1}</span></div>`,
        }),
      })
        .bindTooltip(l.name, { className: 'map-tip', direction: 'top', offset: [0, -30] })
        .on('click', () => onSelect(l.id))
        .addTo(group)
      markers.current.set(l.id, m)
    })
    if (results.length > 0) {
      map.fitBounds(
        results.map((l) => [l.lat, l.lng] as [number, number]),
        { padding: [50, 50], maxZoom: 15 },
      )
    }
    return () => {
      group.remove()
    }
  }, [leaflet, results, onSelect])

  // Highlight and pan to the selected location.
  useEffect(() => {
    if (!leaflet || !active) return
    for (const [id, m] of markers.current) {
      m.getElement()?.firstElementChild?.classList.toggle('is-active', id === active.id)
      if (id === active.id) m.setZIndexOffset(1000)
      else m.setZIndexOffset(0)
    }
    leaflet.map.panTo([active.lat, active.lng], { animate: true })
  }, [leaflet, active, results])

  // "You are here" marker.
  useEffect(() => {
    if (!leaflet || !you) return
    const { L, map } = leaflet
    const m = L.marker(you, {
      title: 'Your location',
      icon: L.divIcon({ className: '', iconSize: [18, 18], html: '<div class="you-marker" style="width:18px;height:18px"></div>' }),
    })
      .bindTooltip('You are here', { className: 'map-tip', direction: 'top', offset: [0, -10] })
      .addTo(map)
    map.flyTo(you, 13)
    return () => {
      m.remove()
    }
  }, [leaflet, you])

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setYou([pos.coords.latitude, pos.coords.longitude])
        toast('Showing your position', {
          description: 'Showing locations in New York City.',
        })
      },
      () => toast.error('We couldn’t get your location. Check browser permissions.'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  const directionsUrl = active
    ? `https://www.openstreetmap.org/directions?route=${you ? `${you[0]}%2C${you[1]}` : ''}%3B${active.lat}%2C${active.lng}#map=15/${active.lat}/${active.lng}`
    : undefined

  return (
    <div className="sticky top-40 h-fit overflow-hidden rounded-xl border bg-card">
      <div className="relative isolate aspect-[4/3] bg-secondary">
        <div
          ref={mapRef}
          className="absolute inset-0"
          role="region"
          aria-label="Map of nearby locations"
        />
        {!leaflet && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 animate-pulse motion-reduce:animate-none" aria-hidden /> Loading map…
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 z-[1000]">
          <Button size="sm" variant="secondary" className="shadow" onClick={locate}>
            <LocateFixed /> Use my location
          </Button>
        </div>
      </div>
      {active && (
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-bold">{active.name}</p>
            <p className="text-sm text-muted-foreground">{active.hours}</p>
          </div>
          <Button asChild>
            <a href={directionsUrl} target="_blank" rel="noreferrer">
              <Navigation /> Directions
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
