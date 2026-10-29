import { describe, expect, it } from 'vitest';
import { advise } from '../../lib/advice';
import type { ConditionsDay, ConditionsWater } from '../../lib/conditions';

function day(over: Partial<ConditionsDay> = {}): ConditionsDay {
  return {
    date: '2026-06-15',
    tMax: 24,
    tMin: 12,
    precip: 0,
    windMax: 10,
    gustMax: 20,
    weatherCode: 1,
    pressureMean: 1016,
    pressureTrend: 0,
    cloudMean: 40,
    waveMax: null,
    seaTempMean: null,
    astro: {
      sunrise: '2026-06-15T03:12:00Z',
      sunset: '2026-06-15T18:52:00Z',
      moonrise: null,
      moonset: null,
      moonPhase: 'first-quarter',
      moonIllumination: 0.5,
      moonPhaseDistance: 0.25,
    },
    score: 60,
    label: 'good',
    factors: [],
    hours: [],
    ...over,
  };
}

const gauge = (over: Partial<NonNullable<ConditionsWater>> = {}): ConditionsWater =>
  ({ id: '1', river: 'Soča', place: 'Kobarid', lat: 46.2, lon: 13.6, level: 80, flow: 30, waterTemp: 11, flowClass: null, time: null, distanceKm: 4, flowLevel: 'normal', ...over }) as ConditionsWater;

describe('setup advisor', () => {
  it('suggests nymphing for trout on a normal fly-only river', () => {
    const a = advise({ species: 'potocna-postrv', group: 'salmonid', day: day({ date: '2026-04-10' }), water: gauge(), isToday: true, waterType: 'river', allowed: ['fly'] });
    expect(a.technique).toBe('fly');
    expect(a.lure).toBe('nimfa');
    expect(a.waterTemp).toEqual({ value: 11, source: 'gauge' });
  });

  it('switches to a streamer when rain has coloured the river', () => {
    const a = advise({ species: 'sarenka', group: 'salmonid', day: day({ precip: 12 }), prev: day({ precip: 9 }), water: gauge(), isToday: true, waterType: 'river', allowed: ['fly'] });
    expect(a.lure).toBe('streamer');
    expect(a.tips).toContain('murky');
  });

  it('warns about a flooding river', () => {
    const a = advise({ species: 'lipan', group: 'salmonid', day: day(), water: gauge({ flowLevel: 'flood' }), isToday: true, waterType: 'river', allowed: [] });
    expect(a.tips[0]).toBe('flood');
  });

  it('uses a hair rig for carp in warm water and a float at midday when it is cold', () => {
    const warm = advise({ species: 'krap', group: 'cyprinid', day: day(), water: null, isToday: true, waterType: 'pond', allowed: [] });
    expect(warm.guide).toBe('hair-rig');
    const cold = advise({ species: 'krap', group: 'cyprinid', day: day({ date: '2026-01-10', tMax: 4, tMin: -2 }), water: null, isToday: true, waterType: 'pond', allowed: [] });
    expect(cold.guide).toBe('float-rig');
    expect(cold.window).toBe('midday');
    expect(cold.waterTemp?.source).toBe('air');
  });

  it('respects the methods a section allows', () => {
    const a = advise({ species: 'scuka', group: 'predator', day: day(), water: null, isToday: true, waterType: 'lake', allowed: ['float'] });
    expect(a.technique).toBe('float');
    expect(a.tips).not.toContain('methodNotAllowed');
  });

  it('sends squid anglers out at night with a squid jig and computes the window', () => {
    const a = advise({ species: 'lignji', group: 'cephalopod', day: day({ date: '2026-11-20', seaTempMean: 15, waveMax: 0.2 }), water: null, isToday: true, waterType: 'sea', allowed: [] });
    expect(a.lure).toBe('kalamarjera');
    expect(a.window).toBe('night');
    expect(a.times).toEqual([['2026-06-15T18:22:00.000Z', '2026-06-15T22:52:00.000Z']]);
    expect(a.tips).toContain('calmSea');
  });

  it('flags huchen out of season', () => {
    const a = advise({ species: 'sulec', group: 'salmonid', day: day(), water: null, isToday: true, waterType: 'river', allowed: [] });
    expect(a.tips).toContain('huchenSeason');
  });
});
