/** Site-wide settings. Override with environment variables on the host (e.g. Vercel). */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ribolovc.si',
  /** Your Ko-fi (or Buy Me a Coffee) page, e.g. https://ko-fi.com/yourname */
  donateUrl: process.env.NEXT_PUBLIC_DONATE_URL ?? '',
  repoUrl: 'https://github.com/swindlebreeze/ribolovc-si',
  issuesUrl: 'https://github.com/swindlebreeze/ribolovc-si/issues/new',
};
