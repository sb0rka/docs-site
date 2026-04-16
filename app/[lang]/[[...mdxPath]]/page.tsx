import type {MDXWrapper} from 'nextra';
import {importPage} from 'nextra/pages';
import {useMDXComponents as getMDXComponents} from '../../../mdx-components';

// Paths relative to content/{lang}/ — keep in sync with docs/ source files.
// Index pages (index.mdx) use empty array; all others use their path segments.
const ROUTES: string[][] = [
  [],
  ['solutions', 'databases'],
  ['solutions', 'secrets'],
  ['concepts', 'projects'],
  ['concepts', 'resources'],
];

export function generateStaticParams() {
  const locales = ['ru', 'en'] as const;
  return locales.flatMap((lang) =>
    ROUTES.map((mdxPath) => ({lang, mdxPath})),
  );
}

export async function generateMetadata(props: {
  params: Promise<{lang: string; mdxPath?: string[]}>;
}) {
  const params = await props.params;
  const {metadata} = await importPage(params.mdxPath, params.lang);
  return metadata;
}

export default async function Page(props: {
  params: Promise<{lang: string; mdxPath?: string[]}>;
}) {
  const params = await props.params;
  const result = await importPage(params.mdxPath, params.lang);
  const {default: MDXContent, toc, metadata, sourceCode} = result;
  const Wrapper = getMDXComponents().wrapper as MDXWrapper;
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
