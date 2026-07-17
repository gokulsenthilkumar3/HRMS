import type { Metadata } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Shell from '../components/Shell';
import FloatingAssistant from '../components/FloatingAssistant';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HRMS | Human Resource Management System',
  description: 'Enterprise-grade HR platform — Employees, Payroll, Attendance, Recruitment & more',
  keywords: ['HRMS', 'HR software', 'payroll', 'attendance', 'employee management'],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
        <AuthProvider>
          <Shell>{children}</Shell>
          <FloatingAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
