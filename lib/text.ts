import type { Locale } from '@/i18n/routing';

type Localized = { sl: string; en: string; de?: string; it?: string };

/** Pick the text for a locale, falling back to English and then Slovenian. */
export function loc(text: Localized | undefined, locale: Locale | string): string {
  if (!text) return '';
  const value = (text as Record<string, string | undefined>)[locale];
  return value ?? text.en ?? text.sl;
}

/** True when the locale had to fall back to another language. */
export function isFallback(text: Localized | undefined, locale: Locale | string): boolean {
  if (!text) return false;
  return !(text as Record<string, string | undefined>)[locale];
}
