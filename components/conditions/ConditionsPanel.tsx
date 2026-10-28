'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ConditionsDay, ConditionsResponse } from '@/lib/conditions';
import type { ScoreLabel } from '@/lib/score';
import type { WaterType } from '@/lib/schema';
import { PressureChart } from './PressureChart';

/** Status always pairs a colour with an icon and a word. */
const STATUS: Record<ScoreLabel, { cls: string; icon: string }> = {
  great: { cls: 'text-good', icon: '★' },
  good: { cls: 'text-good', icon: '▲' },
  fair: { cls: 'text-fair', icon: '●' },
  poor: { cls: 'text-poor', icon: '▼' },
};

const MOON: Record<string, string> = {
  new: '○',
  'waxing-crescent': '◔',
  'first-quarter': '◑',
  'waxing-gibbous': '◕',
  full: '●',
  'waning-gibbous': '◕',
  'last-quarter': '◐',
  'waning-crescent': '◔',
};

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: ConditionsResponse };

export function ConditionsPanel({ query, type }: { query: string; type: WaterType | 'sea' }) {
  const t = useTranslations('conditions');
  const locale = useLocale();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/conditions?${query}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ConditionsResponse) => setState({ status: 'ok', data }))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [query]);

  const fmtDay = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'numeric' }), [locale]);
  const fmtTime = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' }),
    [locale],
  );
  const fmtNum = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);

  if (state.status === 'loading') {
    return (
      <div aria-busy="true" className="border-t-2 border-ink pt-4">
        <p className="text-muted">{t('loading')}</p>
        <div className="mt-3 grid grid-cols-4 gap-px bg-rule-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-panel" />
          ))}
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <p role="status" className="border-t-2 border-ink pt-4">
        {t('error')}
      </p>
    );
  }

  const { days, water, errors } = state.data;
  const day = days[active] ?? days[0];
  const isSea = type === 'sea';
  const time = (iso: string | null) => (iso ? fmtTime.format(new Date(iso)) : '–');
  const dayLabel = (d: ConditionsDay, i: number) => (i === 0 ? t('today') : fmtDay.format(new Date(`${d.date}T12:00:00`)));
  const rows: { label: string; cell: (d: ConditionsDay) => string }[] = [
    { label: t('temp'), cell: (d) => `${Math.round(d.tMin)}° / ${Math.round(d.tMax)}°` },
    { label: t('wind'), cell: (d) => `${Math.round(d.windMax)} km/h` },
    { label: t('rain'), cell: (d) => `${fmtNum.format(d.precip)} mm` },
    { label: t('cloud'), cell: (d) => (Number.isFinite(d.cloudMean) ? `${d.cloudMean} %` : '–') },
    { label: t('moon'), cell: (d) => `${MOON[d.astro.moonPhase]} ${Math.round(d.astro.moonIllumination * 100)} %` },
    ...(isSea
      ? [
          { label: t('waves'), cell: (d: ConditionsDay) => (d.waveMax === null ? '–' : `${fmtNum.format(d.waveMax)} m`) },
          { label: t('seaTemp'), cell: (d: ConditionsDay) => (d.seaTempMean === null ? '–' : `${fmtNum.format(d.seaTempMean)} °C`) },
        ]
      : []),
  ];

  return (
    <div data-testid="conditions">
      <div className="grid grid-cols-4 border-t-2 border-b border-ink" role="tablist" aria-label={t('score')}>
        {days.map((d, i) => {
          const s = STATUS[d.label];
          const selected = i === active;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              data-testid="day-card"
              className={`border-r border-rule px-3 py-3 text-left last:border-r-0 sm:px-4 ${selected ? 'bg-raised shadow-[inset_0_3px_0_var(--accent)]' : 'hover:bg-panel'}`}
            >
              <span className={`label block ${i === 0 ? '!text-accent-ink font-semibold' : ''}`}>{dayLabel(d, i)}</span>
              <span className="num mt-1.5 block text-[34px] leading-none sm:text-[44px]">{d.score}</span>
              <span className={`mt-1.5 block text-sm font-medium ${s.cls}`}>
                <span aria-hidden="true">{s.icon}</span> {t(`label.${d.label}`)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[15px]">
          <caption className="sr-only">{t('hourly')}</caption>
          <tbody className="num">
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-rule-2">
                <th scope="row" className="label w-[18%] py-2.5 pr-2 text-left font-sans">
                  {r.label}
                </th>
                {days.map((d, i) => (
                  <td key={d.date} className={`px-3 py-2.5 sm:px-4 ${i === active ? 'bg-raised' : ''}`}>
                    {r.cell(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PressureChart days={days} locale={locale} />

      <div className="mt-7 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="why-h">
          <h3 id="why-h" className="text-xl font-semibold">
            {t('whyScore', { score: day.score })}
          </h3>
          <ul className="mt-2 text-[15px]" data-testid="score-factors">
            {day.factors.length === 0 && <li className="py-2 text-muted">–</li>}
            {day.factors.map((f) => (
              <li key={f.key} className="flex justify-between gap-3 border-b border-rule-2 py-2">
                <span>{t(`factor.${f.key}`)}</span>
                <span className={`num shrink-0 ${f.delta > 0 ? 'text-good' : 'text-poor'}`}>{f.delta > 0 ? `+${f.delta}` : `−${Math.abs(f.delta)}`}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-muted">{t('scoreNote')}</p>
          <dl className="num mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="label font-sans">{t('sunrise')}</dt>
            <dd>{time(day.astro.sunrise)}</dd>
            <dt className="label font-sans">{t('sunset')}</dt>
            <dd>{time(day.astro.sunset)}</dd>
            <dt className="label font-sans">{t('moon')}</dt>
            <dd className="font-sans">{t(`moonPhase.${day.astro.moonPhase}`)}</dd>
            <dt className="label font-sans">{t('wind')}</dt>
            <dd>{t('gusts', { value: Math.round(day.gustMax) })}</dd>
          </dl>
        </section>

        {!isSea && (
          <section aria-labelledby="water-h" className="border border-ink p-4" data-testid="water">
            <h3 id="water-h" className="label !text-xs">
              {water
                ? t('waterStation', { place: water.place, river: water.river, km: Math.round(water.distanceKm) })
                : t('water')}
            </h3>
            {errors.includes('water') ? (
              <p className="mt-2 text-sm text-muted">{t('waterError')}</p>
            ) : !water ? (
              <p className="mt-2 text-sm text-muted">{t('noWater')}</p>
            ) : (
              <>
                <dl className="mt-3 grid grid-cols-3 gap-3">
                  <Reading label={t('waterLevel')} value={water.level} unit="cm" fmt={fmtNum} />
                  <Reading label={t('flow')} value={water.flow} unit="m³/s" fmt={fmtNum} />
                  <Reading label={t('waterTemp')} value={water.waterTemp} unit="°C" fmt={fmtNum} />
                </dl>
                {water.flowLevel && <FlowBar level={water.flowLevel} label={t(`flowLevel.${water.flowLevel}`)} low={t('flowLevel.low')} high={t('flowLevel.high')} />}
                {water.time && <p className="num mt-3 text-xs text-muted">ARSO · {t('measured', { time: water.time })}</p>}
              </>
            )}
          </section>
        )}
      </div>
      <p className="eyebrow mt-5 !text-[11px]">{t('sources')}</p>
    </div>
  );
}

function Reading({ label, value, unit, fmt }: { label: string; value: number | null; unit: string; fmt: Intl.NumberFormat }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-0.5 text-[26px] leading-tight">
        {value === null ? '–' : fmt.format(value)}
        {value !== null && <span className="text-[13px]"> {unit}</span>}
      </dd>
    </div>
  );
}

const FLOW_POS = { low: 15, normal: 48, high: 78, flood: 95 } as const;

function FlowBar({ level, label, low, high }: { level: keyof typeof FLOW_POS; label: string; low: string; high: string }) {
  return (
    <div className="mt-4">
      <div aria-hidden="true" className="relative h-2 bg-[linear-gradient(90deg,#d9e6ea_0_33%,#9ec1cc_33%_66%,#2f6f8f_66%_100%)]">
        <span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${FLOW_POS[level]}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{low}</span>
        <span className="font-semibold text-ink">
          {level === 'flood' ? '⚠ ' : ''}
          {label}
        </span>
        <span>{high}</span>
      </div>
    </div>
  );
}
