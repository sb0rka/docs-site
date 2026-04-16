import {Head} from 'nextra/components';
import type {Metadata} from 'next';
import 'nextra-theme-docs/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sb0rka',
    template: '%s – Sb0rka',
  },
  description: 'Managed PostgreSQL and encrypted secrets',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="ltr" suppressHydrationWarning>
      <Head />
      <body>{children}</body>
    </html>
  );
}
