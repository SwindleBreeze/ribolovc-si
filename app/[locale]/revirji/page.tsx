import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getRevirji } from '@/lib/content';
import { revirTitle } from '@/lib/places';
import { PageHeader } from '@/components/ui/PageHeader';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'revir' });
  return { title: t('indexTitle'), description: t('indexLede'), alternates: { canonical: `/${locale}/revirji` } };
}

export default async function RevirjiIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('revir');
  const byClub = new Map<string, ReturnType<typeof getRevirji>>();
  for (const r of getRevirji()) {
    const list = byClub.get(r.club.name) ?? [];
    list.push(r);
    byClub.set(r.club.name, list);
  }
  const clubs = [...byClub.entries()].sort((a, b) => a[0].localeCompare(b[0], 'sl'));

  return (
    <>
      <PageHeader eyebrow="ribiskekarte.si · OpenStreetMap" title={t('indexTitle')} lede={t('indexLede')} />
      <div className="mx-auto max-w-[1360px] px-4 py-10 md:px-8">
        {clubs.length === 0 && <p className="text-muted">{t('empty')}</p>}
        <div className="columns-1 gap-10 md:columns-2 xl:columns-3">
          {clubs.map(([club, list]) => (
            <section key={club} className="mb-8 break-inside-avoid border-t border-ink pt-3">
              <h2 className="text-xl font-semibold">{club}</h2>
              <ul className="mt-2">
                {list
                  .sort((a, b) => a.name.localeCompare(b.name, 'sl'))
                  .map((r) => {
                    const { name, sub } = revirTitle(r, locale);
                    return (
                      <li key={r.id} className="border-b border-rule-2 py-1.5">
                        <Link href={`/revirji/${r.id}`} className="text-ink">
                          {name}
                        </Link>
                        {sub && <span className="block text-sm text-muted">{sub}</span>}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
