/**
 * Publishes the photos from an approved "Photo" issue: downloads the uploads, re-encodes them
 * to WebP (which drops EXIF, including GPS), writes them under public/photos/ and adds entries
 * to content/photos.yaml. Run by .github/workflows/photo-approve.yml; nothing from the issue
 * is executed, only parsed.
 *
 * Env: ISSUE_NUMBER, ISSUE_BODY, ISSUE_AUTHOR, GITHUB_TOKEN (optional, for private repos).
 * Writes a summary (or the reason it refused) to photo-result.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { parse, stringify } from 'yaml';
import { getRevir, getSpot } from '../../lib/content';
import type { Photo } from '../../lib/schema';
import { allChecked, cleanLine, imageUrls, LABELS, MAX_PHOTOS, normalizePlace, parseIssueForm } from './form';

const MAX_BYTES = 25 * 1024 * 1024;
const RESULT = 'photo-result.md';

class Refusal extends Error {}

async function download(url: string): Promise<Buffer> {
  const token = process.env.GITHUB_TOKEN;
  // fetch drops the Authorization header when GitHub redirects to its storage host.
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, redirect: 'follow' });
  if (!res.ok) throw new Refusal(`Could not download ${url} (HTTP ${res.status}).`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Refusal(`${url} is not an image (${type || 'unknown type'}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Refusal(`${url} is larger than 25 MB.`);
  return buf;
}

async function encode(buf: Buffer, size: number, quality: number) {
  // rotate() applies the EXIF orientation; WebP output carries no metadata unless asked to.
  const { data, info } = await sharp(buf, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function main() {
  const issue = Number(process.env.ISSUE_NUMBER);
  if (!Number.isInteger(issue) || issue <= 0) throw new Error('ISSUE_NUMBER is missing');
  const form = parseIssueForm(process.env.ISSUE_BODY ?? '');

  const place = normalizePlace(form[LABELS.place] ?? '');
  if (!place) throw new Refusal(`"${LABELS.place}" must be a section or spot link from the site, e.g. https://ribolovc.si/sl/revirji/rd-tolmin/soca-3.`);
  const exists = place.startsWith('revir:') ? getRevir(place.slice(6)) : getSpot(place.slice(5));
  if (!exists) throw new Refusal(`No section or spot "${place}" exists on the site.`);

  if (!allChecked(form[LABELS.consent] ?? '')) throw new Refusal('Not every consent box is ticked.');

  const urls = imageUrls(form[LABELS.photos] ?? '');
  if (urls.length === 0) throw new Refusal('No uploaded photo found. Drag the photo into the photos field so GitHub uploads it.');
  if (urls.length > MAX_PHOTOS) throw new Refusal(`At most ${MAX_PHOTOS} photos per submission.`);

  const author = cleanLine(form[LABELS.author] || process.env.ISSUE_AUTHOR || '', 80);
  if (!author) throw new Refusal('No author name for the credit.');
  const caption = cleanLine(form[LABELS.caption] ?? '', 200) || undefined;

  const dir = place.startsWith('revir:') ? place.slice(6) : `spots/${place.slice(5)}`;
  fs.mkdirSync(path.join('public/photos', dir), { recursive: true });
  const date = new Date().toISOString().slice(0, 10);

  const entries: Photo[] = [];
  for (const [i, url] of urls.entries()) {
    const buf = await download(url);
    const full = await encode(buf, 1600, 80);
    const thumb = await encode(buf, 640, 72);
    const base = `photos/${dir}/${issue}-${i + 1}`;
    fs.writeFileSync(path.join('public', `${base}.webp`), full.data);
    fs.writeFileSync(path.join('public', `${base}-t.webp`), thumb.data);
    entries.push({ place, src: `${base}.webp`, thumb: `${base}-t.webp`, width: full.width, height: full.height, author, caption, date, issue });
  }

  // Keep the header comment, rewrite the list.
  const file = 'content/photos.yaml';
  const text = fs.readFileSync(file, 'utf8');
  const header = text.match(/^(#.*\n)*/)?.[0] ?? '';
  const list = (parse(text) ?? []) as Photo[];
  const fresh = entries.filter((e) => !list.some((p) => p.src === e.src));
  const clean = (e: Photo) => Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined));
  fs.writeFileSync(file, header + stringify([...list, ...fresh].map(clean)));

  const page = place.startsWith('revir:') ? `/sl/revirji/${place.slice(6)}` : `/sl/spots/${place.slice(5)}`;
  fs.writeFileSync(RESULT, `Published ${entries.length} photo(s) on \`${page}\` (credit: ${author}). They go live with the next deploy.`);
  console.log(`ok ${entries.length} ${place}`);
}

main().catch((e) => {
  const msg = e instanceof Refusal ? e.message : `Import failed: ${(e as Error).message}`;
  fs.writeFileSync(RESULT, msg);
  console.error(msg);
  process.exit(1);
});
