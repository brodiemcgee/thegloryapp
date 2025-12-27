// Location users drawer - shows users at a specific location

'use client';

import { Location, User, Intent } from '@/types';
import { PresenceUser } from '@/hooks/usePresence';
import { XIcon, CheckIcon } from './icons';

interface LocationUsersDrawerProps {
  location: Location;
  usersAtLocation: {
    presenceUsers: PresenceUser[];
    nearbyUsers: User[];
  };
  currentUserId?: string;
  isCurrentUserSnapped: boolean;
  onClose: () => void;
  onUserClick?: (user: User) => void;
}

// Get ring color based on user intent
const getIntentColor = (intent: Intent): string => {
  switch (intent) {
    case 'looking_now': return '#ef4444'; // Red
    case 'looking_later': return '#3b82f6'; // Blue
    case 'chatting': return '#f59e0b'; // Amber
    case 'friends': return '#22c55e'; // Green
    default: return '#3b82f6';
  }
};

const typeLabels: Record<Location['type'], string> = {
  public: 'Public',
  private: 'Private',
  cruising: 'Cruising Spot',
  venue: 'Venue',
};

export default function LocationUsersDrawer({
  location,
  usersAtLocation,
  currentUserId,
  isCurrentUserSnapped,
  onClose,
  onUserClick,
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
      <div className="absolute bottom-0 left-0 right-0 bg-hole-surface border-t border-hole-border rounded-t-2xl z-20 animate-slide-up">
        <div className="p-4">
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

        {/* Users circles */}
        <div className="px-4 pb-4">
          {totalUsers > 0 ? (
            <div className="flex flex-wrap gap-3">
              {/* Current user if snapped */}
              {isCurrentUserSnapped && (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-hole-accent/30 border-2 border-hole-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-hole-accent">You</span>
                  </div>
                </div>
              )}

              {/* Nearby users (from mock/DB data) */}
              {filteredNearbyUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onUserClick?.(user)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all group-hover:scale-110"
                      style={{ borderColor: getIntentColor(user.intent) }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-hole-border flex items-center justify-center">
                          <span className="text-lg font-medium">
                            {user.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    {user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-hole-surface" />
                    )}
                  </div>
                </button>
              ))}

              {/* Online users from presence (real-time) */}
              {presenceUsers.map((user) => (
                <button
                  key={user.user_id}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-500 transition-all group-hover:scale-110"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-hole-border flex items-center justify-center">
                          <span className="text-lg font-medium">
                            {user.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-hole-surface" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-hole-muted py-4">
              No users at this location right now
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-hole-border">
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
