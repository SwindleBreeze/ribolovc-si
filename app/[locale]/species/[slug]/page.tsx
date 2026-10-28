import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures, getSpecies } from '@/lib/content';
import { getPlaces } from '@/lib/places';
import { loc } from '@/lib/text';
import { DataStrip, PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { FishSilhouette } from '@/components/ui/FishSilhouette';
import { MonthStrip } from '@/components/ui/MonthStrip';

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

  const places = getPlaces(locale).filter((p) => p.species.includes(s.slug) && !p.forbidden);
  const rigs = s.rigs.map((r) => getGuide(r, locale)).filter((g): g is NonNullable<typeof g> => Boolean(g));
  const lures = getLures().filter((l) => l.species.includes(s.slug));

  return (
    <article>
      <PageHeader
        eyebrow={
          <Link href="/species" className="text-muted">
            {t('species.title')}
          </Link>
        }
        title={
          <span className="flex flex-wrap items-end gap-x-6 gap-y-2">
            {loc(s.name, locale)}
            <FishSilhouette slug={s.slug} group={s.group} label={loc(s.name, locale)} className="mb-2 h-14 w-48 text-ink" />
          </span>
        }
        lede={
          <>
            <span className="font-display italic">{s.latin}</span> — {loc(s.description, locale)}
          </>
        }
      >
        <DataStrip
          items={[
            { label: t('species.bestTime'), value: loc(s.bestTime, locale) },
            { label: t('species.waterTempShort'), value: `${s.tempRange[0]}–${s.tempRange[1]} °C`, mono: true },
            ...(s.rules.minSizeCm ? [{ label: t('species.minSizeShort'), value: `${s.rules.minSizeCm} cm (EU)`, mono: true }] : []),
            { label: t('species.places'), value: String(places.length), mono: true },
          ]}
        />
      </PageHeader>

      <div className="mx-auto flex max-w-[1360px] flex-wrap gap-12 px-4 pb-16 pt-9 md:px-8">
        <div className="min-w-0 flex-[999_1_600px]">
          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">{t('species.habitat')}</h2>
              <p className="mt-1.5 text-ink-2">{loc(s.habitat, locale)}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('species.baits')}</h2>
              <p className="mt-1.5 text-ink-2">{loc(s.baits, locale)}</p>
            </div>
          </section>
          <section className="mt-8">
            <h2 className="mb-2 text-xl font-semibold">{t('species.bestMonths')}</h2>
            <MonthStrip months={s.bestMonths} locale={locale} label={t('species.bestMonths')} />
          </section>
          {(rigs.length > 0 || lures.length > 0) && (
            <section className="mt-10">
              <SectionTitle>{t('species.rigs')}</SectionTitle>
              <ol className="border-t border-ink">
                {rigs.map((g, i) => (
                  <li key={g.slug} className="flex gap-3 border-b border-rule-2 py-2.5">
                    <span className="num text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <Link href={`/guides/${g.slug}`} className="text-ink">
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ol>
              {lures.length > 0 && (
                <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
                  {lures.map((l) => (
                    <div key={l.slug} className="border-b border-rule-2 py-3">
                      <dt className="font-display text-lg font-semibold">{loc(l.name, locale)}</dt>
                      <dd className="mt-0.5 text-sm text-ink-2">{loc(l.tips, locale)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          )}
        </div>
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-7">
          <section className="border border-ink p-4">
            <h2 className="label !text-xs">{t('species.rules')}</h2>
            {s.rules.minSizeCm && (
              <p className="num mt-2 text-2xl">
                {s.rules.minSizeCm} <span className="text-sm">cm</span>
              </p>
            )}
            {s.rules.minSizeCm && s.rules.sourceUrl && (
              <a href={s.rules.sourceUrl} target="_blank" rel="noopener" className="text-sm">
                {t('species.minSize', { cm: s.rules.minSizeCm })} · EUR-Lex
              </a>
            )}
            {s.rules.note && <p className="mt-2 text-sm">{loc(s.rules.note, locale)}</p>}
            {s.water === 'fresh' && <p className="mt-2 text-sm text-muted">{t('species.generalRule')}</p>}
            {s.protected && <p className="mt-2 text-sm font-semibold text-poor">{t('species.protected')}</p>}
          </section>
          {places.length > 0 && (
            <section className="border-t border-ink pt-3.5">
              <h2 className="mb-2 text-[22px] font-semibold">{t('species.where')}</h2>
              <ul className="max-h-[420px] overflow-auto">
                {places.slice(0, 60).map((p) => (
                  <li key={p.id} className="border-b border-rule-2 py-1.5">
                    <Link href={p.href} className="text-ink">
                      {p.name}
                    </Link>
                    {p.club && <span className="block text-xs text-muted">{p.club}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
