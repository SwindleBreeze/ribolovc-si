import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { getSpecies, getSpot } from '@/lib/content';
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

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('spot') ?? '';
  const spot = getSpot(slug);
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
