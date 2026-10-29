import { describe, expect, it } from 'vitest';
import { getAllSpecies } from '../../lib/content';
import { outlinePath, SHAPES, shapeFor } from '../../lib/fish-shapes';

describe('fish silhouettes', () => {
  it('draws every outline as one closed path without NaN', () => {
    for (const [name, s] of Object.entries(SHAPES)) {
      const d = outlinePath(s.outline);
      expect(d, name).toMatch(/^M[\d.-]+ [\d.-]+.*Z$/);
      expect(d, name).not.toContain('NaN');
      expect(d.match(/M/g), name).toHaveLength(1);
    }
  });

  it('keeps every drawing inside the 200 × 60 box', () => {
    for (const [name, s] of Object.entries(SHAPES)) {
      for (const [x, y] of s.outline) {
        expect(x, name).toBeGreaterThanOrEqual(0);
        expect(x, name).toBeLessThanOrEqual(200);
        expect(y, name).toBeGreaterThanOrEqual(-1);
        expect(y, name).toBeLessThanOrEqual(60);
      }
    }
  });

  it('gives every species in the encyclopedia a shape', () => {
    for (const sp of getAllSpecies()) expect(SHAPES[shapeFor(sp.slug, sp.group)], sp.slug).toBeDefined();
  });
});
