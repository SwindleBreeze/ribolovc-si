'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/** Language links that keep the current page. */
export function LanguageLinks({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  return (
    <nav aria-label={label} className="num flex gap-3.5 text-[13px]" data-testid="language-switcher">
      {routing.locales.map((l) => (
        <Link
          key={l}
          // @ts-expect-error -- pathname and params always match the current route
          href={{ pathname, params }}
          locale={l}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={`uppercase no-underline ${l === locale ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
