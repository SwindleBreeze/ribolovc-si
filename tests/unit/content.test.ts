import { describe, expect, it } from 'vitest';
import { getAllSpecies, getGuide, getGuides, getLures, getSpot, getSpots } from '@/lib/content';
import { loc } from '@/lib/text';

describe('content', () => {
  it('loads and validates all collections', () => {
    expect(getSpots().length).toBeGreaterThanOrEqual(50);
    expect(getAllSpecies().length).toBeGreaterThan(30);
    expect(getLures().length).toBeGreaterThan(5);
  });

  it('marks protected coastal reserves as no-fishing', () => {
    expect(getSpot('strunjan-rezervat')?.permit.kind).toBe('forbidden');
    expect(getSpot('secovlje-rezervat')?.permit.kind).toBe('forbidden');
  });

  it('falls back to English for guides without a German translation', () => {
    const g = getGuide('first-steps', 'de');
    expect(g?.locale).toBe('en');
    expect(g?.fallback).toBe(true);
    expect(getGuide('first-steps', 'sl')?.fallback).toBe(false);
    expect(getGuides('sl')[0].slug).toBe('first-steps');
  });

  it('falls back to English for localized text', () => {
    expect(loc({ sl: 'Reka', en: 'River' }, 'it')).toBe('River');
    expect(loc({ sl: 'Reka', en: 'River', it: 'Fiume' }, 'it')).toBe('Fiume');
  });
});
