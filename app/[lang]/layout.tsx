import {Layout, Navbar} from 'nextra-theme-docs';
import {getPageMap} from 'nextra/page-map';
import type {ReactNode} from 'react';

export function generateStaticParams() {
  return [{lang: 'ru'}, {lang: 'en'}];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{lang: string}>;
}) {
  const {lang} = await params;
  const navbar = (
    <Navbar
      logo={
        <img
          src="/logo.png"
          alt="Sb0rka"
          className="site-logo"
          width={120}
          height={28}
          style={{height: '28px', width: 'auto'}}
        />
      }
      projectLink="https://github.com/sb0rka/sb0rka"
      chatLink="https://sb0rka.ru"
      chatIcon={lang === 'ru' ? 'В Консоль' : 'To Console'}
    />
  );

  return (
    <Layout
      navbar={navbar}
      pageMap={await getPageMap(`/${lang}`)}
      search={null}
      docsRepositoryBase="https://github.com/sb0rka/sb0rka/tree/main/docs"
      i18n={[
        {locale: 'ru', name: 'Русский'},
        {locale: 'en', name: 'English'},
      ]}
    >
      {children}
    </Layout>
  );
}
