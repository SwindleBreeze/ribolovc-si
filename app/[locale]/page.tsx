import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAllSpecies, getSpots } from '@/lib/content';
import { toSummary } from '@/lib/spot-summary';
import { loc } from '@/lib/text';
import { SpotExplorer } from '@/components/map/SpotExplorer';

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const spots = getSpots().map((s) => toSummary(s, locale));
  const species = getAllSpecies()
    .map((s) => ({ slug: s.slug, name: loc(s.name, locale), water: s.water }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-6 md:py-8">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">{t('heroTitle')}</h1>
        <p className="muted mt-2 max-w-2xl md:text-lg">
          {t('heroText', { count: spots.filter((s) => !s.forbidden).length })}
        </p>
        <Link href="/guides/first-steps" className="btn btn-ghost mt-4">
          🎣 {t('newHere')}
        </Link>
      </section>
      <SpotExplorer spots={spots} species={species} />
    </div>
  );
}
