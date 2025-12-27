// Hook for handling photo uploads with progress tracking

'use client';

import { useState, useCallback } from 'react';
import { uploadProfilePhoto, uploadChatImage, UploadResult } from '@/lib/storage';

export interface UsePhotoUploadResult {
  upload: (file: File, userId: string, type?: 'profile' | 'chat', conversationId?: string) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for uploading photos with progress tracking
 * @returns Upload functions and state
 */
export function usePhotoUpload(): UsePhotoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File,
      userId: string,
      type: 'profile' | 'chat' = 'profile',
      conversationId?: string
    ): Promise<UploadResult> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Simulate progress (Supabase Storage doesn't provide native progress)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        let result: UploadResult;

        if (type === 'profile') {
          result = await uploadProfilePhoto(file, userId);
        } else if (type === 'chat' && conversationId) {
          result = await uploadChatImage(file, userId, conversationId);
        } else {
          throw new Error('Invalid upload type or missing conversationId');
        }

        clearInterval(progressInterval);
        setProgress(100);
        setUploading(false);

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploading(false);
        setProgress(0);
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
}
