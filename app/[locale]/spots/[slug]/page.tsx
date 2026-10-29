import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures, getPhotos, getRevir, getSpot, getSpots, type Guide } from '@/lib/content';
import { getPlaces, revirTitle } from '@/lib/places';
import { site } from '@/lib/site';
import { advisorData } from '@/lib/advisor-data';
import { loc } from '@/lib/text';
import { ConditionsPanel } from '@/components/conditions/ConditionsPanel';
import { DataStrip, PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { AccessPanel, PermitPanel, RigsPanel, SpeciesPlates } from '@/components/place/Panels';
import { PhotoGallery, photoFormUrl } from '@/components/place/Photos';

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getSpots().map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const spot = getSpot(slug);
  if (!spot) return {};
  return {
    title: loc(spot.name, locale),
    description: loc(spot.description, locale),
    alternates: {
      canonical: `/${locale}/spots/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/spots/${slug}`])),
    },
  };
}

export default async function SpotPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const spot = getSpot(slug);
  if (!spot) notFound();
  const t = await getTranslations();

  const all = getAllSpecies();
  const species = spot.species.map((s) => all.find((x) => x.slug === s)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const forbidden = spot.permit.kind === 'forbidden';
  const guides = [...new Set(species.flatMap((s) => s.rigs))]
    .map((r) => getGuide(r, locale))
    .filter((g): g is Guide => Boolean(g))
    .filter((g) => g.techniques.length === 0 || g.techniques.some((x) => spot.techniques.includes(x)));
  const lures = getLures().filter(
    (l) => l.species.some((s) => spot.species.includes(s)) && l.techniques.some((x) => spot.techniques.includes(x)),
  );
  const place = getPlaces(locale).find((p) => p.id === `spot:${spot.slug}`)!;

  const rules = [
    spot.rules.flyOnly ? t('spot.flyOnly') : null,
    spot.rules.barbless ? t('spot.barbless') : null,
    spot.rules.catchAndRelease ? t('spot.catchAndRelease') : null,
    spot.rules.notes ? loc(spot.rules.notes, locale) : null,
  ].filter((x): x is string => Boolean(x));
  const issueUrl = `${site.issuesUrl}?title=${encodeURIComponent(`Spot: ${spot.slug}`)}&labels=content`;
  const photoUrl = photoFormUrl(`/sl/spots/${spot.slug}`, spot.name.sl);
  const revir = spot.revir ? getRevir(spot.revir) : undefined;

  return (
    <article>
      <PageHeader
        eyebrow={
          <>
            <Link href="/" className="text-muted">
              {t(`region.${spot.region}`)}
            </Link>
            {spot.club ? ` / ${spot.club.name}` : ''}
          </>
        }
        title={loc(spot.name, locale)}
        lede={loc(spot.description, locale)}
      >
        <DataStrip
          items={[
            { label: t('spot.water'), value: t(`waterType.${spot.type}`) },
            ...(spot.season ? [{ label: t('spot.season'), value: loc(spot.season, locale) }] : []),
            { label: t('spot.method'), value: spot.techniques.map((x) => t(`technique.${x}`)).join(', ') },
            { label: t('spot.difficulty'), value: `${'■'.repeat(spot.difficulty)}${'□'.repeat(3 - spot.difficulty)} ${t(`difficulty.${spot.difficulty}`)}` },
            ...(spot.beginnerFriendly ? [{ label: t('spot.beginner'), value: '✓' }] : []),
          ]}
        />
      </PageHeader>

      {forbidden && (
        <p role="alert" className="mx-auto mt-6 max-w-[1360px] border-l-4 border-poor bg-raised px-4 py-3 font-semibold text-poor md:px-8">
          {t('spot.permitKind.forbidden')}
        </p>
      )}

      <div className="mx-auto flex max-w-[1360px] flex-wrap gap-12 px-4 pb-16 pt-9 md:px-8">
        <div className="min-w-0 flex-[999_1_640px]">
          {!forbidden && (
            <section aria-labelledby="cond-h">
              <SectionTitle id="cond-h" note="Open-Meteo · ARSO">
                {t('conditions.heading')}
              </SectionTitle>
              <ConditionsPanel query={`spot=${encodeURIComponent(spot.slug)}`} type={spot.type} advisor={forbidden ? undefined : advisorData(spot.species, spot.techniques, locale)} />
            </section>
          )}
          <PhotoGallery photos={getPhotos(`spot:${spot.slug}`)} addUrl={photoUrl} />
          {!forbidden && species.length > 0 && (
            <section aria-labelledby="fish-h" className="mt-12">
              <SectionTitle id="fish-h">{t('spot.species')}</SectionTitle>
              <SpeciesPlates species={species} locale={locale} />
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-7">
          <PermitPanel
            text={t(`spot.permitKind.${spot.permit.kind}`) + (spot.permit.note ? ` ${loc(spot.permit.note, locale)}` : '')}
            buyUrl={!forbidden ? (revir?.sourceUrl ?? spot.permit.url) : null}
            buyLabel={spot.permit.kind === 'none' ? t('spot.moreInfo') : undefined}
            rules={rules}
            note={t('spot.rulesDisclaimer')}
            extra={
              <>
                {(revir?.club.name ?? spot.club?.name) && (
                  <p className="mt-2 text-sm text-[#D8D3C7]">
                    {t('spot.club')}: {revir?.club.name ?? spot.club?.name}
                  </p>
                )}
                {revir && (
                  <Link href={`/revirji/${revir.id}`} className="mt-3 block text-sm text-[#F3EFE6] underline" data-testid="spot-revir">
                    {t('spot.officialSection')}: {revirTitle(revir, locale).name}
                    {revirTitle(revir, locale).sub ? ` (${revirTitle(revir, locale).sub})` : ''}
                  </Link>
                )}
              </>
            }
          />
          <AccessPanel
            place={place}
            text={loc(spot.access, locale)}
            target={spot.parking ?? spot.coords}
            parking={spot.parking ? [{ lat: spot.parking[0], lon: spot.parking[1], name: null }] : []}
            approx={spot.approx}
            zoom={12}
          />
          {!forbidden && <RigsPanel guides={guides} lures={lures} locale={locale} />}
          <p className="text-[13px] text-muted">
            {t('spot.lastUpdated', { date: spot.lastVerified })} ·{' '}
            <a href={issueUrl} target="_blank" rel="noopener">
              {t('spot.reportIssue')}
            </a>{' '}
            ·{' '}
            <a href={photoUrl} target="_blank" rel="noopener" data-testid="add-photo">
              {t('photos.add')}
            </a>
          </p>
        </aside>
      </div>
    </article>
  );
}
