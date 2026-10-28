import { NextResponse } from 'next/server';
import { revirGeoJSON } from '@/lib/places';

// Section geometries for the map, generated once at build time.
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(revirGeoJSON(), {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}
