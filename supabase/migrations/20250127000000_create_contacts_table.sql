-- Create contacts table for managing people you've had encounters with
-- Supports both app users (via encounters) and manual contacts (people met outside the app)

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  phone_hint TEXT,              -- Partial phone for identification (e.g., "ends in 1234")
  social_handle TEXT,           -- Instagram/etc handle
  appearance_notes TEXT,        -- Physical description for identification
  -- Preferred activities (what they're into)
  preferred_activities TEXT[],  -- ['top', 'oral', 'vers', etc.]
  -- Health info for safer sex planning
  hiv_status TEXT,              -- 'negative', 'positive', 'undetectable', 'on_prep', 'unknown'
  last_tested_date DATE,        -- When they last got tested (if known)
  health_notes TEXT,            -- Any relevant health info
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT contact_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT valid_hiv_status CHECK (hiv_status IS NULL OR hiv_status IN ('negative', 'positive', 'undetectable', 'on_prep', 'unknown'))
);

-- Create indexes for contacts
CREATE INDEX contacts_user_id_idx ON contacts(user_id);
CREATE INDEX contacts_name_idx ON contacts(user_id, name);
CREATE INDEX contacts_created_at_idx ON contacts(created_at DESC);

-- ============================================================================
-- ADD contact_id TO ENCOUNTERS TABLE
-- ============================================================================
ALTER TABLE encounters ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for contact_id lookups
CREATE INDEX encounters_contact_id_idx ON encounters(contact_id);

-- ============================================================================
-- MIGRATE EXISTING ANONYMOUS ENCOUNTERS TO CONTACTS
-- ============================================================================
-- Create contacts from unique anonymous_name values per user
-- Then link existing encounters to the new contact records

-- Step 1: Create contacts from unique anonymous_name values
INSERT INTO contacts (user_id, name, created_at, updated_at)
SELECT DISTINCT ON (user_id, anonymous_name)
  user_id,
  anonymous_name,
  MIN(created_at) OVER (PARTITION BY user_id, anonymous_name),
  MAX(created_at) OVER (PARTITION BY user_id, anonymous_name)
FROM encounters
WHERE anonymous_name IS NOT NULL AND anonymous_name != ''
ON CONFLICT DO NOTHING;

-- Step 2: Link existing encounters to the newly created contacts
UPDATE encounters e
SET contact_id = c.id
FROM contacts c
WHERE e.user_id = c.user_id
  AND e.anonymous_name = c.name
  AND e.anonymous_name IS NOT NULL
  AND e.anonymous_name != ''
  AND e.contact_id IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own contacts
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own contacts
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER FOR updated_at
-- ============================================================================
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
