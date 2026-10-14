import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAllSpecies } from '@/lib/content';
import { loc } from '@/lib/text';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'species' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/species` } };
}

export default async function SpeciesIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('species');
  const all = getAllSpecies();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t('title')}</h1>
      <p className="muted mt-1">{t('intro')}</p>
      {(['fresh', 'sea'] as const).map((water) => (
        <section key={water} className="mt-8">
          <h2 className="mb-3 text-xl font-bold">{t(water)}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {all
              .filter((s) => s.water === water)
              .sort((a, b) => loc(a.name, locale).localeCompare(loc(b.name, locale), locale))
              .map((s) => (
                <li key={s.slug}>
                  <Link href={`/species/${s.slug}`} className="card block h-full p-3 hover:border-brand-500">
                    <p className="font-semibold">
                      {loc(s.name, locale)} {s.protected && <span title={t('protected')}>🛡️</span>}
                    </p>
                    <p className="muted text-xs italic">{s.latin}</p>
                    <p className="mt-2 line-clamp-2 text-sm">{loc(s.description, locale)}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
