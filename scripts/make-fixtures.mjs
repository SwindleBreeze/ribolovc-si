// Writes deterministic upstream fixtures (Open-Meteo forecast/marine, ARSO hydro XML) in the
// providers' response formats, for unit tests and offline e2e runs. Dates start "today".
// Usage: node scripts/make-fixtures.mjs [outDir] [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] ?? 'tests/fixtures';
const start = process.argv[3] ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana' }).format(new Date());
fs.mkdirSync(out, { recursive: true });

const day0 = new Date(`${start}T00:00:00Z`);
day0.setUTCDate(day0.getUTCDate() - 1); // past_days=1
const dates = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(day0);
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
});
const times = dates.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));

// Pressure: steady, then a slow fall on day 3 (a front), then rising.
const pressure = times.map((_, i) => {
  const d = Math.floor(i / 24);
  return +(1016 - (d === 3 ? (i % 24) * 0.25 : d > 3 ? 6 - (i % 24) * 0.3 : 0)).toFixed(1);
});

const forecast = {
  latitude: 46.18,
  longitude: 13.73,
  timezone: 'Europe/Ljubljana',
  hourly: {
    time: times,
    temperature_2m: times.map((_, i) => +(8 + 6 * Math.sin(((i % 24) - 8) / 24 * 2 * Math.PI)).toFixed(1)),
    precipitation: times.map((_, i) => (Math.floor(i / 24) === 3 && i % 24 > 14 ? 0.6 : 0)),
    cloud_cover: times.map((_, i) => [20, 10, 60, 85, 40][Math.floor(i / 24)]),
    wind_speed_10m: times.map((_, i) => [6, 8, 12, 18, 9][Math.floor(i / 24)]),
    wind_gusts_10m: times.map((_, i) => [12, 15, 22, 35, 16][Math.floor(i / 24)]),
    wind_direction_10m: times.map(() => 200),
    surface_pressure: pressure,
  },
  daily: {
    time: dates,
    temperature_2m_max: [14, 15, 13, 11, 12],
    temperature_2m_min: [3, 4, 5, 6, 2],
    precipitation_sum: [0, 0, 0, 5.4, 0],
    wind_speed_10m_max: [6, 8, 12, 18, 9],
    wind_gusts_10m_max: [12, 15, 22, 35, 16],
    weather_code: [1, 0, 3, 61, 2],
  },
};

const marine = {
  hourly: {
    time: times.slice(24),
    wave_height: times.slice(24).map((_, i) => +(0.2 + (Math.floor(i / 24) === 2 ? 0.9 : 0.1)).toFixed(2)),
    wave_period: times.slice(24).map(() => 3.5),
    sea_surface_temperature: times.slice(24).map(() => 17.4),
    sea_level_height_msl: times.slice(24).map((_, i) => +(0.3 * Math.sin((i / 12.4) * 2 * Math.PI)).toFixed(2)),
  },
};

const arso = `<?xml version="1.0" encoding="UTF-8"?>
<arsopodatki verzija="1.4">
<postaja sifra="8060" ge_dolzina="13.7351" ge_sirina="46.1712" kota_0="150.12">
  <reka>Soča</reka><merilno_mesto>Kobarid</merilno_mesto><ime_kratko>Soča - Kobarid</ime_kratko>
  <datum>${start} 06:00</datum><vodostaj>118</vodostaj><pretok>32.4</pretok><pretok_znacilni>srednji pretok</pretok_znacilni><temp_vode>9.8</temp_vode>
</postaja>
<postaja sifra="3420" ge_dolzina="14.5303" ge_sirina="46.0402" kota_0="285.00">
  <reka>Ljubljanica</reka><merilno_mesto>Moste</merilno_mesto>
  <datum>${start} 06:00</datum><vodostaj>142</vodostaj><pretok>61.0</pretok><pretok_znacilni>visok pretok</pretok_znacilni><temp_vode>11.2</temp_vode>
</postaja>
<postaja sifra="9999" ge_dolzina="13.70" ge_sirina="46.20">
  <reka>Tolminka</reka><merilno_mesto>Tolmin</merilno_mesto>
  <datum>${start} 06:00</datum><vodostaj>40</vodostaj><pretok></pretok><temp_vode></temp_vode>
</postaja>
</arsopodatki>
`;

fs.writeFileSync(path.join(out, 'forecast.json'), JSON.stringify(forecast));
fs.writeFileSync(path.join(out, 'marine.json'), JSON.stringify(marine));
fs.writeFileSync(path.join(out, 'arso.xml'), arso);
console.log(`fixtures for ${start} written to ${out}`);
