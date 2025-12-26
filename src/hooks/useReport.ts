// Report submission hook - handles submitting reports

'use client';

import { useState } from 'react';
import { ReportReason, TargetType } from '@/components/ReportModal';

export function useReport() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (
    targetId: string,
    targetType: TargetType,
    reason: ReportReason,
    details: string
  ) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Replace with actual API call to Supabase
      // For now, just simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Log to console for now
      console.log('Report submitted:', {
        targetId,
        targetType,
        reason,
        details,
        timestamp: new Date().toISOString(),
      });

      setSuccess(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit report');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  };

  return {
    submitReport,
    submitting,
    success,
    error,
    reset,
  };
}
