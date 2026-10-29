/**
 * Validates everything in content/: schemas, unique slugs, cross-references between
 * spots, species, lures and guides, and that each guide exists in Slovenian and English.
 * Run with `npm run validate:content`; exits non-zero on any problem.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAllSpecies, getGuideSlugs, getLures, getPhotos, getRevirji, getSpots } from '../lib/content';

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

function unique(kind: string, slugs: string[]) {
  const seen = new Set<string>();
  for (const s of slugs) {
    if (seen.has(s)) fail(`${kind}: duplicate slug "${s}"`);
    seen.add(s);
  }
  return seen;
}

let spots: ReturnType<typeof getSpots> = [];
let species: ReturnType<typeof getAllSpecies> = [];
let lures: ReturnType<typeof getLures> = [];
let revirji: ReturnType<typeof getRevirji> = [];
let photos: ReturnType<typeof getPhotos> = [];
try {
  spots = getSpots();
  species = getAllSpecies();
  lures = getLures();
  revirji = getRevirji();
  photos = getPhotos();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

const guideSlugs = new Set(getGuideSlugs());
const speciesSlugs = unique('species', species.map((s) => s.slug));
unique('spot', spots.map((s) => s.slug));
unique('lure', lures.map((l) => l.slug));

for (const g of guideSlugs) {
  for (const locale of ['sl', 'en']) {
    if (!fs.existsSync(path.join('content/guides', g, `${locale}.md`))) fail(`guide ${g}: missing ${locale}.md`);
  }
}

for (const spot of spots) {
  for (const s of spot.species) if (!speciesSlugs.has(s)) fail(`spot ${spot.slug}: unknown species "${s}"`);
  if (spot.type === 'sea' && spot.permit.kind === 'ribiskekarte') fail(`spot ${spot.slug}: sea spot with a freshwater permit`);
}

for (const s of species) {
  for (const r of s.rigs) if (!guideSlugs.has(r)) fail(`species ${s.slug}: unknown rig guide "${r}"`);
}

for (const l of lures) {
  for (const s of l.species) if (!speciesSlugs.has(s)) fail(`lure ${l.slug}: unknown species "${s}"`);
  if (l.guide && !guideSlugs.has(l.guide)) fail(`lure ${l.slug}: unknown guide "${l.guide}"`);
}

unique('revir', revirji.map((r) => r.id));
for (const r of revirji) {
  for (const s of r.species) if (!speciesSlugs.has(s)) fail(`revir ${r.id}: unknown species "${s}" (add it to species.yaml)`);
}

const placeIds = new Set([...spots.map((s) => `spot:${s.slug}`), ...revirji.map((r) => `revir:${r.id}`)]);
for (const p of photos) {
  if (!placeIds.has(p.place)) fail(`photo from issue #${p.issue}: unknown place "${p.place}"`);
  for (const f of [p.src, p.thumb]) if (!fs.existsSync(path.join('public', f))) fail(`photo from issue #${p.issue}: missing file public/${f}`);
}

// Internal links inside guides: /<locale>/guides/<slug>
for (const g of guideSlugs) {
  for (const file of fs.readdirSync(path.join('content/guides', g))) {
    const text = fs.readFileSync(path.join('content/guides', g, file), 'utf8');
    for (const [, target] of text.matchAll(/\]\(\/[a-z]{2}\/guides\/([a-z0-9-]+)\)/g)) {
      if (!guideSlugs.has(target)) fail(`guide ${g}/${file}: broken link to "${target}"`);
    }
  }
}

if (problems.length) {
  console.error(`Content validation failed (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Content OK: ${spots.length} spots, ${revirji.length} sections, ${species.length} species, ${lures.length} lures, ${guideSlugs.size} guides, ${photos.length} photos.`,
);
