// Ensures every locale has exactly the same message keys as Slovenian.
import fs from 'node:fs';
const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const base = new Set(flat(JSON.parse(fs.readFileSync('messages/sl.json', 'utf8'))));
let ok = true;
for (const l of ['en', 'de', 'it']) {
  const keys = new Set(flat(JSON.parse(fs.readFileSync(`messages/${l}.json`, 'utf8'))));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length || extra.length) {
    ok = false;
    console.error(`${l}: missing ${missing.join(', ') || '-'}; extra ${extra.join(', ') || '-'}`);
  }
}
if (!ok) process.exit(1);
console.log(`Messages OK (${base.size} keys × 4 locales).`);
