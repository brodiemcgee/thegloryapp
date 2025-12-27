// Modal to select which album to share in chat

'use client';

import { XIcon, AlbumIcon } from '@/components/icons';
import { useAlbums } from '@/hooks/useAlbums';
import { AlbumCard } from '@/components/albums';
import type { Album } from '@/types';

interface AlbumPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (album: Album) => void;
}

export default function AlbumPickerModal({
  isOpen,
  onClose,
  onSelect,
}: AlbumPickerModalProps) {
  const { albums, loading, error } = useAlbums();

  if (!isOpen) return null;

  // Filter to albums that have at least one item
  const shareableAlbums = albums.filter((album) => album.item_count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-lg font-semibold text-white">Share Album</h2>
          <button
            onClick={onClose}
            className="p-2 text-hole-muted hover:text-white rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          ) : shareableAlbums.length === 0 ? (
            <div className="text-center py-12">
              <AlbumIcon className="w-12 h-12 text-hole-muted mx-auto mb-4" />
              <p className="text-hole-muted mb-2">No albums to share</p>
              <p className="text-sm text-hole-muted">
                Create an album and add some photos first
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shareableAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => onSelect(album)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        {shareableAlbums.length > 0 && (
          <div className="p-4 border-t border-hole-border">
            <p className="text-xs text-hole-muted text-center">
              Access duration depends on recipient&apos;s subscription tier
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
