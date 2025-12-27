// Location users drawer - shows users at a specific location

'use client';

import { Location, User } from '@/types';
import { PresenceUser } from '@/hooks/usePresence';
import { XIcon, CheckIcon, ChevronLeftIcon } from './icons';

interface LocationUsersDrawerProps {
  location: Location;
  usersAtLocation: {
    presenceUsers: PresenceUser[];
    nearbyUsers: User[];
  };
  currentUserId?: string;
  isCurrentUserSnapped: boolean;
  onClose: () => void;
}

const typeLabels: Record<Location['type'], string> = {
  public: 'Public',
  private: 'Private',
  cruising: 'Cruising Spot',
  venue: 'Venue',
};

const intentLabels: Record<string, string> = {
  looking_now: 'Looking Now',
  looking_later: 'Looking Later',
  chatting: 'Chatting',
  friends: 'Friends',
};

const intentColors: Record<string, string> = {
  looking_now: 'text-red-400',
  looking_later: 'text-blue-400',
  chatting: 'text-amber-400',
  friends: 'text-green-400',
};

export default function LocationUsersDrawer({
  location,
  usersAtLocation,
  currentUserId,
  isCurrentUserSnapped,
  onClose,
}: LocationUsersDrawerProps) {
  const { presenceUsers, nearbyUsers } = usersAtLocation;
  // Filter out current user from nearby users if they're snapped (we show them separately)
  const filteredNearbyUsers = nearbyUsers.filter(u => u.id !== currentUserId);
  const totalUsers = presenceUsers.length + filteredNearbyUsers.length + (isCurrentUserSnapped ? 1 : 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 z-10"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-hole-surface border-t border-hole-border rounded-t-2xl z-20 animate-slide-up max-h-[70vh] flex flex-col">
        <div className="p-4 flex-shrink-0">
          {/* Handle */}
          <div className="w-10 h-1 bg-hole-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {location.name}
                {location.is_verified && (
                  <CheckIcon className="w-4 h-4 text-blue-500" />
                )}
              </h3>
              <p className="text-sm text-hole-muted">{typeLabels[location.type]}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hole-border rounded-full transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User count */}
          <div className="text-sm text-hole-muted mb-3">
            {totalUsers} {totalUsers === 1 ? 'user' : 'users'} here
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {/* Current user if snapped */}
            {isCurrentUserSnapped && (
              <div className="flex items-center gap-3 p-3 bg-hole-accent/20 border border-hole-accent/30 rounded-lg">
                <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">You</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">You are here</div>
                  <div className="text-xs text-hole-muted">Your location is visible to others</div>
                </div>
              </div>
            )}

            {/* Nearby users (from mock/DB data) */}
            {filteredNearbyUsers.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 p-3 bg-hole-bg rounded-lg transition-colors hover:bg-hole-border"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {user.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  {user.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-hole-bg" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-white truncate">{user.username}</div>
                  <div className={`text-xs ${intentColors[user.intent] || 'text-hole-muted'}`}>
                    {intentLabels[user.intent] || 'Chatting'}
                  </div>
                </div>
                <ChevronLeftIcon className="w-4 h-4 text-hole-muted rotate-180" />
              </button>
            ))}

            {/* Online users from presence (real-time) */}
            {presenceUsers.map((user) => (
              <button
                key={user.user_id}
                className="w-full flex items-center gap-3 p-3 bg-hole-bg rounded-lg transition-colors hover:bg-hole-border"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {user.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-hole-bg" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-white truncate">{user.username}</div>
                  <div className={`text-xs ${intentColors[user.intent || 'chatting'] || 'text-hole-muted'}`}>
                    {intentLabels[user.intent || 'chatting'] || 'Chatting'}
                  </div>
                </div>
                <ChevronLeftIcon className="w-4 h-4 text-hole-muted rotate-180" />
              </button>
            ))}

            {/* Empty state */}
            {totalUsers === 0 && (
              <div className="text-center text-sm text-hole-muted py-6">
                No users at this location right now
              </div>
            )}
          </div>
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-hole-border flex-shrink-0">
          <button className="w-full py-3 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted">
            Get Directions
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 200ms ease-out;
        }
      `}</style>
    </>
  );
}
