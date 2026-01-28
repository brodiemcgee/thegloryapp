'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import { useBetaTester } from '@/hooks/useBetaTester';
import BetaFeedbackForm from './BetaFeedbackForm';

export default function BetaFeedbackButton() {
  const { isBetaTester, betaStatus } = useBetaTester();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Only show for active beta testers
  if (!isBetaTester || betaStatus?.status !== 'active') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-20 left-4 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg flex items-center justify-center text-white transition-colors z-40"
        aria-label="Submit feedback"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Feedback Form Modal */}
      <BetaFeedbackForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}
