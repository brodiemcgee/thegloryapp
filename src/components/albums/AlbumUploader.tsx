// Drag and drop upload UI for album media

'use client';

import { useRef, useState, useCallback } from 'react';
import { PlusIcon, ImageIcon, VideoIcon, XIcon } from '@/components/icons';
import { useAlbumUpload } from '@/hooks/useAlbumUpload';
import { useSubscription } from '@/hooks/useSubscription';
import { ALBUM_LIMITS } from '@/contexts/SubscriptionContext';

interface AlbumUploaderProps {
  albumId: string;
  onUploadComplete: (mediaData: {
    url: string;
    thumbnailUrl: string | null;
    type: 'photo' | 'video';
    durationSeconds: number | null;
    fileSizeBytes: number;
  }) => void;
  disabled?: boolean;
}

export default function AlbumUploader({
  albumId,
  onUploadComplete,
  disabled = false,
}: AlbumUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploading, progress, error, uploadMedia, validateFile } = useAlbumUpload();
  const { subscription } = useSubscription();

  const limits = ALBUM_LIMITS[subscription.tier];

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      return;
    }

    const result = await uploadMedia(file, albumId);
    if (result) {
      onUploadComplete(result);
    }
  }, [albumId, validateFile, uploadMedia, onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const acceptTypes = limits.videosAllowed
    ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm'
    : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';

  return (
    <div className="space-y-2">
      {/* Upload area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-square rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-hole-accent bg-hole-accent/10'
            : disabled || uploading
            ? 'border-hole-border bg-hole-bg/50 cursor-not-allowed'
            : 'border-hole-border bg-hole-bg hover:border-hole-accent hover:bg-hole-surface'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-hole-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-hole-muted">{progress}%</span>
          </div>
        ) : (
          <>
            <PlusIcon className="w-8 h-8 text-hole-muted" />
            <span className="text-sm text-hole-muted">Add media</span>
            <div className="flex items-center gap-2 text-xs text-hole-muted">
              <ImageIcon className="w-4 h-4" />
              {limits.videosAllowed && <VideoIcon className="w-4 h-4" />}
            </div>
          </>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="bg-hole-accent/10 border border-hole-accent/20 rounded-lg p-2">
          <p className="text-xs text-hole-accent">{error}</p>
        </div>
      )}

      {/* File limits info */}
      <p className="text-xs text-hole-muted text-center">
        {limits.videosAllowed ? (
          <>Photos (10MB) or videos ({limits.maxVideoSeconds}s, {limits.maxVideoSizeMB}MB)</>
        ) : (
          <>Photos only (10MB max)</>
        )}
      </p>
    </div>
  );
}
