-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create custom types
create type intent_type as enum ('looking', 'hosting', 'traveling', 'discrete');
create type availability_type as enum ('now', 'today', 'later', 'offline');
create type location_type as enum ('public', 'private', 'cruising', 'venue');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  age integer,
  intent intent_type,
  availability availability_type default 'offline',
  is_verified boolean default false,
  is_online boolean default false,
  last_active timestamp with time zone default now(),
  location geography(Point, 4326),
  ghost_mode boolean default false,
  hide_from_contacts boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint age_range check (age >= 18 and age <= 120)
);

-- Create indexes for profiles
create index profiles_username_idx on profiles(username);
create index profiles_location_idx on profiles using gist(location);
create index profiles_is_online_idx on profiles(is_online);
create index profiles_availability_idx on profiles(availability);
create index profiles_last_active_idx on profiles(last_active);

-- ============================================================================
-- LOCATIONS TABLE (Cruising spots)
-- ============================================================================
create table locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type location_type not null,
  coordinates geography(Point, 4326) not null,
  created_by uuid references profiles(id) on delete set null,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now(),

  constraint name_length check (char_length(name) >= 1 and char_length(name) <= 200)
);

-- Create indexes for locations
create index locations_coordinates_idx on locations using gist(coordinates);
create index locations_type_idx on locations(type);
create index locations_is_active_idx on locations(is_active);
create index locations_created_by_idx on locations(created_by);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_1 uuid references profiles(id) on delete cascade not null,
  participant_2 uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint different_participants check (participant_1 != participant_2),
  constraint ordered_participants check (participant_1 < participant_2),
  unique(participant_1, participant_2)
);

-- Create indexes for conversations
create index conversations_participant_1_idx on conversations(participant_1);
create index conversations_participant_2_idx on conversations(participant_2);
create index conversations_updated_at_idx on conversations(updated_at desc);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text,
  image_url text,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone,

  constraint content_or_image check (content is not null or image_url is not null)
);

-- Create indexes for messages
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_sender_id_idx on messages(sender_id);
create index messages_created_at_idx on messages(created_at desc);
create index messages_read_at_idx on messages(read_at) where read_at is null;

-- ============================================================================
-- BLOCKS TABLE
-- ============================================================================
create table blocks (
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),

  primary key (blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id != blocked_id)
);

-- Create indexes for blocks
create index blocks_blocker_id_idx on blocks(blocker_id);
create index blocks_blocked_id_idx on blocks(blocked_id);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
create table reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) on delete set null,
  reported_id uuid references profiles(id) on delete set null,
  reason text not null,
  details text,
  created_at timestamp with time zone default now(),

  constraint reason_length check (char_length(reason) >= 1 and char_length(reason) <= 100)
);

-- Create indexes for reports
create index reports_reporter_id_idx on reports(reporter_id);
create index reports_reported_id_idx on reports(reported_id);
create index reports_created_at_idx on reports(created_at desc);

-- ============================================================================
-- PROFILE_VIEWS TABLE
-- ============================================================================
create table profile_views (
  id uuid default uuid_generate_v4() primary key,
  viewer_id uuid references profiles(id) on delete cascade not null,
  viewed_id uuid references profiles(id) on delete cascade not null,
  viewed_at timestamp with time zone default now(),

  constraint cannot_view_self check (viewer_id != viewed_id)
);

-- Create indexes for profile_views
create index profile_views_viewer_id_idx on profile_views(viewer_id);
create index profile_views_viewed_id_idx on profile_views(viewed_id);
create index profile_views_viewed_at_idx on profile_views(viewed_at desc);

-- ============================================================================
-- PHOTOS TABLE
-- ============================================================================
create table photos (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  url text not null,
  is_primary boolean default false,
  is_nsfw boolean default false,
  created_at timestamp with time zone default now()
);

-- Create indexes for photos
create index photos_profile_id_idx on photos(profile_id);
create index photos_is_primary_idx on photos(is_primary) where is_primary = true;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle updated_at timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to update conversation updated_at when message is sent
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

-- Function to ensure only one primary photo per profile
create or replace function ensure_single_primary_photo()
returns trigger as $$
begin
  if new.is_primary = true then
    update photos
    set is_primary = false
    where profile_id = new.profile_id and id != new.id;
  end if;
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function handle_updated_at();

-- Trigger for conversations updated_at
create trigger update_conversations_updated_at
  before update on conversations
  for each row
  execute function handle_updated_at();

-- Trigger to update conversation timestamp on new message
create trigger update_conversation_on_message
  after insert on messages
  for each row
  execute function update_conversation_timestamp();

-- Trigger to ensure single primary photo
create trigger ensure_single_primary_photo_trigger
  before insert or update on photos
  for each row
  when (new.is_primary = true)
  execute function ensure_single_primary_photo();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table locations enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table profile_views enable row level security;
alter table photos enable row level security;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view profiles that haven't blocked them and aren't in ghost mode from blocked users
create policy "Users can view non-blocked profiles"
  on profiles for select
  using (
    auth.uid() is not null
    and (
      -- Can always view own profile
      id = auth.uid()
      or (
        -- Can view others if not blocked and target not in ghost mode when viewer is blocked
        not exists (
          select 1 from blocks
          where (blocker_id = id and blocked_id = auth.uid())
        )
        and (
          ghost_mode = false
          or not exists (
            select 1 from blocks
            where blocker_id = auth.uid() and blocked_id = id
          )
        )
      )
    )
  );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can delete their own profile
