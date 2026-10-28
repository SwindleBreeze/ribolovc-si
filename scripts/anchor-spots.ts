/**
 * Links each curated spot to the matching fishing section (same water, nearest geometry) and
 * moves its pin onto that section, with parking from OpenStreetMap. Rewrites the spot YAML in
 * place, keeping comments. Run after `npm run data:sync`: tsx scripts/anchor-spots.ts [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { getRevirji, getSpots } from '../lib/content';
import { distanceKm } from '../lib/geo';
import type { Revir } from '../lib/schema';

const dry = process.argv.includes('--dry');
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

/** Closest point of a section's geometry to a [lat, lon]. */
function closest(r: Revir, p: [number, number]): { at: [number, number]; km: number } | null {
  const g = r.geometry;
  if (!g) return r.center ? { at: r.center, km: distanceKm(p, r.center) } : null;
  const pts = g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' ? g.coordinates : g.coordinates[0];
  let best: { at: [number, number]; km: number } | null = null;
  for (const [lon, lat] of pts) {
    const km = distanceKm(p, [lat, lon]);
    if (!best || km < best.km) best = { at: [lat, lon], km };
  }
  return best;
}

const revirji = getRevirji().filter((r) => r.quality === 'segment' || r.quality === 'water');
const updates = new Map<string, { revir: string; coords: [number, number]; parking?: [number, number]; km: number }>();

for (const spot of getSpots()) {
  if (spot.type === 'sea' || !spot.water) continue;
  const w = norm(spot.water);
  const still = spot.type !== 'river';
  let best: { r: Revir; at: [number, number]; km: number; score: number } | null = null;
  for (const r of revirji) {
    // Same water body and the same kind of water (a lake spot never links to a river section).
    if (!r.water || norm(r.water) !== w) continue;
    if (still !== (r.waterType !== 'river')) continue;
    const c = closest(r, spot.coords);
    if (!c || c.km > 2.5) continue;
    const shared = r.species.filter((s) => spot.species.includes(s)).length;
    const score = c.km - 0.3 * shared;
    if (!best || score < best.score) best = { r, ...c, score };
  }
  if (!best) continue;
  const park = best.r.parking
    .map((p) => ({ p, km: distanceKm(best!.at, [p.lat, p.lon]) }))
    .sort((a, b) => a.km - b.km)[0];
  updates.set(spot.slug, {
    revir: best.r.id,
    coords: [Number(best.at[0].toFixed(5)), Number(best.at[1].toFixed(5))],
    parking: park && park.km < 1.5 ? [park.p.lat, park.p.lon] : undefined,
    km: best.km,
  });
}

const dir = path.join(process.cwd(), 'content', 'spots');
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
  const full = path.join(dir, file);
  const doc = parseDocument(fs.readFileSync(full, 'utf8'));
  const items = doc.contents as unknown as { items: { get(k: string): unknown; set(k: string, v: unknown): void }[] };
  let changed = false;
  for (const item of items.items) {
    const u = updates.get(String(item.get('slug')));
    if (!u) continue;
    console.log(`${item.get('slug')} → ${u.revir} (moved ${u.km.toFixed(2)} km)${u.parking ? ' + parking' : ''}`);
    item.set('revir', u.revir);
    item.set('coords', doc.createNode(u.coords, { flow: true }));
    if (u.parking) item.set('parking', doc.createNode(u.parking, { flow: true }));
    item.set('approx', false);
    changed = true;
  }
  if (changed && !dry) fs.writeFileSync(full, doc.toString({ lineWidth: 0 }));
}
console.log(`${updates.size} of ${getSpots().length} spots linked to a section.`);
