import type { Metadata } from 'next';
import { Outfit, Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chidiya Udd — Real-Time Reaction Game',
  description:
    'The classic Indian game reimagined as a real-time multiplayer web game. Fly or not? Decide fast!',
  keywords: ['chidiya udd', 'multiplayer game', 'reaction game', 'indian game'],
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Chidiya Udd',
    description: 'Real-time multiplayer reaction game — who flies?',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn('dark', outfit.variable, 'font-sans', geist.variable)}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="theme-color" content="#0a0e1a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${outfit.className} bg-[#0a0e1a] text-slate-100 min-h-screen bg-grid`}
      >
        {children}
      </body>
    </html>
  );
}
