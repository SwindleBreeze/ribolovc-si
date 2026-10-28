import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { directionsLinks } from '@/lib/geo';
import type { Guide } from '@/lib/content';
import type { Lure, Species } from '@/lib/schema';
import { loc } from '@/lib/text';
import { FishSilhouette } from '@/components/ui/FishSilhouette';
import { MonthStrip } from '@/components/ui/MonthStrip';
import type { PlaceSummary } from '@/lib/places';
import { MiniMap } from './MiniMap';

/** Dark permit box with the call to action. */
export async function PermitPanel({
  text,
  buyUrl,
  buyLabel,
  rules,
  note,
  extra,
}: {
  text: string;
  buyUrl?: string | null;
  buyLabel?: string;
  rules: string[];
  note: string;
  extra?: React.ReactNode;
}) {
  const t = await getTranslations('spot');
  return (
    <section aria-labelledby="permit-h" className="border border-rule bg-[#1C2321] p-5 text-[#F3EFE6]">
      <h2 id="permit-h" className="text-[22px] font-semibold">
        {t('permit')}
      </h2>
      <p className="mt-2 text-[15px] text-[#D8D3C7]">{text}</p>
      {extra}
      {buyUrl && (
        <a href={buyUrl} target="_blank" rel="noopener" className="btn btn-cta mt-4 w-full justify-between" data-testid="buy-permit">
          {buyLabel ?? t('buyPermit')} <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      )}
      {rules.length > 0 && (
        <ul className="mt-4 border-t border-[#3F4845] text-sm">
          {rules.map((r) => (
            <li key={r} className="border-b border-[#3F4845] py-2">
              {r}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[#B9B4A8]">{note}</p>
    </section>
  );
}

export async function AccessPanel({
  place,
  text,
  target,
  parking,
  approx,
  zoom,
}: {
  place: PlaceSummary;
  text?: string;
  /** [lat, lon] to navigate to (parking if known). */
  target: [number, number];
  parking: { lat: number; lon: number; name: string | null }[];
  approx: boolean;
  zoom: number;
}) {
  const t = await getTranslations('spot');
  const d = directionsLinks(target);
  return (
    <section aria-labelledby="access-h">
      <h2 id="access-h" className="mb-2.5 text-[22px] font-semibold">
        {t('getThere')}
      </h2>
      <div className="h-56 border border-ink">
        <MiniMap
          place={place}
          zoom={zoom}
          showDepth={place.type === 'sea'}
          markers={parking.map((p) => ({ lat: p.lat, lon: p.lon, label: 'P', title: p.name ?? t('parking') }))}
        />
      </div>
      {text && <p className="mt-2.5 text-[15px]">{text}</p>}
      <p className="num mt-1.5 text-[13px] text-muted">
        {parking.length > 0 ? 'P ' : ''}
        {target[0].toFixed(4)}, {target[1].toFixed(4)}
        {approx ? ` · ${t('approxCoords')}` : ' · OSM'}
      </p>
      <p className="label mt-3">{t('openIn')}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2" data-testid="directions">
        <a className="btn btn-line" href={d.google} target="_blank" rel="noopener">
          Google Maps
        </a>
        <a className="btn btn-line" href={d.apple} target="_blank" rel="noopener">
          Apple Maps
        </a>
        <a className="btn btn-line" href={d.waze} target="_blank" rel="noopener">
          Waze
        </a>
        <a className="btn btn-line" href={d.osm} target="_blank" rel="noopener">
          OSM
        </a>
      </div>
    </section>
  );
}

/** Field-guide plates for the species found at a place. */
export async function SpeciesPlates({ species, locale }: { species: Species[]; locale: Locale }) {
  const t = await getTranslations('species');
  return (
    <div className="grid border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
      {species.map((s, i) => (
        <Link
          key={s.slug}
          href={`/species/${s.slug}`}
          className={`block border-b border-rule-2 py-5 text-ink no-underline hover:text-ink sm:px-5 ${i % 3 === 0 ? 'lg:pl-0' : 'lg:border-l lg:border-rule'}`}
        >
          <FishSilhouette slug={s.slug} group={s.group} className="h-11 w-36 text-ink" />
          <span className="mt-2.5 block font-display text-[21px] font-semibold">{loc(s.name, locale)}</span>
          <span className="block font-display italic text-muted">{s.latin}</span>
          <span className="mt-2.5 block">
            <MonthStrip months={s.bestMonths} locale={locale} label={t('bestMonths')} />
          </span>
          <span className="mt-2.5 block text-sm text-ink-2">{loc(s.baits, locale)}</span>
        </Link>
      ))}
    </div>
  );
}

export async function RigsPanel({ guides, lures, locale }: { guides: Guide[]; lures: Lure[]; locale: Locale }) {
  const t = await getTranslations('spot');
  if (!guides.length && !lures.length) return null;
  return (
    <section aria-labelledby="rigs-h" className="border-t border-ink pt-3.5">
      <h2 id="rigs-h" className="mb-2 text-[22px] font-semibold">
        {t('rigs')}
      </h2>
      <ol>
        {guides.map((g, i) => (
          <li key={g.slug} className="flex gap-3 border-b border-rule-2 py-2">
            <span className="num text-muted">{String(i + 1).padStart(2, '0')}</span>
            <Link href={`/guides/${g.slug}`} className="text-ink">
              {g.title}
            </Link>
          </li>
        ))}
      </ol>
      {lures.length > 0 && (
        <p className="mt-3 text-sm text-ink-2">
          <span className="label mr-2">{t('lures')}</span>
          {lures.map((l) => loc(l.name, locale)).join(' · ')}
        </p>
      )}
    </section>
  );
}
