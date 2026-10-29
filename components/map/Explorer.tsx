'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocateFixed, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { techniques, waterTypes } from '@/lib/schema';
import type { PlaceSummary } from '@/lib/places';
import { distanceKm } from '@/lib/geo';
import type { Bounds } from './PlacesMap';

const PlacesMap = dynamic(() => import('./PlacesMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-land" />,
});

type Filters = { q: string; species: string; technique: string; type: string; club: string; online: boolean; beginner: boolean };
const EMPTY: Filters = { q: '', species: '', technique: '', type: '', club: '', online: false, beginner: false };
const LIST_LIMIT = 150;

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function Explorer({
  places,
  species,
  clubs,
}: {
  places: PlaceSummary[];
  species: { slug: string; name: string }[];
  clubs: string[];
}) {
  const t = useTranslations();
  const [f, setF] = useState<Filters>(EMPTY);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [showDepth, setShowDepth] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));

  const activeCount = [f.q, f.species, f.technique, f.type, f.club].filter(Boolean).length + (f.online ? 1 : 0) + (f.beginner ? 1 : 0);

  const speciesName = useMemo(() => new Map(species.map((s) => [s.slug, s.name])), [species]);

  const filtered = useMemo(() => {
    const q = normalize(f.q.trim());
    return places.filter(
      (p) =>
        (!q || normalize(`${p.name} ${p.sub} ${p.club ?? ''}`).includes(q)) &&
        (!f.species || p.species.includes(f.species)) &&
        (!f.technique || p.techniques.includes(f.technique as PlaceSummary['techniques'][number])) &&
        (!f.type || p.type === f.type || (f.type === 'lake' && (p.type === 'reservoir' || p.type === 'pond'))) &&
        (!f.club || p.club === f.club) &&
        (!f.online || p.online) &&
        (!f.beginner || p.beginner),
    );
  }, [places, f]);

  const inView = useMemo(() => {
    const within = bounds
      ? filtered.filter(
          (p) => p.center[0] >= bounds.south && p.center[0] <= bounds.north && p.center[1] >= bounds.west && p.center[1] <= bounds.east,
        )
      : filtered;
    const ref = me ?? (bounds ? ([(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2] as [number, number]) : null);
    const withKm = within.map((p) => ({ ...p, km: ref ? distanceKm(ref, p.center) : 0 }));
    withKm.sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
    return withKm;
  }, [filtered, bounds, me]);

  function locate() {
    setGeoError(false);
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMe([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError(true),
      { timeout: 10000 },
    );
  }

  return (
    <>
      <section aria-label={t('filters.title')} className="border-b border-rule bg-paper-2">
        <form className="mx-auto max-w-[1360px] px-4 py-3 md:px-8" onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: search and actions – always one line. */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 min-w-0 basis-full items-center gap-2 border border-field bg-raised px-3 sm:flex-[1_1_220px]">
              <Search aria-hidden="true" size={18} className="shrink-0 text-muted" />
              <span className="sr-only">{t('filters.search')}</span>
              <input
                type="search"
                value={f.q}
                onChange={(e) => set('q', e.target.value)}
                placeholder={t('filters.search')}
                className="w-full min-w-0 bg-transparent outline-none"
              />
            </label>
            <button
              type="button"
              className="btn btn-line flex-1 sm:flex-none md:hidden"
              aria-expanded={filtersOpen}
              aria-controls="more-filters"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal aria-hidden="true" size={16} />
              {t('filters.title')}
              {activeCount > 0 && <span className="num rounded-full bg-ink px-1.5 text-xs text-paper">{activeCount}</span>}
            </button>
            <button type="button" className="btn btn-line" onClick={locate}>
              <LocateFixed aria-hidden="true" size={16} /> <span className="hidden sm:inline">{t('home.nearMe')}</span>
            </button>
            {activeCount > 0 && (
              <button type="button" className="btn text-sm text-muted underline underline-offset-4 hover:text-ink" onClick={() => setF(EMPTY)}>
                {t('filters.reset')}
              </button>
            )}
          </div>
          {geoError && <p className="mt-2 text-sm text-poor">{t('home.nearMeError')}</p>}

          {/* Row 2: filters – a fixed grid on desktop, folded behind the button on phones. */}
          <div id="more-filters" className={`${filtersOpen ? 'block' : 'hidden'} mt-3 md:block`}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-4">
              <Select label={t('filters.species')} value={f.species} onChange={(v) => set('species', v)} testId="filter-species">
                <option value="">{t('filters.any')}</option>
                {species.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select label={t('filters.technique')} value={f.technique} onChange={(v) => set('technique', v)}>
                <option value="">{t('filters.any')}</option>
                {techniques.map((x) => (
                  <option key={x} value={x}>
                    {t(`technique.${x}`)}
                  </option>
                ))}
              </Select>
              <Select label={t('filters.waterType')} value={f.type} onChange={(v) => set('type', v)}>
                <option value="">{t('filters.any')}</option>
                {waterTypes.map((x) => (
                  <option key={x} value={x}>
                    {t(`waterType.${x}`)}
                  </option>
                ))}
              </Select>
              <Select label={t('filters.club')} value={f.club} onChange={(v) => set('club', v)} testId="filter-club">
                <option value="">{t('filters.any')}</option>
                {clubs.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-5">
              <Check label={t('filters.online')} checked={f.online} onChange={(v) => set('online', v)} />
              <Check label={t('filters.beginner')} checked={f.beginner} onChange={(v) => set('beginner', v)} />
              <Check label={t('filters.depthLayer')} checked={showDepth} onChange={setShowDepth} />
            </div>
          </div>
        </form>
      </section>

      <section className="mx-auto flex max-w-[1360px] flex-wrap md:px-8">
        <div className="relative h-[58vh] min-h-[380px] min-w-0 flex-[999_1_560px] border-rule md:h-[680px] md:border-x" data-testid="spot-map">
          <PlacesMap
            places={filtered}
            selected={selected}
            onSelect={setSelected}
            onBounds={setBounds}
            me={me}
            showDepth={showDepth}
            labels={{ open: t('home.openPlace'), types: Object.fromEntries(waterTypes.map((w) => [w, t(`waterType.${w}`)])) }}
          />
          <MapLegend />
        </div>
        <aside
          aria-label={t('home.listTitle')}
          className="h-[70vh] min-w-0 flex-[1_1_380px] overflow-auto border-rule bg-panel md:h-[680px] md:border-r"
        >
          <div className="sticky top-0 z-10 flex items-baseline justify-between border-b border-rule bg-panel px-5 pb-2.5 pt-4">
            <h2 className="text-xl font-semibold">{t('home.listTitle')}</h2>
            <span className="num text-[13px] text-muted" data-testid="result-count">
              {t('home.results', { count: inView.length })}
            </span>
          </div>
          {inView.length === 0 ? (
            <p className="px-5 py-6 text-muted">{t('home.noResults')}</p>
          ) : (
            <ol data-testid="spot-list">
              {inView.slice(0, LIST_LIMIT).map((p) => (
                <li
                  key={p.id}
                  className={`border-b border-rule-2 ${selected === p.id ? 'bg-raised shadow-[inset_3px_0_0_var(--accent)]' : ''}`}
                  onMouseEnter={() => setSelected(p.id)}
                >
                  <Link href={p.href} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-5 py-3.5 text-ink no-underline hover:text-ink">
                    <h3 className="text-lg font-semibold leading-snug">{p.name}</h3>
                    <span className="num pt-1 text-right text-[13px] text-muted">
                      {me || bounds ? `${p.km < 10 ? p.km.toFixed(1) : Math.round(p.km)} km` : ''}
                    </span>
                    <span className="col-span-2 text-xs uppercase tracking-[0.08em] text-muted">
                      {[p.club, t(`waterType.${p.type}`), p.online ? t('home.onlinePermit') : null].filter(Boolean).join(' · ')}
                    </span>
                    {p.species.length > 0 && (
                      <span className="col-span-2 line-clamp-1 text-sm text-ink-2">
                        {p.species.map((s) => speciesName.get(s) ?? s).join(', ')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {inView.length > LIST_LIMIT && (
            <p className="px-5 py-4 text-sm text-muted">{t('home.zoomIn', { count: inView.length - LIST_LIMIT })}</p>
          )}
        </aside>
      </section>
    </>
  );
}

function MapLegend() {
  const t = useTranslations('legend');
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 hidden flex-col gap-1.5 border border-field bg-raised px-3 py-2.5 text-xs sm:flex">
      <span className="flex items-center gap-2">
        <span className="inline-block h-1 w-5 bg-[#0E6B5C]" />
        {t('salmonid')}
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-1 w-5 bg-[#2F6F8F]" />
        {t('coarse')}
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" />
        {t('curated')}
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#2F6F8F] bg-paper" />
        {t('approx')}
      </span>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <label className="label flex min-w-0 flex-col gap-1">
      {label}
      <select
        className="field !min-h-10 truncate normal-case tracking-normal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        {children}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-2 px-1 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-[18px] w-[18px] accent-[var(--brand)]" />
      {label}
    </label>
  );
}
