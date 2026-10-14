import { describe, expect, it } from 'vitest';
import { fishingScore, type ScoreInput } from '@/lib/score';

const base: ScoreInput = {
  waterType: 'lake',
  pressureTrend: null,
  cloudMean: 30,
  windMax: 5,
  precip: 0,
  tMax: 20,
  tMin: 10,
  moonPhaseDistance: 0.2,
};

const keys = (i: Partial<ScoreInput>) => fishingScore({ ...base, ...i }).factors.map((f) => f.key);

describe('fishingScore', () => {
  it('starts neutral', () => {
    expect(fishingScore(base)).toEqual({ score: 50, label: 'fair', factors: [] });
  });

  it('rewards a slowly falling barometer and overcast skies', () => {
    const r = fishingScore({ ...base, pressureTrend: -3, cloudMean: 70 });
    expect(r.score).toBe(75);
    expect(r.label).toBe('great');
  });

  it('classifies pressure trends', () => {
    expect(keys({ pressureTrend: 0.5 })).toEqual(['pressure-stable']);
    expect(keys({ pressureTrend: -10 })).toEqual(['pressure-crash']);
    expect(keys({ pressureTrend: 5 })).toEqual(['pressure-rising-fast']);
    expect(keys({ pressureTrend: 2 })).toEqual([]);
  });

  it('penalises flood water heavily and clamps at 0', () => {
    const r = fishingScore({ ...base, flow: 'flood', precip: 40, windMax: 60, tMax: 35, pressureTrend: 6 });
    expect(r.score).toBe(0);
    expect(r.label).toBe('poor');
  });

  it('uses the target species temperature range', () => {
    expect(keys({ waterTemp: 10, tempRange: [6, 14] })).toContain('water-temp-ideal');
    expect(keys({ waterTemp: 22, tempRange: [6, 14] })).toContain('water-temp-off');
    expect(keys({ waterTemp: 16, tempRange: [6, 14] })).not.toContain('water-temp-off');
  });

  it('applies sea-only and still-water-only factors', () => {
    expect(keys({ waterType: 'sea', waveMax: 2 })).toContain('rough-sea');
    expect(keys({ waterType: 'river', waveMax: 2 })).not.toContain('rough-sea');
    expect(keys({ windMax: 15 })).toContain('light-breeze');
    expect(keys({ waterType: 'river', windMax: 15 })).not.toContain('light-breeze');
    expect(keys({ waterType: 'sea', cloudMean: 5 })).not.toContain('bright-sun');
  });

  it('counts new and full moon', () => {
    expect(keys({ moonPhaseDistance: 0.03 })).toEqual(['moon-major']);
  });
});
