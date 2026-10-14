import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getGuides } from '@/lib/content';
import { guideCategories } from '@/lib/schema';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guides' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/guides` } };
}

export default async function GuidesIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('guides');
  const guides = getGuides(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t('title')}</h1>
      <p className="muted mt-1">{t('intro')}</p>
      {guideCategories.map((cat) => {
        const list = guides.filter((g) => g.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} className="mt-8">
            <h2 className="mb-3 text-xl font-bold">{t(`category.${cat}`)}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="card block h-full p-4 hover:border-brand-500">
                    <p className="font-semibold">{g.title}</p>
                    <p className="muted mt-1 text-sm">{g.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
