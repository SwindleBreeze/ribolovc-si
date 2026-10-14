import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { flowLevel, normalizeName, parseArsoHydro, pickStation } from '@/lib/water/arso';

const xml = fs.readFileSync('tests/fixtures/arso.xml', 'utf8');

describe('ARSO hydro feed', () => {
  const stations = parseArsoHydro(xml);

  it('parses stations with numbers and missing values', () => {
    expect(stations).toHaveLength(3);
    expect(stations[0]).toMatchObject({
      code: '8060',
      river: 'Soča',
      level: 118,
      flow: 32.4,
      waterTemp: 9.8,
      flowClass: 'srednji pretok',
    });
    expect(stations[2]).toMatchObject({ flow: null, waterTemp: null, flowClass: null });
  });

  it('decodes entities and skips stations without coordinates', () => {
    const s = parseArsoHydro('<postaja sifra="1"><reka>A &amp; B</reka></postaja><postaja sifra="2" ge_sirina="46" ge_dolzina="14"><reka>A &amp; B</reka></postaja>');
    expect(s).toHaveLength(1);
    expect(s[0].river).toBe('A & B');
  });

  it('picks the nearest station on the same water only', () => {
    expect(pickStation(stations, { coords: [46.18, 13.73], water: 'Soča' })?.code).toBe('8060');
    // Tolminka station is closer but on a different river.
    expect(pickStation(stations, { coords: [46.2, 13.7], water: 'Soča' })?.code).toBe('8060');
    expect(pickStation(stations, { coords: [46.18, 13.73], water: 'Krka' })).toBeNull();
    expect(pickStation(stations, { coords: [46.18, 13.73] })).toBeNull();
  });

  it('ignores same-river stations that are too far away', () => {
    expect(pickStation(stations, { coords: [46.6, 13.73], water: 'Soča' })).toBeNull();
  });

  it('honours an explicit station code', () => {
    const s = pickStation(stations, { coords: [46.0, 14.0], water: 'Soča', arsoStation: '3420' });
    expect(s?.river).toBe('Ljubljanica');
    expect(s?.distanceKm).toBeGreaterThan(30);
  });

  it('maps ARSO flow labels to levels', () => {
    expect(flowLevel('mali pretok')).toBe('low');
    expect(flowLevel('srednji pretok')).toBe('normal');
    expect(flowLevel('visok pretok')).toBe('high');
    expect(flowLevel('prvi visokovodni pretok')).toBe('flood');
    expect(flowLevel(null)).toBeNull();
  });

  it('normalises Slovenian names', () => {
    expect(normalizeName('Šmartinsko jezero')).toBe('smartinskojezero');
    expect(normalizeName('Soča')).toBe('soca');
  });
});
