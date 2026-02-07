import type { Metadata } from 'next';
import './globals.css';

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
      <body className='antialiased'>{children}</body>
    </html>
  );
}
