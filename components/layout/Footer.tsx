import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mt-16 border-t border-ink bg-paper">
      <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-10 text-sm md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <p className="font-display text-2xl font-bold">Ribolovc</p>
          <p className="mt-2 max-w-[48ch] text-ink-2">{t('site.tagline')}</p>
          <p className="mt-3 max-w-[60ch] text-xs text-muted">{t('spot.rulesDisclaimer')}</p>
        </div>
        <nav aria-label={t('nav.guides')} className="flex flex-col gap-1.5">
          <Link href="/revirji" className="text-ink">{t('nav.sections')}</Link>
          <Link href="/species" className="text-ink">{t('nav.species')}</Link>
          <Link href="/guides" className="text-ink">{t('nav.guides')}</Link>
          <Link href="/lure-finder" className="text-ink">{t('nav.lureFinder')}</Link>
        </nav>
        <div className="flex flex-col gap-1.5">
          <Link href="/about" className="text-ink">{t('nav.about')}</Link>
          <Link href="/podpri" className="text-ink">{t('nav.support')}</Link>
          <a href={site.repoUrl} className="text-ink" rel="noopener">GitHub</a>
        </div>
      </div>
      <p className="eyebrow border-t border-rule px-4 py-3 text-center !text-[11px]">
        © {new Date().getFullYear()} Ribolovc · {t('footer.sources')}
      </p>
    </footer>
  );
}
