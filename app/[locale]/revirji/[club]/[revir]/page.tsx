import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowUpRight, FileText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures, getRevir, getRevirji, type Guide } from '@/lib/content';
import { distanceKm } from '@/lib/geo';
import { getPlaces, revirTitle } from '@/lib/places';
import { site } from '@/lib/site';
import { ConditionsPanel } from '@/components/conditions/ConditionsPanel';
import { DataStrip, PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { AccessPanel, PermitPanel, RigsPanel, SpeciesPlates } from '@/components/place/Panels';

type Params = { locale: Locale; club: string; revir: string };

// Sections are pre-rendered in Slovenian; other languages render on first visit and are cached.
export function generateStaticParams() {
  return getRevirji().map((r) => ({ locale: routing.defaultLocale, club: r.clubSlug, revir: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, club, revir } = await params;
  const r = getRevir(`${club}/${revir}`);
  if (!r) return {};
  const { name, sub } = revirTitle(r, locale);
  return {
    title: `${name}${sub ? ` (${sub})` : ''} – ${r.club.name}`,
    description: (locale !== 'sl' && r.en?.description) || r.description,
    alternates: {
      canonical: `/${locale}/revirji/${r.id}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/revirji/${r.id}`])),
    },
  };
}

/** "Nakup od 01. 04. do 30. 09." → "1 Apr – 30 Sep" in the reader's language. */
function formatWindow(window: string, locale: string): string {
  const m = /od\s+(\d{1,2})\.\s*(\d{1,2})\.\s+do\s+(\d{1,2})\.\s*(\d{1,2})\./.exec(window);
  if (!m) return window.replace(/^Nakup /, '');
  const f = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const d = (day: string, month: string) => f.format(new Date(2024, Number(month) - 1, Number(day)));
  return `${d(m[1], m[2])} – ${d(m[3], m[4])}`;
}

const QUALITY_ZOOM = { segment: 12, water: 12, partial: 13, gauge: 13, place: 12, none: 9 } as const;

