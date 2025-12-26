// Root layout - wraps all pages with providers and navigation

import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthProvider from '@/components/auth/AuthProvider';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

export const metadata: Metadata = {
  title: 'thehole.app',
  description: 'Real-time cruising app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'thehole',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-hole-bg text-white antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
