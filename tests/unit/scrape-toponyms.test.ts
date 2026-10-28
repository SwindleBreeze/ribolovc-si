import { describe, expect, it } from 'vitest';
import { classifyBound, nominativeVariants, phraseVariants, splitBounds, toponymCandidates, waterName } from '@/scripts/scrape/toponyms';

describe('boundary phrases', () => {
  it('splits "od X do Y"', () => {
    expect(splitBounds('od jezu v Markovcih do državne meje s Hrvaško, spodnja stara struga')).toEqual({
      from: 'jezu v Markovcih',
      to: 'državne meje s Hrvaško',
    });
    expect(splitBounds('od državne meje do izliva')).toEqual({ from: 'državne meje', to: 'izliva' });
    expect(splitBounds('Zeleno jezero')).toEqual({ from: null, to: null });
  });

  it('classifies ends', () => {
    expect(classifyBound('izvira')).toEqual({ kind: 'source' });
    expect(classifyBound('izliva')).toEqual({ kind: 'mouth' });
    expect(classifyBound('državne meje s Hrvaško').kind).toBe('border');
    expect(classifyBound('izliva v Dravo')).toMatchObject({ kind: 'confluence', other: 'Dravo' });
    expect(classifyBound('sotočja z Ljubljanico')).toMatchObject({ kind: 'confluence', other: 'Ljubljanico' });
    expect(classifyBound('jezu v Markovcih')).toEqual({ kind: 'place', structure: 'dam' });
    expect(classifyBound('mostu v Doleni')).toEqual({ kind: 'place', structure: 'bridge' });
  });

  it('extracts toponyms and nominative forms', () => {
    expect(toponymCandidates('jezu v Markovcih')).toEqual(['Markovcih']);
    expect(toponymCandidates('potočka pred izlivom Tržiške Bistrice v Savo')).toEqual(['Tržiške Bistrice', 'Savo']);
    expect(nominativeVariants('Markovcih')).toContain('Markovci');
    expect(nominativeVariants('Litiji')).toContain('Litija');
    expect(nominativeVariants('Rakovnika')).toContain('Rakovnik');
    expect(nominativeVariants('Dravo')).toContain('Drava');
    expect(phraseVariants('Tržiške Bistrice')).toContain('Tržiška Bistrica');
  });

  it('strips generic prefixes from water names', () => {
    expect(waterName('Reka Drava')).toBe('Drava');
    expect(waterName('Potok Polskava')).toBe('Polskava');
    expect(waterName('Akumulacijsko jezero Završnica')).toBe('Završnica');
    expect(waterName('Ribnik Rogoznica 1')).toBe('Rogoznica');
  });
});
