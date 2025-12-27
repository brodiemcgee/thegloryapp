// Modal for editing an album and managing its items

'use client';

import { useState, useEffect } from 'react';
import { XIcon, TrashIcon, PlayIcon, ChevronLeftIcon, EyeIcon } from '@/components/icons';
import { useAlbums } from '@/hooks/useAlbums';
import { useAlbumItems } from '@/hooks/useAlbumItems';
import AlbumUploader from './AlbumUploader';
import AlbumAccessList from './AlbumAccessList';
import type { Album, AlbumItem } from '@/types';

interface AlbumEditorModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function AlbumEditorModal({
  album,
  isOpen,
  onClose,
  onDeleted,
}: AlbumEditorModalProps) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewItem, setPreviewItem] = useState<AlbumItem | null>(null);
  const [showAccessList, setShowAccessList] = useState(false);

  const { updateAlbum, deleteAlbum, error: albumError } = useAlbums();
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    addItem,
    removeItem,
    canAddItem,
    itemLimits,
    refresh: refreshItems,
  } = useAlbumItems(album?.id || null);

  useEffect(() => {
    if (album) {
      setName(album.name);
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const handleSaveName = async () => {
    if (name.trim() && name !== album.name) {
      await updateAlbum(album.id, { name: name.trim() });
    }
    setEditingName(false);
  };

  const handleDelete = async () => {
    await deleteAlbum(album.id);
    setShowDeleteConfirm(false);
    onDeleted?.();
    onClose();
  };

  const handleUploadComplete = async (mediaData: {
    url: string;
    thumbnailUrl: string | null;
    type: 'photo' | 'video';
    durationSeconds: number | null;
    fileSizeBytes: number;
  }) => {
    await addItem({
      type: mediaData.type,
      url: mediaData.url,
      thumbnail_url: mediaData.thumbnailUrl,
      duration_seconds: mediaData.durationSeconds,
      file_size_bytes: mediaData.fileSizeBytes,
    });
    refreshItems();
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
  };

  const error = albumError || itemsError;

  return (
    <div className="fixed inset-0 z-50 bg-hole-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        <button
          onClick={onClose}
          className="p-2 text-hole-muted hover:text-white rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {editingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            maxLength={50}
            className="bg-transparent text-lg font-semibold text-white text-center border-b border-hole-accent focus:outline-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-lg font-semibold text-white hover:text-hole-accent transition-colors"
          >
            {album.name}
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-hole-accent hover:text-hole-accent-hover rounded-lg transition-colors"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error */}
        {error && (
          <div className="mb-4 bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-3">
            <p className="text-sm text-hole-accent">{error}</p>
          </div>
        )}

        {/* Items grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Existing items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-hole-border group"
            >
              {item.type === 'video' ? (
                <div
                  className="w-full h-full bg-hole-surface cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayIcon className="w-8 h-8 text-hole-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                      <PlayIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {item.duration_seconds && (
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 text-xs text-white">
                      {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={item.url}
                  alt="Album item"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                />
              )}

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveItem(item.id);
                }}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-hole-accent"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add button */}
          {canAddItem && (
            <AlbumUploader
              albumId={album.id}
              onUploadComplete={handleUploadComplete}
              disabled={itemsLoading}
            />
          )}
        </div>

        {/* Limit indicator */}
        <p className="mt-4 text-center text-sm text-hole-muted">
          {items.length} / {itemLimits.maxItemsPerAlbum} items
        </p>

        {/* Access management button */}
        <button
          onClick={() => setShowAccessList(true)}
          className="mt-6 w-full flex items-center justify-between p-4 bg-hole-surface border border-hole-border rounded-lg transition-colors hover:bg-hole-border"
        >
          <div className="flex items-center gap-3">
            <EyeIcon className="w-5 h-5 text-hole-muted" />
            <div className="text-left">
              <div className="font-medium text-white">Who Has Access</div>
              <div className="text-sm text-hole-muted">Manage who can view this album</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-hole-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-hole-surface rounded-lg w-full max-w-sm border border-hole-border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Delete Album?</h3>
            <p className="text-hole-muted">
              This will permanently delete &quot;{album.name}&quot; and all its contents.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-hole-bg border border-hole-border text-white font-medium py-2 px-4 rounded-lg transition-colors hover:bg-hole-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-hole-accent hover:bg-hole-accent-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-hole-accent transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>

          {previewItem.type === 'video' ? (
            <video
              src={previewItem.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewItem.url}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Access list modal */}
      <AlbumAccessList
        albumId={album.id}
        isOpen={showAccessList}
        onClose={() => setShowAccessList(false)}
      />
    </div>
  );
}
