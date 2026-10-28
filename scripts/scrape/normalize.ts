/** Maps ribiskekarte.si vocabulary onto the app's species, techniques and regions. */
import type { LonLat } from './geo';
import { distKm } from './geo';

/** Raw species name (as written on ribiskekarte.si, lower case) → species slug in content/species.yaml. */
export const SPECIES_MAP: Record<string, string | null> = {
  amur: 'amur',
  androga: 'androga',
  bolen: 'bolen',
  'bolen (bolenj)': 'bolen',
  ciprinidi: null,
  'beli amur': 'amur',
  jegulja: 'jegulja',
  jez: 'jez',
  'jezerska zlatovčica': 'zlatovcica',
  'jezerska postrv': 'jezerska-postrv',
  klen: 'klen',
  'štrkavec (klen)': 'klen',
  štrkavec: 'klen',
  koreselj: 'koreselj',
  'srebrni koreselj': 'koreselj',
  'zlati koreselj': 'koreselj',
  krap: 'krap',
  'krap golec': 'krap',
  'križanec': 'krizanec',
  linj: 'linj',
  lipan: 'lipan',
  menek: 'menek',
  mrena: 'mrena',
  'ogrica (sivka)': 'ogrica',
  ogrica: 'ogrica',
  ostriž: 'ostriz',
  'sončni ostriž': 'soncni-ostriz',
  platnica: 'platnica',
  ploščič: 'ploscic',
  podust: 'podust',
  'potočna postrv': 'potocna-postrv',
  'potočna zlatovčica': 'potocna-zlatovcica',
  'rdečeoka': 'rdeceoka',
  'rdečeperka': 'rdeceperka',
  smuč: 'smuc',
  som: 'som',
  'soška postrv': 'soska-postrv',
  sulec: 'sulec',
  šarenka: 'sarenka',
  ščuka: 'scuka',
  tolstolobik: 'tolstolobik',
  'sivi tolstolobik': 'tolstolobik',
  'beli tolstolobik': 'tolstolobik',
  zelenika: 'zelenika',
  babuška: 'koreselj',
  'grba (mrena)': 'mrena',
  grba: 'mrena',
  pohra: 'pohra',
  klenič: 'klenic',
  'postrvji ostriž': 'postrvji-ostriz',
  jeseter: 'jeseter',
  čep: null,
  psevdorazbora: null,
  pisanka: null,
  brancin: 'brancin',
  orada: 'orada',
  ovčica: 'ovcica',
  ribon: 'ribon',
  salpa: 'salpa',
  sipa: 'sipa',
  ugor: 'ugor',
  špar: 'spar',
  ligenj: 'lignji',
  lignji: 'lignji',
  ciplji: 'cipelj',
  cipelj: 'cipelj',
  bukva: null,
  iglica: null,
  'krulec (m. lastovka)': null,
  menola: null,
  mol: null,
  palamida: null,
  skuša: null,
  strelka: null,
  'šnjur (šur)': null,
  pisanec: null,
  globoček: null,
  pezdirk: null,
  'ameriški somič': 'americki-somic',
  'črni ameriški somič': 'americki-somic',
};

/** Fishing method (ribiskekarte.si) → app technique. */
export const METHOD_MAP: Record<string, string[]> = {
  muharjenje: ['fly'],
  vijačenje: ['spin'],
  beličarjenje: ['float', 'feeder'],
  'talni ribolov': ['bottom', 'feeder'],
  krapolov: ['carp'],
  'lov krapov': ['carp'],
  'lov s plovcem': ['float'],
  'ribolov s plovcem': ['float'],
  'lov roparic': ['spin'],
  'lov sulca': ['spin'],
  'nočni ribolov': [],
  'ribolov iz čolna': [],
  'ribolov na vlek iz čolna': ['spin'],
  'vijačenje z vodno kroglico': ['spin'],
};

export function mapSpecies(raw: string[]): { slugs: string[]; unknown: string[] } {
  const slugs = new Set<string>();
  const unknown: string[] = [];
  for (const r of raw) {
    const k = r.toLowerCase().trim();
    if (k in SPECIES_MAP) {
      const s = SPECIES_MAP[k];
      if (s) slugs.add(s);
    } else unknown.push(r);
  }
  return { slugs: [...slugs], unknown };
}

