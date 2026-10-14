/**
 * ARSO (Slovenian Environment Agency) latest hydrological readings.
 * Feed: https://www.arso.gov.si/xml/vode/hidro_podatki_zadnji.xml
 * Each <postaja> carries water level (cm), discharge (m³/s) and water temperature (°C)
 * when the station measures them. Data © ARSO, used with attribution.
 */

import { distanceKm } from '../geo';

export const ARSO_HYDRO_URL = 'https://www.arso.gov.si/xml/vode/hidro_podatki_zadnji.xml';

export type WaterStation = {
  code: string;
  river: string;
  place: string;
  lat: number;
  lon: number;
  time: string | null;
  level: number | null;
  flow: number | null;
  waterTemp: number | null;
  /** ARSO's characteristic-flow label, e.g. "srednji pretok", "visok pretok". */
  flowClass: string | null;
};

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function toNumber(s: string | undefined): number | null {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseArsoHydro(xml: string): WaterStation[] {
  const stations: WaterStation[] = [];
  const stationRe = /<postaja\b([^>]*)>([\s\S]*?)<\/postaja>/g;
  for (const [, attrText, body] of xml.matchAll(stationRe)) {
    const attrs = Object.fromEntries([...attrText.matchAll(/(\w+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    const fields = Object.fromEntries([...body.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)].map(([, k, v]) => [k, decode(v)]));
    const lat = toNumber(attrs.ge_sirina);
    const lon = toNumber(attrs.ge_dolzina);
    if (lat === null || lon === null) continue;
    stations.push({
      code: attrs.sifra ?? '',
      river: fields.reka ?? '',
      place: fields.merilno_mesto ?? fields.ime_kratko ?? '',
      lat,
      lon,
      time: fields.datum || null,
      level: toNumber(fields.vodostaj),
      flow: toNumber(fields.pretok),
      waterTemp: toNumber(fields.temp_vode),
      flowClass: fields.pretok_znacilni || null,
    });
  }
  return stations;
}

export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

const MAX_DISTANCE_KM = 35;

/**
 * Pick the station for a spot: an explicit station code wins; otherwise the nearest
 * station on the same river/lake within 35 km. Never a station on a different water,
 * because a neighbouring river's level says nothing about this one.
 */
export function pickStation(
  stations: WaterStation[],
  spot: { coords: [number, number]; water?: string; arsoStation?: string },
): (WaterStation & { distanceKm: number }) | null {
  if (spot.arsoStation) {
    const s = stations.find((st) => st.code === spot.arsoStation);
    return s ? { ...s, distanceKm: distanceKm(spot.coords, [s.lat, s.lon]) } : null;
  }
  if (!spot.water) return null;
  const water = normalizeName(spot.water);
  let best: (WaterStation & { distanceKm: number }) | null = null;
  for (const s of stations) {
    if (!normalizeName(s.river).startsWith(water)) continue;
    const d = distanceKm(spot.coords, [s.lat, s.lon]);
    if (d <= MAX_DISTANCE_KM && (!best || d < best.distanceKm)) best = { ...s, distanceKm: d };
  }
  return best;
}

export type FlowLevel = 'low' | 'normal' | 'high' | 'flood' | null;

/** Map ARSO's Slovenian flow label to a coarse level. */
export function flowLevel(flowClass: string | null): FlowLevel {
  if (!flowClass) return null;
  const s = flowClass.toLowerCase();
  if (s.includes('visokovod') || s.includes('poplav')) return 'flood';
  if (s.includes('visok')) return 'high';
  if (s.includes('mal') || s.includes('niz')) return 'low';
  if (s.includes('srednj')) return 'normal';
  return null;
}
