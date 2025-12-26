-- Create storage buckets for media uploads
-- Migration: Create avatars and chat-images buckets with appropriate policies

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create chat-images bucket (public but authenticated access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- CHAT IMAGES BUCKET POLICIES
-- =====================================================

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

-- Allow users to update chat images
CREATE POLICY "Users can update chat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-images')
WITH CHECK (bucket_id = 'chat-images');

-- Allow users to delete chat images
CREATE POLICY "Users can delete chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images');

-- =====================================================
-- ADD IMAGE URL COLUMN TO MESSAGES TABLE (if not exists)
-- =====================================================

-- Add image_url column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index on image_url for faster queries
CREATE INDEX IF NOT EXISTS messages_image_url_idx
ON public.messages(image_url)
WHERE image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.messages.image_url IS 'URL of attached image in chat message';
