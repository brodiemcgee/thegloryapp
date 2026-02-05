// Beta page layout with Open Graph metadata for rich social previews
// The opengraph-image.tsx file in this folder auto-generates the preview image

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the GLORY Beta | Get Lifetime Premium Free',
  description: 'Be one of the first to try GLORY. Join our exclusive beta program and get lifetime premium access for free. Limited spots available.',

  // Open Graph - for Facebook, LinkedIn, iMessage, etc.
  // Images are auto-generated from opengraph-image.tsx
  openGraph: {
    title: 'Join the GLORY Beta',
    description: 'Get lifetime premium free. Limited spots available.',
    url: 'https://theglory.app/beta',
    siteName: 'GLORY',
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter Card
  // Images are auto-generated from opengraph-image.tsx
  twitter: {
    card: 'summary_large_image',
    title: 'Join the GLORY Beta',
    description: 'Get lifetime premium free. Limited spots available.',
  },

  // Additional meta
  keywords: ['GLORY', 'beta', 'cruising app', 'gay app', 'hookup', 'dating'],
  authors: [{ name: 'GLORY' }],

  // Prevents indexing beta page (optional - remove if you want it indexed)
  robots: {
    index: false,
    follow: false,
  },
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
