import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getAllSpecies, getGuideSlugs, getSpots } from '@/lib/content';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    '/species',
    '/guides',
    '/lure-finder',
    '/podpri',
    '/about',
    ...getSpots().map((s) => `/spots/${s.slug}`),
    ...getAllSpecies().map((s) => `/species/${s.slug}`),
    ...getGuideSlugs().map((g) => `/guides/${g}`),
  ];
  return paths.map((p) => ({
    url: `${site.url}/${routing.defaultLocale}${p}`,
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `${site.url}/${l}${p}`])) },
  }));
}
