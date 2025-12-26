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
