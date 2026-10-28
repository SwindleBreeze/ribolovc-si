'use client';

import dynamic from 'next/dynamic';
import type { PlaceSummary } from '@/lib/places';

const PlacesMap = dynamic(() => import('@/components/map/PlacesMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-land" />,
});

export function MiniMap({
  place,
  zoom,
  markers,
  showDepth,
}: {
  place: PlaceSummary;
  zoom: number;
  markers: { lat: number; lon: number; label: string; title: string }[];
  showDepth?: boolean;
}) {
  return (
    <PlacesMap
      places={[place]}
      selected={place.id}
      focus={{ center: place.center, zoom }}
      geoUrl={place.kind === 'revir' ? '/api/revirji-geo' : null}
      cluster={false}
      markers={markers}
      showDepth={showDepth}
    />
  );
}
