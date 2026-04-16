import type {NextConfig} from 'next';
import nextra from 'nextra';

const isProd = process.env.NODE_ENV === 'production';
const pagesRepo = process.env.PAGES_REPO;

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
  ...(isProd && pagesRepo
    ? {
        basePath: `/${pagesRepo}`,
      }
    : {}),
};

export default withNextra(nextConfig);
