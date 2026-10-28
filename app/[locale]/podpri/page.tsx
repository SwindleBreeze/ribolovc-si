import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { site } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  return { title: t('title'), description: t('text'), alternates: { canonical: `/${locale}/podpri` } };
}

export default async function SupportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('support');

  return (
    <>
      <PageHeader title={t('title')} lede={t('text')} />
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-8 md:px-0">
        {site.donateUrl ? (
          <a href={site.donateUrl} className="btn btn-cta" target="_blank" rel="noopener" data-testid="donate-link">
            {t('button')} <ArrowUpRight aria-hidden="true" size={18} />
          </a>
        ) : (
          <p className="text-muted" data-testid="donate-missing">
            {t('notConfigured')}
          </p>
        )}
        <h2 className="mt-10 border-t border-ink pt-3 text-[22px] font-semibold">{t('uses')}</h2>
        <ol className="mt-2">
          {[t('use1'), t('use2'), t('use3')].map((u, i) => (
            <li key={u} className="flex gap-3 border-b border-rule-2 py-2.5">
              <span className="num text-muted">0{i + 1}</span>
              {u}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
