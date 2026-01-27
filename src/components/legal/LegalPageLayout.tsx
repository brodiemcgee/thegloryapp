// Shared layout component for legal pages

'use client';

import { useRouter } from 'next/navigation';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in history, otherwise go to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-hole-bg text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-hole-bg/95 backdrop-blur border-b border-hole-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-hole-surface transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-sm text-hole-muted mb-6">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-sm max-w-none">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hole-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-hole-muted">
          <p>theglory.app</p>
        </div>
      </footer>
    </div>
  );
}
