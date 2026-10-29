/**
 * "For this weather and this fish, use this setup": a rule-based suggestion built from a
 * day of the forecast, the gauging station and what the section allows. Every suggestion
 * carries the reasons it was made, so it can be checked like the fishing score.
 */
import type { ConditionsDay, ConditionsWater } from './conditions';
import type { Technique, WaterType } from './schema';
import type { FlowLevel } from './water/arso';

export type SpeciesGroup = 'salmonid' | 'predator' | 'cyprinid' | 'catfish' | 'sea' | 'cephalopod' | 'other';

export type Bait =
  | 'nymph'
  | 'dryfly'
  | 'streamer'
  | 'lure'
  | 'worms'
  | 'maggots'
  | 'corn'
  | 'boilies'
  | 'bread'
  | 'cheese'
  | 'deadbait'
  | 'seaworm'
  | 'paste'
  | 'pellets'
  | 'squidjig';

export type TipKey =
  | 'cold'
  | 'mild'
  | 'warm'
  | 'hot'
  | 'murky'
  | 'clear'
  | 'highFlow'
  | 'flood'
  | 'lowFlow'
  | 'pressureFalling'
  | 'pressureRising'
  | 'windShore'
  | 'windStrong'
  | 'brightSun'
  | 'overcast'
  | 'surf'
  | 'calmSea'
  | 'huchenSeason'
  | 'squidSeason'
  | 'methodNotAllowed';

/** When to be at the water. */
export type Window = 'dawnDusk' | 'dusk' | 'night' | 'midday' | 'allDay';

export type Advice = {
  technique: Technique;
  guide: string;
  lure: string | null;
  bait: Bait;
  window: Window;
  /** ISO time ranges for the window on this day, when sunrise/sunset are known. */
  times: [string, string][];
  waterTemp: { value: number; source: 'gauge' | 'sea' | 'air' } | null;
  tips: TipKey[];
};

type Ctx = {
  month: number;
  temp: number | null;
  murky: boolean;
  flow: FlowLevel;
  falling: boolean;
  rising: boolean;
  windy: boolean;
  veryWindy: boolean;
  bright: boolean;
  overcast: boolean;
  river: boolean;
  sea: boolean;
  rough: boolean;
};

type Option = {
  technique: Technique;
  guide: string;
  lure?: string;
  bait: Bait;
  window?: Window;
  when?: (c: Ctx) => boolean;
};

const cold = (c: Ctx) => c.temp !== null && c.temp < 8;
const warm = (c: Ctx) => c.temp !== null && c.temp >= 16;
const summer = (c: Ctx) => c.month >= 5 && c.month <= 9;

const TROUT: Option[] = [
  { technique: 'fly', guide: 'euro-nymphing', lure: 'streamer', bait: 'streamer', when: (c) => c.murky || c.flow === 'high' },
  { technique: 'spin', guide: 'spinning', lure: 'vrtilka', bait: 'lure', when: (c) => c.murky || c.flow === 'high' },
  { technique: 'fly', guide: 'dry-fly', lure: 'suha-muha', bait: 'dryfly', window: 'dusk', when: (c) => summer(c) && !c.murky && !c.veryWindy && !cold(c) },
  { technique: 'fly', guide: 'euro-nymphing', lure: 'nimfa', bait: 'nymph' },
  { technique: 'spin', guide: 'spinning', lure: 'vrtilka', bait: 'lure' },
  { technique: 'float', guide: 'float-rig', bait: 'worms' },
];

