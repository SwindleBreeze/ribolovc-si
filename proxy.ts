import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and files with an extension (sw.js, icons, …).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
