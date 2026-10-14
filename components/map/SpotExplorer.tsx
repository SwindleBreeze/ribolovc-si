'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { regions, techniques, waterTypes } from '@/lib/schema';
import type { SpeciesOption, SpotSummary } from '@/lib/spot-summary';
import { distanceKm } from '@/lib/geo';
import { TYPE_COLORS } from './colors';

const SpotMap = dynamic(() => import('./SpotMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--border)]" />,
});

type Filters = {
  q: string;
  species: string;
  technique: string;
  type: string;
  region: string;
  beginner: boolean;
};

const EMPTY: Filters = { q: '', species: '', technique: '', type: '', region: '', beginner: false };

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function SpotExplorer({ spots, species }: { spots: SpotSummary[]; species: SpeciesOption[] }) {
  const t = useTranslations();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [showDepth, setShowDepth] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const speciesName = useMemo(() => new Map(species.map((s) => [s.slug, s.name])), [species]);

  const visible = useMemo(() => {
    const q = normalize(filters.q.trim());
    const list = spots.filter(
      (s) =>
        (!q || normalize(s.name).includes(q)) &&
        (!filters.species || s.species.includes(filters.species)) &&
        (!filters.technique || s.techniques.includes(filters.technique as SpotSummary['techniques'][number])) &&
        (!filters.type || s.type === filters.type) &&
        (!filters.region || s.region === filters.region) &&
        (!filters.beginner || s.beginnerFriendly),
    );
    const withDistance = list.map((s) => ({ ...s, km: me ? distanceKm(me, s.coords) : null }));
    if (me) withDistance.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
    return withDistance;
  }, [spots, filters, me]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  function locate() {
    setGeoError(false);
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMe([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError(true),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  const hasSea = visible.some((s) => s.type === 'sea');

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="card h-fit p-4" aria-label={t('filters.title')}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('filters.title')}</h2>
          <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => setFilters(EMPTY)}>
            {t('filters.reset')}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
          <input
            className="field col-span-2 lg:col-span-1"
            type="search"
            placeholder={t('filters.search')}
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            aria-label={t('filters.search')}
          />
          <Select label={t('filters.species')} value={filters.species} onChange={(v) => set('species', v)} testId="filter-species">
            <option value="">{t('filters.any')}</option>
            {species.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select label={t('filters.technique')} value={filters.technique} onChange={(v) => set('technique', v)}>
            <option value="">{t('filters.any')}</option>
            {techniques.map((x) => (
              <option key={x} value={x}>
                {t(`technique.${x}`)}
              </option>
            ))}
          </Select>
          <Select label={t('filters.waterType')} value={filters.type} onChange={(v) => set('type', v)}>
            <option value="">{t('filters.any')}</option>
            {waterTypes.map((x) => (
              <option key={x} value={x}>
                {t(`waterType.${x}`)}
              </option>
            ))}
          </Select>
          <Select label={t('filters.region')} value={filters.region} onChange={(v) => set('region', v)}>
            <option value="">{t('filters.any')}</option>
            {regions.map((x) => (
              <option key={x} value={x}>
                {t(`region.${x}`)}
              </option>
            ))}
          </Select>
          <label className="col-span-2 flex items-center gap-2 text-sm lg:col-span-1">
            <input type="checkbox" checked={filters.beginner} onChange={(e) => set('beginner', e.target.checked)} />
            {t('filters.beginner')}
          </label>
          <label className="col-span-2 flex items-center gap-2 text-sm lg:col-span-1">
            <input type="checkbox" checked={showDepth} onChange={(e) => setShowDepth(e.target.checked)} />
            {t('filters.depthLayer')}
          </label>
          <button type="button" className="btn btn-ghost col-span-2 lg:col-span-1" onClick={locate}>
            📍 {t('home.nearMe')}
          </button>
          {geoError && <p className="col-span-2 text-sm text-red-600">{t('home.nearMeError')}</p>}
        </div>
        <ul className="mt-4 flex flex-wrap gap-2 text-xs">
          {(['river', 'lake', 'sea'] as const).map((k) => (
            <li key={k} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: TYPE_COLORS[k] }} />
              {t(`waterType.${k}`)}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="card h-[55vh] min-h-[340px] overflow-hidden" data-testid="spot-map">
          <SpotMap
            spots={visible}
            me={me}
            showDepth={showDepth || (hasSea && filters.type === 'sea')}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <section>
          <h2 className="mb-2 flex items-baseline gap-2 text-lg font-bold">
            {t('home.spotsTitle')}
            <span className="muted text-sm font-normal" data-testid="result-count">
              {t('home.results', { count: visible.length })}
            </span>
          </h2>
          {visible.length === 0 ? (
            <p className="muted">{t('home.noResults')}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="spot-list">
              {visible.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/spots/${s.slug}`}
                    className={`card block h-full p-3 transition hover:border-brand-500 ${selected === s.slug ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
                    onMouseEnter={() => setSelected(s.slug)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{s.name}</h3>
                      {s.km !== null && <span className="muted shrink-0 text-xs">{t('home.kmAway', { km: Math.round(s.km) })}</span>}
                    </div>
                    <p className="muted mt-1 text-xs">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: s.forbidden ? TYPE_COLORS.forbidden : TYPE_COLORS[s.type] }} />
                      {t(`waterType.${s.type}`)} · {t(`region.${s.region}`)}
                      {s.beginnerFriendly && ' · 🟢'}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm">{s.blurb}</p>
                    <p className="muted mt-2 line-clamp-1 text-xs">
                      {s.species.map((x) => speciesName.get(x) ?? x).join(', ')}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="muted text-xs font-medium">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}>
        {children}
      </select>
    </label>
  );
}
