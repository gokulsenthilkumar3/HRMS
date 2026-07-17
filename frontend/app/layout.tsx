import type { Metadata } from 'next';
import { Sora, Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const sora  = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = { title: 'HRMS — People Operations Platform', description: 'Modern HR management system' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
