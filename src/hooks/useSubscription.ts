// Subscription hook - convenient access to subscription context

'use client';

import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

export function useSubscription() {
  return useSubscriptionContext();
}
