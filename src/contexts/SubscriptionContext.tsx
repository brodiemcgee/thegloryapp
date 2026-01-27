// Subscription context - manages premium subscription state

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';

export type SubscriptionFeature =
  | 'ghost_mode'
  | 'who_viewed_me'
  | 'unlimited_messages'
  | 'extended_reach'
  | 'read_receipts'
  | 'advanced_filters'
  | 'visibility_controls';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
}

interface SubscriptionContextValue {
  subscription: SubscriptionState;
  isPremium: boolean;
  canAccess: (feature: SubscriptionFeature) => boolean;
  subscribe: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  // Credit balance
  creditBalance: number;  // in cents
  creditBalanceFormatted: string;  // "$4.99"
  refreshCreditBalance: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const FEATURE_ACCESS: Record<SubscriptionTier, SubscriptionFeature[]> = {
  free: [],
  premium: ['ghost_mode', 'who_viewed_me', 'unlimited_messages', 'read_receipts', 'extended_reach', 'visibility_controls'],
  premium_plus: [
    'ghost_mode',
    'who_viewed_me',
    'unlimited_messages',
    'extended_reach',
    'read_receipts',
    'advanced_filters',
    'visibility_controls',
  ],
};

// Profile reach limits per tier (how many nearby profiles you can chat with)
export const PROFILE_LIMITS: Record<SubscriptionTier, number> = {
  free: 20,
  premium: 150,
  premium_plus: 500,
};

// Daily message limits per tier
export const MESSAGE_LIMITS: Record<SubscriptionTier, number | null> = {
  free: 100,
  premium: null, // unlimited
  premium_plus: null, // unlimited
};

// Album limits per tier
export interface AlbumLimits {
  maxAlbums: number;
  maxItemsPerAlbum: number;
  videosAllowed: boolean;
  maxVideoSeconds: number;
  maxVideoSizeMB: number;
}

export const ALBUM_LIMITS: Record<SubscriptionTier, AlbumLimits> = {
  free: {
    maxAlbums: 1,
    maxItemsPerAlbum: 5,
    videosAllowed: false,
    maxVideoSeconds: 0,
    maxVideoSizeMB: 0,
  },
  premium: {
    maxAlbums: 3,
    maxItemsPerAlbum: 5,
    videosAllowed: true,
    maxVideoSeconds: 30,
    maxVideoSizeMB: 25,
  },
  premium_plus: {
    maxAlbums: 5,
    maxItemsPerAlbum: 10,
    videosAllowed: true,
    maxVideoSeconds: 30,
    maxVideoSizeMB: 25,
  },
};

// Album access duration based on RECIPIENT's tier (in milliseconds, null = never expires)
export const ALBUM_ACCESS_DURATION: Record<SubscriptionTier, number | null> = {
  free: 12 * 60 * 60 * 1000,      // 12 hours
  premium: 48 * 60 * 60 * 1000,   // 48 hours
  premium_plus: null,             // Never expires
};

const STORAGE_KEY = 'thehole_subscription';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    expiresAt: null,
    isActive: false,
  });
  const [creditBalance, setCreditBalance] = useState(0);
  const [hasBetaLifetimePremium, setHasBetaLifetimePremium] = useState(false);

  // Fetch credit balance from Supabase
  const refreshCreditBalance = useCallback(async () => {
    if (!user) {
      setCreditBalance(0);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_credit_balance', { p_user_id: user.id });
      if (!error && data !== null) {
        setCreditBalance(data);
      }
    } catch (err) {
      console.error('Error fetching credit balance:', err);
    }
  }, [user]);

  // Check for beta lifetime premium
  const checkBetaLifetimePremium = useCallback(async () => {
    if (!user) {
      setHasBetaLifetimePremium(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_beta_lifetime_premium', { p_user_id: user.id });
      if (!error && data !== null) {
        setHasBetaLifetimePremium(data);

        // If user has beta lifetime premium, set their subscription state
        if (data) {
          setSubscription({
            tier: 'premium',
            expiresAt: null, // Lifetime, no expiry
            isActive: true,
          });
        }
      }
    } catch (err) {
      console.error('Error checking beta lifetime premium:', err);
    }
  }, [user]);

  // Fetch credit balance and check beta premium when user changes
  useEffect(() => {
    refreshCreditBalance();
    checkBetaLifetimePremium();
  }, [refreshCreditBalance, checkBetaLifetimePremium]);

  // Load subscription from localStorage (only if not beta lifetime premium)
  useEffect(() => {
    // Skip localStorage loading if user has beta lifetime premium
    if (hasBetaLifetimePremium) return;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Check if subscription is still active
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
            setSubscription({ ...parsed, isActive: true });
          } else if (parsed.tier !== 'free') {
            // Expired subscription, revert to free
            setSubscription({ tier: 'free', expiresAt: null, isActive: false });
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [hasBetaLifetimePremium]);

  const isPremium = subscription.tier !== 'free' && subscription.isActive;

  const canAccess = (feature: SubscriptionFeature): boolean => {
    if (!subscription.isActive) return false;
    return FEATURE_ACCESS[subscription.tier].includes(feature);
  };

  const subscribe = async (tier: SubscriptionTier): Promise<void> => {
    // Mock subscription - in production, this would call Stripe
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    const newSubscription = {
      tier,
      expiresAt: expiresAt.toISOString(),
      isActive: tier !== 'free',
    };

    setSubscription(newSubscription);

    if (typeof window !== 'undefined') {
      if (tier === 'free') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubscription));
      }
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    setSubscription({ tier: 'free', expiresAt: null, isActive: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const creditBalanceFormatted = `$${(creditBalance / 100).toFixed(2)}`;

  const value: SubscriptionContextValue = {
    subscription,
    isPremium,
    canAccess,
    subscribe,
    cancelSubscription,
    creditBalance,
    creditBalanceFormatted,
    refreshCreditBalance,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
}
