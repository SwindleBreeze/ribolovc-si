import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures, getSpot, getSpots } from '@/lib/content';
import { directionsLinks, distanceKm } from '@/lib/geo';
import { site } from '@/lib/site';
import { loc } from '@/lib/text';
import { toSummary } from '@/lib/spot-summary';
import { ConditionsPanel } from '@/components/conditions/ConditionsPanel';
import { SingleSpotMap } from '@/components/map/SingleSpotMap';
import { DonateCta } from '@/components/DonateCta';

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

  const allSpecies = getAllSpecies();
  const species = spot.species.map((s) => allSpecies.find((x) => x.slug === s)!).filter(Boolean);
  const forbidden = spot.permit.kind === 'forbidden';

  const rigSlugs = [...new Set(species.flatMap((s) => s.rigs))];
  const rigs = rigSlugs
    .map((r) => getGuide(r, locale))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .filter((g) => g.techniques.length === 0 || g.techniques.some((x) => spot.techniques.includes(x)));
  const lures = getLures().filter(
    (l) => l.species.some((s) => spot.species.includes(s)) && l.techniques.some((x) => spot.techniques.includes(x)),
  );

  const target = spot.parking ?? spot.coords;
  const directions = directionsLinks(target);
  const nearby = getSpots()
    .filter((s) => s.slug !== spot.slug && s.permit.kind !== 'forbidden')
    .map((s) => ({ s, km: distanceKm(spot.coords, s.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);

  const issueUrl = `${site.issuesUrl}?title=${encodeURIComponent(`Spot: ${spot.slug}`)}&labels=content`;

  return (
    <article className="mx-auto max-w-6xl px-4 py-6">
      <nav className="muted text-sm">
        <Link href="/" className="hover:underline">
          {t('nav.map')}
        </Link>{' '}
        / {t(`region.${spot.region}`)}
      </nav>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{loc(spot.name, locale)}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="chip">{t(`waterType.${spot.type}`)}</span>
        <span className="chip">{t(`region.${spot.region}`)}</span>
        <span className="chip">
          {t('spot.difficulty')}: {t(`difficulty.${spot.difficulty}`)}
        </span>
        {spot.beginnerFriendly && <span className="chip">🟢 {t('spot.beginner')}</span>}
        {spot.rules.flyOnly && <span className="chip">🪰 {t('spot.flyOnly')}</span>}
        {spot.rules.barbless && <span className="chip">{t('spot.barbless')}</span>}
        {spot.rules.catchAndRelease && <span className="chip">↩︎ {t('spot.catchAndRelease')}</span>}
      </div>
      <p className="mt-4 max-w-3xl text-lg">{loc(spot.description, locale)}</p>

      {forbidden && (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          ⛔ {t('spot.permitKind.forbidden')}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {!forbidden && (
            <section aria-labelledby="conditions">
              <h2 id="conditions" className="mb-3 text-xl font-bold">
                {t('spot.conditions')}
              </h2>
              <ConditionsPanel spot={spot.slug} type={spot.type} />
            </section>
          )}

          {!forbidden && (
            <section aria-labelledby="species">
              <h2 id="species" className="mb-3 text-xl font-bold">
                {t('spot.species')}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {species.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/species/${s.slug}`} className="card block h-full p-3 hover:border-brand-500">
                      <p className="font-semibold">
                        {loc(s.name, locale)} <span className="muted text-xs italic">{s.latin}</span>
                      </p>
                      <p className="muted mt-1 text-sm">{loc(s.bestTime, locale)}</p>
                      <p className="mt-1 text-sm">🪱 {loc(s.baits, locale)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!forbidden && (
            <section aria-labelledby="rigs">
              <h2 id="rigs" className="mb-3 text-xl font-bold">
                {t('spot.rigs')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {rigs.map((g) => (
                  <Link key={g.slug} href={`/guides/${g.slug}`} className="chip hover:border-brand-500">
                    📘 {g.title}
                  </Link>
                ))}
              </div>
              {lures.length > 0 && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {lures.map((l) => (
                    <li key={l.slug} className="card p-3 text-sm">
                      <p className="font-semibold">{loc(l.name, locale)}</p>
                      <p className="muted mt-1">{loc(l.tips, locale)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="card p-4" aria-labelledby="permit">
            <h2 id="permit" className="font-bold">
              🎫 {t('spot.permit')}
            </h2>
            <p className="mt-2 text-sm">{t(`spot.permitKind.${spot.permit.kind}`)}</p>
            {spot.permit.note && <p className="muted mt-2 text-sm">{loc(spot.permit.note, locale)}</p>}
            {spot.club && (
              <p className="mt-2 text-sm">
                {t('spot.club')}:{' '}
                {spot.club.url ? (
                  <a href={spot.club.url} className="text-brand-600 underline" rel="noopener" target="_blank">
                    {spot.club.name}
                  </a>
                ) : (
                  spot.club.name
                )}
              </p>
            )}
            {spot.season && (
              <p className="mt-2 text-sm">
                <strong>{t('spot.season')}:</strong> {loc(spot.season, locale)}
              </p>
            )}
            {spot.rules.notes && <p className="mt-2 text-sm">{loc(spot.rules.notes, locale)}</p>}
            {spot.permit.url && !forbidden && (
              <a href={spot.permit.url} className="btn btn-primary mt-3 w-full" target="_blank" rel="noopener">
                {spot.permit.kind === 'none' ? t('spot.moreInfo') : t('spot.buyPermit')} ↗
              </a>
            )}
            {spot.rules.sourceUrl && (
              <a href={spot.rules.sourceUrl} className="mt-2 block text-sm text-brand-600 underline" target="_blank" rel="noopener">
                {t('spot.rulesSource')} ↗
              </a>
            )}
            <p className="muted mt-3 text-xs">{t('spot.rulesDisclaimer')}</p>
          </section>

          <section className="card p-4" aria-labelledby="getthere">
            <h2 id="getthere" className="font-bold">
              🚗 {t('spot.getThere')}
            </h2>
            <p className="mt-2 text-sm">{loc(spot.access, locale)}</p>
            <div className="mt-3 h-48 overflow-hidden rounded-lg border border-[var(--border)]">
              <SingleSpotMap spot={toSummary(spot, locale)} />
            </div>
            <p className="muted mt-2 text-xs">
              {spot.parking ? `${t('spot.parking')}: ` : ''}
              {target[0].toFixed(4)}, {target[1].toFixed(4)}
              {spot.approx && ` · ${t('spot.approxCoords')}`}
            </p>
            <p className="mt-2 text-sm font-medium">{t('spot.openIn')}:</p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm" data-testid="directions">
              <a className="btn btn-ghost" href={directions.google} target="_blank" rel="noopener">
                Google Maps
              </a>
              <a className="btn btn-ghost" href={directions.apple} target="_blank" rel="noopener">
                Apple Maps
              </a>
              <a className="btn btn-ghost" href={directions.waze} target="_blank" rel="noopener">
                Waze
              </a>
              <a className="btn btn-ghost" href={directions.osm} target="_blank" rel="noopener">
                OSM
              </a>
            </div>
          </section>

          {spot.links.length > 0 && (
            <section className="card p-4">
              <h2 className="font-bold">🔗 {t('spot.links')}</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {spot.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} className="text-brand-600 underline" target="_blank" rel="noopener">
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-4">
            <h2 className="font-bold">📍 {t('spot.nearby')}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {nearby.map(({ s, km }) => (
                <li key={s.slug} className="flex justify-between gap-2">
                  <Link href={`/spots/${s.slug}`} className="text-brand-600 hover:underline">
                    {loc(s.name, locale)}
                  </Link>
                  <span className="muted shrink-0">{Math.round(km)} km</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="muted text-xs">
            {t('spot.lastUpdated', { date: spot.lastVerified })} ·{' '}
            <a href={issueUrl} className="underline" target="_blank" rel="noopener">
              {t('spot.reportIssue')}
            </a>
          </p>
        </aside>
      </div>

      <DonateCta />
    </article>
  );
}
