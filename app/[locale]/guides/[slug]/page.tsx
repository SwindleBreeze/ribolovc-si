import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getGuideSlugs } from '@/lib/content';
import { loc } from '@/lib/text';
import { PageHeader } from '@/components/ui/PageHeader';
import { FishSilhouette } from '@/components/ui/FishSilhouette';

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
    <article>
      <PageHeader
        eyebrow={
          <>
            <Link href="/guides" className="text-muted">
              {t('title')}
            </Link>{' '}
            / {t(`category.${guide.category}`)}
          </>
        }
        title={guide.title}
        lede={guide.summary}
      />
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-8 md:px-0">
        {guide.fallback && (
          <p className="mb-6 border-l-4 border-accent bg-raised px-4 py-2.5 text-sm" lang={guide.locale}>
            {t('fallback', { lang: LANGUAGE_NAMES[guide.locale] })}
          </p>
        )}
        <div className="prose-guide" lang={guide.locale} dangerouslySetInnerHTML={{ __html: html }} />
        {species.length > 0 && (
          <section className="mt-12 border-t border-ink pt-4">
            <h2 className="label mb-3 !text-xs">{t('related')}</h2>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {species.map((s) => (
                <li key={s.slug} className="border-b border-rule-2">
                  <Link href={`/species/${s.slug}`} className="flex items-center gap-3 py-2 text-ink no-underline hover:text-ink">
                    <FishSilhouette slug={s.slug} group={s.group} className="h-6 w-20 shrink-0 text-ink" />
                    <span className="font-display text-lg">{loc(s.name, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
