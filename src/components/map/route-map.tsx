import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

import { useLeaflet } from '@/components/map/use-leaflet'
import { along, distanceKm, greatCircle, type LatLng } from '@/lib/geo'

/** Origin → destination map with the package's current position. */
export function RouteMap({
  origin,
  destination,
  progress,
  originLabel,
  destinationLabel,
  flagged = false,
}: {
  origin: LatLng
  destination: LatLng
  progress: number
  originLabel: string
  destinationLabel: string
  flagged?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const leaflet = useLeaflet(ref, {
    center: origin,
    zoom: 4,
    scrollWheelZoom: false,
    basemap: 'light',
  })
  const km = Math.round(distanceKm(origin, destination))

  useEffect(() => {
    if (!leaflet) return
    const { L, map } = leaflet
    const path = greatCircle(origin, destination, 64)
    const cut = Math.max(1, Math.round(progress * (path.length - 1)))
    const group = L.layerGroup().addTo(map)
    L.polyline(path.slice(0, cut + 1), {
      className: 'route-line',
      interactive: false,
    }).addTo(group)
    if (cut < path.length - 1) {
      L.polyline(path.slice(cut), {
        className: 'route-line is-ahead',
        interactive: false,
      }).addTo(group)
    }
    const end = (p: LatLng, label: string, cls: string) =>
      L.marker(p, {
        title: label,
        icon: L.divIcon({
          className: '',
          iconSize: [14, 14],
          html: `<div class="hub-marker"><span class="hub-dot ${cls}" style="width:14px;height:14px"></span></div>`,
        }),
      })
        .bindTooltip(label, {
          className: 'map-tip',
          direction: 'top',
          offset: [0, -8],
        })
        .addTo(group)
    end(origin, `Origin · ${originLabel}`, '')
    end(path[path.length - 1], `Destination · ${destinationLabel}`, '')

    if (progress < 1) {
      const { point } = along(path, progress)
      L.marker(point, {
        title: 'Current position',
        icon: L.divIcon({
          className: '',
          iconSize: [22, 22],
          html: `<div class="hub-marker is-world" style="width:22px;height:22px"><span class="hub-pulse"></span><span class="hub-dot" style="width:22px;height:22px;${flagged ? 'background:var(--destructive)' : ''}"></span></div>`,
        }),
      })
        .bindTooltip(flagged ? 'Held — action needed' : 'Latest scan', {
          className: 'map-tip',
          direction: 'top',
          offset: [0, -12],
          permanent: true,
        })
        .addTo(group)
    }
    map.fitBounds(path, { padding: [40, 40], maxZoom: 9 })
    return () => {
      group.remove()
    }
  }, [
    leaflet,
    origin,
    destination,
    progress,
    originLabel,
    destinationLabel,
    flagged,
  ])

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="relative isolate aspect-[16/8] bg-secondary">
        <div
          ref={ref}
          className="absolute inset-0"
          role="region"
          aria-label={`Route map from ${originLabel} to ${destinationLabel}`}
        />
        {!leaflet && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin
                className="size-4 animate-pulse motion-reduce:animate-none"
                aria-hidden
              />{' '}
              Loading route map…
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
        <span className="text-muted-foreground">
          {km.toLocaleString('en-US')} km route · {Math.round(progress * 100)}%
          complete
        </span>
        <span className="text-xs text-muted-foreground">
          Map data © OpenStreetMap
        </span>
      </div>
    </div>
  )
}
