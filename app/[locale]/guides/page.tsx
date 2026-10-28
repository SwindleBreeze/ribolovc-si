import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getGuides } from '@/lib/content';
import { guideCategories } from '@/lib/schema';
import { PageHeader } from '@/components/ui/PageHeader';

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
  const number = new Map(
    guideCategories.flatMap((cat) => guides.filter((g) => g.category === cat)).map((g, i) => [g.slug, i + 1]),
  );

  return (
    <>
      <PageHeader eyebrow={`${guides.length} ${t('title').toLowerCase()}`} title={t('title')} lede={t('intro')} />
      <div className="mx-auto max-w-[1100px] px-4 pb-16 md:px-8">
        {guideCategories.map((cat) => {
          const list = guides.filter((g) => g.category === cat);
          if (!list.length) return null;
          return (
            <section key={cat} className="mt-10" aria-labelledby={`h-${cat}`}>
              <h2 id={`h-${cat}`} className="text-[28px] font-semibold">
                {t(`category.${cat}`)}
              </h2>
              <ol className="mt-3 border-t border-ink">
                {list.map((g) => {
                  const n = number.get(g.slug) ?? 0;
                  return (
                    <li key={g.slug} className="border-b border-rule-2">
                      <Link href={`/guides/${g.slug}`} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-2 py-4 text-ink no-underline hover:text-ink">
                        <span className="num pt-1 text-sm text-muted">{String(n).padStart(2, '0')}</span>
                        <span>
                          <span className="block font-display text-[21px] font-semibold">{g.title}</span>
                          <span className="mt-0.5 block text-ink-2">{g.summary}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
