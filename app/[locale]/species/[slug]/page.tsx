import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures, getSpecies, getSpots } from '@/lib/content';
import { loc } from '@/lib/text';
import { DonateCta } from '@/components/DonateCta';

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getAllSpecies().map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = getSpecies(slug);
  if (!s) return {};
  return {
    title: `${loc(s.name, locale)} (${s.latin})`,
    description: loc(s.description, locale),
    alternates: {
      canonical: `/${locale}/species/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/species/${slug}`])),
    },
  };
}

export default async function SpeciesPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const s = getSpecies(slug);
  if (!s) notFound();
  const t = await getTranslations();

  const months = new Intl.DateTimeFormat(locale, { month: 'short' });
  const spots = getSpots().filter((x) => x.species.includes(s.slug) && x.permit.kind !== 'forbidden');
  const rigs = s.rigs.map((r) => getGuide(r, locale)).filter((g): g is NonNullable<typeof g> => Boolean(g));
  const lures = getLures().filter((l) => l.species.includes(s.slug));

  return (
    <article className="mx-auto max-w-4xl px-4 py-6">
      <nav className="muted text-sm">
        <Link href="/species" className="hover:underline">
          {t('species.title')}
        </Link>
      </nav>
      <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{loc(s.name, locale)}</h1>
      <p className="muted italic">{s.latin}</p>
      {s.protected && <p className="chip mt-2">🛡️ {t('species.protected')}</p>}
      <p className="mt-4 text-lg">{loc(s.description, locale)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-bold">{t('species.habitat')}</h2>
          <p className="mt-1 text-sm">{loc(s.habitat, locale)}</p>
        </section>
        <section className="card p-4">
          <h2 className="font-bold">{t('species.baits')}</h2>
          <p className="mt-1 text-sm">{loc(s.baits, locale)}</p>
        </section>
        <section className="card p-4">
          <h2 className="font-bold">{t('species.bestTime')}</h2>
          <p className="mt-1 text-sm">{loc(s.bestTime, locale)}</p>
          <p className="muted mt-2 text-xs">{t('species.waterTemp', { min: s.tempRange[0], max: s.tempRange[1] })}</p>
        </section>
        <section className="card p-4">
          <h2 className="font-bold">{t('species.bestMonths')}</h2>
          <ol className="mt-2 grid grid-cols-6 gap-1 text-center text-xs" aria-label={t('species.bestMonths')}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const on = s.bestMonths.includes(m);
              return (
                <li
                  key={m}
                  className={`rounded px-1 py-1 ${on ? 'bg-brand-600 font-semibold text-white' : 'muted border border-[var(--border)]'}`}
                >
                  {months.format(new Date(2024, m - 1, 15))}
                  <span className="sr-only">{on ? ' ✓' : ''}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="card mt-4 p-4">
        <h2 className="font-bold">⚖️ {t('species.rules')}</h2>
        {s.rules.minSizeCm && (
          <p className="mt-1 text-sm font-semibold">
            {t('species.minSize', { cm: s.rules.minSizeCm })}
            {s.rules.sourceUrl && (
              <a href={s.rules.sourceUrl} className="ml-2 font-normal text-brand-600 underline" target="_blank" rel="noopener">
                EUR-Lex ↗
              </a>
            )}
          </p>
        )}
        {s.rules.note && <p className="mt-1 text-sm">{loc(s.rules.note, locale)}</p>}
        {s.water === 'fresh' && <p className="muted mt-1 text-sm">{t('species.generalRule')}</p>}
      </section>

      {(rigs.length > 0 || lures.length > 0) && (
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold">{t('species.rigs')}</h2>
          <div className="flex flex-wrap gap-2">
            {rigs.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="chip hover:border-brand-500">
                📘 {g.title}
              </Link>
            ))}
          </div>
          {lures.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">{t('species.lures')}</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {lures.map((l) => (
                  <li key={l.slug} className="card p-3 text-sm">
                    <p className="font-semibold">{loc(l.name, locale)}</p>
                    <p className="muted mt-1">{loc(l.tips, locale)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {spots.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold">{t('species.where')}</h2>
          <ul className="flex flex-wrap gap-2">
            {spots.map((x) => (
              <li key={x.slug}>
                <Link href={`/spots/${x.slug}`} className="chip hover:border-brand-500">
                  📍 {loc(x.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DonateCta />
    </article>
  );
}
