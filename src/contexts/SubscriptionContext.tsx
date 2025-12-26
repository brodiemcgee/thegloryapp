// Subscription context - manages premium subscription state

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';

export type SubscriptionFeature =
  | 'ghost_mode'
  | 'who_viewed_me'
  | 'unlimited_messages'
  | 'priority_placement'
  | 'read_receipts'
  | 'advanced_filters';

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
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

const FEATURE_ACCESS: Record<SubscriptionTier, SubscriptionFeature[]> = {
  free: [],
  premium: ['ghost_mode', 'who_viewed_me', 'unlimited_messages', 'read_receipts'],
  premium_plus: [
    'ghost_mode',
    'who_viewed_me',
    'unlimited_messages',
    'priority_placement',
    'read_receipts',
    'advanced_filters',
  ],
};

const STORAGE_KEY = 'thehole_subscription';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    expiresAt: null,
    isActive: false,
  });

  // Load subscription from localStorage
  useEffect(() => {
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
  }, []);

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

  const value: SubscriptionContextValue = {
    subscription,
    isPremium,
    canAccess,
    subscribe,
    cancelSubscription,
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
