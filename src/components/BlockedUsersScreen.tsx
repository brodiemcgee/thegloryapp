// Blocked users screen - shows list of blocked users with unblock option

'use client';

import { useBlock } from '@/hooks/useBlock';
import { ChevronLeftIcon } from './icons';

interface BlockedUsersScreenProps {
  onBack: () => void;
}

export default function BlockedUsersScreen({ onBack }: BlockedUsersScreenProps) {
  const { blockedUsers, unblockUser } = useBlock();

  // TODO: Replace with actual user data fetching
  // For now, using mock data structure
  const getBlockedUserData = (userId: string) => ({
    id: userId,
    username: `User ${userId.substring(0, 8)}`,
    avatar_url: null,
  });

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
        {blockedUsers.length === 0 ? (
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
            {blockedUsers.map((userId) => {
              const user = getBlockedUserData(userId);
              return (
                <div
                  key={userId}
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
                    onClick={() => unblockUser(userId)}
                    className="px-4 py-2 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted/20"
                  >
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
