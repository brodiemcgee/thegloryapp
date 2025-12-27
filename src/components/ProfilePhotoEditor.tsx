// Profile photo management component with grid view

'use client';

import { useState, useEffect } from 'react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { deletePhoto, getPublicUrl, listUserPhotos } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import PhotoUploader from './PhotoUploader';
import { XIcon, CheckIcon } from './icons';

export interface ProfilePhoto {
  id?: string;
  name: string;
  path: string;
  url: string;
  isPrimary?: boolean;
  isNSFW?: boolean;
}

export interface ProfilePhotoEditorProps {
  userId: string;
  currentPhotos?: ProfilePhoto[];
  onPhotosChange?: (photos: ProfilePhoto[]) => void;
}

export default function ProfilePhotoEditor({
  userId,
  currentPhotos = [],
  onPhotosChange,
}: ProfilePhotoEditorProps) {
  const [photos, setPhotos] = useState<ProfilePhoto[]>(currentPhotos);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);
  const { upload, uploading, progress, error, reset } = usePhotoUpload();

  useEffect(() => {
    loadPhotos();
  }, [userId]);

  // Sync photos from storage to database if they don't exist yet
  const syncStorageToDatabase = async () => {
    try {
      // Get photos from storage
      const storageFiles = await listUserPhotos(userId);
      if (!storageFiles || storageFiles.length === 0) return;

      // Get existing photos from database
      const { data: dbPhotos } = await supabase
        .from('photos')
        .select('url')
        .eq('profile_id', userId);

      const dbUrls = new Set((dbPhotos || []).map(p => p.url));

      // Find photos in storage that aren't in database
      const photosToSync = storageFiles.filter(file => {
        const url = getPublicUrl('avatars', `${userId}/${file.name}`);
        return !dbUrls.has(url);
      });

      if (photosToSync.length === 0) return;

      // Insert missing photos into database
      const inserts = photosToSync.map((file, index) => ({
        profile_id: userId,
        url: getPublicUrl('avatars', `${userId}/${file.name}`),
        is_primary: index === 0 && dbPhotos?.length === 0, // First photo is primary if no existing
        is_nsfw: false,
      }));

      const { error: insertError } = await supabase
        .from('photos')
        .insert(inserts);

      if (insertError) {
        console.error('Failed to sync photos to database:', insertError);
      } else {
        console.log(`Synced ${inserts.length} photos from storage to database`);
      }
    } catch (err) {
      console.error('Error syncing storage photos:', err);
    }
  };

  // Load photos from database (photos table)
  const loadPhotos = async () => {
    try {
      setLoading(true);

      // First, sync any photos from storage that aren't in database
      await syncStorageToDatabase();

      // Then load all photos from database
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const photoList: ProfilePhoto[] = (data || []).map((photo) => ({
        id: photo.id,
        name: photo.url.split('/').pop() || '',
        path: photo.url,
        url: photo.url,
        isPrimary: photo.is_primary,
        isNSFW: photo.is_nsfw,
      }));
      setPhotos(photoList);
      onPhotosChange?.(photoList);

      // Update avatar_url if we have photos but no avatar set
      if (photoList.length > 0) {
        const primaryPhoto = photoList.find(p => p.isPrimary) || photoList[0];
        await updateAvatarUrl(primaryPhoto.url);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update avatar_url in profiles table
  const updateAvatarUrl = async (url: string | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update avatar_url:', error);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, userId, 'profile');
      const isPrimary = photos.length === 0; // First photo is primary

      // Always update avatar_url for primary photo (do this first as fallback)
      if (isPrimary) {
        await updateAvatarUrl(result.url);
      }

      // Try to save to photos table
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          profile_id: userId,
          url: result.url,
          is_primary: isPrimary,
          is_nsfw: false,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save photo to database:', dbError);
        // Photo is in storage and avatar_url is updated, so continue
        // but with a generated ID
      }

      const newPhoto: ProfilePhoto = {
        id: photoData?.id || crypto.randomUUID(),
        name: result.path.split('/').pop() || '',
        path: result.path,
        url: result.url,
        isPrimary: isPrimary,
        isNSFW: false,
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

      setShowUploader(false);
      reset();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleDelete = async (photo: ProfilePhoto) => {
    if (!confirm('Delete this photo?')) return;

    try {
      // Delete from database
      if (photo.id) {
        const { error: dbError } = await supabase
          .from('photos')
          .delete()
          .eq('id', photo.id);

        if (dbError) throw dbError;
      }

      // Delete from storage
      const storagePath = photo.path.includes('/') ? photo.path : `${userId}/${photo.name}`;
      await deletePhoto('avatars', storagePath);

      const updatedPhotos = photos.filter((p) => p.path !== photo.path);

      // If deleted photo was primary, make first photo primary
      if (photo.isPrimary && updatedPhotos.length > 0) {
        updatedPhotos[0].isPrimary = true;
        // Update in database
        if (updatedPhotos[0].id) {
          await supabase
            .from('photos')
            .update({ is_primary: true })
            .eq('id', updatedPhotos[0].id);
        }
        await updateAvatarUrl(updatedPhotos[0].url);
      } else if (photo.isPrimary) {
        // No more photos, clear avatar_url
        await updateAvatarUrl(null);
      }

      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete photo');
    }
  };

  const handleSetPrimary = async (photo: ProfilePhoto) => {
    try {
      // Update all photos in database - set all to non-primary first
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('profile_id', userId);

      // Set this photo as primary
      if (photo.id) {
        await supabase
          .from('photos')
          .update({ is_primary: true })
          .eq('id', photo.id);
      }

      // Update avatar_url
      await updateAvatarUrl(photo.url);

      const updatedPhotos = photos.map((p) => ({
        ...p,
        isPrimary: p.path === photo.path,
      }));
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    } catch (err) {
      console.error('Failed to set primary:', err);
    }
  };

  const handleToggleNSFW = async (photo: ProfilePhoto) => {
    const newNSFW = !photo.isNSFW;
    try {
      if (photo.id) {
        await supabase
          .from('photos')
          .update({ is_nsfw: newNSFW })
          .eq('id', photo.id);
      }

      const updatedPhotos = photos.map((p) =>
        p.path === photo.path ? { ...p, isNSFW: newNSFW } : p
      );
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    } catch (err) {
      console.error('Failed to toggle NSFW:', err);
    }
  };

  if (showUploader) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Photo</h3>
          <button
            onClick={() => {
              setShowUploader(false);
              reset();
            }}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <PhotoUploader
          onUpload={handleUpload}
          uploading={uploading}
          progress={progress}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.path} className="relative aspect-square group">
            <img
              src={photo.url}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />

            {/* Primary badge */}
            {photo.isPrimary && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-hole-accent rounded text-xs font-medium">
                Primary
              </div>
            )}

            {/* NSFW badge */}
            {photo.isNSFW && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded text-xs font-medium">
                NSFW
              </div>
            )}

            {/* Action overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              {!photo.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(photo)}
                  className="p-2 bg-hole-accent hover:bg-hole-accent-hover rounded-lg transition-colors"
                  aria-label="Set as primary"
                  title="Set as primary"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleToggleNSFW(photo)}
                className={`p-2 rounded-lg transition-colors ${
                  photo.isNSFW
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-hole-surface hover:bg-hole-border'
                }`}
                aria-label="Toggle NSFW"
                title="Toggle NSFW"
              >
                <span className="text-xs font-bold">18+</span>
              </button>
              <button
                onClick={() => handleDelete(photo)}
                className="p-2 bg-hole-surface hover:bg-hole-border rounded-lg transition-colors"
                aria-label="Delete"
                title="Delete"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add photo button */}
        {photos.length < 6 && (
          <button
            onClick={() => setShowUploader(true)}
            className="aspect-square border-2 border-dashed border-hole-border hover:border-hole-accent rounded-lg flex flex-col items-center justify-center gap-2 transition-colors bg-hole-surface"
          >
            <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center">
              <span className="text-2xl text-hole-muted">+</span>
            </div>
            <span className="text-xs text-hole-muted">Add Photo</span>
          </button>
        )}
      </div>

      {/* Photo limit indicator */}
      <p className="text-xs text-hole-muted text-center">
        {photos.length}/6 photos
      </p>
    </div>
  );
}
