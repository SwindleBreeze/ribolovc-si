/**
 * Turns an `osmium export -f geojsonseq` dump of the Slovenia OSM extract into small,
 * compact layers the geocoder needs: named rivers, named lakes/reservoirs, places,
 * dams/weirs, bridges, parking and fishing spots.
 * Usage: tsx scripts/scrape/osm-extract.ts <in.geojsonseq> <outDir>
 * OSM data © OpenStreetMap contributors, ODbL.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { simplify, type LonLat } from './geo';

type Geometry =
  | { type: 'Point'; coordinates: LonLat }
  | { type: 'LineString'; coordinates: LonLat[] }
  | { type: 'MultiLineString'; coordinates: LonLat[][] }
  | { type: 'Polygon'; coordinates: LonLat[][] }
  | { type: 'MultiPolygon'; coordinates: LonLat[][][] };

type Feature = { id?: string; properties: Record<string, string>; geometry: Geometry };

export type OsmRiver = { id: string; name: string; kind: string; line: LonLat[] };
export type OsmWater = { id: string; name: string; kind: string; centroid: LonLat; bbox: [number, number, number, number]; areaKm2: number; ring: LonLat[] };
export type OsmPoint = { id: string; name: string; kind: string; at: LonLat };

const r5 = (n: number) => Math.round(n * 1e5) / 1e5;
const roundLine = (l: LonLat[]): LonLat[] => l.map(([x, y]) => [r5(x), r5(y)]);

function centroidOf(g: Geometry): LonLat {
  const pts: LonLat[] =
    g.type === 'Point'
      ? [g.coordinates]
      : g.type === 'LineString'
        ? g.coordinates
        : g.type === 'MultiLineString' || g.type === 'Polygon'
          ? g.coordinates.flat()
          : g.coordinates.flat(2);
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [r5(x), r5(y)];
}

function ringAreaKm2(ring: LonLat[]): number {
  // Shoelace on an equirectangular projection; fine for lakes at this latitude.
  const k = 111.32;
  const cos = Math.cos((46 * Math.PI) / 180);
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * k * cos * ring[i + 1][1] * k - ring[i + 1][0] * k * cos * ring[i][1] * k;
  }
  return Math.abs(a / 2);
}

const PLACE_KINDS = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'locality', 'isolated_dwelling', 'neighbourhood', 'quarter', 'island', 'islet', 'farm', 'square']);
const NATURAL_LANDMARKS = new Set(['spring', 'sinkhole', 'gorge', 'cave_entrance', 'waterfall', 'rapids']);

async function main() {
  const [input, outDir] = process.argv.slice(2);
  const rivers: OsmRiver[] = [];
  const waters: OsmWater[] = [];
  const places: OsmPoint[] = [];
  const structures: OsmPoint[] = [];
  const parking: OsmPoint[] = [];
  const fishing: OsmPoint[] = [];

  const rl = readline.createInterface({ input: fs.createReadStream(input), crlfDelay: Infinity });
  for await (const raw of rl) {
    const line = raw.replace(/^\x1e/, '').trim();
    if (!line) continue;
    const f = JSON.parse(line) as Feature;
    const p = f.properties ?? {};
    const g = f.geometry;
    const id = f.id ?? p['@id'] ?? '';
    const name = p.name ?? p['name:sl'] ?? '';

    if ((p.waterway === 'river' || p.waterway === 'stream' || p.waterway === 'canal') && name) {
      const parts = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      for (const part of parts) rivers.push({ id, name, kind: p.waterway, line: roundLine(simplify(part, 0.00004)) });
    } else if ((g.type === 'Polygon' || g.type === 'MultiPolygon') && name && (p.natural === 'water' || p.water || p.landuse === 'reservoir' || p.landuse === 'basin')) {
      const outer = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates.reduce((best, poly) => (ringAreaKm2(poly[0]) > ringAreaKm2(best) ? poly[0] : best), g.coordinates[0][0]);
      const xs = outer.map((c) => c[0]);
      const ys = outer.map((c) => c[1]);
      waters.push({
        id,
        name,
        kind: p.water ?? p.landuse ?? p.natural,
        centroid: centroidOf(g),
        bbox: [r5(Math.min(...xs)), r5(Math.min(...ys)), r5(Math.max(...xs)), r5(Math.max(...ys))],
        areaKm2: Math.round(ringAreaKm2(outer) * 1000) / 1000,
        ring: roundLine(simplify(outer, 0.0001)),
      });
    } else if (p.place && PLACE_KINDS.has(p.place) && name) {
      places.push({ id, name, kind: p.place, at: centroidOf(g) });
    } else if (p.waterway === 'dam' || p.waterway === 'weir' || p.man_made === 'bridge') {
      structures.push({ id, name, kind: p.waterway ?? 'bridge', at: centroidOf(g) });
    } else if ((p.natural && NATURAL_LANDMARKS.has(p.natural)) || (p.waterway === 'waterfall' && name)) {
      if (name) structures.push({ id, name, kind: p.natural ?? 'waterfall', at: centroidOf(g) });
    } else if (p.amenity === 'parking' && p.access !== 'private' && p.access !== 'no' && p.access !== 'customers') {
      parking.push({ id, name, kind: p.parking ?? 'surface', at: centroidOf(g) });
    } else if (p.leisure === 'fishing') {
      fishing.push({ id, name, kind: p.fishing ?? 'yes', at: centroidOf(g) });
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const write = (n: string, d: unknown) => fs.writeFileSync(path.join(outDir, n), JSON.stringify(d));
  write('rivers.json', rivers);
  write('waters.json', waters);
  write('places.json', places);
  write('structures.json', structures);
  write('parking.json', parking);
  write('fishing.json', fishing);
  console.log(
    `osm layers: rivers ${rivers.length}, waters ${waters.length}, places ${places.length}, structures ${structures.length}, parking ${parking.length}, fishing ${fishing.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
