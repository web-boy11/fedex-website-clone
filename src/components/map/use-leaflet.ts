import { useEffect, useState, type RefObject } from 'react'
import type * as Leaflet from 'leaflet'

export type LeafletLib = typeof Leaflet

const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const esriAttribution =
  'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
const esri = (service: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${service}/MapServer/tile/{z}/{y}/{x}`

// Keyless tile sources, so the map works on any deploy without secrets.
export const basemaps = {
  light: {
    label: 'Streets',
    layers: [
      {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: osmAttribution,
        maxNativeZoom: 19,
      },
    ],
  },
  dark: {
    label: 'Night',
    layers: [
      {
        url: esri('World_Dark_Gray_Base'),
        attribution: esriAttribution,
        maxNativeZoom: 16,
      },
      {
        url: esri('World_Dark_Gray_Reference'),
        attribution: '',
        maxNativeZoom: 16,
      },
    ],
  },
} as const

export type BasemapId = keyof typeof basemaps

/**
 * Create a Leaflet map inside `ref` on the client only. Leaflet touches
 * `window` at import time, so it is loaded lazily after hydration.
 */
export function useLeaflet(
  ref: RefObject<HTMLDivElement | null>,
  options: Leaflet.MapOptions & { basemap?: BasemapId },
) {
  const [state, setState] = useState<{
    L: LeafletLib
    map: Leaflet.Map
  } | null>(null)
  const { basemap = 'light', ...mapOptions } = options
  // Options are read once on mount, like Leaflet itself.
  const [initial] = useState(mapOptions)

  useEffect(() => {
    let cancelled = false
    let map: Leaflet.Map | undefined
    let observer: ResizeObserver | undefined
    void import('leaflet').then((mod) => {
      const L = ((mod as unknown as { default?: LeafletLib }).default ??
        mod) as LeafletLib
      if (cancelled || !ref.current) return
      map = L.map(ref.current, {
        zoomControl: false,
        worldCopyJump: false,
        ...initial,
      })
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      const m = map
      observer = new ResizeObserver(() => m.invalidateSize())
      observer.observe(ref.current)
      setState({ L, map })
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      map?.remove()
      setState(null)
    }
  }, [ref, initial])

  // Swap tile layers when the basemap changes.
  useEffect(() => {
    if (!state) return
    const tiles = basemaps[basemap].layers.map((l, i) =>
      state.L.tileLayer(l.url, {
        attribution: l.attribution,
        maxNativeZoom: l.maxNativeZoom,
        maxZoom: 19,
        zIndex: i,
      }).addTo(state.map),
    )
    state.map.getContainer().classList.toggle('map-light', basemap === 'light')
    return () => {
      tiles.forEach((t) => t.remove())
    }
  }, [state, basemap])

  return state
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
