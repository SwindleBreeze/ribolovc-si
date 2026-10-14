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
      <div className="card grid gap-4 p-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted text-xs font-medium">{t('species')}</span>
          <select className="field" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="finder-species">
            {species.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="muted mb-1 text-xs font-medium">{t('clarity')}</legend>
          <div className="flex gap-2">
            {(['clear', 'murky'] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={clarity === c}
                onClick={() => setClarity(c)}
                className={`btn flex-1 ${clarity === c ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t(c)}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted text-xs font-medium">{t('season')}</span>
          <select className="field" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {t(`seasons.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="mt-6" aria-live="polite">
        <h2 className="mb-3 text-xl font-bold">{t('results')}</h2>
        {matches.length === 0 ? (
          <p className="muted">{t('none')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="finder-results">
            {matches.map((l) => (
              <li key={l.slug} className="card p-4">
                <p className="font-semibold">{l.name}</p>
                <p className="mt-1 text-sm">{l.description}</p>
                <p className="muted mt-2 text-sm">💡 {l.tips}</p>
                {l.guide && (
                  <Link href={`/guides/${l.guide.slug}`} className="mt-2 inline-block text-sm text-brand-600 underline">
                    {t('readGuide')}: {l.guide.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        {fish && (
          <div className="card mt-4 p-4">
            <h3 className="font-semibold">🪱 {t('naturalBaits')}</h3>
            <p className="mt-1 text-sm">{fish.baits}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {fish.rigs.map((r) => (
                <Link key={r.slug} href={`/guides/${r.slug}`} className="chip hover:border-brand-500">
                  📘 {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
