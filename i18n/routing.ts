import { defineRouting } from 'next-intl/routing';

export const locales = ['sl', 'en', 'de', 'it'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'sl',
});
