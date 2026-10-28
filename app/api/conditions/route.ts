import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { getRevir, getSpecies, getSpot } from '@/lib/content';
import type { WaterType } from '@/lib/schema';
import { buildConditions, todayInSlovenia } from '@/lib/conditions';
import { forecastUrl, marineUrl, parseForecast, parseMarine } from '@/lib/weather/openmeteo';
import { ARSO_HYDRO_URL, parseArsoHydro, pickStation } from '@/lib/water/arso';

const REVALIDATE_SECONDS = 1800;
const TIMEOUT_MS = 8000;

/**
 * For tests and offline development: when CONDITIONS_FIXTURE_DIR is set, upstream responses
 * are read from forecast.json, marine.json and arso.xml in that directory instead of the network.
 */
const FIXTURE_DIR = process.env.CONDITIONS_FIXTURE_DIR;

async function fetchText(url: string, fixture: string): Promise<string> {
  if (FIXTURE_DIR) return fs.readFile(path.resolve(FIXTURE_DIR, fixture), 'utf8');
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'ribolovc.si (fishing conditions; contact via website)' },
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res.text();
}

type Target = {
  slug: string;
  type: WaterType;
  coords: [number, number];
  water?: string;
  arsoStation?: string;
  species: string[];
};

/** A curated spot (?spot=slug) or a generated fishing section (?revir=club/slug). */
function resolveTarget(spotSlug: string | null, revirId: string | null): Target | null {
  if (revirId) {
    const r = getRevir(revirId);
    if (!r?.center) return null;
    return { slug: r.id, type: r.waterType, coords: r.center, water: r.water ?? undefined, species: r.species };
  }
  const s = spotSlug ? getSpot(spotSlug) : undefined;
  return s ? { slug: s.slug, type: s.type, coords: s.coords, water: s.water, arsoStation: s.arsoStation, species: s.species } : null;
}

export async function GET(request: NextRequest) {
  const spot = resolveTarget(request.nextUrl.searchParams.get('spot'), request.nextUrl.searchParams.get('revir'));
  if (!spot) return NextResponse.json({ error: 'Unknown spot' }, { status: 404 });

  const [lat, lon] = spot.coords;
  const isSea = spot.type === 'sea';

  const [forecastRes, marineRes, arsoRes] = await Promise.allSettled([
    fetchText(forecastUrl(lat, lon), 'forecast.json').then((t) => parseForecast(JSON.parse(t))),
    isSea ? fetchText(marineUrl(lat, lon), 'marine.json').then((t) => parseMarine(JSON.parse(t))) : Promise.resolve(null),
    spot.water || spot.arsoStation
      ? fetchText(ARSO_HYDRO_URL, 'arso.xml').then(parseArsoHydro)
      : Promise.resolve([]),
  ]);

  if (forecastRes.status === 'rejected') {
    console.error('conditions: forecast failed', forecastRes.reason);
    return NextResponse.json({ error: 'Weather forecast is unavailable right now' }, { status: 502 });
  }

  const errors: string[] = [];
  if (marineRes.status === 'rejected') errors.push('marine');
  if (arsoRes.status === 'rejected') errors.push('water');

  const stations = arsoRes.status === 'fulfilled' ? arsoRes.value : [];
  const target = getSpecies(spot.species[0]);

  const body = buildConditions({
    spot: { slug: spot.slug, type: spot.type, coords: spot.coords },
    forecast: forecastRes.value,
    marine: marineRes.status === 'fulfilled' ? marineRes.value : null,
    water: pickStation(stations, spot),
    tempRange: target?.tempRange ?? null,
    today: todayInSlovenia(),
    generatedAt: new Date().toISOString(),
    errors,
  });

  return NextResponse.json(body, {
    headers: { 'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=3600` },
  });
}
