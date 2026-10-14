import SunCalc from 'suncalc';

export const moonPhases = [
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
] as const;
export type MoonPhase = (typeof moonPhases)[number];

export function moonPhaseName(phase: number): MoonPhase {
  // suncalc phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
  return moonPhases[Math.round(phase * 8) % 8];
}

export type DayAstro = {
  sunrise: string | null;
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  moonPhase: MoonPhase;
  moonIllumination: number;
  /** Distance of the phase from new or full moon (0 = exactly new/full, 0.25 = quarter). */
  moonPhaseDistance: number;
};

const iso = (d: Date | undefined) => (d && !Number.isNaN(d.getTime()) ? d.toISOString() : null);

/** Sun and moon data for a local calendar date (YYYY-MM-DD) at a location. */
export function dayAstro(date: string, lat: number, lon: number): DayAstro {
  const noon = new Date(`${date}T12:00:00Z`);
  const sun = SunCalc.getTimes(noon, lat, lon);
  const moon = SunCalc.getMoonTimes(new Date(`${date}T00:00:00Z`), lat, lon, true);
  const illum = SunCalc.getMoonIllumination(noon);
  const p = illum.phase;
  return {
    sunrise: iso(sun.sunrise),
    sunset: iso(sun.sunset),
    moonrise: iso(moon.rise),
    moonset: iso(moon.set),
    moonPhase: moonPhaseName(p),
    moonIllumination: Math.round(illum.fraction * 100) / 100,
    moonPhaseDistance: Math.min(p, Math.abs(p - 0.5), 1 - p),
  };
}
