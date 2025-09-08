import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './providers-simple';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Resume Customizer Pro',
  description:
    'A high-performance resume customization platform for bulk processing, tech stack injection, and automated email sending.',
  keywords: [
    'resume',
    'customization',
    'bulk processing',
    'tech stack',
    'email',
  ],
  authors: [{ name: 'Resume Customizer Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Resume Customizer Pro',
    description:
      'A high-performance resume customization platform for bulk processing, tech stack injection, and automated email sending.',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
