// Message bubble for shared albums in chat

'use client';

import { useState } from 'react';
import { AlbumIcon, LockIcon, ClockIcon } from '@/components/icons';
import { useAlbumViewer } from '@/hooks/useAlbumAccess';
import AlbumViewerModal from './AlbumViewerModal';
import type { AlbumShareMessage } from '@/types';

interface AlbumShareBubbleProps {
  albumShare: AlbumShareMessage;
  isMine: boolean;
  timestamp: string;
  isRead?: boolean;
}

export default function AlbumShareBubble({
  albumShare,
  isMine,
  timestamp,
  isRead,
}: AlbumShareBubbleProps) {
  const [showViewer, setShowViewer] = useState(false);
  const { album, items, accessInfo, loading, error, timeRemaining, isExpired, isOwner } = useAlbumViewer(albumShare.album_id);

  const canView = isOwner || (!isExpired && !accessInfo?.is_locked);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const handleClick = () => {
    if (canView) {
      setShowViewer(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!canView}
        className={`w-full max-w-[280px] rounded-2xl overflow-hidden ${
          isMine
            ? 'bg-hole-accent rounded-br-md'
            : 'bg-hole-surface rounded-bl-md'
        } ${canView ? 'cursor-pointer hover:opacity-90 transition-opacity' : 'cursor-not-allowed opacity-75'}`}
      >
        {/* Preview image */}
        <div className="relative aspect-[4/3] bg-hole-bg">
          {albumShare.preview_url ? (
            <img
              src={albumShare.preview_url}
              alt={albumShare.album_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AlbumIcon className="w-12 h-12 text-hole-muted" />
            </div>
          )}

          {/* Overlay for locked/expired */}
          {!canView && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <LockIcon className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-sm">
                {isExpired ? 'Access Expired' : 'Locked'}
              </span>
            </div>
          )}

          {/* Time remaining badge */}
          {canView && timeRemaining && timeRemaining > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
              <ClockIcon className="w-3 h-3" />
              <span>{formatTimeRemaining()}</span>
            </div>
          )}

          {/* Item count badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {albumShare.item_count} {albumShare.item_count === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 text-left">
          <p className={`font-medium truncate ${isMine ? 'text-white' : 'text-white'}`}>
            {albumShare.album_name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${isMine ? 'text-red-200' : 'text-hole-muted'}`}>
              {isMine ? 'Album shared' : 'Tap to view'}
            </p>
            <p className={`text-xs ${isMine ? 'text-red-200' : 'text-hole-muted'}`}>
              {formatTime(timestamp)}
              {isMine && isRead && <span className="ml-1">✓✓</span>}
            </p>
          </div>
        </div>
      </button>

      {/* Viewer modal */}
      {showViewer && (
        <AlbumViewerModal
          albumId={albumShare.album_id}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
