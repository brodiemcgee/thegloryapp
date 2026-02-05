// Blocked users screen - shows list of blocked users with unblock option

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBlock } from '@/hooks/useBlock';
import { supabase } from '@/lib/supabase';
import { ChevronLeftIcon } from './icons';

interface BlockedUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface BlockedUsersScreenProps {
  onBack: () => void;
}

export default function BlockedUsersScreen({ onBack }: BlockedUsersScreenProps) {
  const { user } = useAuth();
  const { unblockUser } = useBlock();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlockedUsers() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query blocks table and join with profiles to get user details
        const { data, error: queryError } = await supabase
          .from('blocks')
          .select(`
            blocked_id,
            profiles:blocked_id (
              id,
              username,
              avatar_url
            )
          `)
          .eq('blocker_id', user.id);

        if (queryError) throw queryError;

        // Transform the data to our BlockedUser interface
        const users: BlockedUser[] = (data || [])
          .map((block: any) => {
            const profile = block.profiles;
            if (!profile) return null;
            return {
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
            };
          })
          .filter((user): user is BlockedUser => user !== null);

        setBlockedUsers(users);
      } catch (err) {
        console.error('Error fetching blocked users:', err);
        setError('Failed to load blocked users. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchBlockedUsers();
  }, [user]);

  const handleUnblock = async (userId: string) => {
    await unblockUser(userId);
    // Remove from local state immediately for better UX
    setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-hole-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Blocked Users</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 border-4 border-hole-border border-t-hole-accent rounded-full animate-spin mb-4"></div>
            <p className="text-hole-muted">Loading blocked users...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-hole-surface rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
            <p className="text-hole-muted mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent/90"
            >
              Retry
            </button>
          </div>
        ) : blockedUsers.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-hole-surface rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No Blocked Users</h2>
            <p className="text-hole-muted">
              When you block someone, they'll appear here.
            </p>
          </div>
        ) : (
          // Blocked users list
          <div className="p-4 space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-hole-surface border border-hole-border rounded-lg"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-hole-muted">?</span>
                  )}
                </div>

                {/* Username */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.username}</p>
                  <p className="text-sm text-hole-muted">Blocked</p>
                </div>

                {/* Unblock button */}
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="px-4 py-2 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted/20"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
