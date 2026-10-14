'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ConditionsDay, ConditionsResponse } from '@/lib/conditions';
import type { ScoreLabel } from '@/lib/score';
import type { WaterType } from '@/lib/schema';

/** Status colours always appear together with an icon and a text label. */
const STATUS: Record<ScoreLabel, { color: string; icon: string }> = {
  great: { color: '#0ca30c', icon: '★' },
  good: { color: '#0ca30c', icon: '▲' },
  fair: { color: '#fab219', icon: '●' },
  poor: { color: '#d03b3b', icon: '▼' },
};

const MOON_ICON: Record<string, string> = {
  new: '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  full: '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘',
};

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: ConditionsResponse };

export function ConditionsPanel({ spot, type }: { spot: string; type: WaterType }) {
  const t = useTranslations('conditions');
  const locale = useLocale();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/conditions?spot=${encodeURIComponent(spot)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ConditionsResponse) => setState({ status: 'ok', data }))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [spot]);

  if (state.status === 'loading') {
    return (
      <div className="card p-4" aria-busy="true">
        <p className="muted">{t('loading')}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-[var(--border)]" />
          ))}
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="card p-4" role="status">
        <p>{t('error')}</p>
      </div>
    );
  }

  const { days, water, errors } = state.data;
  const day = days[active] ?? days[0];
  const fmtDay = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' });
  const time = (iso: string | null) => (iso ? fmtTime.format(new Date(iso)) : '–');

  return (
    <div className="card p-4" data-testid="conditions">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist">
        {days.map((d, i) => (
          <DayCard
            key={d.date}
            day={d}
            label={i === 0 ? t('today') : fmtDay.format(new Date(`${d.date}T12:00:00`))}
            selected={i === active}
            onClick={() => setActive(i)}
            isSea={type === 'sea'}
          />
        ))}
      </div>

      {day && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">
              {t('why')} <span className="muted text-sm font-normal">({t('score')}: {day.score}/100)</span>
            </h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm" data-testid="score-factors">
              {day.factors.length === 0 && <li className="muted">–</li>}
              {day.factors.map((f) => (
                <li key={f.key} className="flex justify-between gap-2">
                  <span>{t(`factor.${f.key}`)}</span>
                  <span className={`shrink-0 font-semibold tabular-nums ${f.delta > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {f.delta > 0 ? `+${f.delta}` : f.delta}
                  </span>
                </li>
              ))}
            </ul>
            <p className="muted mt-2 text-xs">{t('scoreNote')}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="muted">{t('sunrise')}</dt>
            <dd>🌅 {time(day.astro.sunrise)}</dd>
            <dt className="muted">{t('sunset')}</dt>
            <dd>🌇 {time(day.astro.sunset)}</dd>
            <dt className="muted">{t('moon')}</dt>
            <dd>
              {MOON_ICON[day.astro.moonPhase]} {t(`moonPhase.${day.astro.moonPhase}`)} ({Math.round(day.astro.moonIllumination * 100)} %)
            </dd>
            <dt className="muted">{t('pressure')}</dt>
            <dd>
              {day.pressureMean} hPa <Trend value={day.pressureTrend} />
            </dd>
            <dt className="muted">{t('cloud')}</dt>
            <dd>{Number.isFinite(day.cloudMean) ? `${day.cloudMean} %` : '–'}</dd>
            <dt className="muted">{t('wind')}</dt>
            <dd>
              {Math.round(day.windMax)} km/h · {t('gusts', { value: Math.round(day.gustMax) })}
            </dd>
            {type === 'sea' && (
              <>
                <dt className="muted">{t('waves')}</dt>
                <dd>{day.waveMax ?? '–'} m</dd>
                <dt className="muted">{t('seaTemp')}</dt>
                <dd>{day.seaTempMean ?? '–'} °C</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {day && day.hours.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">{t('hourly')}</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm tabular-nums">
              <thead className="muted text-xs">
                <tr className="text-left">
                  <th className="py-1 pr-2 font-medium">h</th>
                  <th className="pr-2 font-medium">{t('temp')}</th>
                  <th className="pr-2 font-medium">{t('rain')}</th>
                  <th className="pr-2 font-medium">{t('wind')}</th>
                  <th className="pr-2 font-medium">{t('cloud')}</th>
                  <th className="pr-2 font-medium">{t('pressure')}</th>
                  {type === 'sea' && <th className="pr-2 font-medium">{t('waves')}</th>}
                </tr>
              </thead>
              <tbody>
                {day.hours
                  .filter((_, i) => i % 3 === 0)
                  .map((h) => (
                    <tr key={h.time} className="border-t border-[var(--border)]">
                      <td className="py-1 pr-2">{h.time.slice(11, 16)}</td>
                      <td className="pr-2">{Math.round(h.temp)} °C</td>
                      <td className="pr-2">{h.precip > 0 ? `${h.precip} mm` : '–'}</td>
                      <td className="pr-2">
                        <span aria-hidden="true" style={{ display: 'inline-block', transform: `rotate(${h.windDir + 180}deg)` }}>
                          ↑
                        </span>{' '}
                        {Math.round(h.wind)} km/h
                      </td>
                      <td className="pr-2">{Math.round(h.cloud)} %</td>
                      <td className="pr-2">{Math.round(h.pressure)}</td>
                      {type === 'sea' && <td className="pr-2">{h.waveHeight ?? '–'} m</td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {type !== 'sea' && (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-3" data-testid="water">
          <h3 className="font-semibold">💧 {t('water')}</h3>
          {errors.includes('water') ? (
            <p className="muted mt-1 text-sm">{t('waterError')}</p>
          ) : !water ? (
            <p className="muted mt-1 text-sm">{t('noWater')}</p>
          ) : (
            <>
              <p className="muted mt-1 text-xs">
                {t('waterStation', { place: water.place, river: water.river, km: Math.round(water.distanceKm) })}
              </p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <Stat label={t('waterLevel')} value={water.level !== null ? `${water.level} cm` : '–'} />
                <Stat label={t('flow')} value={water.flow !== null ? `${water.flow} m³/s` : '–'} />
                <Stat label={t('waterTemp')} value={water.waterTemp !== null ? `${water.waterTemp} °C` : '–'} />
              </dl>
              {water.flowLevel && (
                <p className="mt-2 text-sm font-semibold">
                  {water.flowLevel === 'flood' ? '⚠️ ' : ''}
                  {t(`flowLevel.${water.flowLevel}`)}
                </p>
              )}
              {water.time && <p className="muted mt-1 text-xs">{t('measured', { time: water.time })}</p>}
            </>
          )}
        </div>
      )}

      <p className="muted mt-3 text-xs">{t('sources')}</p>
    </div>
  );
}

function DayCard({
  day,
  label,
  selected,
  onClick,
  isSea,
}: {
  day: ConditionsDay;
  label: string;
  selected: boolean;
  onClick: () => void;
  isSea: boolean;
}) {
  const t = useTranslations('conditions');
  const status = STATUS[day.label];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${selected ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800' : 'border-[var(--border)] hover:border-brand-500'}`}
      data-testid="day-card"
    >
      <p className="text-sm font-semibold capitalize">{label}</p>
      <p className="mt-1 text-sm font-semibold">
        <span style={{ color: status.color }} aria-hidden="true">
          {status.icon}
        </span>{' '}
        {t(`label.${day.label}`)} <span className="muted font-normal tabular-nums">{day.score}</span>
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${day.score}%`, background: status.color }} />
      </div>
      <p className="mt-2 text-sm tabular-nums">
        {Math.round(day.tMin)}° / <strong>{Math.round(day.tMax)}°</strong>
      </p>
      <p className="muted text-xs tabular-nums">
        💨 {Math.round(day.windMax)} km/h · 🌧 {day.precip} mm
      </p>
      {isSea && day.waveMax !== null && <p className="muted text-xs tabular-nums">🌊 {day.waveMax} m</p>}
    </button>
  );
}

function Trend({ value }: { value: number | null }) {
  const t = useTranslations('conditions.trend');
  if (value === null) return null;
  const key = value <= -1.5 ? 'falling' : value >= 1.5 ? 'rising' : 'stable';
  const arrow = key === 'falling' ? '↘' : key === 'rising' ? '↗' : '→';
  return (
    <span className="muted text-xs">
      {arrow} {t(key)} ({value > 0 ? '+' : ''}
      {value})
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="muted text-xs">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
