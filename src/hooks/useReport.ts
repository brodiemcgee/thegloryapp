// Report submission hook - handles submitting reports

'use client';

import { useState } from 'react';
import { ReportReason, TargetType } from '@/components/ReportModal';
import { supabase, getCurrentUser } from '@/lib/supabase';

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
      // Get current authenticated user
      const { user, error: authError } = await getCurrentUser();

      if (authError || !user) {
        throw new Error('You must be logged in to submit a report');
      }

      // Note: The reports table currently only supports reporting users (reported_id references profiles)
      // Location reports will need schema update to add a separate reported_location_id column
      if (targetType === 'location') {
        throw new Error('Location reporting is not yet supported');
      }

      // Insert report into Supabase
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: targetId,
          reason: reason,
          details: details || null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

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