export default async function RevirPage({ params }: { params: Promise<Params> }) {
  const { locale, club, revir } = await params;
  setRequestLocale(locale);
  const r = getRevir(`${club}/${revir}`);
  if (!r) notFound();
  const t = await getTranslations();
  const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  const all = getAllSpecies();
  const species = r.species.map((s) => all.find((x) => x.slug === s)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const guides = [...new Set(species.flatMap((s) => s.rigs))]
    .map((g) => getGuide(g, locale))
    .filter((g): g is Guide => Boolean(g))
    .filter((g) => g.techniques.length === 0 || g.techniques.some((x) => r.techniques.includes(x)))
    .slice(0, 5);
  const lures = getLures().filter((l) => l.species.some((s) => r.species.includes(s)) && l.techniques.some((x) => r.techniques.includes(x)));
  const places = getPlaces(locale);
  const place = places.find((p) => p.id === `revir:${r.id}`);
  const nearby = r.center
    ? places
        .filter((p) => p.id !== `revir:${r.id}` && !p.forbidden)
        .map((p) => ({ p, km: distanceKm(r.center!, p.center) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 6)
    : [];

  const { name, sub } = revirTitle(r, locale);
  const description = (locale !== 'sl' && r.en?.description) || r.description;
  const prices = r.passes.map((p) => p.priceEur).filter((p): p is number => p !== null);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const seasons = [...new Set(r.passes.map((p) => p.saleWindow).filter((s): s is string => Boolean(s)))];
  const salmonid = species.filter((s) => s.group === 'salmonid').length >= species.length / 2 && species.length > 0;
  const passes = [...r.passes].sort((a, b) => (a.priceEur ?? 1e9) - (b.priceEur ?? 1e9)).slice(0, 6);
  const target: [number, number] | null = r.parking[0] ? [r.parking[0].lat, r.parking[0].lon] : r.center;
  const approx = r.quality !== 'segment' && r.quality !== 'water';
  const rules = [
    r.flyOnly ? t('spot.flyOnly') : null,
    r.catchAndReleaseOnly ? t('spot.catchAndRelease') : null,
    r.baits.length ? `${t('revir.baits')}: ${r.baits.join(', ')}` : null,
  ].filter((x): x is string => Boolean(x));
  const issueUrl = `${site.issuesUrl}?title=${encodeURIComponent(`Revir: ${r.id}`)}&labels=content`;

  return (
    <article>
      <PageHeader
        eyebrow={
          <>
            {r.region ? t(`region.${r.region}`) : ''}
            {r.water ? ` / ${r.water}` : ''} / {r.club.name}
          </>
        }
        title={name}
        lede={sub}
      >
        <DataStrip
          items={[
            {
              label: t('spot.water'),
              value: `${r.waterType === 'river' ? t('spot.flowing') : t(`waterType.${r.waterType}`)} · ${salmonid ? t('spot.salmonid') : t('spot.coarse')}`,
            },
            ...(seasons[0] ? [{ label: t('spot.season'), value: formatWindow(seasons[0], locale), mono: true }] : []),
            ...(r.techniques.length
              ? [{ label: t('spot.method'), value: r.techniques.map((x) => t(`technique.${x}`)).join(', ') }]
              : r.methods.length
                ? [{ label: t('spot.method'), value: r.methods.join(', ') }]
                : []),
            ...(minPrice !== null ? [{ label: t('spot.permit'), value: t('spot.from', { price: fmt.format(minPrice) }), mono: true }] : []),
            ...(r.lengthKm ? [{ label: t('revir.length'), value: `${r.lengthKm} km`, mono: true }] : []),
          ]}
        />
      </PageHeader>

      <div className="mx-auto flex max-w-[1360px] flex-wrap gap-12 px-4 pb-16 pt-9 md:px-8">
        <div className="min-w-0 flex-[999_1_640px]">
          {r.center && (
            <section aria-labelledby="cond-h">
              <SectionTitle id="cond-h" note="Open-Meteo · ARSO">
                {t('conditions.heading')}
              </SectionTitle>
              <ConditionsPanel query={`revir=${encodeURIComponent(r.id)}`} type={r.waterType} />
            </section>
          )}

          {description && (
            <section aria-labelledby="about-h" className="mt-12">
              <SectionTitle id="about-h">{t('revir.about')}</SectionTitle>
              <p className="max-w-[68ch] text-[17px] leading-relaxed">{description}</p>
              <a href={r.sourceUrl} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1">
                {t('revir.moreAtSource')} <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            </section>
          )}

          {species.length > 0 && (
            <section aria-labelledby="fish-h" className="mt-12">
              <SectionTitle id="fish-h" note={t('revir.speciesSource')}>
                {t('spot.species')}
              </SectionTitle>
              <SpeciesPlates species={species} locale={locale} />
              {r.speciesRaw.length > species.length && (
                <p className="mt-3 text-sm text-muted">
                  {t('revir.allListed')}: {r.speciesRaw.join(', ')}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-7">
          <PermitPanel
            text={r.online ? t('revir.permitOnline', { club: r.club.name }) : t('revir.permitClub', { club: r.club.name })}
            buyUrl={r.sourceUrl}
            buyLabel={t('revir.buyAtSource')}
            rules={rules}
            note={t('revir.rulesNote')}
            extra={
              passes.length > 0 ? (
                <ul className="num mt-3 text-sm" data-testid="passes">
                  {passes.map((p) => (
                    <li key={`${p.name}-${p.buyUrl}`} className="flex justify-between gap-3 border-b border-[#3F4845] py-1.5">
                      <span className="font-sans">{p.name}</span>
                      <span className="shrink-0">{p.priceEur !== null ? fmt.format(p.priceEur) : '–'}</span>
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
          {place && target && (
            <AccessPanel place={place} target={target} parking={r.parking} approx={approx} zoom={QUALITY_ZOOM[r.quality]} />
          )}
          <p className="-mt-4 text-[13px] text-muted">{t(`revir.quality.${r.quality}`)}</p>
          {r.mapPdfUrl && (
            <a href={r.mapPdfUrl} target="_blank" rel="noopener" className="btn btn-line justify-start">
              <FileText aria-hidden="true" size={18} /> {t('revir.mapPdf')}
            </a>
          )}
          <RigsPanel guides={guides} lures={lures} locale={locale} />
          {nearby.length > 0 && (
            <section aria-labelledby="near-h" className="border-t border-ink pt-3.5">
              <h2 id="near-h" className="mb-2 text-[22px] font-semibold">
                {t('spot.nearby')}
              </h2>
              <ul>
                {nearby.map(({ p, km }) => (
                  <li key={p.id} className="flex justify-between gap-3 border-b border-rule-2 py-2">
                    <Link href={p.href} className="text-ink">
                      {p.name}
                      {p.kind === 'revir' && p.sub && <span className="block text-xs text-muted">{p.sub}</span>}
                    </Link>
                    <span className="num shrink-0 text-sm text-muted">{km < 10 ? km.toFixed(1) : Math.round(km)} km</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-[13px] text-muted">
            {t('revir.source', { date: r.scrapedAt.slice(0, 10) })} ·{' '}
            <a href={issueUrl} target="_blank" rel="noopener">
              {t('spot.reportIssue')}
            </a>
          </p>
        </aside>
      </div>
    </article>
  );
}
