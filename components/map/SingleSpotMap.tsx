'use client';

import dynamic from 'next/dynamic';
import type { SpotSummary } from '@/lib/spot-summary';

const SpotMap = dynamic(() => import('./SpotMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--border)]" />,
});

export function SingleSpotMap({ spot }: { spot: SpotSummary }) {
  return <SpotMap spots={[spot]} me={null} showDepth={spot.type === 'sea'} selected={spot.slug} onSelect={() => {}} focus={spot.coords} />;
}
