-- Albums System Migration
-- Adds tables for private photo/video albums with time-limited access sharing

-- ============================================
-- ENUM TYPES
-- ============================================

create type album_item_type as enum ('photo', 'video');

-- ============================================
-- TABLES
-- ============================================

-- Albums: Container for photos/videos
create table albums (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  cover_url text,
  item_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint album_name_length check (char_length(name) >= 1 and char_length(name) <= 50)
);

create index albums_owner_id_idx on albums(owner_id);
create index albums_created_at_idx on albums(created_at desc);

-- Album items: Photos and videos within albums
create table album_items (
  id uuid default uuid_generate_v4() primary key,
  album_id uuid references albums(id) on delete cascade not null,
  type album_item_type not null default 'photo',
  url text not null,
  thumbnail_url text,
  duration_seconds integer,
  file_size_bytes integer,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),

  constraint video_duration_limit check (
    (type = 'photo' and duration_seconds is null) or
    (type = 'video' and duration_seconds is not null and duration_seconds <= 30)
  )
);

create index album_items_album_id_idx on album_items(album_id);
create index album_items_sort_order_idx on album_items(album_id, sort_order);

-- Album access grants: Who can view which albums
create table album_access_grants (
  id uuid default uuid_generate_v4() primary key,
  album_id uuid references albums(id) on delete cascade not null,
  granted_by uuid references profiles(id) on delete cascade not null,
  granted_to uuid references profiles(id) on delete cascade not null,
  conversation_id uuid references conversations(id) on delete set null,
  granted_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  is_locked boolean default false,

  constraint different_users check (granted_by != granted_to),
  constraint unique_album_grant unique(album_id, granted_to)
);

create index album_access_grants_album_id_idx on album_access_grants(album_id);
create index album_access_grants_granted_to_idx on album_access_grants(granted_to);
create index album_access_grants_granted_by_idx on album_access_grants(granted_by);
create index album_access_grants_expires_at_idx on album_access_grants(expires_at)
  where expires_at is not null and is_locked = false;

-- ============================================
-- EXTEND MESSAGES TABLE
-- ============================================

alter table messages add column if not exists album_share jsonb;

create index messages_album_share_idx on messages using gin(album_share)
  where album_share is not null;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if a user has access to an album
create or replace function has_album_access(p_album_id uuid, p_user_id uuid)
returns boolean as $$
begin
  -- Owner always has access
  if exists (select 1 from albums where id = p_album_id and owner_id = p_user_id) then
    return true;
  end if;

  -- Check for valid grant
  return exists (
    select 1 from album_access_grants
    where album_id = p_album_id
      and granted_to = p_user_id
      and is_locked = false
      and (expires_at is null or expires_at > now())
  );
end;
$$ language plpgsql security definer;

-- Function to calculate expiration based on recipient's subscription tier
create or replace function calculate_album_access_expiration(p_recipient_id uuid)
returns timestamp with time zone as $$
declare
  v_tier text;
begin
  -- Get recipient's subscription tier from profiles
  select coalesce(subscription_tier, 'free') into v_tier
  from profiles where id = p_recipient_id;

  case v_tier
    when 'premium_plus' then
      return null;  -- Never expires
    when 'premium' then
      return now() + interval '48 hours';
    else  -- 'free' or any other
      return now() + interval '12 hours';
  end case;
end;
$$ language plpgsql security definer;

-- Function to grant album access with automatic expiration
create or replace function grant_album_access(
  p_album_id uuid,
  p_recipient_id uuid,
  p_conversation_id uuid
)
returns uuid as $$
declare
  v_grant_id uuid;
  v_expires_at timestamp with time zone;
  v_owner_id uuid;
begin
  -- Verify caller owns the album
  select owner_id into v_owner_id from albums where id = p_album_id;
  if v_owner_id is null or v_owner_id != auth.uid() then
    raise exception 'Not authorized to grant access to this album';
  end if;

  -- Calculate expiration based on recipient's tier
  v_expires_at := calculate_album_access_expiration(p_recipient_id);

  -- Upsert the grant (update expiration if already exists)
  insert into album_access_grants (album_id, granted_by, granted_to, conversation_id, expires_at, is_locked)
  values (p_album_id, auth.uid(), p_recipient_id, p_conversation_id, v_expires_at, false)
  on conflict (album_id, granted_to) do update set
    granted_at = now(),
    expires_at = v_expires_at,
    is_locked = false,
    conversation_id = p_conversation_id
  returning id into v_grant_id;

  return v_grant_id;
end;
$$ language plpgsql security definer;

-- Trigger to update album item_count
create or replace function update_album_item_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update albums set item_count = item_count + 1, updated_at = now()
    where id = NEW.album_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update albums set item_count = item_count - 1, updated_at = now()
    where id = OLD.album_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger album_items_count_trigger
  after insert or delete on album_items
  for each row execute function update_album_item_count();

-- Trigger to set cover_url from first item
create or replace function update_album_cover()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    -- Set cover if album doesn't have one
    update albums
    set cover_url = NEW.thumbnail_url
    where id = NEW.album_id and cover_url is null;

    -- If no thumbnail (photo), use url directly
    if NEW.thumbnail_url is null then
      update albums
      set cover_url = NEW.url
      where id = NEW.album_id and cover_url is null;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    -- Reset cover if deleted item was the cover
    if exists (select 1 from albums where id = OLD.album_id and cover_url = OLD.url) or
       exists (select 1 from albums where id = OLD.album_id and cover_url = OLD.thumbnail_url) then
      update albums
      set cover_url = (
        select coalesce(thumbnail_url, url) from album_items
        where album_id = OLD.album_id
        order by sort_order, created_at
        limit 1
      )
      where id = OLD.album_id;
    end if;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger album_cover_trigger
  after insert or delete on album_items
  for each row execute function update_album_cover();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table albums enable row level security;
alter table album_items enable row level security;
alter table album_access_grants enable row level security;

-- Albums policies
create policy "Users can view accessible albums"
  on albums for select
  using (
    owner_id = auth.uid() or
    has_album_access(id, auth.uid())
  );

create policy "Users can create own albums"
  on albums for insert
  with check (owner_id = auth.uid());

create policy "Users can update own albums"
  on albums for update
  using (owner_id = auth.uid());

create policy "Users can delete own albums"
  on albums for delete
  using (owner_id = auth.uid());

-- Album items policies
create policy "Users can view accessible album items"
  on album_items for select
  using (
    exists (
      select 1 from albums
      where albums.id = album_items.album_id
      and (owner_id = auth.uid() or has_album_access(albums.id, auth.uid()))
    )
  );

create policy "Users can add items to own albums"
  on album_items for insert
  with check (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );

create policy "Users can update items in own albums"
  on album_items for update
  using (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );

create policy "Users can delete items from own albums"
  on album_items for delete
  using (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );

-- Album access grants policies
create policy "Users can view grants they made or received"
  on album_access_grants for select
  using (granted_by = auth.uid() or granted_to = auth.uid());

create policy "Users can create grants for own albums"
  on album_access_grants for insert
  with check (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );

create policy "Album owners can update grants"
  on album_access_grants for update
  using (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );

create policy "Album owners can delete grants"
  on album_access_grants for delete
  using (
    exists (select 1 from albums where id = album_id and owner_id = auth.uid())
  );
