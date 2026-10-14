/** Open-Meteo forecast and marine APIs (free, no key; https://open-meteo.com). */

export const FORECAST_DAYS = 4;
const TZ = 'Europe/Ljubljana';

export type HourlyWeather = {
  time: string;
  temp: number;
  precip: number;
  cloud: number;
  wind: number;
  gust: number;
  windDir: number;
  pressure: number;
};

export type DailyWeather = {
  date: string;
  tMax: number;
  tMin: number;
  precip: number;
  windMax: number;
  gustMax: number;
  weatherCode: number;
};

export type Forecast = { hourly: HourlyWeather[]; daily: DailyWeather[] };

export type HourlyMarine = {
  time: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  seaTemp: number | null;
  seaLevel: number | null;
};

const HOURLY = [
  'temperature_2m',
  'precipitation',
  'cloud_cover',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'surface_pressure',
] as const;
const DAILY = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'weather_code',
] as const;
const MARINE = ['wave_height', 'wave_period', 'sea_surface_temperature', 'sea_level_height_msl'] as const;

export function forecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
    // One day of history lets us compute the pressure trend for the first forecast day.
    past_days: '1',
    forecast_days: String(FORECAST_DAYS),
    timezone: TZ,
    wind_speed_unit: 'kmh',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function marineUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    hourly: MARINE.join(','),
    forecast_days: String(FORECAST_DAYS),
    timezone: TZ,
  });
  return `https://marine-api.open-meteo.com/v1/marine?${params}`;
}

type Series = Record<string, (number | null)[] | string[]>;

function num(series: Series, key: string, i: number): number {
  const v = (series[key] as (number | null)[] | undefined)?.[i];
  return typeof v === 'number' ? v : NaN;
}

function numOrNull(series: Series, key: string, i: number): number | null {
  const v = (series[key] as (number | null)[] | undefined)?.[i];
  return typeof v === 'number' ? v : null;
}

export function parseForecast(json: unknown): Forecast {
  const data = json as { hourly?: Series & { time: string[] }; daily?: Series & { time: string[] } };
  if (!data?.hourly?.time || !data?.daily?.time) throw new Error('Unexpected Open-Meteo forecast response');
  const h = data.hourly;
  const d = data.daily;
  return {
    hourly: h.time.map((time, i) => ({
      time,
      temp: num(h, 'temperature_2m', i),
      precip: num(h, 'precipitation', i),
      cloud: num(h, 'cloud_cover', i),
      wind: num(h, 'wind_speed_10m', i),
      gust: num(h, 'wind_gusts_10m', i),
      windDir: num(h, 'wind_direction_10m', i),
      pressure: num(h, 'surface_pressure', i),
    })),
    daily: d.time.map((date, i) => ({
      date,
      tMax: num(d, 'temperature_2m_max', i),
      tMin: num(d, 'temperature_2m_min', i),
      precip: num(d, 'precipitation_sum', i),
      windMax: num(d, 'wind_speed_10m_max', i),
      gustMax: num(d, 'wind_gusts_10m_max', i),
      weatherCode: num(d, 'weather_code', i),
    })),
  };
}

export function parseMarine(json: unknown): HourlyMarine[] {
  const data = json as { hourly?: Series & { time: string[] } };
  if (!data?.hourly?.time) throw new Error('Unexpected Open-Meteo marine response');
  const h = data.hourly;
  return h.time.map((time, i) => ({
    time,
    waveHeight: numOrNull(h, 'wave_height', i),
    wavePeriod: numOrNull(h, 'wave_period', i),
    seaTemp: numOrNull(h, 'sea_surface_temperature', i),
    seaLevel: numOrNull(h, 'sea_level_height_msl', i),
  }));
}
