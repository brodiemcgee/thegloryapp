// List of user's albums for Settings page

'use client';

import { useState } from 'react';
import { PlusIcon, ChevronLeftIcon, CrownIcon } from '@/components/icons';
import { useAlbums } from '@/hooks/useAlbums';
import AlbumCard from './AlbumCard';
import CreateAlbumModal from './CreateAlbumModal';
import AlbumEditorModal from './AlbumEditorModal';
import type { Album } from '@/types';

interface AlbumListProps {
  onBack: () => void;
}

export default function AlbumList({ onBack }: AlbumListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const { albums, loading, error, canCreateAlbum, albumLimits, refresh } = useAlbums();

  const handleAlbumCreated = (albumId: string) => {
    setShowCreateModal(false);
    refresh();
    // Open the newly created album for editing
    const newAlbum = albums.find((a) => a.id === albumId);
    if (newAlbum) {
      setEditingAlbum(newAlbum);
    }
  };

  const handleAlbumClick = (album: Album) => {
    setEditingAlbum(album);
  };

  const handleEditorClose = () => {
    setEditingAlbum(null);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-40 bg-hole-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        <button
          onClick={onBack}
          className="p-2 text-hole-muted hover:text-white rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">My Albums</h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Limit indicator */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-hole-muted">
            {albums.length} / {albumLimits.maxAlbums} albums
          </p>
          {!albumLimits.videosAllowed && (
            <div className="flex items-center gap-1 text-xs text-hole-muted">
              <CrownIcon className="w-3 h-3 text-yellow-500" />
              <span>Upgrade for videos</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
            <p className="text-sm text-hole-accent">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* Albums grid */
          <div className="grid grid-cols-2 gap-3">
            {/* Create button */}
            {canCreateAlbum && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="aspect-square rounded-lg border-2 border-dashed border-hole-border bg-hole-surface flex flex-col items-center justify-center gap-2 hover:border-hole-accent transition-colors"
              >
                <PlusIcon className="w-8 h-8 text-hole-muted" />
                <span className="text-sm text-hole-muted">New Album</span>
              </button>
            )}

            {/* Album cards */}
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleAlbumClick(album)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && albums.length === 0 && (
          <div className="text-center py-12">
            <p className="text-hole-muted mb-4">
              Create your first album to share photos and videos in chat.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-hole-accent hover:bg-hole-accent-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Create Album
            </button>
          </div>
        )}

        {/* Upgrade prompt when at limit */}
        {!canCreateAlbum && albums.length > 0 && (
          <div className="mt-6 bg-hole-surface border border-hole-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CrownIcon className="w-5 h-5 text-yellow-500" />
              <h3 className="text-white font-medium">Want more albums?</h3>
            </div>
            <p className="text-sm text-hole-muted mb-3">
              Upgrade to create more albums and add videos.
            </p>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium py-2 px-4 rounded-lg transition-opacity hover:opacity-90">
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateAlbumModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAlbumCreated}
      />

      {/* Editor modal */}
      <AlbumEditorModal
        album={editingAlbum}
        isOpen={!!editingAlbum}
        onClose={handleEditorClose}
        onDeleted={() => {
          setEditingAlbum(null);
          refresh();
        }}
      />
    </div>
  );
}
