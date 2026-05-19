import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'PermitPro', template: '%s | PermitPro' },
  description: 'End-to-end permit lifecycle management for coordinators and expediters.',
  keywords: ['permit management', 'permit tracking', 'construction permits', 'permit software'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'font-sans',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
