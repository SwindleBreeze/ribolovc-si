import type { Locale } from '@/i18n/routing';
import { getAllSpecies, getRevirji, getSpots } from './content';
import type { Region, Revir, Spot, Technique } from './schema';
import { loc } from './text';

/** One row of the map/list: a curated spot or a generated fishing section. */
export type PlaceSummary = {
  id: string;
  kind: 'spot' | 'revir';
  href: string;
  name: string;
  sub: string;
  type: 'river' | 'lake' | 'reservoir' | 'pond' | 'sea';
  /** [lat, lon] */
  center: [number, number];
  species: string[];
  techniques: Technique[];
  region: Region | null;
  club: string | null;
  online: boolean;
  beginner: boolean;
  salmonid: boolean;
  forbidden: boolean;
  approx: boolean;
};

let salmonids: Set<string> | undefined;
function salmonidSet() {
  salmonids ??= new Set(getAllSpecies().filter((s) => s.group === 'salmonid').map((s) => s.slug));
  return salmonids;
}

export function revirTitle(r: Revir, locale: Locale): { name: string; sub: string } {
  const en = locale !== 'sl' && r.en?.name ? r.en : null;
  return { name: en?.name || r.name, sub: en?.subtitle || r.subtitle };
}

function fromRevir(r: Revir, locale: Locale): PlaceSummary | null {
  // Unplaced sections only carry the club's town (for the weather); a pin there would pile
  // every unplaced water of a club onto one spot, so they stay off the map and list.
  if (!r.center || r.quality === 'none') return null;
  const sal = salmonidSet();
  const { name, sub } = revirTitle(r, locale);
  return {
    id: `revir:${r.id}`,
    kind: 'revir',
    href: `/revirji/${r.id}`,
    name,
    sub: sub || r.club.name,
    type: r.waterType,
    center: r.center,
    species: r.species,
    techniques: r.techniques,
    region: r.region,
    club: r.club.name,
    online: r.online,
    beginner: r.waterType !== 'river' && !r.flyOnly && r.species.some((s) => ['krap', 'koreselj', 'rdeceoka', 'ploscic', 'linj', 'amur'].includes(s)),
    salmonid: r.species.length > 0 && r.species.filter((s) => sal.has(s)).length >= r.species.length / 2,
    forbidden: false,
    approx: r.quality !== 'segment' && r.quality !== 'water' && r.quality !== 'manual',
  };
}

function fromSpot(s: Spot, locale: Locale): PlaceSummary {
  const sal = salmonidSet();
  return {
    id: `spot:${s.slug}`,
    kind: 'spot',
    href: `/spots/${s.slug}`,
    name: loc(s.name, locale),
    sub: s.club?.name ?? '',
    type: s.type,
    center: s.coords,
    species: s.species,
    techniques: s.techniques,
    region: s.region,
    club: s.club?.name ?? null,
    online: s.permit.kind === 'ribiskekarte',
    beginner: s.beginnerFriendly,
    salmonid: s.species.filter((x) => sal.has(x)).length >= s.species.length / 2,
    forbidden: s.permit.kind === 'forbidden',
    approx: s.approx,
  };
}

export function getPlaces(locale: Locale): PlaceSummary[] {
  const revirji = getRevirji()
    .map((r) => fromRevir(r, locale))
    .filter((p): p is PlaceSummary => p !== null);
  return [...getSpots().map((s) => fromSpot(s, locale)), ...revirji];
}

/** GeoJSON of section geometries (lines and lakes) for the map. */
export function revirGeoJSON(): GeoJSON.FeatureCollection {
  const sal = salmonidSet();
  return {
    type: 'FeatureCollection',
    features: getRevirji()
      .filter((r) => r.geometry && r.geometry.type !== 'Point')
      .map((r) => ({
        type: 'Feature',
        geometry: r.geometry as GeoJSON.Geometry,
        properties: {
          id: `revir:${r.id}`,
          salmonid: r.species.length > 0 && r.species.filter((s) => sal.has(s)).length >= r.species.length / 2,
        },
      })),
  };
}
