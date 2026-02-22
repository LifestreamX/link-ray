import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LinkRay - AI Link Pre-screener',
  description:
    'Know before you visit. AI-powered link analysis with safety scoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='dark'>
      <head>
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <link rel='alternate icon' href='/favicon.ico' />
      </head>
      <body className='antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
