import { dayAstro, type DayAstro } from './astro';
import type { Forecast, HourlyMarine, HourlyWeather } from './weather/openmeteo';
import { flowLevel, type FlowLevel, type WaterStation } from './water/arso';
import { fishingScore, type ScoreFactor, type ScoreLabel } from './score';
import type { WaterType } from './schema';

export type ConditionsHour = HourlyWeather & {
  waveHeight?: number | null;
  seaTemp?: number | null;
  seaLevel?: number | null;
};

export type ConditionsDay = {
  date: string;
  tMax: number;
  tMin: number;
  precip: number;
  windMax: number;
  gustMax: number;
  weatherCode: number;
  pressureMean: number;
  pressureTrend: number | null;
  cloudMean: number;
  waveMax: number | null;
  seaTempMean: number | null;
  astro: DayAstro;
  score: number;
  label: ScoreLabel;
  factors: ScoreFactor[];
  hours: ConditionsHour[];
};

export type ConditionsWater = (WaterStation & { distanceKm: number; flowLevel: FlowLevel }) | null;

export type ConditionsResponse = {
  spot: string;
  generatedAt: string;
  days: ConditionsDay[];
  water: ConditionsWater;
  errors: string[];
};

const mean = (xs: number[]) => {
  const v = xs.filter(Number.isFinite);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildConditions(args: {
  spot: { slug: string; type: WaterType; coords: [number, number] };
  forecast: Forecast;
  marine: HourlyMarine[] | null;
  water: (WaterStation & { distanceKm: number }) | null;
  tempRange: [number, number] | null;
  /** Local date (YYYY-MM-DD) of "today"; earlier days in the forecast are history. */
  today: string;
  generatedAt: string;
  errors?: string[];
}): ConditionsResponse {
  const { spot, forecast, marine, water, tempRange, today } = args;
  const [lat, lon] = spot.coords;
  const marineByTime = new Map((marine ?? []).map((m) => [m.time, m]));
  const flow = water ? flowLevel(water.flowClass) : null;

  const pressureAt = new Map(forecast.hourly.map((h) => [h.time, h.pressure]));

  const days = forecast.daily
    .filter((d) => d.date >= today)
    .map((d): ConditionsDay => {
      const hours: ConditionsHour[] = forecast.hourly
        .filter((h) => h.time.startsWith(d.date))
        .map((h) => {
          const m = marineByTime.get(h.time);
          return m ? { ...h, waveHeight: m.waveHeight, seaTemp: m.seaTemp, seaLevel: m.seaLevel } : h;
        });
      const daytime = hours.filter((h) => {
        const hour = Number(h.time.slice(11, 13));
        return hour >= 6 && hour <= 20;
      });

      // Pressure trend: last hour of this day vs. the same hour a day earlier.
      const last = hours.at(-1);
      let pressureTrend: number | null = null;
      if (last) {
        const prev = new Date(`${last.time}:00Z`);
        prev.setUTCDate(prev.getUTCDate() - 1);
        const before = pressureAt.get(prev.toISOString().slice(0, 16));
        if (before !== undefined && Number.isFinite(before) && Number.isFinite(last.pressure)) {
          pressureTrend = round1(last.pressure - before);
        }
      }

      const waves = hours.map((h) => h.waveHeight).filter((v): v is number => typeof v === 'number');
      const seaTemps = hours.map((h) => h.seaTemp).filter((v): v is number => typeof v === 'number');
      const waveMax = waves.length ? Math.max(...waves) : null;
      const cloudMean = Math.round(mean(daytime.map((h) => h.cloud)));
      const astro = dayAstro(d.date, lat, lon);
      const isToday = d.date === today;

      const { score, label, factors } = fishingScore({
        waterType: spot.type,
        pressureTrend,
        cloudMean,
        windMax: d.windMax,
        precip: d.precip,
        tMax: d.tMax,
        tMin: d.tMin,
        moonPhaseDistance: astro.moonPhaseDistance,
        waterTemp: isToday ? (water?.waterTemp ?? (seaTemps.length ? mean(seaTemps) : null)) : null,
        tempRange,
        flow: isToday ? flow : null,
        waveMax,
      });

      return {
        ...d,
        pressureMean: Math.round(mean(hours.map((h) => h.pressure))),
        pressureTrend,
        cloudMean,
        waveMax: waveMax === null ? null : round1(waveMax),
        seaTempMean: seaTemps.length ? round1(mean(seaTemps)) : null,
        astro,
        score,
        label,
        factors,
        hours,
      };
    });

  return {
    spot: spot.slug,
    generatedAt: args.generatedAt,
    days,
    water: water ? { ...water, flowLevel: flow } : null,
    errors: args.errors ?? [],
  };
}

/** Today's date in Slovenia as YYYY-MM-DD. */
export function todayInSlovenia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana' }).format(now);
}
