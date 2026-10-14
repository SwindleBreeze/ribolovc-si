import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { site } from '@/lib/site';

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
    <div className="mx-auto max-w-2xl px-4 py-10 text-center">
      <p className="text-5xl" aria-hidden="true">
        ☕🎣
      </p>
      <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">{t('title')}</h1>
      <p className="mt-4 text-lg">{t('text')}</p>
      {site.donateUrl ? (
        <a href={site.donateUrl} className="btn btn-primary mt-6 !px-6 !py-3 text-lg" target="_blank" rel="noopener" data-testid="donate-link">
          ☕ {t('button')}
        </a>
      ) : (
        <p className="muted mt-6" data-testid="donate-missing">
          {t('notConfigured')}
        </p>
      )}
      <section className="card mt-10 p-5 text-left">
        <h2 className="font-bold">{t('uses')}</h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-7">
          <li>{t('use1')}</li>
          <li>{t('use2')}</li>
          <li>{t('use3')}</li>
        </ul>
      </section>
    </div>
  );
}
