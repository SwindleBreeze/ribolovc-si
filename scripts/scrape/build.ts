/**
 * Builds the section database from the crawl and the OSM layers:
 * geocodes every section, attaches nearby parking and fishing spots, maps species and
 * methods, and writes <out>/revirji/<club>.json plus <out>/report.md.
 * Usage: tsx scripts/scrape/build.ts <outDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RawRevir } from './crawl';
import { closestOnLine, distKm, type LonLat } from './geo';
import { Geocoder, type Placement } from './geocode';
import { mapMethods, mapSpecies, regionFor, stillKind } from './normalize';
import type { OsmPoint, OsmRiver, OsmWater } from './osm-extract';

const out = process.argv[2] ?? 'scrape-out';
const read = <T>(p: string): T => JSON.parse(fs.readFileSync(path.join(out, p), 'utf8')) as T;

const raw = read<RawRevir[]>('raw/ribiskekarte.json');
const osm = {
  rivers: read<OsmRiver[]>('osm/rivers.json'),
  waters: read<OsmWater[]>('osm/waters.json'),
  places: read<OsmPoint[]>('osm/places.json'),
  structures: read<OsmPoint[]>('osm/structures.json'),
};
const parking = read<OsmPoint[]>('osm/parking.json');
const fishing = read<OsmPoint[]>('osm/fishing.json');
const geo = new Geocoder(osm);

// Grid index for point lookups (≈1 km cells).
function grid(points: OsmPoint[]) {
  const g = new Map<string, OsmPoint[]>();
  for (const p of points) {
    const k = `${Math.floor(p.at[0] * 100)},${Math.floor(p.at[1] * 100)}`;
    const arr = g.get(k);
    if (arr) arr.push(p);
    else g.set(k, [p]);
  }
  return (at: LonLat, km: number) => {
    const r = Math.ceil(km / 0.75);
    const cx = Math.floor(at[0] * 100);
    const cy = Math.floor(at[1] * 100);
    const found: OsmPoint[] = [];
    for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) found.push(...(g.get(`${x},${y}`) ?? []));
    return found;
  };
}
const parkingNear = grid(parking);
const fishingNear = grid(fishing);

function samplePoints(p: Placement): LonLat[] {
  const g = p.geometry;
  if (!g) return [];
  if (g.type === 'Point') return [g.coordinates];
  const pts = g.type === 'LineString' ? g.coordinates : g.coordinates[0];
  const step = Math.max(1, Math.floor(pts.length / 60));
  return pts.filter((_, i) => i % step === 0);
}

function nearby(p: Placement, lookup: (at: LonLat, km: number) => OsmPoint[], km: number, max: number) {
  const samples = samplePoints(p);
  const best = new Map<string, { pt: OsmPoint; km: number }>();
  for (const s of samples) {
    for (const pt of lookup(s, km)) {
      let d = distKm(s, pt.at);
      if (p.geometry?.type === 'LineString') d = Math.min(d, closestOnLine(pt.at, p.geometry.coordinates).km);
      if (d > km) continue;
      const prev = best.get(pt.id);
      if (!prev || d < prev.km) best.set(pt.id, { pt, km: d });
    }
  }
  const list = [...best.values()].sort((a, b) => a.km - b.km);
  // Spread picks along long sections rather than taking a cluster at one end.
  const picked: typeof list = [];
  for (const c of list) {
    if (picked.every((x) => distKm(x.pt.at, c.pt.at) > 0.4)) picked.push(c);
    if (picked.length >= max) break;
  }
  return picked.map(({ pt, km: d }) => ({ lat: pt.at[1], lon: pt.at[0], name: pt.name || null, distKm: Math.round(d * 100) / 100 }));
}

const r5 = (n: number) => Math.round(n * 1e5) / 1e5;
const roundGeom = (g: Placement['geometry']) => {
  if (!g) return null;
  if (g.type === 'Point') return { type: 'Point', coordinates: [r5(g.coordinates[0]), r5(g.coordinates[1])] };
  if (g.type === 'LineString') return { type: 'LineString', coordinates: g.coordinates.map(([x, y]) => [r5(x), r5(y)]) };
  return { type: 'Polygon', coordinates: g.coordinates.map((ring) => ring.map(([x, y]) => [r5(x), r5(y)])) };
};

function excerpt(text: string, max = 420): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '));
  return (end > 120 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`).trim();
}

const byClub = new Map<string, unknown[]>();
const stats = new Map<string, number>();
const unknownSpecies = new Map<string, number>();
const unknownMethods = new Map<string, number>();
const unresolved: string[] = [];

for (const r of raw) {
  const isRiver = (r.features.waterType ?? r.index?.features.waterType ?? '').startsWith('teko');
  const features = r.features.species.length ? r.features : (r.index?.features ?? r.features);
  const anchor = geo.clubSeat(r.club.name || r.index?.clubName || '');
  const gauge: LonLat | null = r.gauge ? [r.gauge.lon, r.gauge.lat] : null;
  const placement = isRiver
    ? geo.placeRiver({ name: r.name, subtitle: r.subtitle, anchor, gauge })
    : geo.placeStill({ name: r.name, subtitle: r.subtitle, anchor });

  stats.set(placement.quality, (stats.get(placement.quality) ?? 0) + 1);
  if (placement.quality === 'none' || placement.quality === 'place') {
    unresolved.push(`- [${placement.quality}] ${r.clubSlug}/${r.slug} — ${r.name} (${r.subtitle}) · ${placement.notes.join('; ')}`);
  }

  const sp = mapSpecies(features.species);
  sp.unknown.forEach((u) => unknownSpecies.set(u, (unknownSpecies.get(u) ?? 0) + 1));
  const mt = mapMethods(features.methods);
  mt.unknown.forEach((u) => unknownMethods.set(u, (unknownMethods.get(u) ?? 0) + 1));

  const center = placement.center ?? anchor;
  const passNames = r.passes.map((p) => p.name.toLowerCase());
  const record = {
    id: `${r.clubSlug}/${r.slug}`,
    clubSlug: r.clubSlug,
    slug: r.slug,
    code: r.code,
    name: r.name,
    subtitle: r.subtitle,
    en: r.en ? { name: r.en.name, subtitle: r.en.subtitle, description: excerpt(r.en.description) } : null,
    club: { name: r.club.name || r.index?.clubName || '', url: r.club.url || r.index?.clubUrl || '' },
    description: excerpt(r.description),
    waterType: isRiver ? 'river' : stillKind(`${r.name} ${r.subtitle}`),
    water: placement.matchedWater,
    species: sp.slugs,
    speciesRaw: features.species,
    methods: features.methods,
    techniques: mt.techniques,
    baits: features.baits,
    flyOnly: features.methods.length > 0 && features.methods.every((m) => m.toLowerCase() === 'muharjenje'),
    catchAndReleaseOnly: passNames.length > 0 && passNames.every((n) => n.includes('spusti')),
    passes: r.passes.map((p) => ({ name: p.name, priceEur: p.priceEur, saleWindow: p.saleWindow, buyUrl: p.buyUrl })),
    online: !r.notMember && r.passes.length > 0,
    sourceUrl: r.url,
    mapPdfUrl: r.mapPdfUrl,
    gauge: r.gauge,
    quality: center ? placement.quality : 'none',
    qualityNotes: placement.notes,
    geometry: roundGeom(placement.geometry),
    center: center ? [r5(center[1]), r5(center[0])] : null,
    lengthKm: placement.lengthKm,
    region: center ? regionFor(center) : null,
    parking: placement.geometry ? nearby(placement, parkingNear, 0.6, 4) : [],
    fishingSpots: placement.geometry ? nearby(placement, fishingNear, 0.3, 6) : [],
    scrapedAt: r.scrapedAt,
  };
  const arr = byClub.get(r.clubSlug);
  if (arr) arr.push(record);
  else byClub.set(r.clubSlug, [record]);
}

const dir = path.join(out, 'revirji');
fs.mkdirSync(dir, { recursive: true });
for (const [club, list] of byClub) fs.writeFileSync(path.join(dir, `${club}.json`), JSON.stringify(list, null, 1));

const total = raw.length;
const pct = (n: number) => `${((n / Math.max(1, total)) * 100).toFixed(0)} %`;
const order = ['segment', 'water', 'partial', 'gauge', 'place', 'none'];
const report = [
  `# Section database report`,
  ``,
  `Generated ${new Date().toISOString()} from ${total} sections in ${byClub.size} clubs.`,
  ``,
  `## Placement quality`,
  ``,
  `| quality | sections | share |`,
  `|---|---|---|`,
  ...order.map((q) => `| ${q} | ${stats.get(q) ?? 0} | ${pct(stats.get(q) ?? 0)} |`),
  ``,
  `## Unknown species names (add to SPECIES_MAP)`,
  ``,
  ...[...unknownSpecies].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} (${v})`),
  ``,
  `## Unknown methods (add to METHOD_MAP)`,
  ``,
  ...[...unknownMethods].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} (${v})`),
  ``,
  `## Needs a manual position (${unresolved.length})`,
  ``,
  ...unresolved,
  ``,
].join('\n');
fs.writeFileSync(path.join(out, 'report.md'), report);
console.log(report.split('## Unknown')[0]);
