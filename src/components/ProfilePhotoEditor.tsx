// Profile photo management component with grid view

'use client';

import { useState, useEffect } from 'react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { deletePhoto, listUserPhotos, getPublicUrl } from '@/lib/storage';
import PhotoUploader from './PhotoUploader';
import { XIcon, CheckIcon } from './icons';

export interface ProfilePhoto {
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

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const files = await listUserPhotos(userId);
      const photoList: ProfilePhoto[] = files.map((file) => ({
        name: file.name,
        path: `${userId}/${file.name}`,
        url: getPublicUrl('avatars', `${userId}/${file.name}`),
      }));
      setPhotos(photoList);
      onPhotosChange?.(photoList);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, userId, 'profile');

      const newPhoto: ProfilePhoto = {
        name: result.path.split('/').pop() || '',
        path: result.path,
        url: result.url,
        isPrimary: photos.length === 0, // First photo is primary
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
      setShowUploader(false);
      reset();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDelete = async (photo: ProfilePhoto) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await deletePhoto('avatars', photo.path);
      const updatedPhotos = photos.filter((p) => p.path !== photo.path);

      // If deleted photo was primary, make first photo primary
      if (photo.isPrimary && updatedPhotos.length > 0) {
        updatedPhotos[0].isPrimary = true;
      }

      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete photo');
    }
  };

  const handleSetPrimary = (photo: ProfilePhoto) => {
    const updatedPhotos = photos.map((p) => ({
      ...p,
      isPrimary: p.path === photo.path,
    }));
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
  };

  const handleToggleNSFW = (photo: ProfilePhoto) => {
    const updatedPhotos = photos.map((p) =>
      p.path === photo.path ? { ...p, isNSFW: !p.isNSFW } : p
    );
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
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
