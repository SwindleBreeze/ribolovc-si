import type { Locale } from '@/i18n/routing';
import type { Region, Species, Spot, Technique, WaterType } from './schema';
import { loc } from './text';

/** The slim, serialisable view of a spot that the client-side map and list need. */
export type SpotSummary = {
  slug: string;
  name: string;
  type: WaterType;
  region: Region;
  coords: [number, number];
  species: string[];
  techniques: Technique[];
  beginnerFriendly: boolean;
  difficulty: 1 | 2 | 3;
  forbidden: boolean;
  blurb: string;
};

export function toSummary(spot: Spot, locale: Locale): SpotSummary {
  return {
    slug: spot.slug,
    name: loc(spot.name, locale),
    type: spot.type,
    region: spot.region,
    coords: spot.coords,
    species: spot.species,
    techniques: spot.techniques,
    beginnerFriendly: spot.beginnerFriendly,
    difficulty: spot.difficulty,
    forbidden: spot.permit.kind === 'forbidden',
    blurb: loc(spot.description, locale),
  };
}

export type SpeciesOption = { slug: string; name: string; water: Species['water'] };
