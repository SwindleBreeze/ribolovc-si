'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PlaceSummary } from '@/lib/places';

/** Free vector basemap (OpenStreetMap data), no API key. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
/** EMODnet Bathymetry WMS – mean depth, coloured. */
const DEPTH_TILES =
  'https://ows.emodnet-bathymetry.eu/wms?service=WMS&version=1.1.1&request=GetMap&layers=emodnet:mean_multicolour&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}';

const SLOVENIA: [[number, number], [number, number]] = [
  [13.35, 45.4],
  [16.6, 46.9],
];
const SALMONID = '#0E6B5C';
const COARSE = '#2F6F8F';
const INK = '#1C2321';
const ACCENT = '#E2561B';

export type Bounds = { west: number; south: number; east: number; north: number };

function pointsGeoJSON(places: PlaceSummary[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.center[1], p.center[0]] },
      properties: { id: p.id, name: p.name, href: p.href, kind: p.kind, salmonid: p.salmonid, forbidden: p.forbidden },
    })),
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export default function PlacesMap({
  places,
  selected,
  onSelect,
  onBounds,
  me,
  showDepth,
  focus,
  geoUrl = '/api/revirji-geo',
  cluster = true,
  markers,
  labels,
}: {
  places: PlaceSummary[];
  selected: string | null;
  onSelect?: (id: string | null) => void;
  onBounds?: (b: Bounds) => void;
  me?: [number, number] | null;
  showDepth?: boolean;
  /** Fit to this [lat, lon] (single place) or bounds instead of all of Slovenia. */
  focus?: { center: [number, number]; zoom?: number } | null;
  geoUrl?: string | null;
  cluster?: boolean;
  /** Small labelled markers, e.g. "P" for parking. */
  markers?: { lat: number; lon: number; label: string; title: string }[];
  /** Popup texts: the "open" link and water-type names. */
  labels?: { open: string; fish: string; types: Record<string, string>; species: Record<string, string> };
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef({ places, onSelect, onBounds, locale, showDepth, selected, markers, labels });
  useEffect(() => {
    latest.current = { places, onSelect, onBounds, locale, showDepth, selected, markers, labels };
  });

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      ...(focus
        ? { center: [focus.center[1], focus.center[0]] as [number, number], zoom: focus.zoom ?? 12 }
        : { bounds: SLOVENIA, fitBoundsOptions: { padding: 16 } }),
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const emitBounds = () => {
      const b = map.getBounds();
      latest.current.onBounds?.({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
    };

    map.on('load', () => {
      map.addSource('depth', { type: 'raster', tiles: [DEPTH_TILES], tileSize: 256, attribution: 'Bathymetry © EMODnet' });
      map.addLayer({
        id: 'depth',
        type: 'raster',
        source: 'depth',
        paint: { 'raster-opacity': 0.6 },
        layout: { visibility: latest.current.showDepth ? 'visible' : 'none' },
      });

      if (geoUrl) {
        map.addSource('geo', { type: 'geojson', data: geoUrl });
        map.addLayer({
          id: 'geo-fill',
          type: 'fill',
          source: 'geo',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: { 'fill-color': '#9EC1CC', 'fill-opacity': 0.55, 'fill-outline-color': INK },
        });
        map.addLayer({
          id: 'geo-selected',
          type: 'line',
          source: 'geo',
          filter: ['==', ['get', 'id'], ''],
          paint: { 'line-color': ACCENT, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 8, 13, 16], 'line-opacity': 0.4 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: 'geo-line',
          type: 'line',
          source: 'geo',
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': ['case', ['get', 'salmonid'], SALMONID, COARSE],
            'line-width': ['interpolate', ['linear'], ['zoom'], 7, 2.5, 13, 7],
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }

      map.addSource('places', {
        type: 'geojson',
        data: pointsGeoJSON(latest.current.places),
        cluster,
        clusterRadius: 36,
        clusterMaxZoom: 9,
      });
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#F3EFE6',
          'circle-stroke-color': INK,
          'circle-stroke-width': 1.5,
          'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 40, 22],
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': INK },
      });
      map.addLayer({
        id: 'place',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['case', ['get', 'forbidden'], '#A3321F', ['==', ['get', 'kind'], 'spot'], INK, '#F3EFE6'],
          'circle-stroke-color': ['case', ['==', ['get', 'kind'], 'spot'], '#F3EFE6', ['get', 'salmonid'], SALMONID, COARSE],
          'circle-stroke-width': ['case', ['==', ['get', 'kind'], 'spot'], 2, 2.5],
          'circle-radius': ['case', ['==', ['get', 'kind'], 'spot'], 6.5, 5],
        },
      });
      map.addLayer({
        id: 'place-selected',
        type: 'circle',
        source: 'places',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'circle-color': 'transparent', 'circle-radius': 12, 'circle-stroke-width': 3, 'circle-stroke-color': ACCENT },
      });

      const open = (id: string, at: maplibregl.LngLatLike) => {
        const p = latest.current.places.find((x) => x.id === id);
        if (!p) return;
        latest.current.onSelect?.(id);
        const href = `/${latest.current.locale}${p.href}`;
        // Up to six fish by name; the page lists them all.
        const names = p.species.map((s) => latest.current.labels?.species?.[s]).filter((n): n is string => Boolean(n));
        const fish = names.slice(0, 6);
        const more = names.length - fish.length;
        const kicker = [p.club && p.club !== p.sub ? p.club : null, latest.current.labels?.types?.[p.type]].filter(Boolean).join(' · ');
        new maplibregl.Popup({ offset: 12, maxWidth: '280px', className: 'place-popup' })
          .setLngLat(at)
          .setHTML(
            `${kicker ? `<p class="pop-kicker">${escapeHtml(kicker)}</p>` : ''}` +
              `<a class="pop-title" href="${href}">${escapeHtml(p.name)}</a>` +
              `${p.sub ? `<p class="pop-sub">${escapeHtml(p.sub)}</p>` : ''}` +
              `${fish.length ? `<p class="pop-fish"><span>${escapeHtml(latest.current.labels?.fish ?? '')}</span> ${escapeHtml(fish.join(', '))}${more > 0 ? ` +${more}` : ''}</p>` : ''}` +
              `<a class="pop-link" href="${href}">${escapeHtml(latest.current.labels?.open ?? '→')} →</a>`,
          )
          .addTo(map);
      };

      map.on('click', 'place', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        open(String(f.properties.id), (f.geometry as GeoJSON.Point).coordinates as [number, number]);
      });
      map.on('click', 'geo-line', (e) => {
        const f = e.features?.[0];
        if (f?.properties?.id) open(String(f.properties.id), e.lngLat);
      });
      map.on('click', 'clusters', async (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const zoom = await (map.getSource('places') as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
        map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });
      for (const layer of ['clusters', 'place', 'geo-line']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }
      map.on('moveend', emitBounds);
      emitBounds();
      applyVisible(map, latest.current.places);
      applySelection(map, latest.current.selected);
      for (const m of latest.current.markers ?? []) {
        const el = document.createElement('span');
        el.textContent = m.label;
        el.setAttribute('aria-label', m.title);
        el.className = 'map-badge';
        new maplibregl.Marker({ element: el }).setLngLat([m.lon, m.lat]).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    (map?.getSource('places') as GeoJSONSource | undefined)?.setData(pointsGeoJSON(places));
    if (map) applyVisible(map, places);
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('depth')) map.setLayoutProperty('depth', 'visibility', showDepth ? 'visible' : 'none');
  }, [showDepth]);

  useEffect(() => {
    if (mapRef.current?.getLayer('place-selected')) applySelection(mapRef.current, selected);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !me) return;
    meMarker.current?.remove();
    meMarker.current = new maplibregl.Marker({ color: ACCENT }).setLngLat([me[1], me[0]]).addTo(map);
    map.easeTo({ center: [me[1], me[0]], zoom: 10 });
  }, [me]);

  return <div ref={container} className="h-full w-full" />;
}

function applyVisible(map: MLMap, places: PlaceSummary[]) {
  if (!map.getLayer('geo-line')) return;
  const ids = places.filter((p) => p.kind === 'revir').map((p) => p.id);
  const visible: maplibregl.FilterSpecification = ['in', ['get', 'id'], ['literal', ids]];
  map.setFilter('geo-line', ['all', ['==', ['geometry-type'], 'LineString'], visible]);
  map.setFilter('geo-fill', ['all', ['==', ['geometry-type'], 'Polygon'], visible]);
}

function applySelection(map: MLMap, selected: string | null) {
  map.setFilter('place-selected', ['==', ['get', 'id'], selected ?? '']);
  if (map.getLayer('geo-selected')) map.setFilter('geo-selected', ['==', ['get', 'id'], selected ?? '']);
}
