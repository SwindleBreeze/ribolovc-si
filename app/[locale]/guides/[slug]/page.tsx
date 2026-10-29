import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getAllSpecies, getGuide, getGuideSlugs } from '@/lib/content';
import { loc } from '@/lib/text';
import { PageHeader } from '@/components/ui/PageHeader';
import { FishSilhouette } from '@/components/ui/FishSilhouette';
import { RigDiagram } from '@/components/guides/RigDiagram';

type Params = { locale: Locale; slug: string };

const LANGUAGE_NAMES: Record<string, string> = { sl: 'slovenska', en: 'English', de: 'Deutsch', it: 'italiano' };

// Sections that read as asides rather than steps: tips get a callout, gear lists a kit box.
const TIP_HEADINGS = /^(nasveti|tips|must-haves|nujno|ne pozabite|remember|varnost|safety)\b/i;
const KIT_HEADINGS = /^(oprema|gear)$/i;

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Give every h2 an id and wrap tip and gear sections so they can be styled as asides. */
function structure(html: string) {
  const toc: { id: string; text: string }[] = [];
  const parts = html.split(/(?=<h2>)/);
  const out = parts.map((part) => {
    const m = part.match(/^<h2>(.*?)<\/h2>/);
    if (!m) return part;
    const text = m[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const id = slugify(text) || `s${toc.length + 1}`;
    toc.push({ id, text });
    const body = part.replace(/^<h2>/, `<h2 id="${id}">`);
    if (part.includes('<!-- diagram -->')) return body;
    if (TIP_HEADINGS.test(text)) return `<section class="guide-aside guide-tips">${body}</section>`;
    if (KIT_HEADINGS.test(text)) return `<section class="guide-aside guide-kit">${body}</section>`;
    return body;
  });
  return { html: out.join(''), toc };
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getGuideSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = getGuide(slug, locale);
  if (!g) return {};
  return {
    title: g.title,
    description: g.summary,
    alternates: {
      canonical: `/${locale}/guides/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/guides/${slug}`])),
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = getGuide(slug, locale);
  if (!guide) notFound();
  const t = await getTranslations('guides');

  // Guide Markdown is our own repository content, so rendering its HTML is safe.
  // Links written for the fallback language are pointed at the reader's locale.
  const raw = (await marked.parse(guide.body)).replace(/href="\/(sl|en|de|it)\//g, `href="/${locale}/`);
  const { html, toc } = structure(raw);
  // A rig drawing replaces the old ASCII sketches where the Markdown marks its place.
  const [before, after] = html.split('<!-- diagram -->');
  const species = getAllSpecies().filter((s) => guide.species.includes(s.slug));

  return (
    <article>
      <PageHeader
        eyebrow={
          <>
            <Link href="/guides" className="text-muted">
              {t('title')}
            </Link>{' '}
            / {t(`category.${guide.category}`)}
          </>
        }
        title={guide.title}
        lede={guide.summary}
      />
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-8 md:px-0">
        {guide.fallback && (
          <p className="mb-6 border-l-4 border-accent bg-raised px-4 py-2.5 text-sm" lang={guide.locale}>
            {t('fallback', { lang: LANGUAGE_NAMES[guide.locale] })}
          </p>
        )}
        {toc.length >= 4 && (
          <nav aria-label={t('onThisPage')} className="mb-8 border-y border-rule py-3">
            <p className="label mb-1.5">{t('onThisPage')}</p>
            <ol className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-brand">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="prose-guide" lang={guide.locale} dangerouslySetInnerHTML={{ __html: before }} />
        {after !== undefined && (
          <>
            <RigDiagram slug={slug} locale={guide.locale} />
            <div className="prose-guide" lang={guide.locale} dangerouslySetInnerHTML={{ __html: after }} />
          </>
        )}
        {species.length > 0 && (
          <section className="mt-12 border-t border-ink pt-4">
            <h2 className="label mb-3 !text-xs">{t('related')}</h2>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {species.map((s) => (
                <li key={s.slug} className="border-b border-rule-2">
                  <Link href={`/species/${s.slug}`} className="flex items-center gap-3 py-2 text-ink no-underline hover:text-ink">
                    <FishSilhouette slug={s.slug} group={s.group} className="h-6 w-20 shrink-0 text-ink" />
                    <span className="font-display text-lg">{loc(s.name, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
