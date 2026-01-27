'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface BetaTesterStatus {
  id: string;
  status: 'active' | 'completed' | 'dropped';
  startDate: string;
  weeksCompleted: number;
  lifetimePremiumGranted: boolean;
  currentWeek: number;
  currentWeekProgress: {
    messagesSent: number;
    profilesViewed: number;
    photosUploaded: number;
    activityScore: number;
    meetsRequirement: boolean;
  } | null;
}

export function useBetaTester() {
  const { user } = useAuth();
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [betaStatus, setBetaStatus] = useState<BetaTesterStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch beta tester status
  const refreshStatus = useCallback(async () => {
    if (!user) {
      setIsBetaTester(false);
      setBetaStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get beta tester record
      const { data: tester, error: testerError } = await supabase
        .from('beta_testers')
        .select(`
          id,
          status,
          start_date,
          weeks_completed,
          lifetime_premium_granted,
          activity_logs:beta_activity_logs(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (testerError || !tester) {
        setIsBetaTester(false);
        setBetaStatus(null);
        setIsLoading(false);
        return;
      }

      setIsBetaTester(true);

      // Calculate current week
      const startDate = new Date(tester.start_date);
      const now = new Date();
      const weeksSinceStart = Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = Math.max(1, Math.min(10, weeksSinceStart));

      // Find current week's activity
      const currentWeekLog = tester.activity_logs?.find(
        (log: { week_number: number }) => log.week_number === currentWeek
      );

      setBetaStatus({
        id: tester.id,
        status: tester.status,
        startDate: tester.start_date,
        weeksCompleted: tester.weeks_completed,
        lifetimePremiumGranted: tester.lifetime_premium_granted,
        currentWeek,
        currentWeekProgress: currentWeekLog ? {
          messagesSent: currentWeekLog.messages_sent,
          profilesViewed: currentWeekLog.profiles_viewed,
          photosUploaded: currentWeekLog.photos_uploaded,
          activityScore: currentWeekLog.activity_score,
          meetsRequirement: currentWeekLog.meets_requirement,
        } : null,
      });
    } catch (err) {
      console.error('Error fetching beta tester status:', err);
      setIsBetaTester(false);
      setBetaStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Submit feedback
  const submitFeedback = useCallback(async (
    type: 'bug' | 'feedback' | 'suggestion',
    title: string,
    description: string,
    screenshotUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!betaStatus) {
      return { success: false, error: 'Not a beta tester' };
    }

    try {
      const { error } = await supabase
        .from('beta_feedback')
        .insert({
          tester_id: betaStatus.id,
          type,
          title,
          description,
          screenshot_url: screenshotUrl || null,
        });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      return { success: false, error: message };
    }
  }, [betaStatus]);

  // Get user's feedback history
  const getFeedbackHistory = useCallback(async () => {
    if (!betaStatus) return [];

    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .eq('tester_id', betaStatus.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch {
      return [];
    }
  }, [betaStatus]);

  return {
    isBetaTester,
    betaStatus,
    isLoading,
    refreshStatus,
    submitFeedback,
    getFeedbackHistory,
  };
}
