import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The conditions API reads spot coordinates from the YAML content at runtime.
  outputFileTracingIncludes: {
    '/api/conditions': ['./content/**/*'],
  },
};

export default withNextIntl(nextConfig);
