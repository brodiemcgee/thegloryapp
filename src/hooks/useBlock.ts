// Block management hook - handles blocking/unblocking users

'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'blocked_users';

export function useBlock() {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Load blocked users from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBlockedUsers(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse blocked users:', e);
      }
    }
  }, []);

  // Save to localStorage whenever blockedUsers changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  const blockUser = (userId: string) => {
    setBlockedUsers((prev) => {
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });
  };

  const unblockUser = (userId: string) => {
    setBlockedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const isBlocked = (userId: string): boolean => {
    return blockedUsers.includes(userId);
  };

  return {
    blockedUsers,
    blockUser,
    unblockUser,
    isBlocked,
  };
}
