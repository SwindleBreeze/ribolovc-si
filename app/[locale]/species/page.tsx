import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAllSpecies } from '@/lib/content';
import { loc } from '@/lib/text';
import { PageHeader } from '@/components/ui/PageHeader';
import { FishSilhouette } from '@/components/ui/FishSilhouette';

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
    <>
      <PageHeader eyebrow={`${all.length} · ${t('fresh')} · ${t('sea')}`} title={t('title')} lede={t('intro')} />
      <div className="mx-auto max-w-[1360px] px-4 pb-16 md:px-8">
        {(['fresh', 'sea'] as const).map((water) => (
          <section key={water} className="mt-10" aria-labelledby={`h-${water}`}>
            <h2 id={`h-${water}`} className="mb-4 text-[28px] font-semibold">
              {t(water)}
            </h2>
            <ul className="grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
              {all
                .filter((s) => s.water === water)
                .sort((a, b) => loc(a.name, locale).localeCompare(loc(b.name, locale), locale))
                .map((s) => (
                  <li key={s.slug} className="border-b border-rule-2">
                    <Link href={`/species/${s.slug}`} className="block py-5 pr-4 text-ink no-underline hover:text-ink">
                      <FishSilhouette slug={s.slug} group={s.group} className="h-10 w-32 text-ink" />
                      <span className="mt-2 block font-display text-xl font-semibold">
                        {loc(s.name, locale)}
                        {s.protected && <span className="label ml-2 align-middle !text-poor">{t('protectedShort')}</span>}
                      </span>
                      <span className="block font-display italic text-muted">{s.latin}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
