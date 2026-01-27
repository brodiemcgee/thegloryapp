-- Add visibility control columns to profiles table
-- These allow users to control where they appear in the app

ALTER TABLE profiles
ADD COLUMN show_in_grid BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN show_on_map BOOLEAN DEFAULT true NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.show_in_grid IS 'Whether the user appears in the grid view (premium feature)';
COMMENT ON COLUMN profiles.show_on_map IS 'Whether the user appears on the map view (premium feature)';
