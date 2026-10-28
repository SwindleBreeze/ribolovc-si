import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { site } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';

const SOURCES = [
  { name: 'Open-Meteo (weather & marine forecast, CC BY 4.0)', url: 'https://open-meteo.com' },
  { name: 'ARSO – Agencija RS za okolje (hydrological data)', url: 'https://www.arso.gov.si' },
  { name: 'OpenStreetMap contributors / OpenFreeMap (base map)', url: 'https://www.openstreetmap.org/copyright' },
  { name: 'EMODnet Bathymetry (sea depth)', url: 'https://emodnet.ec.europa.eu/en/bathymetry' },
  { name: 'Zavod za ribištvo Slovenije – ribiško-gojitveni načrti', url: 'https://www.gov.si/assets/seznami/ribisko-gojitveni-nacrti/Goriski-RGN.pdf' },
  { name: 'RibiskeKarte.si – fishing sections, species, methods and permits', url: 'https://www.ribiskekarte.si/ribolovni-revirji' },
  { name: 'Geofabrik – OpenStreetMap extract for Slovenia (ODbL)', url: 'https://download.geofabrik.de/europe/slovenia.html' },
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
    <>
      <PageHeader title={t('title')} />
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-8 md:px-0">
        <section className="border-l-4 border-accent bg-raised px-5 py-4">
          <h2 className="text-xl font-semibold">{t('disclaimerTitle')}</h2>
          <p className="mt-1.5 text-[15px]">{t('disclaimer')}</p>
        </section>
        <section className="mt-10">
          <h2 className="border-t border-ink pt-3 text-[22px] font-semibold">{t('sourcesTitle')}</h2>
          <ul className="mt-2">
            {SOURCES.map((s) => (
              <li key={s.url} className="border-b border-rule-2 py-2">
                <a href={s.url} target="_blank" rel="noopener">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10">
          <h2 className="border-t border-ink pt-3 text-[22px] font-semibold">{t('privacyTitle')}</h2>
          <p className="mt-2">{t('privacy')}</p>
        </section>
        <section className="mt-10">
          <h2 className="border-t border-ink pt-3 text-[22px] font-semibold">{t('contactTitle')}</h2>
          <p className="mt-2">
            {t('contact')}{' '}
            <a href={site.issuesUrl} target="_blank" rel="noopener">
              GitHub
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
