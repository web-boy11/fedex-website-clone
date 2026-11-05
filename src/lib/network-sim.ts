// Deterministic "live" flight simulation. Every visitor computes the same
// positions from the wall clock, so the map looks live without a backend.

import { distanceKm, greatCircle, along, type LatLng } from '@/lib/geo'
import { hubs, lanes, findHub, type Hub } from '@/lib/site-data'

/** One real second equals ten simulated minutes. */
export const TIME_SCALE = 600
const CRUISE_KMH = 850
/** Share of each cycle a flight spends on the ground turning around. */
const GROUND_SHARE = 0.14
const MIN_CYCLE_MS = 14_000

export type Flight = {
  id: string
  number: string
  from: Hub
  to: Hub
  path: Array<LatLng>
  km: number
  cycleMs: number
  offset: number
}

function buildFlights(): Array<Flight> {
  const out: Array<Flight> = []
  lanes.forEach((lane, li) => {
    const a = findHub(lane.from)
    const b = findHub(lane.to)
    if (!a || !b) return
    const count = Math.min(3, Math.max(1, Math.round(lane.flightsPerDay / 4)))
    for (let k = 0; k < count; k++) {
      const [from, to] = k % 2 === 0 ? [a, b] : [b, a]
      const km = distanceKm([from.lat, from.lng], [to.lat, to.lng])
      const airMs = ((km / CRUISE_KMH) * 3_600_000) / TIME_SCALE
      out.push({
        id: `f${li}-${k}`,
        number: `Flight ${(2100 + li * 17 + k * 5).toString()}`,
        from,
        to,
        path: greatCircle([from.lat, from.lng], [to.lat, to.lng], 80),
        km,
        cycleMs: Math.max(MIN_CYCLE_MS, airMs / (1 - GROUND_SHARE)),
        offset: (li * 0.373 + k * 0.519) % 1,
      })
    }
  })
  return out
}

export const flights = buildFlights()

export function flightState(flight: Flight, now: number) {
  const cycle = (now / flight.cycleMs + flight.offset) % 1
  const airborne = cycle < 1 - GROUND_SHARE
  const t = airborne ? cycle / (1 - GROUND_SHARE) : 1
  const { point, heading } = along(flight.path, t)
  const remainingKm = flight.km * (1 - t)
  const etaMin = Math.round((remainingKm / CRUISE_KMH) * 60)
  return { airborne, t, point, heading, remainingKm, etaMin }
}

/** Longitude shifts needed so a path that crosses ±180° is drawn on both sides. */
export function worldShifts(path: Array<LatLng>) {
  const shifts = [0]
  if (path.some(([, lng]) => lng < -180)) shifts.push(360)
  if (path.some(([, lng]) => lng > 180)) shifts.push(-360)
  return shifts
}

export const shift = (path: Array<LatLng>, by: number): Array<LatLng> =>
  by === 0 ? path : path.map(([lat, lng]) => [lat, lng + by])

/** Illustrative running count of packages in the network right now. */
export function packagesInMotion(now: number) {
  const msOfDay = now % 86_400_000
  const wave = Math.sin((msOfDay / 86_400_000) * Math.PI * 2) * 180_000
  return Math.round(4_600_000 + wave + (msOfDay / 1000) * 3.7)
}

export const totalDailyVolumeK = hubs.reduce((sum, h) => sum + h.dailyVolume, 0)

export function formatEta(min: number) {
  if (min <= 0) return 'Landing'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}
