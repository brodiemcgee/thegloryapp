// Hook for managing referral data and operations

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Referral {
  id: string;
  referred_id: string;
  referred_username: string;
  created_at: string;
  subscription_status: 'free' | 'active' | 'cancelled' | null;
  subscription_tier: 'free' | 'premium' | 'premium_plus' | null;
  total_earned_cents: number;
}

interface CreditTransaction {
  id: string;
  amount_cents: number;
  transaction_type: 'referral_earning' | 'subscription_payment' | 'manual_adjustment';
  description: string | null;
  created_at: string;
}

interface UseReferralReturn {
  // User's referral code/link
  referralCode: string | null;
  referralLink: string;

  // Credit balance
  creditBalance: number;  // in cents
  creditBalanceFormatted: string;  // "$4.99"

  // Referrals made by this user
  referrals: Referral[];
  activeReferralsCount: number;
  totalEarned: number;  // in cents
  totalEarnedFormatted: string;

  // Transaction history
  transactions: CreditTransaction[];

  // Loading states
  loading: boolean;

  // Actions
  copyReferralLink: () => Promise<boolean>;
  shareReferralLink: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://thehole.app';

export function useReferral(): UseReferralReturn {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all referral data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch referral code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .single();

      if (codeData) {
        setReferralCode(codeData.code);
      }

      // Fetch credit balance using RPC
      const { data: balanceData } = await supabase
        .rpc('get_credit_balance', { p_user_id: user.id });

      setCreditBalance(balanceData || 0);

      // Fetch referrals with referred user details
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          created_at,
          referred:profiles!referrals_referred_id_fkey(username),
          subscription:subscriptions!subscriptions_user_id_fkey(status, tier)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        // Get total earned per referral
        const { data: earningsData } = await supabase
          .from('credit_transactions')
          .select('referral_id, amount_cents')
          .eq('user_id', user.id)
          .eq('transaction_type', 'referral_earning');

        const earningsByReferral: Record<string, number> = {};
        earningsData?.forEach((e) => {
          if (e.referral_id) {
            earningsByReferral[e.referral_id] = (earningsByReferral[e.referral_id] || 0) + e.amount_cents;
          }
        });

        const mappedReferrals: Referral[] = referralsData.map((r) => {
          // Handle Supabase joins which can be object or array
          const referred = r.referred as unknown as { username: string } | { username: string }[] | null;
          const subscription = r.subscription as unknown as { status: string; tier: string } | { status: string; tier: string }[] | null;

          // Extract values from potential array or object
          const referredObj = Array.isArray(referred) ? referred[0] : referred;
          const subscriptionObj = Array.isArray(subscription) ? subscription[0] : subscription;

          return {
            id: r.id,
            referred_id: r.referred_id,
            referred_username: referredObj?.username || 'Unknown',
            created_at: r.created_at,
            subscription_status: (subscriptionObj?.status as Referral['subscription_status']) || null,
            subscription_tier: (subscriptionObj?.tier as Referral['subscription_tier']) || null,
            total_earned_cents: earningsByReferral[r.id] || 0,
          };
        });

        setReferrals(mappedReferrals);
      }

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('id, amount_cents, transaction_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsData) {
        setTransactions(transactionsData as CreditTransaction[]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching referral data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed values
  const referralLink = referralCode ? `${APP_URL}/?ref=${referralCode}` : '';

  const creditBalanceFormatted = `$${(creditBalance / 100).toFixed(2)}`;

  const activeReferralsCount = referrals.filter(
    (r) => r.subscription_status === 'active' && r.subscription_tier !== 'free'
  ).length;

  const totalEarned = transactions
    .filter((t) => t.transaction_type === 'referral_earning')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalEarnedFormatted = `$${(totalEarned / 100).toFixed(2)}`;

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    if (!referralLink) return false;

    try {
      await navigator.clipboard.writeText(referralLink);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }, [referralLink]);

  // Share referral link using Web Share API
  const shareReferralLink = useCallback(async (): Promise<boolean> => {
    if (!referralLink) return false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on The Hole',
          text: 'Check out this app!',
          url: referralLink,
        });
        return true;
      } catch {
        // User cancelled or error
        return false;
      }
    } else {
      // Fall back to copy
      return copyReferralLink();
    }
  }, [referralLink, copyReferralLink]);

  return {
    referralCode,
    referralLink,
    creditBalance,
    creditBalanceFormatted,
    referrals,
    activeReferralsCount,
    totalEarned,
    totalEarnedFormatted,
    transactions,
    loading,
    copyReferralLink,
    shareReferralLink,
    refreshData: fetchData,
  };
}
