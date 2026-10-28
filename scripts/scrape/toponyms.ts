/**
 * Slovenian place-name handling for boundary phrases such as
 * "od jezu v Markovcih do državne meje s Hrvaško" or "od mostu v Doleni do izliva v Dravo".
 */

export function norm(s: string): string {
  return s
    .replace(/\./g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split "od X do Y" into its two ends. Returns raw phrases (or null). */
export function splitBounds(subtitle: string): { from: string | null; to: string | null } {
  const s = subtitle.replace(/\s+/g, ' ').trim();
  const m = /(?:^|\b)od\s+(.+?)\s+(?:navzdol\s+|navzgor\s+)?do\s+(.+)$/i.exec(s);
  if (m) return { from: m[1].trim(), to: m[2].replace(/[,;].*$/, '').trim() };
  const only = /(?:^|\b)do\s+(.+)$/i.exec(s);
  if (only) return { from: null, to: only[1].replace(/[,;].*$/, '').trim() };
  return { from: null, to: null };
}

export type BoundKind = 'source' | 'mouth' | 'border' | 'confluence' | 'place';

/** Classify a boundary phrase. `other` is a named river for confluences ("izliv v Dravo"). */
export function classifyBound(phrase: string): { kind: BoundKind; other?: string; structure?: 'dam' | 'bridge' } {
  const p = phrase.toLowerCase();
  const structure = /\b(jez|jezu|jezom|pregrad|he\b|hidroelektrarn|zapornic)/.test(p)
    ? 'dam'
    : /\bmost|brv/.test(p)
      ? 'bridge'
      : undefined;
  if (/izvir/.test(p)) return { kind: 'source' };
  if (/(državn\w* mej|meje? z |mejo)/.test(p) && !/\b(v|pri)\s+[A-ZČŠŽ]/.test(phrase)) return { kind: 'border' };
  const conf = /(?:izliv\w*|sotočj\w*|stik\w*)\s+(?:v|z|s|reke|potoka)?\s*(?:reko\s+|potok\s+)?([A-ZČŠŽ][\wčšžćđ]+(?:\s+[A-ZČŠŽ][\wčšžćđ]+)?)/u.exec(phrase);
  if (conf) return { kind: 'confluence', other: conf[1], structure };
  if (/izliv|ustj/.test(p)) return { kind: 'mouth' };
  return { kind: 'place', structure };
}

const STOP = new Set(['Reka', 'Reke', 'Potok', 'Potoka', 'HE', 'RD', 'Republike', 'Hrvaško', 'Italijo', 'Avstrijo', 'Madžarsko']);

const CONNECTORS = new Set(['ob', 'pri', 'na', 'nad', 'pod', 'v', 'pod', 'pred']);
const isCap = (w: string) => /^[A-ZČŠŽĆĐ][\p{L}-]+$/u.test(w) && !STOP.has(w);

/**
 * Candidate toponyms in a phrase: runs of capitalised words, runs joined by short
 * connectors ("Središče ob Dravi"), and a capitalised word with the lowercase word after it
 * ("Zidanem mostu", "Mršeče vasi", "Cajhnovega jezu").
 */
export function toponymCandidates(phrase: string): string[] {
  const words = expandAbbreviations(phrase)
    .replace(/\./g, ' ')
    .split(/[\s,()]+/)
    .filter(Boolean);
  const out: string[] = [];
  const add = (s: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  let cur: string[] = [];
  for (const w of words) {
    if (isCap(w)) cur.push(w);
    else if (cur.length) {
      add(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) add(cur.join(' '));
  for (let i = 0; i < words.length; i++) {
    if (!isCap(words[i])) continue;
    const next = words[i + 1];
    const after = words[i + 2];
    if (next && CONNECTORS.has(next) && after && isCap(after)) add(`${words[i]} ${next} ${after}`);
    if (next && /^[a-zčšž]{3,}$/u.test(next) && !CONNECTORS.has(next)) add(`${words[i]} ${next}`);
  }
  return out;
}

/** Plausible nominative forms of an inflected Slovenian word (locative/genitive/instrumental). */
export function nominativeVariants(word: string): string[] {
  const w = word;
  const out = new Set<string>([w]);
  const rules: [RegExp, string][] = [
    [/ih$/, 'i'], // v Markovcih → Markovci
    [/ah$/, 'e'], // v Lazah → Laze
    [/ah$/, 'a'],
    [/iji$/, 'ija'], // v Litiji → Litija
    [/ji$/, 'ja'],
    [/ici$/, 'ica'], // v Bistrici → Bistrica
    [/i$/, 'a'], // v Doleni → Dolena
    [/i$/, ''],
    [/u$/, ''], // v Kamniku → Kamnik
    [/a$/, ''], // do Rakovnika → Rakovnik
    [/e$/, 'a'], // do Tržiške Bistrice → Tržiška Bistrica
    [/e$/, 'i'],
    [/ega$/, 'i'], // Šmartinskega → Šmartinski
    [/ega$/, ''], // Cajhnovega → Cajhnov
    [/ami$/, 'e'], // pod Brjami → Brje
    [/ami$/, 'a'],
    [/mi$/, ''],
    [/ju$/, 'je'], // v Melju → Melje
    [/cu$/, 'ec'], // v Zagradcu → Zagradec (fleeting e)
    [/ca$/, 'ec'],
    [/ku$/, 'ek'],
    [/ka$/, 'ek'],
    [/nu$/, 'en'], // v Tacnu → Tacen
    [/lu$/, 'el'],
    [/em$/, 'o'], // v Šmartnem → Šmartno
    [/em$/, 'i'], // v Zidanem → Zidani
    [/u$/, 'o'], // v Velenju? → handled by ju; v Mostu → Most covered by u→''
    [/ega$/, 'o'],
    [/em$/, ''],
    [/om$/, ''],
    [/ih$/, 'e'],
    [/ijo$/, 'ija'],
    [/o$/, 'a'], // v Dravo → Drava
  ];
  for (const [re, rep] of rules) if (re.test(w)) out.add(w.replace(re, rep));
  return [...out];
}

/** All nominative variants of a multi-word name (cartesian product, capped). */
export function phraseVariants(name: string): string[] {
  const parts = name.split(' ').map(nominativeVariants);
  let acc: string[] = [''];
  for (const opts of parts) {
    acc = acc.flatMap((a) => opts.map((o) => (a ? `${a} ${o}` : o))).slice(0, 64);
  }
  return acc;
}

/** Water-body name without generic prefixes ("Reka Drava" → "Drava"). */
export function waterName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(
      /^(reka|potok|kanal|odvodni kanal|dovodni kanal|akumulacijsko jezero|akumulacija|jezero|ribnik[ia]?|gramoznica|bajer|mrtvica|struga|revir)\s+/i,
      '',
    )
    .replace(/\s+(s|z)\s+pritok.*$/i, '')
    .replace(/\s+in\s+mrtvic.*$/i, '')
    .replace(/\s*\+.*$/, '')
    .replace(/\s+(R\s*)?[\dIVX]+[.\s].*$/, '')
    .replace(/\s+(R\s*)?[\dIVX]+$/, '')
    .replace(/\s+-\s+\p{L}+\s+del$/iu, '')
    .trim();
}

/** Common abbreviations in boundary descriptions. */
export function expandAbbreviations(s: string): string {
  return s.replace(/\bpri SG\b/g, 'pri Slovenj Gradcu').replace(/\bSG\b/g, 'Slovenj Gradec');
}

/** Abbreviated key for a place name ("Zgornji Dolič" → "zg dolic"), matching "Zg. Doliču" queries. */
export function abbreviatedKey(name: string): string {
  return norm(name)
    .replace(/\b(zgornj[aei]|zgornji)\b/g, 'zg')
    .replace(/\b(spodnj[aei])\b/g, 'sp')
    .replace(/\b(srednj[aei])\b/g, 'sr')
    .replace(/\b(doln?j[aei]|dolenj[aei])\b/g, 'dol')
    .replace(/\b(gorenj[aei]|gornj[aei])\b/g, 'gor')
    .replace(/\b(svet[aieo])\b/g, 'sv')
    .replace(/\b(velik[aieo])\b/g, 'vel')
    .replace(/\b(mal[aieo])\b/g, 'm');
}
