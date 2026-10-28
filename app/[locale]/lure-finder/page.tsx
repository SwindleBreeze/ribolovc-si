import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getLures } from '@/lib/content';
import { loc } from '@/lib/text';
import { PageHeader } from '@/components/ui/PageHeader';
import { LureFinder, type FinderLure, type FinderSpecies } from '@/components/LureFinder';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'lureFinder' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/lure-finder` } };
}

export default async function LureFinderPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('lureFinder');

  const species: FinderSpecies[] = getAllSpecies()
    .map((s) => ({
      slug: s.slug,
      name: loc(s.name, locale),
      baits: loc(s.baits, locale),
      rigs: s.rigs
        .map((r) => getGuide(r, locale))
        .filter((g): g is NonNullable<typeof g> => Boolean(g))
        .map((g) => ({ slug: g.slug, title: g.title })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const lures: FinderLure[] = getLures().map((l) => {
    const guide = l.guide ? getGuide(l.guide, locale) : undefined;
    return {
    slug: l.slug,
    name: loc(l.name, locale),
    description: loc(l.description, locale),
    tips: loc(l.tips, locale),
    species: l.species,
    clarity: l.clarity,
    seasons: l.seasons,
    guide: guide ? { slug: guide.slug, title: guide.title } : null,
    };
  });

  return (
    <>
      <PageHeader title={t('title')} lede={t('intro')} />
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-8 md:px-8">
        <LureFinder species={species} lures={lures} />
      </div>
    </>
  );
}
