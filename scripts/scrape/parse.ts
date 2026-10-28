/**
 * Pure HTML parsers for ribiskekarte.si pages. Kept free of network code so they can be
 * unit-tested against saved pages.
 */
import * as cheerio from 'cheerio';

export const BASE = 'https://www.ribiskekarte.si';

export type Features = {
  species: string[];
  methods: string[];
  baits: string[];
  waterType: string | null;
};

export type IndexItem = {
  url: string;
  name: string;
  subtitle: string;
  clubName: string;
  clubUrl: string;
  features: Features;
};

export type Pass = {
  name: string;
  priceEur: number | null;
  /** "Nakup od DD. MM. do DD. MM." when the pass is only sold part of the year. */
  saleWindow: string | null;
  buyUrl: string | null;
};

export type RevirPage = {
  url: string;
  clubSlug: string;
  slug: string;
  code: string;
  name: string;
  subtitle: string;
  club: { name: string; url: string };
  description: string;
  features: Features;
  passes: Pass[];
  /** Location of the gauging station shown on the page ("Pretok"), if any. */
  gauge: { lat: number; lon: number } | null;
  mapPdfUrl: string | null;
  siblingUrls: string[];
  /** The club is not a portal member, so no permits are sold online. */
  notMember: boolean;
};

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const list = (s: string) =>
  clean(s)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const absolute = (href: string) => (href.startsWith('http') ? href : `${BASE}/${href.replace(/^\//, '')}`);

function parseFeatures($: cheerio.CheerioAPI, root: cheerio.Cheerio<never>): Features {
  const f: Features = { species: [], methods: [], baits: [], waterType: null };
  root.find('ul.block-features > li').each((_, li) => {
    const label = clean($(li).find('span.bold').first().text()).toLowerCase();
    const value = $(li).find('span').not('.bold').last().text();
    if (label.startsWith('možnost ribolova')) f.species = list(value);
    else if (label.startsWith('vrsta ribolova')) f.methods = list(value);
    else if (label.startsWith('dovoljene vabe')) f.baits = list(value);
    else if (label.startsWith('tip vode')) f.waterType = clean(value) || null;
  });
  return f;
}

export function parseIndexPage(html: string): { items: IndexItem[]; total: number | null; pages: number[] } {
  const $ = cheerio.load(html);
  const items: IndexItem[] = [];
  $('.districts .block').each((_, el) => {
    const block = $(el);
    const a = block.find('.block-text-sm h2 a').first();
    const href = a.attr('href');
    if (!href) return;
    const club = block.find('.block-text-sm h4 a').first();
    items.push({
      url: absolute(href),
      name: clean(a.text()),
      subtitle: clean(block.find('.block-text-sm span.h5').first().text()).replace(/^\(|\)$/g, ''),
      clubName: clean(club.text()),
      clubUrl: absolute(club.attr('href') ?? ''),
      features: parseFeatures($, block as cheerio.Cheerio<never>),
    });
  });
  const totalText = $('span.bold')
    .filter((_, el) => /število zadetkov/i.test($(el).text()))
    .next()
    .text();
  const total = Number.parseInt(totalText, 10);
  const pages = $('ul.pagination a')
    .map((_, a) => Number(/[?&]page=(\d+)/.exec($(a).attr('href') ?? '')?.[1]))
    .get()
    .filter((n) => Number.isFinite(n));
  return { items, total: Number.isFinite(total) ? total : null, pages: [...new Set(pages)] };
}

function parsePrice(s: string): number | null {
  const m = /(\d+(?:[.,]\d+)?)\s*(?:&euro;|€)/.exec(s);
  return m ? Number(m[1].replace('.', '').replace(',', '.')) : null;
}

export function parseRevirPage(html: string, url: string): RevirPage {
  const $ = cheerio.load(html);
  const path = new URL(url).pathname.replace(/^\/(en|de|it)\//, '/').split('/').filter(Boolean);
  const title = $('.district-title').first();
  const clubLink = title.find('h4 a').first();

  // Description: the paragraphs of the main text block, without the feature list.
  const block = $('.block-text').has('.district-title').first();
  const description = block
    .find('p')
    .map((_, p) => clean($(p).text()))
    .get()
    .filter((t) => t.length > 0)
    .filter((t, i, all) => all.indexOf(t) === i)
    .join('\n\n');

  const passes: Pass[] = [];
  $('.district-buy-pass').each((_, el) => {
    const p = $(el);
    const left = p.find('.pull-left').first();
    const window = /Nakup od[^<]*/.exec(left.html() ?? '')?.[0];
    passes.push({
      name: clean(left.find('.font-lg').first().text()),
      priceEur: parsePrice(p.find('.pass-price').first().html() ?? ''),
      saleWindow: window ? clean(cheerio.load(window).text()) : null,
      buyUrl: p.find('a.pass-btn').attr('href') ? absolute(p.find('a.pass-btn').attr('href')!) : null,
    });
  });

  let gauge: RevirPage['gauge'] = null;
  const gaugeText = $('.water-level-title a').first().text();
  const gm = /Lat:\s*(-?\d+\.\d+)\s*Long:\s*(-?\d+\.\d+)/i.exec(gaugeText);
  if (gm) gauge = { lat: Number(gm[1]), lon: Number(gm[2]) };

  const pdf = $('a[href$=".pdf"]')
    .map((_, a) => $(a).attr('href'))
    .get()
    .find((h) => h.includes('districts_files'));

  const siblingUrls = $('.district-other a')
    .map((_, a) => absolute($(a).attr('href') ?? ''))
    .get()
    .filter((h, i, all) => h.startsWith(BASE) && all.indexOf(h) === i);

  return {
    url,
    clubSlug: path[0] ?? '',
    slug: path[1] ?? '',
    code: clean($('.breadcrumb li.active').first().text()),
    name: clean(title.find('h2').first().text()),
    subtitle: clean(title.find('span.h5').first().text()).replace(/^\(|\)$/g, ''),
    club: { name: clean(clubLink.text()), url: absolute(clubLink.attr('href') ?? '') },
    description,
    features: parseFeatures($, block as cheerio.Cheerio<never>),
    passes,
    gauge,
    mapPdfUrl: pdf ? absolute(pdf) : null,
    siblingUrls,
    notMember: /ni član spletnega portala/i.test($.text()),
  };
}
