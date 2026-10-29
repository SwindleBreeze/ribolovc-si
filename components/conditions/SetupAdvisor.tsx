'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { advise, type SpeciesGroup } from '@/lib/advice';
import type { ConditionsDay, ConditionsWater } from '@/lib/conditions';
import type { Technique, WaterType } from '@/lib/schema';
import { LureIllustration } from '@/components/ui/LureIllustration';

export type AdvisorData = {
  species: { slug: string; name: string; group: SpeciesGroup }[];
  /** Methods the place allows; empty = not restricted. */
  techniques: Technique[];
  lures: Record<string, string>;
  guides: Record<string, string>;
};

export function SetupAdvisor({
  data,
  days,
  active,
  dayLabel,
  water,
  waterType,
}: {
  data: AdvisorData;
  days: ConditionsDay[];
  active: number;
  dayLabel: string;
  water: ConditionsWater;
  waterType: WaterType;
}) {
  const t = useTranslations('advice');
  const tt = useTranslations('technique');
  const locale = useLocale();
  const [fish, setFish] = useState(data.species[0]?.slug ?? '');
  const sp = data.species.find((s) => s.slug === fish) ?? data.species[0];
  const fmtTime = useMemo(() => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Ljubljana' }), [locale]);

  if (!sp) return null;
  const day = days[active];
  const a = advise({
    species: sp.slug,
    group: sp.group,
    day,
    prev: active > 0 ? days[active - 1] : null,
    water,
    isToday: active === 0,
    waterType,
    allowed: data.techniques,
  });
  const lureName = a.lure ? data.lures[a.lure] : null;
  const guideTitle = data.guides[a.guide];
  const times = a.times.map(([from, to]) => `${fmtTime.format(new Date(from))}–${fmtTime.format(new Date(to))}`).join(' · ');

  return (
    <section aria-labelledby="advice-h" className="mt-8 border-t-[3px] border-ink bg-raised" data-testid="advisor">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
        <h3 id="advice-h" className="text-xl font-semibold">
          {t('heading', { day: dayLabel })}
        </h3>
        {data.species.length > 1 && (
          <label className="label flex min-w-0 items-center gap-2">
            {t('fish')}
            <select className="field !min-h-9 w-auto normal-case tracking-normal" value={sp.slug} onChange={(e) => setFish(e.target.value)} data-testid="advisor-fish">
              {data.species.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-5 p-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          {a.lure && (
            <div className="mb-3 flex h-24 items-center justify-center border border-rule bg-paper px-6">
              <LureIllustration slug={a.lure} className="h-auto w-full max-w-[200px] text-ink" />
            </div>
          )}
          <p className="label">{tt(a.technique)}</p>
          <p className="font-display text-2xl font-semibold leading-tight" data-testid="advisor-setup">
            {lureName ?? t(`bait.${a.bait}`)}
          </p>
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
            <dt className="label pt-0.5">{t('when')}</dt>
            <dd>
              {t(`window.${a.window}`)}
              {times && <span className="num block text-ink-2">{times}</span>}
            </dd>
            {a.waterTemp && (
              <>
                <dt className="label pt-0.5">{t('water')}</dt>
                <dd>
                  <span className="num">≈ {Math.round(a.waterTemp.value)} °C</span>{' '}
                  <span className="text-muted">({t(`tempSource.${a.waterTemp.source}`)})</span>
                </dd>
              </>
            )}
          </dl>
          {guideTitle && (
            <Link href={`/guides/${a.guide}`} className="mt-3 inline-flex items-center gap-1 text-sm">
              {t('guide')}: {guideTitle} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div>
          <p className="label mb-1">{t('why')}</p>
          <ul className="text-[15px]" data-testid="advisor-tips">
            {a.tips.map((k) => (
              <li key={k} className={`border-b border-rule-2 py-2 ${k === 'flood' || k === 'methodNotAllowed' ? 'font-medium text-poor' : ''}`}>
                {t(`tip.${k}`)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-muted">{t('note')}</p>
        </div>
      </div>
    </section>
  );
}
