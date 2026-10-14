import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildConditions, todayInSlovenia } from '@/lib/conditions';
import { parseForecast, parseMarine } from '@/lib/weather/openmeteo';
import { parseArsoHydro, pickStation } from '@/lib/water/arso';
import { dayAstro, moonPhaseName } from '@/lib/astro';

const forecast = parseForecast(JSON.parse(fs.readFileSync('tests/fixtures/forecast.json', 'utf8')));
const marine = parseMarine(JSON.parse(fs.readFileSync('tests/fixtures/marine.json', 'utf8')));
const stations = parseArsoHydro(fs.readFileSync('tests/fixtures/arso.xml', 'utf8'));

describe('buildConditions', () => {
  const river = buildConditions({
    spot: { slug: 'soca-tolmin', type: 'river', coords: [46.181, 13.728] },
    forecast,
    marine: null,
    water: pickStation(stations, { coords: [46.181, 13.728], water: 'Soča' }),
    tempRange: [6, 14],
    today: '2026-06-10',
    generatedAt: '2026-06-10T05:00:00Z',
  });

  it('returns four days from today, dropping the history day', () => {
    expect(river.days.map((d) => d.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13']);
    expect(river.days[0].hours).toHaveLength(24);
  });

  it('computes the pressure trend over 24 hours, including for the first day', () => {
    expect(river.days[0].pressureTrend).toBe(0);
    expect(river.days[2].pressureTrend).toBeLessThan(-1.5);
    expect(river.days[2].factors.map((f) => f.key)).toContain('pressure-falling');
  });

  it('uses the gauging station only for today', () => {
    expect(river.water).toMatchObject({ code: '8060', flowLevel: 'normal', waterTemp: 9.8 });
    expect(river.days[0].factors.map((f) => f.key)).toContain('water-temp-ideal');
    expect(river.days[1].factors.map((f) => f.key)).not.toContain('water-temp-ideal');
  });

  it('adds wave and sea temperature data for sea spots', () => {
    const sea = buildConditions({
      spot: { slug: 'piran-punta', type: 'sea', coords: [45.529, 13.564] },
      forecast,
      marine,
      water: null,
      tempRange: [10, 20],
      today: '2026-06-10',
      generatedAt: '2026-06-10T05:00:00Z',
    });
    expect(sea.days[0].waveMax).toBe(0.3);
    expect(sea.days[2].waveMax).toBe(1.1);
    expect(sea.days[0].seaTempMean).toBe(17.4);
    expect(sea.days[0].hours[0].seaLevel).toBe(0);
    expect(sea.days[0].factors.map((f) => f.key)).toContain('water-temp-ideal');
  });
});

describe('dates and astronomy', () => {
  it("formats today's date in Slovenian time", () => {
    expect(todayInSlovenia(new Date('2026-06-09T22:30:00Z'))).toBe('2026-06-10');
  });

  it('names moon phases', () => {
    expect(moonPhaseName(0)).toBe('new');
    expect(moonPhaseName(0.5)).toBe('full');
    expect(moonPhaseName(0.98)).toBe('new');
    expect(moonPhaseName(0.25)).toBe('first-quarter');
  });

  it('computes sunrise before sunset in Ljubljana in midsummer', () => {
    const a = dayAstro('2026-06-21', 46.05, 14.5);
    expect(a.sunrise! < a.sunset!).toBe(true);
    // Sunrise in Ljubljana around 03:10 UTC (05:10 local) at the solstice.
    expect(a.sunrise!.slice(11, 13)).toBe('03');
    expect(a.moonIllumination).toBeGreaterThanOrEqual(0);
  });
});
