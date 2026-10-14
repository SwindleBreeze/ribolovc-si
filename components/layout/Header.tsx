import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

export async function Header() {
  const t = await getTranslations('nav');
  const items = [
    { href: '/', label: t('map') },
    { href: '/species', label: t('species') },
    { href: '/guides', label: t('guides') },
    { href: '/lure-finder', label: t('lureFinder') },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-brand-700 dark:text-brand-200">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0b8573" />
            <path d="M6 17c4-6 11-7 16-2l4-3v10l-4-3c-5 5-12 4-16-2z" fill="#fff" />
            <circle cx="11" cy="16" r="1.4" fill="#0b8573" />
          </svg>
          <span>Ribolovc.si</span>
        </Link>
        <nav className="ml-2 hidden gap-1 md:flex" aria-label="Main">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/podpri" className="btn btn-primary !px-3 !py-1.5 text-sm">
            ☕ {t('support')}
          </Link>
          <LanguageSwitcher label={t('language')} />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Main mobile">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="chip whitespace-nowrap">
            {i.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
