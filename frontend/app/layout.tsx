import type { Metadata } from 'next';
import { Inter, Outfit, Fira_Code } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Shell from '../components/Shell';
import FloatingAssistant from '../components/FloatingAssistant';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
  title: 'VaultIQ | Enterprise Operations',
  description: 'AI-Powered Cyber-Physical Office Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${firaCode.variable}`}>
        <AuthProvider>
          <Shell>{children}</Shell>
          <FloatingAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
