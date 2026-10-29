'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LureIllustration } from '@/components/ui/LureIllustration';
import { seasons, type Season } from '@/lib/schema';

export type FinderSpecies = { slug: string; name: string; baits: string; rigs: { slug: string; title: string }[] };
export type FinderLure = {
  slug: string;
  name: string;
  description: string;
  tips: string;
  species: string[];
  clarity: ('clear' | 'murky')[];
  seasons: Season[];
  guide: { slug: string; title: string } | null;
};

function currentSeason(month = new Date().getMonth() + 1): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function LureFinder({ species, lures }: { species: FinderSpecies[]; lures: FinderLure[] }) {
  const t = useTranslations('lureFinder');
  const [target, setTarget] = useState(species.find((s) => s.slug === 'scuka')?.slug ?? species[0]?.slug ?? '');
  const [clarity, setClarity] = useState<'clear' | 'murky'>('clear');
  const [season, setSeason] = useState<Season>(currentSeason);

  const fish = species.find((s) => s.slug === target);
  const matches = useMemo(
    () => lures.filter((l) => l.species.includes(target) && l.clarity.includes(clarity) && l.seasons.includes(season)),
    [lures, target, clarity, season],
  );

  return (
    <div className="mt-6">
      <div className="grid gap-5 border-y border-ink py-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
        <label className="label flex min-w-0 flex-col gap-1">
          {t('species')}
          <select className="field normal-case tracking-normal" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="finder-species">
            {species.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Segmented
          legend={t('clarity')}
          value={clarity}
          onChange={setClarity}
          options={(['clear', 'murky'] as const).map((c) => ({ value: c, label: t(c) }))}
          testId="finder-clarity"
        />
        <Segmented
          legend={t('season')}
          value={season}
          onChange={setSeason}
          options={seasons.map((s) => ({ value: s, label: t(`seasons.${s}`) }))}
          testId="finder-season"
        />
      </div>

      <section className="mt-8" aria-live="polite">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[28px] font-semibold">{t('results')}</h2>
          <p className="num text-sm text-muted">
            {fish?.name} · {t(clarity)} · {t(`seasons.${season}`)}
          </p>
        </div>
        {matches.length === 0 ? (
          <p className="text-muted">{t('none')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="finder-results">
            {matches.map((l) => (
              <li key={l.slug} className="flex flex-col border border-rule bg-raised">
                <div className="flex h-28 items-center justify-center border-b border-rule bg-paper px-6">
                  <LureIllustration slug={l.slug} className="h-auto w-full max-w-[220px] text-ink" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-xl font-semibold leading-tight">{l.name}</h3>
                  <p className="mt-1.5 text-[15px] leading-snug">{l.description}</p>
                  <div className="mt-3 border-l-2 border-accent pl-3">
                    <p className="label">{t('howToUse')}</p>
                    <p className="mt-0.5 text-sm text-ink-2">{l.tips}</p>
                  </div>
                  <dl className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 pt-4 text-xs">
                    <dt className="label">{t('season')}</dt>
                    <dd className="flex gap-1">
                      {seasons.map((s) => (
                        <span
                          key={s}
                          title={t(`seasons.${s}`)}
                          className={`num px-1.5 py-0.5 ${l.seasons.includes(s) ? 'border border-ink bg-ink text-paper' : 'border border-dashed border-rule text-muted'}`}
                        >
                          {t(`seasonShort.${s}`)}
                        </span>
                      ))}
                    </dd>
                    <dt className="label">{t('clarity')}</dt>
                    <dd className="text-ink-2">{l.clarity.map((c) => t(c)).join(' · ')}</dd>
                  </dl>
                  {l.guide && (
                    <Link href={`/guides/${l.guide.slug}`} className="mt-3 inline-flex items-center gap-1 border-t border-rule-2 pt-3 text-sm">
                      {t('readGuide')}: {l.guide.title} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {fish && (
          <div className="mt-8 grid gap-4 border-t-[3px] border-ink bg-raised p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <h3 className="label !text-xs">{t('naturalBaits')}</h3>
              <p className="mt-1 text-[15px]">{fish.baits}</p>
            </div>
            {fish.rigs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fish.rigs.map((r) => (
                  <Link key={r.slug} href={`/guides/${r.slug}`} className="btn btn-line !min-h-9 text-sm">
                    {r.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Segmented<T extends string>({
  legend,
  value,
  onChange,
  options,
  testId,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  testId: string;
}) {
  return (
    <fieldset className="min-w-0" data-testid={testId}>
      <legend className="label mb-1">{legend}</legend>
      <div className="flex border border-ink">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-11 flex-1 whitespace-nowrap px-3 text-sm not-first:border-l not-first:border-ink ${
              value === o.value ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-raised'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
