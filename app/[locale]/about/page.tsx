import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { site } from '@/lib/site';

const SOURCES = [
  { name: 'Open-Meteo (weather & marine forecast, CC BY 4.0)', url: 'https://open-meteo.com' },
  { name: 'ARSO – Agencija RS za okolje (hydrological data)', url: 'https://www.arso.gov.si' },
  { name: 'OpenStreetMap contributors / OpenFreeMap (base map)', url: 'https://www.openstreetmap.org/copyright' },
  { name: 'EMODnet Bathymetry (sea depth)', url: 'https://emodnet.ec.europa.eu/en/bathymetry' },
  { name: 'Zavod za ribištvo Slovenije – ribiško-gojitveni načrti', url: 'https://www.gov.si/assets/seznami/ribisko-gojitveni-nacrti/Goriski-RGN.pdf' },
  { name: 'RibiskeKarte.si (permits)', url: 'https://www.ribiskekarte.si' },
  { name: 'SPOT – sea sport fishing permit', url: 'https://spot.gov.si/sl/dejavnosti-in-poklici/dovoljenja/letno-dovoljenje-za-sportni-ribolov' },
  { name: 'EU Reg. (EC) No 1967/2006 – Mediterranean minimum sizes', url: 'https://eur-lex.europa.eu/eli/reg/2006/1967/oj' },
  { name: 'SeaFishingSlovenia – coastal spots', url: 'https://seafishingslovenia.com/skriti-koticki-za-ribolov-na-slovenski-obali/' },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), alternates: { canonical: `/${locale}/about` } };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t('title')}</h1>
      <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <h2 className="font-bold">⚠️ {t('disclaimerTitle')}</h2>
        <p className="mt-1 text-sm">{t('disclaimer')}</p>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-bold">{t('sourcesTitle')}</h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-7">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} className="text-brand-600 underline" target="_blank" rel="noopener">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-bold">{t('privacyTitle')}</h2>
        <p className="mt-1 text-sm">{t('privacy')}</p>
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-bold">{t('contactTitle')}</h2>
        <p className="mt-1 text-sm">
          {t('contact')}{' '}
          <a href={site.issuesUrl} className="text-brand-600 underline" target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </p>
      </section>
    </div>
  );
}
