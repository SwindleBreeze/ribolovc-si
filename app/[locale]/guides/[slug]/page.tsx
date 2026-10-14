import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getGuideSlugs } from '@/lib/content';
import { loc } from '@/lib/text';
import { DonateCta } from '@/components/DonateCta';

type Params = { locale: Locale; slug: string };

const LANGUAGE_NAMES: Record<string, string> = { sl: 'slovenska', en: 'English', de: 'Deutsch', it: 'italiano' };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getGuideSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = getGuide(slug, locale);
  if (!g) return {};
  return {
    title: g.title,
    description: g.summary,
    alternates: {
      canonical: `/${locale}/guides/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/guides/${slug}`])),
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = getGuide(slug, locale);
  if (!guide) notFound();
  const t = await getTranslations('guides');

  // Guide Markdown is our own repository content, so rendering its HTML is safe.
  // Links written for the fallback language are pointed at the reader's locale.
  const html = (await marked.parse(guide.body)).replace(/href="\/(sl|en|de|it)\//g, `href="/${locale}/`);
  const species = getAllSpecies().filter((s) => guide.species.includes(s.slug));

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <nav className="muted text-sm">
        <Link href="/guides" className="hover:underline">
          {t('title')}
        </Link>{' '}
        / {t(`category.${guide.category}`)}
      </nav>
      <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{guide.title}</h1>
      <p className="muted mt-1 text-lg">{guide.summary}</p>
      {guide.fallback && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900" lang={guide.locale}>
          {t('fallback', { lang: LANGUAGE_NAMES[guide.locale] })}
        </p>
      )}
      <div className="prose-guide mt-4" lang={guide.locale} dangerouslySetInnerHTML={{ __html: html }} />
      {species.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-bold">{t('related')}</h2>
          <div className="flex flex-wrap gap-2">
            {species.map((s) => (
              <Link key={s.slug} href={`/species/${s.slug}`} className="chip hover:border-brand-500">
                🐟 {loc(s.name, locale)}
              </Link>
            ))}
          </div>
        </section>
      )}
      <DonateCta />
    </article>
  );
}
