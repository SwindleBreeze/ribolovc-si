import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageLinks } from './LanguageSwitcher';
import { NavLinks } from './NavLinks';

export async function Header() {
  const t = await getTranslations('nav');
  const items = [
    { href: '/', label: t('map') },
    { href: '/revirji', label: t('sections') },
    { href: '/species', label: t('species') },
    { href: '/guides', label: t('guides') },
    { href: '/lure-finder', label: t('lureFinder') },
  ];

  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-baseline gap-2.5 text-ink no-underline hover:text-ink">
          <span className="font-display text-[26px] font-bold tracking-tight">Ribolovc</span>
          <span className="num hidden text-xs tracking-[0.08em] text-muted sm:inline">46°N · 14°E</span>
        </Link>
        <NavLinks items={items} label={t('main')} />
        <div className="ml-auto">
          <LanguageLinks label={t('language')} />
        </div>
      </div>
    </header>
  );
}
