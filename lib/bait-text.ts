import type { Bait } from './advice';

/**
 * Natural baits and lure types mentioned in a species' Slovenian bait text
 * (content/species.yaml `baits.sl`), in the order they first appear, so the species page and
 * the lure finder can show a drawing for each.
 */

const BAITS: [Bait, RegExp][] = [
  ['seaworm', /morsk\w* črv/i],
  ['worms', /(?<!\p{L})črv|rosnic|glist/iu],
  ['maggots', /ličink|pinkij/i],
  ['corn', /koruz/i],
  ['boilies', /boili/i],
  ['pellets', /pelet/i],
  ['bread', /kruh|drobtin/i],
  ['cheese', /(?<!\p{L})sir(?!\p{L})/iu],
  ['paste', /(?<!\p{L})(test[oa]|past[ea])(?!\p{L})/iu],
  // "muhe ribice" are streamer flies and "gumijaste ribice" soft lures, not deadbait.
  ['deadbait', /(?<!(?:muh|gumijast)\p{L}* )ribic|mrtva riba|kos\p{L}* rib|koščk\p{L}* rib|sardel/iu],
  ['nymph', /nimf/i],
  ['dryfly', /suh\p{L}* muh|muh\p{L}* v izletu|kobilic/iu],
  ['streamer', /muh\p{L}* ribic/iu],
];

const LURES: [string, RegExp][] = [
  ['vrtilka', /vrtilk/i],
  ['zlica', /žli[cč]/iu],
  ['wobler', /vobler/i],
  ['shad', /gumijast|\bshad\b|gumic/i],
  ['drop-shot', /spodnj\p{L}* utež/iu],
  ['povrsinska', /površinsk/iu],
  ['zopf', /zopf|pletenic/i],
  ['kalamarjera', /kalamarjer/i],
];

function inOrder<T>(text: string, rules: [T, RegExp][]): T[] {
  return rules
    .map(([key, re]) => ({ key, at: text.search(re) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.key);
}

export function tackleInText(slText: string): { baits: Bait[]; lures: string[] } {
  // "črv (morski črv)" is one sea worm; sea worms are blanked out before looking for earthworms.
  const text = slText.replace(/črv\s*\(morski črv\)/giu, 'morski črv');
  const seaworm = BAITS.find(([b]) => b === 'seaworm')![1];
  const land = text.replace(new RegExp(seaworm.source + '\\p{L}*', 'giu'), (m) => '·'.repeat(m.length));
  const baits = inOrder(text, BAITS.filter(([b]) => b !== 'worms'));
  const worm = land.search(BAITS.find(([b]) => b === 'worms')![1]);
  if (worm >= 0) baits.splice(inOrder(text.slice(0, worm), BAITS.filter(([b]) => b !== 'worms')).length, 0, 'worms');
  return { baits, lures: inOrder(text, LURES) };
}