const PROFILES: Record<string, Option[]> = {
  'potocna-postrv': TROUT,
  sarenka: TROUT,
  'soska-postrv': TROUT,
  krizanec: TROUT,
  'potocna-zlatovcica': TROUT,
  zlatovcica: [
    { technique: 'spin', guide: 'spinning', lure: 'zlica', bait: 'lure', when: cold },
    { technique: 'spin', guide: 'spinning', lure: 'vrtilka', bait: 'lure' },
    ...TROUT,
  ],
  'jezerska-postrv': [
    { technique: 'spin', guide: 'spinning', lure: 'wobler', bait: 'lure' },
    { technique: 'spin', guide: 'spinning', lure: 'zlica', bait: 'lure' },
    ...TROUT,
  ],
  lipan: [
    { technique: 'fly', guide: 'dry-fly', lure: 'suha-muha', bait: 'dryfly', window: 'dusk', when: (c) => summer(c) && !c.murky && !cold(c) },
    { technique: 'fly', guide: 'euro-nymphing', lure: 'nimfa', bait: 'nymph' },
  ],
  sulec: [
    { technique: 'spin', guide: 'huchen', lure: 'zopf', bait: 'lure', window: 'dawnDusk', when: (c) => !warm(c) },
    { technique: 'spin', guide: 'huchen', lure: 'wobler', bait: 'lure', window: 'dawnDusk' },
  ],
  scuka: [
    { technique: 'spin', guide: 'spinning', lure: 'shad', bait: 'lure', when: cold },
    { technique: 'spin', guide: 'spinning', lure: 'zlica', bait: 'lure', when: (c) => c.murky },
    { technique: 'spin', guide: 'spinning', lure: 'povrsinska', bait: 'lure', window: 'dawnDusk', when: (c) => warm(c) && !c.windy && !c.murky },
    { technique: 'spin', guide: 'spinning', lure: 'wobler', bait: 'lure' },
    { technique: 'float', guide: 'float-rig', bait: 'deadbait' },
  ],
  smuc: [
    { technique: 'spin', guide: 'drop-shot', lure: 'drop-shot', bait: 'lure', window: 'dusk', when: (c) => cold(c) || (!c.murky && c.bright) },
    { technique: 'spin', guide: 'spinning', lure: 'shad', bait: 'lure', window: 'dusk' },
    { technique: 'float', guide: 'float-rig', bait: 'deadbait', window: 'night' },
  ],
  ostriz: [
    { technique: 'spin', guide: 'drop-shot', lure: 'drop-shot', bait: 'lure', when: (c) => cold(c) || c.rising },
    { technique: 'spin', guide: 'spinning', lure: 'vrtilka', bait: 'lure' },
    { technique: 'float', guide: 'float-rig', bait: 'worms' },
  ],
  bolen: [
    { technique: 'spin', guide: 'spinning', lure: 'metal-jig', bait: 'lure', when: (c) => !cold(c) },
    { technique: 'spin', guide: 'spinning', lure: 'zlica', bait: 'lure' },
  ],
  som: [
    { technique: 'feeder', guide: 'feeder-rig', bait: 'worms', window: 'night', when: (c) => !cold(c) },
    { technique: 'spin', guide: 'spinning', lure: 'wobler', bait: 'lure', window: 'dusk' },
    { technique: 'bottom', guide: 'feeder-rig', bait: 'deadbait', window: 'night' },
  ],
  krap: [
    { technique: 'carp', guide: 'hair-rig', bait: 'boilies', when: (c) => c.temp === null || c.temp >= 14 },
    { technique: 'feeder', guide: 'feeder-rig', bait: 'corn', when: (c) => !cold(c) },
    { technique: 'float', guide: 'float-rig', bait: 'maggots', window: 'midday' },
    { technique: 'feeder', guide: 'feeder-rig', bait: 'maggots', window: 'midday' },
  ],
  amur: [
    { technique: 'float', guide: 'float-rig', bait: 'corn', when: warm },
    { technique: 'carp', guide: 'hair-rig', bait: 'boilies' },
    { technique: 'float', guide: 'float-rig', bait: 'corn' },
  ],
  linj: [
    { technique: 'float', guide: 'float-rig', bait: 'worms', window: 'dawnDusk' },
    { technique: 'feeder', guide: 'feeder-rig', bait: 'corn', window: 'dawnDusk' },
  ],
  klen: [
    { technique: 'fly', guide: 'dry-fly', lure: 'suha-muha', bait: 'dryfly', when: (c) => summer(c) && !c.murky },
    { technique: 'spin', guide: 'spinning', lure: 'vrtilka', bait: 'lure', when: (c) => !cold(c) },
    { technique: 'float', guide: 'float-rig', bait: 'bread' },
    { technique: 'feeder', guide: 'feeder-rig', bait: 'cheese' },
  ],
  mrena: [{ technique: 'feeder', guide: 'feeder-rig', bait: 'cheese', window: 'dusk' }],
  tolstolobik: [{ technique: 'float', guide: 'float-rig', bait: 'paste' }],
  jeseter: [{ technique: 'feeder', guide: 'feeder-rig', bait: 'pellets' }],
  jegulja: [{ technique: 'feeder', guide: 'feeder-rig', bait: 'worms', window: 'night' }],
  brancin: [
    { technique: 'spin', guide: 'sea-bass-spinning', lure: 'wobler', bait: 'lure', window: 'dawnDusk', when: (c) => c.rough || c.murky || c.overcast },
    { technique: 'spin', guide: 'sea-bass-spinning', lure: 'metal-jig', bait: 'lure', window: 'dawnDusk' },
    { technique: 'sea-shore', guide: 'sea-bottom-rig', bait: 'seaworm', window: 'night' },
  ],
  ugor: [{ technique: 'sea-shore', guide: 'sea-bottom-rig', bait: 'deadbait', window: 'night' }],
  cipelj: [{ technique: 'sea-shore', guide: 'float-rig', bait: 'bread' }],
  salpa: [{ technique: 'sea-shore', guide: 'float-rig', bait: 'bread' }],
  lignji: [{ technique: 'eging', guide: 'eging', lure: 'kalamarjera', bait: 'squidjig', window: 'night' }],
  sipa: [
    { technique: 'eging', guide: 'eging', lure: 'kalamarjera', bait: 'squidjig', window: 'allDay', when: (c) => c.month >= 3 && c.month <= 5 },
    { technique: 'eging', guide: 'eging', lure: 'kalamarjera', bait: 'squidjig', window: 'night' },
  ],
};

