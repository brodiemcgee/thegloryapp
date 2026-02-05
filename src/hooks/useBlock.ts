// Block management hook - handles blocking/unblocking users

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export function useBlock() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load blocked users from Supabase on mount
  useEffect(() => {
    async function fetchBlockedUsers() {
      if (!user) {
        setBlockedUsers([]);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);

        if (error) throw error;

        const blockedIds = (data || []).map((block) => block.blocked_id);
        setBlockedUsers(blockedIds);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching blocked users:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBlockedUsers();
  }, [user]);

  const blockUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (error) throw error;

      // Update local state
      setBlockedUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error blocking user:', err);
      }
      throw err;
    }
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) throw error;

      // Update local state
      setBlockedUsers((prev) => prev.filter((id) => id !== userId));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error unblocking user:', err);
      }
      throw err;
    }
  };

  const isBlocked = (userId: string): boolean => {
    return blockedUsers.includes(userId);
  };

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
    loading,
  };
}
