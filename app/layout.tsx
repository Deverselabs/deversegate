import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeverseGate - Crypto Invoice Platform',
  description: 'Professional crypto invoicing with AI-powered monitoring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={plusJakarta.className}>
          <Providers>
            {children}
          </Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}