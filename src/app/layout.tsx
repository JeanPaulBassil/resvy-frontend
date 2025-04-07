import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '@/components/providers/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const appUrl = process.env.APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    template: 'KLYO ASO | %s',
    default: 'KLYO ASO',
  },
  description: 'KLYO ASO | App Store Optimization Platform using AI insights.',
  metadataBase: new URL(appUrl),
  keywords: [
    'ASO',
    'App Store Optimization',
    'Mobile Growth',
    'App Marketing',
    'Keyword Optimization',
    'KLYO',
    'AI ASO',
  ],
  openGraph: {
    title: 'KLYO ASO - AI-Driven App Store Optimization',
    description: "Boost your app's ranking with AI-driven ASO insights.",
    url: appUrl,
    siteName: 'KLYO ASO',
    images: [
      {
        url: `${appUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'KLYO ASO AI Optimization Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: appUrl,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      type: 'image/png',
    },
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preload" as="image" href="/images/auth/loginBg.png" type="image/png" />
        <link rel="preload" as="image" href="/images/auth/signupBg.png" type="image/png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
