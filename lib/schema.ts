import { z } from 'zod';

/** Localized text. Slovenian and English are required; German and Italian fall back to English. */
export const LText = z.object({
  sl: z.string().min(1),
  en: z.string().min(1),
  de: z.string().min(1).optional(),
  it: z.string().min(1).optional(),
});
export type LText = z.infer<typeof LText>;

/** Localized text that must exist in every UI language (names, short labels). */
export const LTextFull = z.object({
  sl: z.string().min(1),
  en: z.string().min(1),
  de: z.string().min(1),
  it: z.string().min(1),
});

const LatLon = z.tuple([z.number().min(45.3).max(46.95), z.number().min(13.3).max(16.65)]);

export const waterTypes = ['river', 'lake', 'reservoir', 'pond', 'sea'] as const;
export const techniques = ['fly', 'spin', 'float', 'feeder', 'carp', 'bottom', 'sea-shore', 'eging'] as const;
export const regions = [
  'gorenjska',
  'goriska',
  'osrednjeslovenska',
  'notranjska',
  'dolenjska',
  'posavje',
  'savinjska',
  'koroska',
  'stajerska',
  'pomurje',
  'obala',
] as const;
export const lureClarity = ['clear', 'murky'] as const;
export const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;

export type WaterType = (typeof waterTypes)[number];
export type Technique = (typeof techniques)[number];
export type Region = (typeof regions)[number];
export type Season = (typeof seasons)[number];

const Url = z.url();

export const Spot = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: LTextFull,
  type: z.enum(waterTypes),
  region: z.enum(regions),
  /** River or lake name used to match the nearest ARSO gauging station. */
  water: z.string().optional(),
  coords: LatLon,
  parking: LatLon.optional(),
  /** Coordinates are approximate (true for all hand-curated seed data until checked on site). */
  approx: z.boolean().default(true),
  description: LText,
  access: LText,
  species: z.array(z.string()).min(1),
  techniques: z.array(z.enum(techniques)).min(1),
  club: z.object({ name: z.string(), url: Url.optional() }).optional(),
  permit: z.object({
    kind: z.enum(['ribiskekarte', 'club', 'none', 'sea-boat', 'forbidden']),
    url: Url.optional(),
    note: LText.optional(),
  }),
  rules: z
    .object({
      flyOnly: z.boolean().optional(),
      barbless: z.boolean().optional(),
      catchAndRelease: z.boolean().optional(),
      notes: LText.optional(),
      sourceUrl: Url.optional(),
    })
    .default({}),
  season: LText.optional(),
  beginnerFriendly: z.boolean().default(false),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Explicit ARSO station code; otherwise the nearest station on the same water is used. */
  arsoStation: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: Url })).default([]),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Spot = z.infer<typeof Spot>;

export const Species = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: LTextFull,
  latin: z.string(),
  water: z.enum(['fresh', 'sea']),
  group: z.enum(['salmonid', 'predator', 'cyprinid', 'catfish', 'sea', 'cephalopod', 'other']),
  description: LText,
  habitat: LText,
  baits: LText,
  bestMonths: z.array(z.number().int().min(1).max(12)),
  bestTime: LText,
  techniques: z.array(z.enum(techniques)).min(1),
  rigs: z.array(z.string()).default([]),
  /** Preferred water temperature range in °C, used by the fishing score. */
  tempRange: z.tuple([z.number(), z.number()]),
  rules: z
    .object({
      /** Legal minimum size where it is set by a national or EU rule (sea species). */
      minSizeCm: z.number().optional(),
      note: LText.optional(),
      sourceUrl: Url.optional(),
    })
    .default({}),
  protected: z.boolean().default(false),
});
export type Species = z.infer<typeof Species>;

export const Lure = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: LTextFull,
  description: LText,
  tips: LText,
  species: z.array(z.string()).min(1),
  clarity: z.array(z.enum(lureClarity)).min(1),
  seasons: z.array(z.enum(seasons)).min(1),
  techniques: z.array(z.enum(techniques)).min(1),
  guide: z.string().optional(),
});
export type Lure = z.infer<typeof Lure>;

export const guideCategories = ['beginner', 'rig', 'technique', 'sea'] as const;
export const GuideFrontmatter = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.enum(guideCategories),
  order: z.number().default(100),
  species: z.array(z.string()).default([]),
});
export type GuideFrontmatter = z.infer<typeof GuideFrontmatter>;