for (const s of ['postrvji-ostriz', 'soncni-ostriz']) PROFILES[s] = PROFILES.ostriz;
for (const s of ['americki-somic', 'menek']) PROFILES[s] = PROFILES.som;
for (const s of ['jez', 'klenic']) PROFILES[s] = PROFILES.klen;

const BY_GROUP: Record<SpeciesGroup, Option[]> = {
  salmonid: TROUT,
  predator: PROFILES.scuka,
  cyprinid: [
    { technique: 'feeder', guide: 'feeder-rig', bait: 'maggots', when: (c) => c.river || c.windy },
    { technique: 'float', guide: 'float-rig', bait: 'maggots' },
    { technique: 'feeder', guide: 'feeder-rig', bait: 'maggots' },
  ],
  catfish: PROFILES.som,
  sea: [{ technique: 'sea-shore', guide: 'sea-bottom-rig', bait: 'seaworm', window: 'dawnDusk' }],
  cephalopod: PROFILES.lignji,
  other: [{ technique: 'feeder', guide: 'feeder-rig', bait: 'worms' }],
};

/** Night-active fish shift the default window. */
const DEFAULT_WINDOW: Partial<Record<SpeciesGroup, Window>> = { catfish: 'night', cephalopod: 'night' };

const HOUR = 3600_000;
const iso = (ms: number) => new Date(ms).toISOString();

function windowTimes(w: Window, day: ConditionsDay): [string, string][] {
  const rise = day.astro.sunrise ? Date.parse(day.astro.sunrise) : NaN;
  const set = day.astro.sunset ? Date.parse(day.astro.sunset) : NaN;
  if (!Number.isFinite(rise) || !Number.isFinite(set)) return [];
  switch (w) {
    case 'dawnDusk':
      return [
        [iso(rise - 0.5 * HOUR), iso(rise + 2 * HOUR)],
        [iso(set - 2 * HOUR), iso(set + 0.5 * HOUR)],
      ];
    case 'dusk':
      return [[iso(set - 2.5 * HOUR), iso(set + 1 * HOUR)]];
    case 'night':
      return [[iso(set - 0.5 * HOUR), iso(set + 4 * HOUR)]];
    case 'midday': {
      const noon = (rise + set) / 2;
      return [[iso(noon - 1.5 * HOUR), iso(noon + 2.5 * HOUR)]];
    }
    case 'allDay':
      return [[iso(rise), iso(set)]];
  }
}

