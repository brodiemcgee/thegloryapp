// Full-screen album viewer with swipe navigation

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, ClockIcon, LockIcon } from '@/components/icons';
import { useAlbumViewer } from '@/hooks/useAlbumAccess';
import type { AlbumItem } from '@/types';

interface AlbumViewerModalProps {
  albumId: string;
  onClose: () => void;
  initialIndex?: number;
}

export default function AlbumViewerModal({
  albumId,
  onClose,
  initialIndex = 0,
}: AlbumViewerModalProps) {
  const { album, items, loading, error, timeRemaining, isExpired, isOwner } = useAlbumViewer(albumId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = items[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, items.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:text-hole-accent transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <LockIcon className="w-16 h-16 text-hole-muted mb-4" />
        <h2 className="text-xl text-white mb-2">Access Expired</h2>
        <p className="text-hole-muted text-center">
          {error || 'Your access to this album has expired. Ask the owner to share again.'}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:text-hole-accent transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <p className="text-hole-muted">This album is empty</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex-1">
          <h2 className="text-white font-medium">{album?.name}</h2>
          <p className="text-hole-muted text-sm">
            {currentIndex + 1} of {items.length}
          </p>
        </div>

        {/* Time remaining */}
        {!isOwner && timeRemaining && (
          <div className="flex items-center gap-1 text-yellow-400 text-sm mr-4">
            <ClockIcon className="w-4 h-4" />
            <span>{formatTimeRemaining()}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="p-2 text-white hover:text-hole-accent transition-colors"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous button */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        {/* Media */}
        {currentItem.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentItem.url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={currentItem.url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Next button */}
        {currentIndex < items.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto pb-safe">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-hole-accent'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-hole-surface flex items-center justify-center">
                        <PlayIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dot indicators for single item */}
      {items.length > 1 && items.length <= 10 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
