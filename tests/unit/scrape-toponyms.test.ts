import { describe, expect, it } from 'vitest';
import { abbreviatedKey, classifyBound, nominativeVariants, phraseVariants, splitBounds, toponymCandidates, waterName } from '@/scripts/scrape/toponyms';

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
    expect(toponymCandidates('potočka pred izlivom Tržiške Bistrice v Savo')).toEqual(
      expect.arrayContaining(['Tržiške Bistrice', 'Savo']),
    );
    expect(toponymCandidates('cestnega mostu v Zidanem mostu')).toContain('Zidanem mostu');
    expect(toponymCandidates('Jez HE Varaždin do Središče ob Dravi')).toContain('Središče ob Dravi');
    expect(toponymCandidates('mostu v Zg. Doliču')).toContain('Zg Doliču');
    expect(nominativeVariants('Markovcih')).toContain('Markovci');
    expect(nominativeVariants('Litiji')).toContain('Litija');
    expect(nominativeVariants('Rakovnika')).toContain('Rakovnik');
    expect(nominativeVariants('Dravo')).toContain('Drava');
    expect(phraseVariants('Tržiške Bistrice')).toContain('Tržiška Bistrica');
    expect(phraseVariants('Zidanem mostu')).toContain('Zidani most');
    expect(nominativeVariants('Zagradcu')).toContain('Zagradec');
    expect(nominativeVariants('Tacnu')).toContain('Tacen');
    expect(nominativeVariants('Brjami')).toContain('Brje');
    expect(nominativeVariants('Šmartnem')).toContain('Šmartno');
  });

  it('abbreviates place names the way boundary texts do', () => {
    expect(abbreviatedKey('Zgornji Dolič')).toBe('zg dolic');
    expect(abbreviatedKey('Sveti Martin')).toBe('sv martin');
  });

  it('strips generic prefixes from water names', () => {
    expect(waterName('Reka Drava')).toBe('Drava');
    expect(waterName('Potok Polskava')).toBe('Polskava');
    expect(waterName('Akumulacijsko jezero Završnica')).toBe('Završnica');
    expect(waterName('Ribnik Rogoznica 1')).toBe('Rogoznica');
    expect(waterName('Reka Mura s pritoki in mrtvicami')).toBe('Mura');
    expect(waterName('Nanoščica II. A')).toBe('Nanoščica');
    expect(waterName('Ljubljanica 8 + Gruberjev prekop')).toBe('Ljubljanica');
    expect(waterName('Paka R 14+15')).toBe('Paka');
  });
});
