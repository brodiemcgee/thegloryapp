// Supabase Storage helpers for media uploads

import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadResult {
  path: string;
  url: string;
}

export interface ValidationError {
  message: string;
}

/**
 * Validates file before upload
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export function validateImageFile(file: File): string | null {
  if (!file) {
    return 'No file selected';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

/**
 * Generates unique filename with timestamp
 * @param userId - User ID for namespacing
 * @param originalFilename - Original file name
 * @returns Unique filename
 */
export function generateUniqueFilename(userId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop();
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Uploads profile photo to 'avatars' bucket
 * @param file - Image file to upload
 * @param userId - User ID
 * @returns Upload result with path and public URL
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate file
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // Generate unique filename
  const filename = generateUniqueFilename(userId, file.name);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const url = getPublicUrl('avatars', data.path);

  return {
    path: data.path,
    url,
  };
}

/**
 * Uploads chat image to 'chat-images' bucket
 * @param file - Image file to upload
 * @param conversationId - Conversation ID for namespacing
 * @returns Upload result with path and public URL
 */
export async function uploadChatImage(
  file: File,
  conversationId: string
): Promise<UploadResult> {
  // Validate file
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const filename = `${conversationId}/${timestamp}-${randomString}.${extension}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const url = getPublicUrl('chat-images', data.path);

  return {
    path: data.path,
    url,
  };
}

/**
 * Deletes photo from storage
 * @param bucket - Bucket name ('avatars' or 'chat-images')
 * @param path - File path in bucket
 */
export async function deletePhoto(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Gets public URL for a file in storage
 * @param bucket - Bucket name
 * @param path - File path in bucket
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Lists all photos for a user in the avatars bucket
 * @param userId - User ID
 * @returns Array of file metadata
 */
export async function listUserPhotos(userId: string) {
  const { data, error } = await supabase.storage
    .from('avatars')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Failed to list photos: ${error.message}`);
  }

  return data || [];
}

// ============================================
// ALBUM MEDIA FUNCTIONS
// ============================================

const ALBUM_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

/**
 * Validates album media file
 * @param file - File to validate
 * @param videosAllowed - Whether videos are allowed (based on subscription)
 * @param maxVideoSizeMB - Max video size in MB
 * @returns Error message or null if valid
 */
export function validateAlbumMediaFile(
  file: File,
  videosAllowed: boolean,
  maxVideoSizeMB: number
): string | null {
  if (!file) {
    return 'No file selected';
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, MOV, WebM';
  }

  if (isVideo && !videosAllowed) {
    return 'Videos are only available for premium users';
  }

  const maxSize = isVideo ? maxVideoSizeMB * 1024 * 1024 : ALBUM_MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return `File too large. Max size: ${maxSize / 1024 / 1024}MB`;
  }

  return null;
}

/**
 * Uploads media to album-media bucket (private)
 * @param file - File to upload
 * @param userId - User ID
 * @param albumId - Album ID
 * @returns Upload result with path
 */
export async function uploadAlbumMedia(
  file: File,
  userId: string,
  albumId: string
): Promise<{ path: string }> {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${userId}/${albumId}/${timestamp}-${randomString}.${extension}`;

  const { data, error } = await supabase.storage
    .from('album-media')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return { path: data.path };
}

/**
 * Gets a signed URL for album media (private bucket)
 * @param path - File path in album-media bucket
 * @param expiresIn - Expiration time in seconds (default 7 days)
 * @returns Signed URL
 */
export async function getSignedAlbumUrl(
  path: string,
  expiresIn: number = 60 * 60 * 24 * 7
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('album-media')
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to get signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

/**
 * Deletes album media from storage
 * @param path - File path in album-media bucket
 */
export async function deleteAlbumMedia(path: string): Promise<void> {
  const { error } = await supabase.storage.from('album-media').remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Lists all media files for an album
 * @param userId - User ID
 * @param albumId - Album ID
 * @returns Array of file metadata
 */
export async function listAlbumMedia(userId: string, albumId: string) {
  const { data, error } = await supabase.storage
    .from('album-media')
    .list(`${userId}/${albumId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'asc' },
    });

  if (error) {
    throw new Error(`Failed to list album media: ${error.message}`);
  }

  return data || [];
}
