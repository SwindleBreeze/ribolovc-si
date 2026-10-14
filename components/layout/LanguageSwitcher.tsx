'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const names: Record<Locale, string> = { sl: 'SL', en: 'EN', de: 'DE', it: 'IT' };

export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <label className="flex items-center">
      <span className="sr-only">{label}</span>
      <select
        className="field !w-auto !py-1 text-sm font-semibold"
        value={locale}
        onChange={(e) =>
          // @ts-expect-error -- pathname and params always match the current route
          router.replace({ pathname, params }, { locale: e.target.value as Locale })
        }
        data-testid="language-switcher"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {names[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
