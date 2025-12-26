# Quick Setup Guide for Media Upload System

## Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI installed and linked to your project:

```bash
# Apply the migration
supabase db push

# Or if using migrations manually
supabase migration up
```

## Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20250101000000_create_storage_buckets.sql`
5. Click **Run** to execute the migration

## Option 3: Using MCP Supabase Tools

Since you have the Supabase MCP tools available, you can use them:

```typescript
// The migration has been created at:
// supabase/migrations/20250101000000_create_storage_buckets.sql

// To apply it, you can use the mcp__supabase__apply_migration tool
// or execute the SQL directly via mcp__supabase__execute_sql
```

## Verify Setup

After running the migration, verify everything is set up correctly:

### 1. Check Buckets Created

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('avatars', 'chat-images');
```

Expected result:
- `avatars` bucket: public=true, file_size_limit=5242880
- `chat-images` bucket: public=true, file_size_limit=5242880

### 2. Check Policies Created

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%avatar%' OR policyname LIKE '%chat%';
```

Expected result: 8 policies total (4 for avatars, 4 for chat-images)

### 3. Check Messages Table Updated

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name = 'image_url';
```

Expected result: One row showing `image_url` column of type `text`

## Testing the Upload System

### Test Profile Photo Upload

1. Navigate to the Profile tab
2. Click "Edit" under Photos
3. Click "Add Photo" or drag an image
4. Upload should complete successfully
5. Photo should appear in the grid
6. Set as primary and mark as NSFW to test all features

### Test Chat Image Upload

1. Navigate to Messages tab
2. Open a conversation
3. Click the image attachment button (camera icon)
4. Select an image
5. Preview should appear
6. Click send
7. Image should appear in the chat

## Troubleshooting

### Upload Fails with "403 Forbidden"
- Check that RLS policies are correctly set up
- Verify user is authenticated
- Check that bucket exists

### Upload Fails with "File too large"
- Verify file is under 5MB
- Check browser console for specific error

### Images Don't Display
- Check public URL generation in storage.ts
- Verify bucket is set to public
- Check CORS settings in Supabase

### Can't Delete Photos
- Verify delete policies are set up
- Check user owns the photo (path matches user ID)

## Next Steps

1. ✅ Run the migration
2. ✅ Test profile photo upload
3. ✅ Test chat image upload
4. Configure CDN caching (optional)
5. Set up image moderation (optional)
6. Add image compression (optional)

## Important Notes

- All images are public via URL but not easily discoverable
- User IDs are used in storage paths for access control
- Chat images are scoped by conversation ID
- RLS policies enforce user permissions
- 5MB file size limit is enforced both client and server side
