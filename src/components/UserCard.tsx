// User card component for grid and list views

'use client';

import { User } from '@/types';
import { CheckIcon, LookingIcon, HostingIcon, TravelingIcon } from './icons';

interface UserCardProps {
  user: User;
  variant: 'grid' | 'list';
  onClick: () => void;
}

const intentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  looking: LookingIcon,
  hosting: HostingIcon,
  traveling: TravelingIcon,
  discrete: LookingIcon,
};

const intentColors: Record<string, string> = {
  looking: 'text-green-500',
  hosting: 'text-blue-500',
  traveling: 'text-yellow-500',
  discrete: 'text-gray-500',
};

export default function UserCard({ user, variant, onClick }: UserCardProps) {
  const IntentIcon = intentIcons[user.intent] || LookingIcon;
  const intentColor = intentColors[user.intent] || 'text-gray-500';

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  if (variant === 'list') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-hole-surface rounded-lg w-full text-left transition-colors hover:bg-hole-border"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center">
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
          {user.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-hole-surface" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{user.display_name || user.username}</span>
            {user.is_verified && <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-hole-muted">
            <IntentIcon className={`w-3 h-3 ${intentColor}`} />
            <span className="capitalize">{user.intent}</span>
            {user.distance_km && <span>· {formatDistance(user.distance_km)}</span>}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-[3/4] bg-hole-surface rounded-lg overflow-hidden transition-transform active:scale-95"
    >
      {/* Image */}
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-hole-border">
          <span className="text-4xl text-hole-muted">?</span>
        </div>
      )}

      {/* Top badges */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        {/* Verified badge */}
        {user.is_verified && (
          <div className="bg-blue-500 rounded-full p-1">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
        )}
        {/* Online indicator */}
        {user.is_online && (
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white/50 ml-auto" />
        )}
      </div>

      {/* Bottom gradient overlay with distance and name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-8">
        <div className="min-w-0">
          {user.distance_km !== undefined && (
            <span className="text-xs text-white/70 drop-shadow-md block">
              {formatDistance(user.distance_km)}
            </span>
          )}
          <span className="font-semibold text-sm text-white truncate block drop-shadow-md">
            {user.display_name || user.username}
          </span>
        </div>
      </div>
    </button>
  );
}
