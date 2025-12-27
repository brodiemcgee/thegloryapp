// Hook for uploading photos and videos to albums

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { ALBUM_LIMITS } from '@/contexts/SubscriptionContext';
import type { AlbumItemType } from '@/types';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

interface UploadedMedia {
  url: string;
  thumbnailUrl: string | null;
  type: AlbumItemType;
  durationSeconds: number | null;
  fileSizeBytes: number;
}

interface UseAlbumUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadMedia: (file: File, albumId: string) => Promise<UploadedMedia | null>;
  validateFile: (file: File) => string | null;
}

export function useAlbumUpload(): UseAlbumUploadReturn {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const limits = ALBUM_LIMITS[subscription.tier];

  const validateFile = useCallback((file: File): string | null => {
    if (!file) {
      return 'No file selected';
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return `Invalid file type. Allowed: images (${ALLOWED_IMAGE_TYPES.join(', ')})${limits.videosAllowed ? ` and videos (${ALLOWED_VIDEO_TYPES.join(', ')})` : ''}`;
    }

    if (isVideo && !limits.videosAllowed) {
      return 'Videos are only available for premium users';
    }

    // Check file size
    const maxSizeBytes = isVideo
      ? limits.maxVideoSizeMB * 1024 * 1024
      : 10 * 1024 * 1024; // 10MB for images

    if (file.size > maxSizeBytes) {
      const maxSizeMB = maxSizeBytes / 1024 / 1024;
      return `File size too large. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  }, [limits]);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        reject(new Error('Could not load video metadata'));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        // Seek to 1 second or 25% of duration, whichever is smaller
        video.currentTime = Math.min(1, video.duration * 0.25);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          window.URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        reject(new Error('Could not load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const uploadMedia = useCallback(async (
    file: File,
    albumId: string
  ): Promise<UploadedMedia | null> => {
    if (!user) {
      setError('Not authenticated');
      return null;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
      const type: AlbumItemType = isVideo ? 'video' : 'photo';

      // For videos, validate duration
      let durationSeconds: number | null = null;
      if (isVideo) {
        durationSeconds = await getVideoDuration(file);
        if (durationSeconds > limits.maxVideoSeconds) {
          setError(`Video cannot exceed ${limits.maxVideoSeconds} seconds`);
          setUploading(false);
          return null;
        }
      }

      setProgress(10);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
      const filename = `${user.id}/${albumId}/${timestamp}-${randomString}.${extension}`;

      // Upload main file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('album-media')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(60);

      // Get signed URL for the uploaded file (private bucket)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('album-media')
        .createSignedUrl(uploadData.path, 60 * 60 * 24 * 7); // 7 days

      if (urlError || !urlData) {
        throw new Error('Failed to get signed URL');
      }

      setProgress(70);

      // For videos, generate and upload thumbnail
      let thumbnailUrl: string | null = null;
      if (isVideo) {
        try {
          const thumbnailBlob = await generateVideoThumbnail(file);
          const thumbnailFilename = `${user.id}/${albumId}/${timestamp}-${randomString}-thumb.jpg`;

          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('album-media')
            .upload(thumbnailFilename, thumbnailBlob, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
            });

          if (!thumbError && thumbData) {
            const { data: thumbUrl } = await supabase.storage
              .from('album-media')
              .createSignedUrl(thumbData.path, 60 * 60 * 24 * 7);
            thumbnailUrl = thumbUrl?.signedUrl || null;
          }
        } catch (thumbErr) {
          console.error('Failed to generate thumbnail:', thumbErr);
          // Continue without thumbnail
        }
      }

      setProgress(100);

      return {
        url: urlData.signedUrl,
        thumbnailUrl,
        type,
        durationSeconds,
        fileSizeBytes: file.size,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      console.error('Error uploading album media:', err);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, validateFile, limits.maxVideoSeconds]);

  return {
    uploading,
    progress,
    error,
    uploadMedia,
    validateFile,
  };
}