create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- ============================================================================
-- LOCATIONS POLICIES
-- ============================================================================

-- Anyone can view active locations
create policy "Anyone can view active locations"
  on locations for select
  using (auth.uid() is not null and is_active = true);

-- Authenticated users can create locations
create policy "Authenticated users can create locations"
  on locations for insert
  with check (auth.uid() is not null and created_by = auth.uid());

-- Users can update their own locations
create policy "Users can update own locations"
  on locations for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Users can delete their own locations
create policy "Users can delete own locations"
  on locations for delete
  using (auth.uid() = created_by);

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================

-- Users can view conversations they're part of
create policy "Users can view own conversations"
  on conversations for select
  using (
    auth.uid() is not null
    and (participant_1 = auth.uid() or participant_2 = auth.uid())
  );

-- Users can create conversations
create policy "Users can create conversations"
  on conversations for insert
  with check (
    auth.uid() is not null
    and (participant_1 = auth.uid() or participant_2 = auth.uid())
    -- Prevent creating conversations with blocked users
    and not exists (
      select 1 from blocks
      where (blocker_id = participant_1 and blocked_id = participant_2)
         or (blocker_id = participant_2 and blocked_id = participant_1)
    )
  );

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Users can view messages in their conversations
create policy "Users can view own messages"
  on messages for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (participant_1 = auth.uid() or participant_2 = auth.uid())
    )
  );

-- Users can send messages in their conversations
create policy "Users can send messages"
  on messages for insert
  with check (
    auth.uid() is not null
    and sender_id = auth.uid()
    and exists (
      select 1 from conversations
      where conversations.id = conversation_id
      and (participant_1 = auth.uid() or participant_2 = auth.uid())
    )
  );

-- Users can update their own messages (for read receipts)
create policy "Users can update messages in their conversations"
  on messages for update
  using (
    auth.uid() is not null
    and exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and (participant_1 = auth.uid() or participant_2 = auth.uid())
    )
  );

-- ============================================================================
-- BLOCKS POLICIES
-- ============================================================================

-- Users can view blocks they created
create policy "Users can view own blocks"
  on blocks for select
  using (auth.uid() = blocker_id);

-- Users can create blocks
create policy "Users can create blocks"
  on blocks for insert
  with check (auth.uid() = blocker_id);

-- Users can delete their own blocks
create policy "Users can delete own blocks"
  on blocks for delete
  using (auth.uid() = blocker_id);

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

-- Users can view their own reports
create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = reporter_id);

-- Users can create reports
create policy "Users can create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

-- ============================================================================
-- PROFILE_VIEWS POLICIES
-- ============================================================================

-- Users can view who viewed their profile
create policy "Users can see who viewed them"
  on profile_views for select
  using (auth.uid() = viewed_id);

-- Users can create profile views
create policy "Users can create profile views"
  on profile_views for insert
  with check (auth.uid() = viewer_id);

-- ============================================================================
-- PHOTOS POLICIES
-- ============================================================================

-- Users can view photos of profiles they can see
create policy "Users can view photos of visible profiles"
  on photos for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from profiles
      where profiles.id = photos.profile_id
    )
  );

-- Users can manage their own photos
create policy "Users can insert own photos"
  on photos for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own photos"
  on photos for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users can delete own photos"
  on photos for delete
  using (auth.uid() = profile_id);

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for messages and profiles
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table conversations;

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Function to get nearby profiles
create or replace function get_nearby_profiles(
  user_location geography,
  radius_meters float default 5000,
  limit_count int default 50
)
returns setof profiles as $$
begin
  return query
  select p.*
  from profiles p
  where p.id != auth.uid()
    and p.location is not null
    and p.is_online = true
    and p.ghost_mode = false
    and st_dwithin(p.location, user_location, radius_meters)
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = p.id and b.blocked_id = auth.uid())
         or (b.blocker_id = auth.uid() and b.blocked_id = p.id)
    )
  order by p.location <-> user_location
  limit limit_count;
end;
$$ language plpgsql security definer;

-- Function to get nearby locations
create or replace function get_nearby_locations(
  user_location geography,
  radius_meters float default 10000,
  limit_count int default 50
)
returns setof locations as $$
begin
  return query
  select l.*
  from locations l
  where l.is_active = true
    and st_dwithin(l.coordinates, user_location, radius_meters)
  order by l.coordinates <-> user_location
  limit limit_count;
end;
$$ language plpgsql security definer;

-- Function to get or create conversation
create or replace function get_or_create_conversation(
  other_user_id uuid
)
returns uuid as $$
declare
  conversation_id uuid;
  user1 uuid;
  user2 uuid;
begin
  -- Check if blocked
  if exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = other_user_id)
       or (blocker_id = other_user_id and blocked_id = auth.uid())
  ) then
    raise exception 'Cannot create conversation with blocked user';
  end if;

  -- Order participants to maintain uniqueness constraint
  if auth.uid() < other_user_id then
    user1 := auth.uid();
    user2 := other_user_id;
  else
    user1 := other_user_id;
    user2 := auth.uid();
  end if;

  -- Try to get existing conversation
  select id into conversation_id
  from conversations
  where participant_1 = user1 and participant_2 = user2;

  -- Create if doesn't exist
  if conversation_id is null then
    insert into conversations (participant_1, participant_2)
    values (user1, user2)
    returning id into conversation_id;
  end if;

  return conversation_id;
end;
$$ language plpgsql security definer;
