-- Add display_name field for user-facing name (can be duplicated, like "cruising now")
-- username remains the unique identifier set at signup

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Add a reasonable length constraint (1-50 chars, or null)
ALTER TABLE profiles ADD CONSTRAINT display_name_length
  CHECK (display_name IS NULL OR (char_length(display_name) >= 1 AND char_length(display_name) <= 50));

COMMENT ON COLUMN profiles.display_name IS 'User-facing display name shown on profile. Can be duplicated. Falls back to username if null.';
