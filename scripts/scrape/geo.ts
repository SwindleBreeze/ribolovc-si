/** Small geometry helpers for the scraper ([lon, lat] order, as in GeoJSON). */

export type LonLat = [number, number];

const R = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

export function distKm(a: LonLat, b: LonLat): number {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Local planar projection (km) around a reference latitude; accurate enough within Slovenia. */
function project(p: LonLat, lat0: number): [number, number] {
  return [p[0] * 111.32 * Math.cos(toRad(lat0)), p[1] * 110.57];
}

/** Closest point on segment a–b to p, with the fraction t along the segment. */
export function closestOnSegment(p: LonLat, a: LonLat, b: LonLat): { point: LonLat; t: number; km: number } {
  const lat0 = p[1];
  const [px, py] = project(p, lat0);
  const [ax, ay] = project(a, lat0);
  const [bx, by] = project(b, lat0);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const point: LonLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return { point, t, km: distKm(p, point) };
}

/** Closest point on a polyline: segment index, fraction and distance. */
export function closestOnLine(p: LonLat, line: LonLat[]): { index: number; t: number; point: LonLat; km: number } {
  let best = { index: 0, t: 0, point: line[0], km: Infinity };
  for (let i = 0; i < line.length - 1; i++) {
    const c = closestOnSegment(p, line[i], line[i + 1]);
    if (c.km < best.km) best = { index: i, t: c.t, point: c.point, km: c.km };
  }
  if (line.length === 1) best = { index: 0, t: 0, point: line[0], km: distKm(p, line[0]) };
  return best;
}

export function lineLengthKm(line: LonLat[]): number {
  let s = 0;
  for (let i = 0; i < line.length - 1; i++) s += distKm(line[i], line[i + 1]);
  return s;
}

/** Douglas–Peucker simplification; tolerance in degrees. */
export function simplify(line: LonLat[], tolerance: number): LonLat[] {
  if (line.length <= 2) return line;
  const keep = new Uint8Array(line.length);
  keep[0] = keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  const t2 = tolerance * tolerance;
  while (stack.length) {
    const [s, e] = stack.pop()!;
    const [ax, ay] = line[s];
    const [bx, by] = line[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = line[i];
      let d: number;
      if (len2 === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > t2 && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

export function centroid(points: LonLat[]): LonLat {
  return [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
}

/** The point halfway along a polyline. */
export function midpointAlong(line: LonLat[]): LonLat {
  const total = lineLengthKm(line);
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const d = distKm(line[i], line[i + 1]);
    if (acc + d >= total / 2) {
      const t = d === 0 ? 0 : (total / 2 - acc) / d;
      return [line[i][0] + (line[i + 1][0] - line[i][0]) * t, line[i][1] + (line[i + 1][1] - line[i][1]) * t];
    }
    acc += d;
  }
  return line[line.length - 1];
}
