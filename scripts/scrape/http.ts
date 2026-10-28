/** Polite HTTP client for the scraper: identifies itself, waits between requests, retries and caches on disk. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const USER_AGENT =
  'RibolovcBot/1.0 (+https://github.com/swindlebreeze/ribolovc-si; free fishing guide, links back to permit pages)';

const CACHE_DIR = process.env.SCRAPE_CACHE_DIR ?? '.scrape-cache';
const DELAY_MS = Number(process.env.SCRAPE_DELAY_MS ?? 1200);
let last = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getText(url: string, { maxAgeHours = 24 * 20 } = {}): Promise<string> {
  const key = crypto.createHash('sha1').update(url).digest('hex');
  const file = path.join(CACHE_DIR, `${key}.html`);
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < maxAgeHours * 3600_000) {
    return fs.readFileSync(file, 'utf8');
  }
  for (let attempt = 1; ; attempt++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'sl,en;q=0.5' } });
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { permanent: true });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      const text = await res.text();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, text);
      return text;
    } catch (e) {
      if ((e as { permanent?: boolean }).permanent || attempt >= 3) throw e;
      await sleep(3000 * attempt);
    }
  }
}
