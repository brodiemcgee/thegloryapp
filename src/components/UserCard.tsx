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
            <span className="font-medium truncate">{user.username}</span>
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
      className="flex flex-col bg-hole-surface rounded-lg overflow-hidden transition-transform active:scale-95"
    >
      {/* Image */}
      <div className="relative aspect-square bg-hole-border">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-hole-muted">?</span>
          </div>
        )}
        {/* Online indicator */}
        {user.is_online && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-hole-surface" />
        )}
        {/* Intent badge */}
        <div className={`absolute bottom-2 left-2 p-1.5 bg-black/60 rounded-full ${intentColor}`}>
          <IntentIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm truncate">{user.username}</span>
          {user.is_verified && <CheckIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-hole-muted">
          {formatDistance(user.distance_km)}
        </p>
      </div>
    </button>
  );
}
