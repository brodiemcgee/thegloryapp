// Modal for creating a new album

'use client';

import { useState } from 'react';
import { XIcon } from '@/components/icons';
import { useAlbums } from '@/hooks/useAlbums';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (albumId: string) => void;
}

export default function CreateAlbumModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAlbumModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createAlbum, error, albumLimits, canCreateAlbum } = useAlbums();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    const album = await createAlbum(name);
    setLoading(false);

    if (album) {
      setName('');
      onCreated(album.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-hole-surface rounded-lg w-full max-w-sm border border-hole-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-lg font-semibold text-white">Create Album</h2>
          <button
            onClick={onClose}
            className="p-2 text-hole-muted hover:text-white rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Album Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Album"
              maxLength={50}
              className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-3 text-white placeholder-hole-muted focus:outline-none focus:border-hole-accent"
              autoFocus
            />
            <p className="text-xs text-hole-muted">
              {name.length}/50 characters
            </p>
          </div>

          {/* Limit info */}
          <div className="text-xs text-hole-muted">
            <p>Up to {albumLimits.maxItemsPerAlbum} items per album</p>
            {albumLimits.videosAllowed ? (
              <p>Videos allowed (max {albumLimits.maxVideoSeconds}s, {albumLimits.maxVideoSizeMB}MB)</p>
            ) : (
              <p>Photos only (upgrade for videos)</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">{error}</p>
            </div>
          )}

          {!canCreateAlbum && (
            <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
              <p className="text-sm text-hole-accent">
                You&apos;ve reached the maximum number of albums for your plan ({albumLimits.maxAlbums})
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!name.trim() || loading || !canCreateAlbum}
            className="w-full bg-hole-accent hover:bg-hole-accent-hover disabled:bg-hole-border disabled:text-hole-muted text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Album'}
          </button>
        </form>
      </div>
    </div>
  );
}
