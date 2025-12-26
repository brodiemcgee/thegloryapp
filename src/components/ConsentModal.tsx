// NSFW consent modal shown on first visit

'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'thehole_consent_accepted';

export default function ConsentModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has been given
    const hasConsent = localStorage.getItem(CONSENT_KEY);
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Redirect to a safe page or show a message
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-hole-surface p-6 border border-hole-border">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white">
            Content Warning
          </h1>

          <div className="space-y-3 text-sm text-hole-muted">
            <p>
              This app contains sexually explicit content and is intended for adults only.
            </p>

            <p>
              By continuing, you confirm that:
            </p>

            <ul className="list-disc pl-5 space-y-1">
              <li>You are at least 18 years of age</li>
              <li>You understand this app contains explicit adult content</li>
              <li>You consent to viewing such content</li>
              <li>Viewing this content is legal in your jurisdiction</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="w-full bg-hole-accent hover:bg-hole-accent-hover text-white font-medium py-3 px-4 rounded-lg transition-colors touch-target"
          >
            I am 18+ and Accept
          </button>

          <button
            onClick={handleDecline}
            className="w-full bg-hole-bg hover:bg-hole-border text-hole-muted font-medium py-3 px-4 rounded-lg border border-hole-border transition-colors touch-target"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
