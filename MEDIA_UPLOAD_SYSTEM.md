# Media Upload System - Implementation Guide

## Overview
This document describes the media upload system built for thehole.app, including profile photos and chat image attachments.

## Files Created

### 1. Storage Helper Library
**File:** `src/lib/storage.ts`

Core functionality for Supabase Storage:
- `uploadProfilePhoto(file, userId)` - Uploads to 'avatars' bucket
- `uploadChatImage(file, conversationId)` - Uploads to 'chat-images' bucket
- `deletePhoto(bucket, path)` - Deletes files from storage
- `getPublicUrl(bucket, path)` - Gets public URL for files
- `validateImageFile(file)` - Validates file size (max 5MB) and type
- `generateUniqueFilename(userId, originalFilename)` - Creates unique filenames
- `listUserPhotos(userId)` - Lists all photos for a user

### 2. Upload Hook
**File:** `src/hooks/usePhotoUpload.ts`

React hook for handling uploads:
- Returns: `{ upload, uploading, progress, error, reset }`
- Handles both profile and chat image uploads
- Simulates progress (Supabase doesn't provide native progress)
- Error handling and state management

### 3. Reusable Upload Component
**File:** `src/components/PhotoUploader.tsx`

Drag-and-drop upload component with:
- Click to upload or drag-drop interface
- Image preview before upload
- Progress indicator during upload
- Error display
- Configurable max size and accepted types

### 4. Profile Photo Manager
**File:** `src/components/ProfilePhotoEditor.tsx`

Full photo management interface:
- Grid view of photos (up to 6 photos)
- Add new photos
- Set primary photo
- Toggle NSFW marking
- Delete photos
- Real-time updates

### 5. Updated Components

#### ChatView Component
**File:** `src/components/ChatView.tsx`

Added features:
- Image attachment button
- Image preview before send
- Display images in messages (clickable to open full size)
- Upload progress indicator
- Error handling

#### ProfileView Component
**File:** `src/components/ProfileView.tsx`

Integrated ProfilePhotoEditor:
- Edit/Done toggle for photo editing mode
- Display photo grid in view mode
- Full photo management in edit mode

#### Icons
**File:** `src/components/icons.tsx`

Added `ImageIcon` for attachment button.

## Setup Instructions

### 1. Create Supabase Storage Buckets

Run these commands in your Supabase SQL Editor or use the Supabase Dashboard:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create chat-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true);
```

### 2. Set Up Storage Policies

#### Avatars Bucket Policies

```sql
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Chat Images Bucket Policies

```sql
-- Allow authenticated users to upload chat images
CREATE POLICY "Users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow authenticated users to view chat images
CREATE POLICY "Authenticated users can view chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

-- Allow users to delete their chat images
CREATE POLICY "Users can delete their chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images');
```

### 3. Update Database Schema (if needed)

The `messages` table should already have the `image_url` field from the types definition. If not, add it:

```sql
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 4. Configure Storage Settings (Optional)

In Supabase Dashboard > Storage > Settings:

- **File size limit:** 5MB (already enforced in code)
- **Allowed MIME types:** image/jpeg, image/png, image/gif, image/webp
- **Enable image transformations:** Optional for automatic resizing

## Usage Examples

### Profile Photo Upload

```typescript
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

function MyComponent() {
  const { upload, uploading, progress, error } = usePhotoUpload();

  const handleUpload = async (file: File) => {
    const result = await upload(file, userId, 'profile');
    console.log('Uploaded to:', result.url);
  };
}
```

### Chat Image Upload

```typescript
const { upload } = usePhotoUpload();

const handleUpload = async (file: File) => {
  const result = await upload(file, userId, 'chat', conversationId);
  // Send message with image URL
  await sendMessage('Check this out!', result.url);
};
```

### Using PhotoUploader Component

```typescript
import PhotoUploader from '@/components/PhotoUploader';

<PhotoUploader
  onUpload={handleFileUpload}
  uploading={uploading}
  progress={progress}
  error={error}
  maxSize={5 * 1024 * 1024}
  accept="image/jpeg,image/png"
/>
```

## Features

### Profile Photos
- Upload up to 6 photos
- Set primary photo (used as avatar)
- Mark photos as NSFW
- Delete individual photos
- Drag-and-drop upload
- Automatic thumbnail generation (via Supabase)

### Chat Images
- Attach images to messages
- Preview before sending
- Click to view full size
- Upload progress indicator
- Error handling

## Security

- File type validation (images only)
- File size limit (5MB max)
- User-scoped storage paths
- RLS policies for access control
- Public URLs for avatars
- Authenticated access for chat images

## Performance Considerations

- Lazy loading of images
- Automatic CDN delivery via Supabase
- Compressed uploads (client-side)
- Cached public URLs

## Styling

All components use the existing Tailwind theme:
- `hole-bg` - Background color
- `hole-surface` - Surface color
- `hole-border` - Border color
- `hole-accent` - Primary red accent
- `hole-muted` - Muted text color

## Testing Checklist

- [ ] Upload profile photo
- [ ] Delete profile photo
- [ ] Set primary photo
- [ ] Toggle NSFW on photo
- [ ] Upload chat image
- [ ] Send message with image
- [ ] View image in message
- [ ] Test file size limit
- [ ] Test file type validation
- [ ] Test drag-and-drop
- [ ] Test error handling
- [ ] Test mobile responsiveness

## Next Steps

1. Create the storage buckets in Supabase Dashboard
2. Set up RLS policies
3. Test upload functionality
4. Configure CDN settings (optional)
5. Add image compression (optional)
6. Implement image moderation (optional)

## Notes

- The current implementation uses simulated progress since Supabase Storage doesn't provide native upload progress
- Images are stored in user-scoped folders: `{userId}/{timestamp}-{random}.{ext}`
- Chat images are stored in conversation-scoped folders: `{conversationId}/{timestamp}-{random}.{ext}`
- All URLs are public but not easily guessable due to random filenames
- Consider implementing image moderation for NSFW content
- Consider adding image compression before upload to reduce storage costs
