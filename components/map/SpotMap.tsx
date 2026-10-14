'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SpotSummary } from '@/lib/spot-summary';
import { TYPE_COLORS } from './colors';

/** Free vector basemap (OpenStreetMap data), no API key. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
/** EMODnet Bathymetry WMS – mean depth, coloured. */
const DEPTH_TILES =
  'https://ows.emodnet-bathymetry.eu/wms?service=WMS&version=1.1.1&request=GetMap&layers=emodnet:mean_multicolour&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}';

const SLOVENIA_BOUNDS: [[number, number], [number, number]] = [
  [13.35, 45.4],
  [16.6, 46.9],
];

function toGeoJSON(spots: SpotSummary[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: spots.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.coords[1], s.coords[0]] },
      properties: {
        slug: s.slug,
        name: s.name,
        color: s.forbidden ? TYPE_COLORS.forbidden : TYPE_COLORS[s.type],
      },
    })),
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export default function SpotMap({
  spots,
  me,
  showDepth,
  selected,
  onSelect,
  focus,
}: {
  spots: SpotSummary[];
  me: [number, number] | null;
  showDepth: boolean;
  selected: string | null;
  onSelect: (slug: string | null) => void;
  /** Centre on this point instead of showing all of Slovenia. */
  focus?: [number, number];
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  // Map event handlers are registered once; they read the latest props through this ref.
  const latest = useRef({ spots, showDepth, onSelect, locale });
  useEffect(() => {
    latest.current = { spots, showDepth, onSelect, locale };
  });

  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      ...(focus ? { center: [focus[1], focus[0]] as [number, number], zoom: 12 } : { bounds: SLOVENIA_BOUNDS, fitBoundsOptions: { padding: 20 } }),
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('depth', { type: 'raster', tiles: [DEPTH_TILES], tileSize: 256, attribution: 'Bathymetry © EMODnet' });
      map.addLayer({
        id: 'depth',
        type: 'raster',
        source: 'depth',
        paint: { 'raster-opacity': 0.6 },
        layout: { visibility: latest.current.showDepth ? 'visible' : 'none' },
      });

      map.addSource('spots', {
        type: 'geojson',
        data: toGeoJSON(latest.current.spots),
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 10,
      });
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'spots',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0e544b',
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 15, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'spots',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: 'spot',
        type: 'circle',
        source: 'spots',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'spot-selected',
        type: 'circle',
        source: 'spots',
        filter: ['==', ['get', 'slug'], ''],
        paint: { 'circle-color': 'transparent', 'circle-radius': 13, 'circle-stroke-width': 3, 'circle-stroke-color': '#f59e0b' },
      });

      map.on('click', 'clusters', async (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const source = map.getSource('spots') as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
        map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });

      map.on('click', 'spot', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const { slug, name } = feature.properties as { slug: string; name: string };
        latest.current.onSelect(slug);
        new maplibregl.Popup({ offset: 12 })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(
            `<strong>${escapeHtml(name)}</strong><br/><a href="/${latest.current.locale}/spots/${slug}" style="color:#0b8573;font-weight:600">→ ${escapeHtml(name)}</a>`,
          )
          .addTo(map);
      });

      for (const layer of ['clusters', 'spot']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
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
    const source = mapRef.current?.getSource('spots') as GeoJSONSource | undefined;
    source?.setData(toGeoJSON(spots));
  }, [spots]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('depth')) map.setLayoutProperty('depth', 'visibility', showDepth ? 'visible' : 'none');
  }, [showDepth]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('spot-selected')) map.setFilter('spot-selected', ['==', ['get', 'slug'], selected ?? '']);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !me) return;
    meMarker.current?.remove();
    meMarker.current = new maplibregl.Marker({ color: '#f59e0b' }).setLngLat([me[1], me[0]]).addTo(map);
    map.easeTo({ center: [me[1], me[0]], zoom: 9 });
  }, [me]);

  return <div ref={container} className="h-full w-full" />;
}
