import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getRevirji } from '@/lib/content';
import { getPlaces } from '@/lib/places';
import { loc } from '@/lib/text';
import { Explorer } from '@/components/map/Explorer';

const START_GUIDES = ['permits', 'float-rig', 'etiquette'];

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const places = getPlaces(locale);
  const revirji = getRevirji();
  const species = getAllSpecies()
    .map((s) => ({ slug: s.slug, name: loc(s.name, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  const clubs = [...new Set(revirji.map((r) => r.club.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sl'));
  const guides = START_GUIDES.map((g) => getGuide(g, locale)).filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <>
      <section className="contour-bg border-b border-rule">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-end gap-8 px-4 pb-9 pt-11 md:px-8">
          <div className="min-w-0 flex-[999_1_560px]">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="mt-2.5 max-w-[14ch] text-[42px] font-semibold leading-[1.04] tracking-tight md:text-[56px]">{t('heroTitle')}</h1>
            <p className="mt-3.5 max-w-[56ch] text-lg text-ink-2">{t('heroText')}</p>
          </div>
          <dl className="grid flex-[1_1_320px] grid-cols-3 border-t border-ink">
            <Stat label={t('statSections')} value={revirji.length || places.length} />
            <Stat label={t('statClubs')} value={clubs.length} border />
            <Stat label={t('statSpecies')} value={species.length} border />
          </dl>
        </div>
      </section>

      <Explorer places={places} species={species} clubs={clubs} />

      <section className="mx-auto max-w-[1360px] px-4 pb-14 pt-10 md:px-8">
        <h2 className="mb-4 text-[28px] font-semibold">{t('startTitle')}</h2>
        <div className="grid border-t border-ink sm:grid-cols-3">
          {guides.map((g, i) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className={`block py-5 text-ink no-underline hover:text-ink sm:px-6 ${i === 0 ? 'sm:pl-0' : 'border-rule sm:border-l'} ${i > 0 ? 'border-t border-rule sm:border-t-0' : ''}`}
            >
              <span className="num text-[13px] text-muted">0{i + 1}</span>
              <span className="mt-1.5 block font-display text-[21px] font-semibold">{g.title}</span>
              <span className="mt-1.5 block text-ink-2">{g.summary}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, border }: { label: string; value: number; border?: boolean }) {
  return (
    <div className={`pt-3 ${border ? 'border-l border-rule pl-3' : 'pr-3'}`}>
      <dt className="label">{label}</dt>
      <dd className="num mt-1 text-[28px]">{value}</dd>
    </div>
  );
}
