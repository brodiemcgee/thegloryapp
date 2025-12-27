// Hook to track which profiles the user has unlocked (initiated chat with)
// This enforces the per-tier profile limits

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { PROFILE_LIMITS } from '@/contexts/SubscriptionContext';

const STORAGE_KEY = 'thehole_unlocked_profiles';

interface UnlockedProfilesState {
  unlockedIds: string[];
  updatedAt: string;
}

export function useUnlockedProfiles() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { subscription } = useSubscription();

  // Load unlocked profiles from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: UnlockedProfilesState = JSON.parse(stored);
          setUnlockedIds(parsed.unlockedIds || []);
        } catch {
          // Invalid JSON, start fresh
          setUnlockedIds([]);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when unlocked profiles change
  const saveToStorage = useCallback((ids: string[]) => {
    if (typeof window !== 'undefined') {
      const state: UnlockedProfilesState = {
        unlockedIds: ids,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, []);

  // Get the profile limit for current subscription tier
  const profileLimit = PROFILE_LIMITS[subscription.tier];

  // Check if a profile is already unlocked
  const isUnlocked = useCallback((userId: string): boolean => {
    return unlockedIds.includes(userId);
  }, [unlockedIds]);

  // Check if user can unlock more profiles
  const canUnlockMore = useCallback((): boolean => {
    return unlockedIds.length < profileLimit;
  }, [unlockedIds.length, profileLimit]);

  // Get remaining unlock slots
  const remainingSlots = profileLimit - unlockedIds.length;

  // Unlock a profile (returns true if successful, false if at limit)
  const unlockProfile = useCallback((userId: string): boolean => {
    // Already unlocked
    if (unlockedIds.includes(userId)) {
      return true;
    }

    // Check if at limit
    if (unlockedIds.length >= profileLimit) {
      return false;
    }

    // Unlock the profile
    const newIds = [...unlockedIds, userId];
    setUnlockedIds(newIds);
    saveToStorage(newIds);
    return true;
  }, [unlockedIds, profileLimit, saveToStorage]);

  // Check if can message a user (unlocked or has capacity)
  const canMessageUser = useCallback((userId: string): { allowed: boolean; reason?: 'unlocked' | 'has_capacity' | 'at_limit' } => {
    if (unlockedIds.includes(userId)) {
      return { allowed: true, reason: 'unlocked' };
    }
    if (unlockedIds.length < profileLimit) {
      return { allowed: true, reason: 'has_capacity' };
    }
    return { allowed: false, reason: 'at_limit' };
  }, [unlockedIds, profileLimit]);

  return {
    unlockedIds,
    unlockedCount: unlockedIds.length,
    profileLimit,
    remainingSlots,
    isLoaded,
    isUnlocked,
    canUnlockMore,
    unlockProfile,
    canMessageUser,
    tier: subscription.tier,
  };
}
