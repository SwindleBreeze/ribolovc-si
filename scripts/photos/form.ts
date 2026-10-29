/**
 * Parsing for the "Photo" issue form (.github/ISSUE_TEMPLATE/photo.yml). GitHub renders an
 * issue form as "### <label>" sections, so the labels here must match the template exactly.
 */

export const LABELS = {
  place: 'Revir ali lokacija / Section or spot',
  photos: 'Fotografije / Photos',
  caption: 'Opis / Caption',
  author: 'Avtor / Credit',
  consent: 'Soglasje / Consent',
} as const;

export const MAX_PHOTOS = 4;

const ALLOWED_IMAGE_PREFIXES = [
  'https://github.com/user-attachments/assets/',
  'https://user-images.githubusercontent.com/',
  'https://private-user-images.githubusercontent.com/',
];

/** Split an issue-form body into { label: value }. "_No response_" counts as empty. */
export function parseIssueForm(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = (nl === -1 ? part : part.slice(0, nl)).trim();
    const value = (nl === -1 ? '' : part.slice(nl + 1)).trim();
    out[label] = value === '_No response_' ? '' : value;
  }
  return out;
}

/**
 * Accept a place id ("revir:rd-tolmin/soca-3", "spot:bohinj-ukanc") or a link to its page
 * on the site ("https://…/sl/revirji/rd-tolmin/soca-3") and return the id, or null.
 */
export function normalizePlace(input: string): string | null {
  const v = input.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
  let m = /^(revir:[a-z0-9-]+\/[A-Za-z0-9-]+|spot:[a-z0-9-]+)$/.exec(v);
  if (m) return m[1];
  m = /\/revirji\/([a-z0-9-]+\/[A-Za-z0-9-]+)$/.exec(v);
  if (m) return `revir:${m[1]}`;
  m = /\/spots\/([a-z0-9-]+)$/.exec(v);
  if (m) return `spot:${m[1]}`;
  return null;
}

/** Image URLs uploaded to GitHub in the photos field, in order, without duplicates. */
export function imageUrls(text: string): string[] {
  const found = [
    ...[...text.matchAll(/!\[[^\]]*\]\((\S+?)\)/g)].map((m) => m[1]),
    ...[...text.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]),
  ];
  return [...new Set(found)].filter((u) => ALLOWED_IMAGE_PREFIXES.some((p) => u.startsWith(p)));
}

/** True when every checkbox in the consent field is ticked. */
export function allChecked(text: string): boolean {
  const boxes = [...text.matchAll(/^- \[( |x|X)\]/gm)];
  return boxes.length > 0 && boxes.every((b) => b[1] !== ' ');
}

/** One line of plain text, at most `max` characters. */
export function cleanLine(text: string, max: number): string {
  return text.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
