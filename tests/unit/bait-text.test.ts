import { describe, expect, it } from 'vitest';
import { tackleInText } from '../../lib/bait-text';
import { getAllSpecies } from '../../lib/content';

const bySlug = Object.fromEntries(getAllSpecies().map((s) => [s.slug, s.baits.sl]));

describe('baits in species texts', () => {
  it('finds natural baits in order', () => {
    expect(tackleInText(bySlug.krap).baits).toEqual(['boilies', 'corn', 'pellets', 'bread']);
    expect(tackleInText(bySlug.linj).baits).toEqual(['worms', 'maggots', 'corn']);
    expect(tackleInText(bySlug.klen).baits).toEqual(['bread', 'cheese', 'maggots', 'dryfly']);
  });

  it('tells sea worms from earthworms', () => {
    expect(tackleInText(bySlug.orada).baits).toEqual(['seaworm']);
    expect(tackleInText(bySlug.brancin).baits).toEqual(['seaworm']);
    expect(tackleInText(bySlug.spar).baits).toContain('worms');
  });

  it('finds lure types', () => {
    expect(tackleInText(bySlug.scuka).lures).toEqual(['zlica', 'vrtilka', 'wobler', 'shad']);
    expect(tackleInText(bySlug.scuka).baits).toEqual(['deadbait']);
    expect(tackleInText(bySlug.sulec).lures).toEqual(['wobler', 'shad', 'zopf']);
  });

  it('finds something to draw for every species', () => {
    const empty = getAllSpecies().filter((s) => {
      const t = tackleInText(s.baits.sl);
      return t.baits.length + t.lures.length === 0;
    });
    expect(empty.map((s) => s.slug)).toEqual([]);
  });
});
