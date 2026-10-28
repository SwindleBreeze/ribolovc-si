'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
      <div className="grid gap-4 border-y border-ink py-5 sm:grid-cols-3">
        <label className="label flex flex-col gap-1">
          {t('species')}
          <select className="field normal-case tracking-normal" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="finder-species">
            {species.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="label mb-1">{t('clarity')}</legend>
          <div className="flex gap-2">
            {(['clear', 'murky'] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={clarity === c}
                onClick={() => setClarity(c)}
                className={`btn flex-1 ${clarity === c ? 'bg-ink text-paper' : 'btn-line'}`}
              >
                {t(c)}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="label flex flex-col gap-1">
          {t('season')}
          <select className="field normal-case tracking-normal" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {t(`seasons.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="mt-8" aria-live="polite">
        <h2 className="mb-3 text-[28px] font-semibold">{t('results')}</h2>
        {matches.length === 0 ? (
          <p className="text-muted">{t('none')}</p>
        ) : (
          <ul className="grid border-t border-ink sm:grid-cols-2" data-testid="finder-results">
            {matches.map((l) => (
              <li key={l.slug} className="border-b border-rule-2 py-4 sm:odd:pr-6 sm:even:border-l sm:even:border-l-rule sm:even:pl-6">
                <p className="font-display text-xl font-semibold">{l.name}</p>
                <p className="mt-1 text-sm">{l.description}</p>
                <p className="mt-2 text-sm text-ink-2">{l.tips}</p>
                {l.guide && (
                  <Link href={`/guides/${l.guide.slug}`} className="mt-2 inline-block text-sm">
                    {t('readGuide')}: {l.guide.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        {fish && (
          <div className="mt-8 border border-ink p-4">
            <h3 className="label !text-xs">{t('naturalBaits')}</h3>
            <p className="mt-1 text-sm">{fish.baits}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {fish.rigs.map((r) => (
                <Link key={r.slug} href={`/guides/${r.slug}`} className="btn btn-line !min-h-9 text-sm">
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
