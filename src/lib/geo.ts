// Small geodesy helpers for drawing realistic flight arcs and moving markers.

export type LatLng = [number, number]

const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

/** Points along the great-circle path between a and b (spherical slerp). */
export function greatCircle(
  a: LatLng,
  b: LatLng,
  segments = 64,
): Array<LatLng> {
  const [lat1, lng1] = [toRad(a[0]), toRad(a[1])]
  const [lat2, lng2] = [toRad(b[0]), toRad(b[1])]
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    )
  if (d === 0) return [a, b]

  const points: Array<LatLng> = []
  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x =
      A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y =
      A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    points.push([
      toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      toDeg(Math.atan2(y, x)),
    ])
  }
  return unwrap(points)
}

/** Keep longitudes continuous so lines crossing the antimeridian draw correctly. */
function unwrap(points: Array<LatLng>): Array<LatLng> {
  const out: Array<LatLng> = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const prev = out[i - 1][1]
    let lng = points[i][1]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    out.push([points[i][0], lng])
  }
  return out
}

/** Interpolate a position (and heading in degrees) at fraction t along a path. */
export function along(
  path: Array<LatLng>,
  t: number,
): { point: LatLng; heading: number } {
  const clamped = Math.min(Math.max(t, 0), 1)
  const scaled = clamped * (path.length - 1)
  const i = Math.min(Math.floor(scaled), path.length - 2)
  const f = scaled - i
  const [a, b] = [path[i], path[i + 1]]
  const point: LatLng = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
  // Screen-space heading in Web Mercator is close enough for an icon.
  const heading = toDeg(Math.atan2(b[1] - a[1], b[0] - a[0]))
  return { point, heading }
}

/** Distance in kilometres between two coordinates. */
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
