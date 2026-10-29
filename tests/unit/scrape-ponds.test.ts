import { describe, expect, it } from 'vitest';
import { Geocoder, isGenericWaterName, withAdjectiveStems, withoutGenericPrefix } from '../../scripts/scrape/geocode';
import type { OsmPond } from '../../scripts/scrape/osm-extract';

const square = (lon: number, lat: number, size: number): [number, number][] => [
  [lon, lat],
  [lon + size, lat],
  [lon + size, lat + size],
  [lon, lat + size],
  [lon, lat],
];

describe('still-water placement', () => {
  it('treats names like "Ribnik" or "Mali ribnik 2" as generic', () => {
    expect(isGenericWaterName('Ribnik')).toBe(true);
    expect(isGenericWaterName('Mali ribnik 2')).toBe(true);
    expect(isGenericWaterName('Gramoznica')).toBe(true);
    expect(isGenericWaterName('Kal')).toBe(true);
    expect(isGenericWaterName('Šoštanjsko jezero')).toBe(false);
    expect(isGenericWaterName('Ribnik Boštanj')).toBe(false);
  });

  it('also tries the village without the "Gramoznica"/"Ribnik" prefix', () => {
    expect(withoutGenericPrefix(['Gramoznica Tržec'])).toEqual(['Gramoznica Tržec', 'Tržec']);
    expect(withoutGenericPrefix(['Ribnik Bajer Grobišče'])).toEqual(['Ribnik Bajer Grobišče', 'Grobišče']);
    expect(withoutGenericPrefix(['Soča'])).toEqual(['Soča']);
  });

  it('derives the town from an adjective name', () => {
    expect(withAdjectiveStems(['Šoštanjsko'])).toEqual(['Šoštanjsko', 'Šoštanj', 'Šoštanje', 'Šoštanja']);
    expect(withAdjectiveStems(['Velenjsko'])).toContain('Velenje');
    expect(isGenericWaterName('Lokev')).toBe(true);
  });

  it('snaps a pond named after a village to the nearest pond there, not to a lake called "Gramoznica"', () => {
    const village = { id: 'n1', name: 'Tržec', kind: 'village', at: [15.877, 46.364] as [number, number] };
    const ponds: OsmPond[] = [
      { id: 'w1', name: '', centroid: [15.8815, 46.3615], areaKm2: 0.05, ring: square(15.879, 46.3605, 0.005) },
      { id: 'w2', name: '', centroid: [15.95, 46.4], areaKm2: 0.2, ring: square(15.948, 46.398, 0.004) },
    ];
    const geo = new Geocoder({
      rivers: [],
      waters: [{ id: 'w9', name: 'Gramoznica', kind: 'lake', centroid: [15.9, 46.4], bbox: [15.89, 46.39, 15.91, 46.41], areaKm2: 0.04, ring: square(15.89, 46.39, 0.01) }],
      places: [village],
      structures: [],
      ponds,
    });
    const p = geo.placeStill({ name: 'Gramoznica Tržec', subtitle: '', anchor: [15.87, 46.42] });
    expect(p.quality).toBe('place');
    expect(p.geometry?.type).toBe('Polygon');
    expect(p.center).toEqual([15.8815, 46.3615]);
    expect(p.notes.at(-1)).toBe('ribnik ob kraju Tržec');
  });
});