export function mapMethods(raw: string[]): { techniques: string[]; unknown: string[] } {
  const t = new Set<string>();
  const unknown: string[] = [];
  for (const r of raw) {
    const k = r.toLowerCase().trim();
    if (k in METHOD_MAP) METHOD_MAP[k].forEach((x) => t.add(x));
    else unknown.push(r);
  }
  return { techniques: [...t], unknown };
}

/** Reference towns for assigning a statistical region by nearest town. [lon, lat] */
const REGION_TOWNS: [string, LonLat][] = [
  ['gorenjska', [14.36, 46.24]], ['gorenjska', [14.06, 46.43]], ['gorenjska', [14.11, 46.37]], ['gorenjska', [14.31, 46.17]],
  ['gorenjska', [13.95, 46.28]], ['gorenjska', [13.79, 46.48]], ['gorenjska', [14.31, 46.36]], ['gorenjska', [14.17, 46.22]],
  ['gorenjska', [14.17, 46.34]],
  ['goriska', [13.65, 45.96]], ['goriska', [13.73, 46.18]], ['goriska', [13.55, 46.34]], ['goriska', [14.03, 46.0]],
  ['goriska', [13.91, 45.89]], ['goriska', [13.58, 46.25]], ['goriska', [13.99, 46.13]],
  ['obala', [13.73, 45.55]], ['obala', [13.87, 45.71]], ['obala', [13.57, 45.53]], ['obala', [13.66, 45.54]],
  ['notranjska', [14.21, 45.78]], ['notranjska', [14.36, 45.79]], ['notranjska', [14.24, 45.57]], ['notranjska', [14.2, 45.68]],
  ['notranjska', [14.5, 45.65]],
  ['osrednjeslovenska', [14.51, 46.05]], ['osrednjeslovenska', [14.3, 45.96]], ['osrednjeslovenska', [14.59, 46.14]],
  ['osrednjeslovenska', [14.61, 46.23]], ['osrednjeslovenska', [14.82, 46.06]], ['osrednjeslovenska', [14.66, 45.96]],
  ['osrednjeslovenska', [14.41, 46.14]], ['osrednjeslovenska', [14.22, 45.92]],
  ['dolenjska', [15.17, 45.8]], ['dolenjska', [15.19, 45.57]], ['dolenjska', [15.31, 45.65]], ['dolenjska', [15.02, 45.9]],
  ['dolenjska', [14.86, 45.64]], ['dolenjska', [14.73, 45.74]], ['dolenjska', [14.93, 45.83]],
  ['posavje', [15.49, 45.96]], ['posavje', [15.59, 45.9]], ['posavje', [15.31, 46.01]], ['posavje', [15.42, 45.85]],
  ['zasavje', [15.05, 46.15]], ['zasavje', [14.95, 46.13]], ['zasavje', [15.18, 46.12]],
  ['savinjska', [15.27, 46.23]], ['savinjska', [15.11, 46.36]], ['savinjska', [15.16, 46.25]], ['savinjska', [14.96, 46.34]],
  ['savinjska', [14.83, 46.34]], ['savinjska', [15.24, 46.15]], ['savinjska', [15.4, 46.22]], ['savinjska', [15.64, 46.24]],
  ['savinjska', [15.42, 46.34]],
  ['koroska', [15.08, 46.51]], ['koroska', [14.97, 46.54]], ['koroska', [15.02, 46.59]], ['koroska', [15.23, 46.61]],
  ['stajerska', [15.65, 46.55]], ['stajerska', [15.87, 46.42]], ['stajerska', [15.57, 46.39]], ['stajerska', [15.83, 46.58]],
  ['stajerska', [16.15, 46.41]], ['stajerska', [15.73, 46.35]], ['stajerska', [15.51, 46.54]],
  ['pomurje', [16.16, 46.66]], ['pomurje', [16.45, 46.56]], ['pomurje', [16.2, 46.52]], ['pomurje', [15.99, 46.67]],
  ['pomurje', [16.1, 46.78]],
];

export function regionFor(p: LonLat): string {
  let best = REGION_TOWNS[0];
  for (const t of REGION_TOWNS) if (distKm(p, t[1]) < distKm(p, best[1])) best = t;
  return best[0];
}

/** Coarse water kind from the section name. */
export function stillKind(name: string): 'lake' | 'reservoir' | 'pond' {
  const n = name.toLowerCase();
  if (/akumulacij|zadrževalnik|bazen/.test(n)) return 'reservoir';
  if (/ribnik|gramoznic|bajer|glinokop|mrtvic|kanal/.test(n)) return 'pond';
  return 'lake';
}
