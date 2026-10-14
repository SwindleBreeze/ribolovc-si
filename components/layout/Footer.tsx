import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mt-12 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm md:grid-cols-3">
        <div>
          <p className="font-bold">Ribolovc.si</p>
          <p className="muted mt-1">{t('site.tagline')}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/guides" className="hover:underline">{t('nav.guides')}</Link>
          <Link href="/species" className="hover:underline">{t('nav.species')}</Link>
          <Link href="/lure-finder" className="hover:underline">{t('nav.lureFinder')}</Link>
          <Link href="/about" className="hover:underline">{t('nav.about')}</Link>
        </div>
        <div>
          <p className="muted">{t('support.cta')}</p>
          <Link href="/podpri" className="btn btn-primary mt-2">☕ {t('nav.support')}</Link>
        </div>
      </div>
      <div className="muted border-t border-[var(--border)] px-4 py-3 text-center text-xs">
        © {new Date().getFullYear()} Ribolovc.si · {t('about.disclaimerTitle')}: {t('spot.rulesDisclaimer')} ·{' '}
        <a href={site.repoUrl} className="underline" rel="noopener">GitHub</a>
      </div>
    </footer>
  );
}
