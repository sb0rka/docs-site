import type {NextConfig} from 'next';
import nextra from 'nextra';
import fs from 'node:fs';
import path from 'node:path';

const isProd = process.env.NODE_ENV === 'production';
const pagesRepo = process.env.PAGES_REPO;
const hasCustomDomain =
  fs.existsSync(path.join(process.cwd(), 'CNAME')) ||
  fs.existsSync(path.join(process.cwd(), 'public', 'CNAME'));

const withNextra = nextra({
  contentDirBasePath: '/',
  unstable_shouldAddLocaleToLinks: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  // Nextra reads locales/defaultLocale from here and then unsets i18n itself
  // so this is safe with output: 'export'
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'en',
  },
  ...(isProd && pagesRepo && !hasCustomDomain
    ? {
        basePath: `/${pagesRepo}`,
      }
    : {}),
};

export default withNextra(nextConfig);
