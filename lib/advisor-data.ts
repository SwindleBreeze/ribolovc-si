import type { Locale } from '@/i18n/routing';
import type { AdvisorData } from '@/components/conditions/SetupAdvisor';
import { getAllSpecies, getGuides, getLures } from './content';
import type { Technique } from './schema';
import { loc } from './text';

// The fish most anglers come for, so the advisor opens on one of them.
const MAIN_FISH = ['soska-postrv', 'potocna-postrv', 'sarenka', 'lipan', 'sulec', 'krap', 'scuka', 'smuc', 'brancin', 'lignji', 'som', 'ostriz', 'klen', 'mrena', 'linj', 'orada', 'cipelj'];
const rank = (slug: string) => (MAIN_FISH.indexOf(slug) + 1 || 99);

/** What the setup advisor needs for one place: its fish, its allowed methods and display names. */
export function advisorData(speciesSlugs: string[], techniques: Technique[], locale: Locale): AdvisorData {
  const all = getAllSpecies();
  return {
    species: speciesSlugs
      .map((slug) => all.find((s) => s.slug === slug))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ slug: s.slug, name: loc(s.name, locale), group: s.group }))
      .sort((a, b) => rank(a.slug) - rank(b.slug)),
    techniques,
    lures: Object.fromEntries(getLures().map((l) => [l.slug, loc(l.name, locale)])),
    guides: Object.fromEntries(getGuides(locale).map((g) => [g.slug, g.title])),
  };
}
