import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { forecastUrl, marineUrl, parseForecast, parseMarine } from '@/lib/weather/openmeteo';

const forecastJson = JSON.parse(fs.readFileSync('tests/fixtures/forecast.json', 'utf8'));
const marineJson = JSON.parse(fs.readFileSync('tests/fixtures/marine.json', 'utf8'));

describe('Open-Meteo', () => {
  it('builds a 4-day forecast URL with one past day for the pressure trend', () => {
    const url = new URL(forecastUrl(46.1812345, 13.728));
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('46.181');
    expect(url.searchParams.get('forecast_days')).toBe('4');
    expect(url.searchParams.get('past_days')).toBe('1');
    expect(url.searchParams.get('timezone')).toBe('Europe/Ljubljana');
    expect(url.searchParams.get('hourly')).toContain('surface_pressure');
  });

  it('builds a marine URL with waves, sea temperature and sea level', () => {
    const hourly = new URL(marineUrl(45.5, 13.6)).searchParams.get('hourly')!;
    expect(hourly.split(',')).toEqual(['wave_height', 'wave_period', 'sea_surface_temperature', 'sea_level_height_msl']);
  });

  it('parses hourly and daily series', () => {
    const f = parseForecast(forecastJson);
    expect(f.daily).toHaveLength(5);
    expect(f.hourly).toHaveLength(120);
    expect(f.hourly[0]).toMatchObject({ time: '2026-06-09T00:00', pressure: 1016, windDir: 200 });
    expect(f.daily[4]).toMatchObject({ date: '2026-06-13', tMax: 12, precip: 0 });
  });

  it('parses marine data and keeps missing values as null', () => {
    const m = parseMarine({ hourly: { time: ['2026-06-10T00:00'], wave_height: [null], sea_surface_temperature: [17.2] } });
    expect(m[0]).toEqual({ time: '2026-06-10T00:00', waveHeight: null, wavePeriod: null, seaTemp: 17.2, seaLevel: null });
    expect(parseMarine(marineJson)).toHaveLength(96);
  });

  it('rejects an unexpected response', () => {
    expect(() => parseForecast({ error: true })).toThrow();
    expect(() => parseMarine({})).toThrow();
  });
});
