'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './useAdminAuth';

export interface BetaSettings {
  maxTesters: number;
  isOpen: boolean;
}

export interface BetaInvitation {
  id: string;
  code: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string | null;
  accepted_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by_profile?: {
    username: string;
  };
  accepted_by_profile?: {
    username: string;
  };
}

export interface BetaTester {
  id: string;
  user_id: string;
  invitation_id: string | null;
  status: 'active' | 'completed' | 'dropped';
  start_date: string;
  weeks_completed: number;
  lifetime_premium_granted: boolean;
  granted_at: string | null;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  activity_logs?: BetaActivityLog[];
}

export interface BetaActivityLog {
  id: string;
  tester_id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  messages_sent: number;
  profiles_viewed: number;
  photos_uploaded: number;
  activity_score: number;
  meets_requirement: boolean;
  created_at: string;
}

export interface BetaFeedback {
  id: string;
  tester_id: string;
  type: 'bug' | 'feedback' | 'suggestion';
  title: string;
  description: string;
  screenshot_url: string | null;
  status: 'open' | 'reviewed' | 'resolved';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  tester?: {
    profile?: {
      username: string;
    };
  };
}

export function useBetaAdmin() {
  const { adminRoleId, adminProfile } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch beta settings
  const fetchSettings = useCallback(async (): Promise<BetaSettings | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('beta_settings')
        .select('max_testers, is_open')
        .eq('id', 1)
        .single();

      if (fetchError) throw fetchError;

      return {
        maxTesters: data?.max_testers || 50,
        isOpen: data?.is_open ?? true,
      };
    } catch (err) {
      console.error('Error fetching settings:', err);
      return null;
    }
  }, []);

  // Update beta settings
  const updateSettings = useCallback(async (maxTesters: number, isOpen: boolean): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .rpc('update_beta_settings', {
          p_max_testers: maxTesters,
          p_is_open: isOpen,
        });

      if (updateError) throw updateError;

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to update settings');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all beta invitations
  const fetchInvitations = useCallback(async (): Promise<BetaInvitation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('beta_invitations')
        .select(`
          *,
          invited_by_profile:admin_roles!beta_invitations_invited_by_fkey(
            profile:profiles(username)
          ),
          accepted_by_profile:profiles!beta_invitations_accepted_by_fkey(username)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the nested data
      return (data || []).map(inv => ({
        ...inv,
        invited_by_profile: inv.invited_by_profile?.profile || undefined,
        accepted_by_profile: inv.accepted_by_profile || undefined,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invitations';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all beta testers with their activity
  const fetchTesters = useCallback(async (): Promise<BetaTester[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('beta_testers')
        .select(`
          *,
          profile:profiles(username, avatar_url),
          activity_logs:beta_activity_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch testers';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all feedback
  const fetchFeedback = useCallback(async (): Promise<BetaFeedback[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('beta_feedback')
        .select(`
          *,
          tester:beta_testers(
            profile:profiles(username)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch feedback';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a beta invitation
  const sendInvitation = useCallback(async (email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    if (!adminRoleId) {
      return { success: false, error: 'Not authenticated as admin' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate invite code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_beta_invite_code');

      if (codeError) throw codeError;

      const code = codeData as string;

      // Create invitation record
      const { error: insertError } = await supabase
        .from('beta_invitations')
        .insert({
          code,
          email: email.toLowerCase().trim(),
          invited_by: adminRoleId,
        });

      if (insertError) throw insertError;

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-beta-invite', {
        body: {
          email: email.toLowerCase().trim(),
          code,
          invitedBy: adminProfile?.username,
        },
      });

      if (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the whole operation if email fails
        // The invitation is still created
      }

      return { success: true, code };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [adminRoleId, adminProfile]);

  // Revoke an invitation
  const revokeInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('beta_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke invitation';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Resend invitation email
  const resendInvitation = useCallback(async (invitation: BetaInvitation): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: emailError } = await supabase.functions.invoke('send-beta-invite', {
        body: {
          email: invitation.email,
          code: invitation.code,
          invitedBy: adminProfile?.username,
        },
      });

      if (emailError) throw emailError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [adminProfile]);

  // Grant lifetime premium to a tester
  const grantPremium = useCallback(async (testerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: grantError } = await supabase
        .rpc('grant_beta_lifetime_premium', { p_tester_id: testerId });

      if (grantError) throw grantError;

      if (!data) {
        throw new Error('Tester has not completed all requirements');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to grant premium';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark tester as dropped
  const dropTester = useCallback(async (testerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('beta_testers')
        .update({ status: 'dropped' })
        .eq('id', testerId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to drop tester';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update feedback status
  const updateFeedbackStatus = useCallback(async (
    feedbackId: string,
    status: 'reviewed' | 'resolved',
    notes?: string
  ): Promise<boolean> => {
    if (!adminRoleId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = { status };

      if (notes) {
        updates.admin_notes = notes;
      }

      if (status === 'resolved') {
        updates.resolved_by = adminRoleId;
        updates.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('beta_feedback')
        .update(updates)
        .eq('id', feedbackId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feedback';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [adminRoleId]);

  // Get stats
  const getStats = useCallback(async () => {
    try {
      const [
        { count: pendingInvites },
        { count: activeTesters },
        { count: completedTesters },
        { count: openFeedback },
      ] = await Promise.all([
        supabase.from('beta_invitations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('beta_testers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('beta_testers').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('beta_feedback').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);

      return {
        pendingInvites: pendingInvites || 0,
        activeTesters: activeTesters || 0,
        completedTesters: completedTesters || 0,
        openFeedback: openFeedback || 0,
      };
    } catch {
      return {
        pendingInvites: 0,
        activeTesters: 0,
        completedTesters: 0,
        openFeedback: 0,
      };
    }
  }, []);

  return {
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    fetchInvitations,
    fetchTesters,
    fetchFeedback,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
    grantPremium,
    dropTester,
    updateFeedbackStatus,
    getStats,
  };
}
