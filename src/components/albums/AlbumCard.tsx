// Single album preview card

'use client';

import { Album } from '@/types';
import { AlbumIcon, VideoIcon, LockIcon } from '@/components/icons';

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
  showItemCount?: boolean;
  isLocked?: boolean;
  expiresAt?: string | null;
}

export default function AlbumCard({
  album,
  onClick,
  showItemCount = true,
  isLocked = false,
  expiresAt,
}: AlbumCardProps) {
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const locked = isLocked || isExpired;

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!expiresAt) return null;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const timeRemaining = formatTimeRemaining();

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative w-full aspect-square rounded-lg overflow-hidden border transition-all ${
        locked
          ? 'border-hole-border opacity-50 cursor-not-allowed'
          : 'border-hole-border hover:border-hole-accent active:scale-95'
      }`}
    >
      {/* Cover image or placeholder */}
      {album.cover_url ? (
        <img
          src={album.cover_url}
          alt={album.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-hole-surface flex items-center justify-center">
          <AlbumIcon className="w-12 h-12 text-hole-muted" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <LockIcon className="w-8 h-8 text-white" />
        </div>
      )}

      {/* Info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-sm font-medium truncate">{album.name}</p>
        <div className="flex items-center justify-between">
          {showItemCount && (
            <p className="text-hole-muted text-xs">
              {album.item_count} {album.item_count === 1 ? 'item' : 'items'}
            </p>
          )}
          {timeRemaining && (
            <p className={`text-xs ${isExpired ? 'text-hole-accent' : 'text-hole-muted'}`}>
              {timeRemaining}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
