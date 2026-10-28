// Discovery run: fetches robots.txt, the section index and a few section pages from
// ribiskekarte.si and saves the raw responses so the parser can be written against real
// markup. Also checks that OSM Overpass and Nominatim are reachable from the runner.
// Usage: node scripts/scrape/discover.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] ?? 'scrape-out/discovery';
fs.mkdirSync(out, { recursive: true });
const UA = 'RibolovcBot/0.1 (+https://github.com/swindlebreeze/ribolovc-si; fishing guide data, polite crawl)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BASE = 'https://www.ribiskekarte.si';
const pages = [
  '/robots.txt',
  '/sitemap.xml',
  '/ribolovni-revirji',
  '/rd-ptuj/drava-10',
  '/rd-tolmin/ucja',
  '/rd-vrhnika',
  '/zavod-za-ribistvo-slovenije/sava-11',
  '/rd-koroska/meza-4',
  '/rd-bled/revir-sava-bohinjka',
];

const summary = [];
for (const p of pages) {
  const url = BASE + p;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'sl' } });
    // Never store third-party API keys embedded in the pages (e.g. Mapbox tokens).
    const text = (await res.text())
      .replace(/\b(pk|sk|tk)\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, '$1.[REDACTED]')
      .replace(/(access_token=)[^&"'\s]+/g, '$1[REDACTED]');
    if (p === '/robots.txt') console.log(text);
    const file = path.join(out, (p.replace(/^\//, '').replace(/\//g, '__') || 'index') + '.txt');
    fs.writeFileSync(file, text);
    const links = [...new Set([...text.matchAll(/href="([^"#?]+)"/g)].map((m) => m[1]))];
    const coords = [...text.matchAll(/(4[5-6]\.\d{3,})[^0-9]{1,20}(1[3-6]\.\d{3,})/g)].slice(0, 10).map((m) => m[0]);
    summary.push({ url, status: res.status, bytes: text.length, links: links.length, coordSamples: coords });
    console.log(`${res.status} ${url} ${text.length}B links=${links.length} coords=${coords.length}`);
  } catch (e) {
    summary.push({ url, error: String(e) });
    console.log(`ERR ${url} ${e}`);
  }
  await sleep(1500);
}

// Reachability of the geocoding services used later.
for (const [name, url, init] of [
  ['overpass', 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent('[out:json][timeout:25];way["waterway"="river"]["name"="Soča"](45.4,13.3,46.9,16.6);out ids 3;'), {}],
  ['overpass-kumi', 'https://overpass.kumi.systems/api/interpreter?data=' + encodeURIComponent('[out:json][timeout:25];way["waterway"="river"]["name"="Soča"](45.4,13.3,46.9,16.6);out ids 3;'), {}],
  ['nominatim', 'https://nominatim.openstreetmap.org/search?q=Most%20na%20So%C4%8Di&countrycodes=si&format=json&limit=1', {}],
]) {
  try {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: '*/*' } });
    const text = await res.text();
    summary.push({ service: name, status: res.status, sample: text.slice(0, 300) });
    console.log(`${name}: ${res.status} ${text.slice(0, 200)}`);
  } catch (e) {
    summary.push({ service: name, error: String(e) });
    console.log(`${name}: ERR ${e}`);
  }
}

fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
