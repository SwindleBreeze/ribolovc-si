import type { FlowLevel } from './water/arso';

/**
 * A simple, explainable "fishing score" (0–100) per day. It is a rule of thumb built from
 * widely shared angling wisdom, not a prediction; every factor is shown to the user.
 */

export type ScoreFactorKey =
  | 'pressure-stable'
  | 'pressure-falling'
  | 'pressure-rising-fast'
  | 'pressure-crash'
  | 'overcast'
  | 'bright-sun'
  | 'light-breeze'
  | 'strong-wind'
  | 'light-rain'
  | 'heavy-rain'
  | 'heat'
  | 'frost'
  | 'moon-major'
  | 'water-temp-ideal'
  | 'water-temp-off'
  | 'high-water'
  | 'flood'
  | 'low-water'
  | 'calm-sea'
  | 'rough-sea';

export type ScoreFactor = { key: ScoreFactorKey; delta: number };
export type ScoreLabel = 'poor' | 'fair' | 'good' | 'great';

export type ScoreInput = {
  waterType: 'river' | 'lake' | 'reservoir' | 'pond' | 'sea';
  /** Pressure change over the 24 h ending at the end of this day, hPa. */
  pressureTrend: number | null;
  /** Mean daytime cloud cover, %. */
  cloudMean: number;
  windMax: number;
  precip: number;
  tMax: number;
  tMin: number;
  moonPhaseDistance: number;
  /** Only known for today (from the gauging station). */
  waterTemp?: number | null;
  /** Preferred water temperature range of the target species, if any. */
  tempRange?: [number, number] | null;
  flow?: FlowLevel;
  waveMax?: number | null;
};

export function fishingScore(input: ScoreInput): { score: number; label: ScoreLabel; factors: ScoreFactor[] } {
  const f: ScoreFactor[] = [];
  const add = (key: ScoreFactorKey, delta: number) => f.push({ key, delta });

  const p = input.pressureTrend;
  if (p !== null && Number.isFinite(p)) {
    if (p <= -8) add('pressure-crash', -5);
    else if (p <= -1.5) add('pressure-falling', 15);
    else if (p < 1.5) add('pressure-stable', 10);
    else if (p >= 4) add('pressure-rising-fast', -10);
  }

  if (input.cloudMean >= 40 && input.cloudMean <= 90) add('overcast', 10);
  else if (input.cloudMean < 15 && input.waterType !== 'sea') add('bright-sun', -5);

  if (input.windMax > 40) add('strong-wind', -15);
  else if (input.windMax >= 8 && input.windMax <= 25 && input.waterType !== 'river') add('light-breeze', 5);

  if (input.precip > 20) add('heavy-rain', -15);
  else if (input.precip >= 0.5 && input.precip <= 8) add('light-rain', 5);

  if (input.tMax >= 32) add('heat', -10);
  else if (input.tMax <= 0) add('frost', -10);

  if (input.moonPhaseDistance <= 0.07) add('moon-major', 5);

  if (input.waterTemp != null && input.tempRange) {
    const [lo, hi] = input.tempRange;
    if (input.waterTemp >= lo && input.waterTemp <= hi) add('water-temp-ideal', 10);
    else if (input.waterTemp < lo - 3 || input.waterTemp > hi + 3) add('water-temp-off', -10);
  }

  if (input.flow === 'flood') add('flood', -30);
  else if (input.flow === 'high') add('high-water', -15);
  else if (input.flow === 'low') add('low-water', -5);

  if (input.waterType === 'sea' && input.waveMax != null) {
    if (input.waveMax > 1.5) add('rough-sea', -15);
    else if (input.waveMax <= 0.5) add('calm-sea', 5);
  }

  const score = Math.max(0, Math.min(100, 50 + f.reduce((s, x) => s + x.delta, 0)));
  const label: ScoreLabel = score >= 75 ? 'great' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  return { score, label, factors: f };
}
