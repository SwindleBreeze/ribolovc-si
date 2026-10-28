/**
 * Crawls every fishing section (revir) listed on ribiskekarte.si: the paginated index, then
 * each section page in Slovenian and English. Writes <out>/raw/ribiskekarte.json.
 * Usage: tsx scripts/scrape/crawl.ts <outDir> [maxSections]
 */
import fs from 'node:fs';
import path from 'node:path';
import { getText } from './http';
import { BASE, parseIndexPage, parseRevirPage, type IndexItem, type RevirPage } from './parse';

export type RawRevir = RevirPage & {
  index: IndexItem | null;
  en: { name: string; subtitle: string; description: string } | null;
  scrapedAt: string;
};

const out = process.argv[2] ?? 'scrape-out';
const max = Number(process.argv[3] ?? Infinity);

async function crawlIndex(): Promise<IndexItem[]> {
  const items = new Map<string, IndexItem>();
  for (let page = 1; page < 200; page++) {
    const url = page === 1 ? `${BASE}/ribolovni-revirji/` : `${BASE}/ribolovni-revirji/?page=${page}`;
    const { items: found, total } = parseIndexPage(await getText(url));
    const before = items.size;
    for (const it of found) items.set(it.url, it);
    console.log(`index page ${page}: +${items.size - before} (total ${items.size}/${total ?? '?'})`);
    if (found.length === 0 || items.size === before || (total && items.size >= total)) break;
  }
  return [...items.values()];
}

async function main() {
  const index = await crawlIndex();
  const urls = new Set(index.map((i) => i.url));
  const byUrl = new Map(index.map((i) => [i.url, i]));
  const results: RawRevir[] = [];
  const failures: string[] = [];

  const queue = [...urls];
  while (queue.length && results.length < max) {
    const url = queue.shift()!;
    try {
      const page = parseRevirPage(await getText(url), url);
      // Section pages link to the club's other sections; pick up any the index missed.
      for (const s of page.siblingUrls) {
        if (!urls.has(s) && new URL(s).pathname.split('/').filter(Boolean).length === 2) {
          urls.add(s);
          queue.push(s);
        }
      }
      let en: RawRevir['en'] = null;
      try {
        const enUrl = url.replace(BASE, `${BASE}/en`);
        const e = parseRevirPage(await getText(enUrl), enUrl);
        if (e.name) en = { name: e.name, subtitle: e.subtitle, description: e.description };
      } catch {
        // English page missing: Slovenian only.
      }
      results.push({ ...page, index: byUrl.get(url) ?? null, en, scrapedAt: new Date().toISOString() });
      if (results.length % 25 === 0) console.log(`sections: ${results.length}/${urls.size}`);
    } catch (e) {
      failures.push(`${url}: ${(e as Error).message}`);
    }
  }

  fs.mkdirSync(path.join(out, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(out, 'raw', 'ribiskekarte.json'), JSON.stringify(results, null, 1));
  fs.writeFileSync(path.join(out, 'raw', 'crawl-failures.txt'), failures.join('\n'));
  console.log(`done: ${results.length} sections, ${failures.length} failures`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