export function advise(input: {
  species: string;
  group: SpeciesGroup;
  day: ConditionsDay;
  /** The forecast day before, for rain that has already coloured the water. */
  prev?: ConditionsDay | null;
  /** Gauge readings are only current for today. */
  water: ConditionsWater;
  isToday: boolean;
  waterType: WaterType;
  /** Methods the section allows; empty means not restricted (or unknown). */
  allowed: Technique[];
}): Advice {
  const { day, water } = input;
  const sea = input.waterType === 'sea';
  const river = input.waterType === 'river';
  const airMean = (day.tMax + day.tMin) / 2;

  let waterTemp: Advice['waterTemp'] = null;
  if (sea && day.seaTempMean !== null) waterTemp = { value: day.seaTempMean, source: 'sea' };
  else if (!sea && input.isToday && water?.waterTemp != null && water.distanceKm <= 25) waterTemp = { value: water.waterTemp, source: 'gauge' };
  else if (Number.isFinite(airMean)) {
    // Rough: still water lags the air; rivers run a few degrees colder.
    const est = river ? airMean - 3 : airMean;
    waterTemp = { value: Math.round(Math.max(sea ? 10 : 2, Math.min(river ? 22 : 28, est))), source: 'air' };
  }

  const rain = day.precip + (input.prev?.precip ?? 0);
  const flow = input.isToday && water && water.distanceKm <= 25 ? water.flowLevel : null;
  const c: Ctx = {
    month: Number(day.date.slice(5, 7)),
    temp: waterTemp?.value ?? null,
    murky: !sea && (rain >= 15 || flow === 'high' || flow === 'flood'),
    flow,
    falling: day.pressureTrend !== null && day.pressureTrend <= -1.5,
    rising: day.pressureTrend !== null && day.pressureTrend >= 4,
    windy: day.windMax >= 20,
    veryWindy: day.windMax > 40,
    bright: day.cloudMean < 25,
    overcast: day.cloudMean >= 60,
    river,
    sea,
    rough: sea && day.waveMax !== null && day.waveMax > 0.8,
  };

  const options = PROFILES[input.species] ?? BY_GROUP[input.group];
  const allowedOk = (o: Option) => sea || input.allowed.length === 0 || input.allowed.includes(o.technique);
  const pick = options.find((o) => allowedOk(o) && (!o.when || o.when(c))) ?? options.find(allowedOk) ?? options[0];

  const tips: TipKey[] = [];
  if (!allowedOk(pick)) tips.push('methodNotAllowed');
  if (c.flow === 'flood') tips.push('flood');
  else if (c.flow === 'high') tips.push('highFlow');
  else if (c.flow === 'low') tips.push('lowFlow');
  if (c.murky && c.flow !== 'flood' && c.flow !== 'high') tips.push('murky');
  if (c.temp !== null) tips.push(c.temp < 8 ? 'cold' : c.temp < 16 ? 'mild' : c.temp < 23 ? 'warm' : 'hot');
  if (!c.murky && !sea && (input.group === 'salmonid' || input.group === 'predator')) tips.push('clear');
  if (c.falling) tips.push('pressureFalling');
  else if (c.rising) tips.push('pressureRising');
  if (c.veryWindy) tips.push('windStrong');
  else if (c.windy && !river && !sea) tips.push('windShore');
  if (c.bright && !sea) tips.push('brightSun');
  else if (c.overcast && !sea && !c.murky) tips.push('overcast');
  if (c.rough) tips.push('surf');
  else if (sea && day.waveMax !== null && day.waveMax <= 0.3) tips.push('calmSea');
  if (input.species === 'sulec' && c.month >= 3 && c.month <= 9) tips.push('huchenSeason');
  if (input.species === 'lignji' && c.month >= 3 && c.month <= 9) tips.push('squidSeason');

  let window: Window = pick.window ?? DEFAULT_WINDOW[input.group] ?? (cold(c) ? 'midday' : c.overcast ? 'allDay' : 'dawnDusk');
  if (!pick.window && warm(c) && c.bright) window = 'dawnDusk';

  return { technique: pick.technique, guide: pick.guide, lure: pick.lure ?? null, bait: pick.bait, window, times: windowTimes(window, day), waterTemp, tips };
}
