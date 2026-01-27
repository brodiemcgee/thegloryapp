-- Beta Tester Invitation System Migration
-- Adds tables for beta invitations, tester tracking, activity logs, and feedback

-- ============================================
-- ENUM TYPES
-- ============================================

create type beta_invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type beta_tester_status as enum ('active', 'completed', 'dropped');
create type beta_feedback_type as enum ('bug', 'feedback', 'suggestion');
create type beta_feedback_status as enum ('open', 'reviewed', 'resolved');

-- ============================================
-- TABLES
-- ============================================

-- Beta invitations sent by admins
create table beta_invitations (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  email text not null,
  status beta_invitation_status default 'pending',
  invited_by uuid references admin_roles(id) on delete set null,
  accepted_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  accepted_at timestamp with time zone,

  constraint code_format check (char_length(code) = 6)
);

create index beta_invitations_code_idx on beta_invitations(code);
create index beta_invitations_email_idx on beta_invitations(email);
create index beta_invitations_status_idx on beta_invitations(status);
create index beta_invitations_invited_by_idx on beta_invitations(invited_by);

-- Active beta testers with progress tracking
create table beta_testers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  invitation_id uuid references beta_invitations(id) on delete set null,
  status beta_tester_status default 'active',
  start_date timestamp with time zone default now(),
  weeks_completed integer default 0,
  lifetime_premium_granted boolean default false,
  granted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index beta_testers_user_id_idx on beta_testers(user_id);
create index beta_testers_status_idx on beta_testers(status);
create index beta_testers_invitation_id_idx on beta_testers(invitation_id);

-- Weekly activity tracking
create table beta_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  tester_id uuid references beta_testers(id) on delete cascade not null,
  week_number integer not null,
  week_start timestamp with time zone not null,
  week_end timestamp with time zone not null,
  messages_sent integer default 0,
  profiles_viewed integer default 0,
  photos_uploaded integer default 0,
  activity_score integer default 0,
  meets_requirement boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint valid_week_number check (week_number >= 1 and week_number <= 10),
  unique(tester_id, week_number)
);

create index beta_activity_logs_tester_id_idx on beta_activity_logs(tester_id);
create index beta_activity_logs_week_number_idx on beta_activity_logs(week_number);

-- Bug reports and feedback from testers
create table beta_feedback (
  id uuid default uuid_generate_v4() primary key,
  tester_id uuid references beta_testers(id) on delete cascade not null,
  type beta_feedback_type not null,
  title text not null,
  description text not null,
  screenshot_url text,
  status beta_feedback_status default 'open',
  admin_notes text,
  resolved_by uuid references admin_roles(id) on delete set null,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index beta_feedback_tester_id_idx on beta_feedback(tester_id);
create index beta_feedback_type_idx on beta_feedback(type);
create index beta_feedback_status_idx on beta_feedback(status);
create index beta_feedback_created_at_idx on beta_feedback(created_at desc);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique 6-char beta invite code (alphanumeric)
create or replace function generate_beta_invite_code()
returns text as $$
declare
  new_code text;
  code_exists boolean;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars: 0, O, I, 1
begin
  loop
    -- Generate 6-char code from allowed characters
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from beta_invitations where code = new_code) into code_exists;

    exit when not code_exists;
  end loop;

  return new_code;
end;
$$ language plpgsql;

-- Function to calculate activity score
-- Messages: 2 pts each, Profile views: 1 pt each, Photos: 5 pts each
-- Weekly requirement: 60 points minimum
create or replace function calculate_beta_activity_score(
  p_messages integer,
  p_profiles integer,
  p_photos integer
)
returns integer as $$
begin
  return (p_messages * 2) + (p_profiles * 1) + (p_photos * 5);
end;
$$ language plpgsql immutable;

-- Function to update beta engagement (called on user activity)
create or replace function update_beta_engagement(
  p_user_id uuid,
  p_action text -- 'message', 'profile_view', 'photo'
)
returns void as $$
declare
  v_tester_id uuid;
  v_current_week integer;
  v_week_start timestamp with time zone;
  v_week_end timestamp with time zone;
  v_start_date timestamp with time zone;
begin
  -- Get active beta tester record
  select id, start_date into v_tester_id, v_start_date
  from beta_testers
  where user_id = p_user_id and status = 'active';

  if v_tester_id is null then
    return; -- User is not an active beta tester
  end if;

  -- Calculate current week number (1-10)
  v_current_week := greatest(1, least(10,
    ceil(extract(epoch from (now() - v_start_date)) / (7 * 24 * 60 * 60))::integer
  ));

  -- Calculate week boundaries
  v_week_start := v_start_date + ((v_current_week - 1) * interval '7 days');
  v_week_end := v_week_start + interval '7 days';

  -- Insert or update activity log
  insert into beta_activity_logs (tester_id, week_number, week_start, week_end)
  values (v_tester_id, v_current_week, v_week_start, v_week_end)
  on conflict (tester_id, week_number) do nothing;

  -- Update the appropriate counter
  if p_action = 'message' then
    update beta_activity_logs
    set messages_sent = messages_sent + 1,
        activity_score = calculate_beta_activity_score(messages_sent + 1, profiles_viewed, photos_uploaded),
        meets_requirement = calculate_beta_activity_score(messages_sent + 1, profiles_viewed, photos_uploaded) >= 60,
        updated_at = now()
    where tester_id = v_tester_id and week_number = v_current_week;
  elsif p_action = 'profile_view' then
    update beta_activity_logs
    set profiles_viewed = profiles_viewed + 1,
        activity_score = calculate_beta_activity_score(messages_sent, profiles_viewed + 1, photos_uploaded),
        meets_requirement = calculate_beta_activity_score(messages_sent, profiles_viewed + 1, photos_uploaded) >= 60,
        updated_at = now()
    where tester_id = v_tester_id and week_number = v_current_week;
  elsif p_action = 'photo' then
    update beta_activity_logs
    set photos_uploaded = photos_uploaded + 1,
        activity_score = calculate_beta_activity_score(messages_sent, profiles_viewed, photos_uploaded + 1),
        meets_requirement = calculate_beta_activity_score(messages_sent, profiles_viewed, photos_uploaded + 1) >= 60,
        updated_at = now()
    where tester_id = v_tester_id and week_number = v_current_week;
  end if;
end;
$$ language plpgsql security definer;

-- Function to update weeks_completed count
create or replace function update_beta_weeks_completed()
returns trigger as $$
begin
  -- When a week becomes complete (meets_requirement = true), update the tester's count
  if new.meets_requirement = true and (old is null or old.meets_requirement = false) then
    update beta_testers
    set weeks_completed = (
      select count(*) from beta_activity_logs
      where tester_id = new.tester_id and meets_requirement = true
    )
    where id = new.tester_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update weeks_completed on activity log changes
create trigger update_weeks_completed_trigger
  after insert or update of meets_requirement on beta_activity_logs
  for each row
  execute function update_beta_weeks_completed();

-- Function to grant lifetime premium to a beta tester
create or replace function grant_beta_lifetime_premium(p_tester_id uuid)
returns boolean as $$
declare
  v_user_id uuid;
  v_weeks_completed integer;
begin
  -- Get tester info
  select user_id, weeks_completed into v_user_id, v_weeks_completed
  from beta_testers
  where id = p_tester_id and status = 'active';

  if v_user_id is null then
    return false;
  end if;

  -- Check if requirements are met (10 weeks completed)
  if v_weeks_completed < 10 then
    return false;
  end if;

  -- Grant lifetime premium
  update beta_testers
  set status = 'completed',
      lifetime_premium_granted = true,
      granted_at = now()
  where id = p_tester_id;

  -- Also update/create subscription record for immediate effect
  insert into subscriptions (user_id, tier, status, price_cents)
  values (v_user_id, 'premium', 'active', 0)
  on conflict (user_id) do update
  set tier = 'premium',
      status = 'active',
      price_cents = 0,
      updated_at = now();

  return true;
end;
$$ language plpgsql security definer;

-- Function to check and expire old invitations
create or replace function expire_old_beta_invitations()
returns void as $$
begin
  update beta_invitations
  set status = 'expired'
  where status = 'pending' and expires_at < now();
end;
$$ language plpgsql security definer;

-- Function to accept a beta invitation
create or replace function accept_beta_invitation(
  p_code text,
  p_user_id uuid
)
returns uuid as $$ -- Returns the new beta_tester id
declare
  v_invitation_id uuid;
  v_tester_id uuid;
begin
  -- Find and validate the invitation
  select id into v_invitation_id
  from beta_invitations
  where code = upper(p_code)
    and status = 'pending'
    and expires_at > now();

  if v_invitation_id is null then
    return null; -- Invalid or expired code
  end if;

  -- Mark invitation as accepted
  update beta_invitations
  set status = 'accepted',
      accepted_by = p_user_id,
      accepted_at = now()
  where id = v_invitation_id;

  -- Create beta tester record
  insert into beta_testers (user_id, invitation_id)
  values (p_user_id, v_invitation_id)
  returning id into v_tester_id;

  return v_tester_id;
end;
$$ language plpgsql security definer;

-- Function to check if a user is a beta tester with lifetime premium
create or replace function has_beta_lifetime_premium(p_user_id uuid)
returns boolean as $$
declare
  v_has_premium boolean;
begin
  select lifetime_premium_granted into v_has_premium
  from beta_testers
  where user_id = p_user_id and lifetime_premium_granted = true;

  return coalesce(v_has_premium, false);
end;
$$ language plpgsql security definer;

-- ============================================
-- TRIGGERS FOR ACTIVITY TRACKING
-- ============================================

-- Trigger function to track message activity
create or replace function track_beta_message_activity()
returns trigger as $$
begin
  perform update_beta_engagement(new.sender_id, 'message');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger function to track profile view activity
create or replace function track_beta_profile_view_activity()
returns trigger as $$
begin
  perform update_beta_engagement(new.viewer_id, 'profile_view');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger function to track photo upload activity
create or replace function track_beta_photo_activity()
returns trigger as $$
begin
  perform update_beta_engagement(new.user_id, 'photo');
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers on relevant tables (if they exist)
-- Note: These triggers will be created conditionally based on table existence

do $$
begin
  -- Trigger on messages table
  if exists (select 1 from information_schema.tables where table_name = 'messages') then
    drop trigger if exists track_beta_message_trigger on messages;
    create trigger track_beta_message_trigger
      after insert on messages
      for each row
      execute function track_beta_message_activity();
  end if;

  -- Trigger on profile_views table
  if exists (select 1 from information_schema.tables where table_name = 'profile_views') then
    drop trigger if exists track_beta_profile_view_trigger on profile_views;
    create trigger track_beta_profile_view_trigger
      after insert on profile_views
      for each row
      execute function track_beta_profile_view_activity();
  end if;

  -- Trigger on photos table
  if exists (select 1 from information_schema.tables where table_name = 'photos') then
    drop trigger if exists track_beta_photo_trigger on photos;
    create trigger track_beta_photo_trigger
      after insert on photos
      for each row
      execute function track_beta_photo_activity();
  end if;
end $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table beta_invitations enable row level security;
alter table beta_testers enable row level security;
alter table beta_activity_logs enable row level security;
alter table beta_feedback enable row level security;

-- Beta invitations: Admins can manage, public can view by code (for validation)
create policy "Admins can view all beta invitations"
  on beta_invitations for select
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Admins can insert beta invitations"
  on beta_invitations for insert
  with check (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Admins can update beta invitations"
  on beta_invitations for update
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Public can view pending invitations by code"
  on beta_invitations for select
  using (status = 'pending');

-- Beta testers: Users can view their own, admins can view all
create policy "Users can view own beta tester record"
  on beta_testers for select
  using (auth.uid() = user_id);

create policy "Admins can view all beta testers"
  on beta_testers for select
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Admins can update beta testers"
  on beta_testers for update
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Service can insert beta testers"
  on beta_testers for insert
  with check (true);

-- Beta activity logs: Users can view their own, admins can view all
create policy "Users can view own activity logs"
  on beta_activity_logs for select
  using (
    exists (
      select 1 from beta_testers
      where id = beta_activity_logs.tester_id and user_id = auth.uid()
    )
  );

create policy "Admins can view all activity logs"
  on beta_activity_logs for select
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

-- Beta feedback: Users can manage their own, admins can view/update all
create policy "Users can insert own feedback"
  on beta_feedback for insert
  with check (
    exists (
      select 1 from beta_testers
      where id = beta_feedback.tester_id and user_id = auth.uid()
    )
  );

create policy "Users can view own feedback"
  on beta_feedback for select
  using (
    exists (
      select 1 from beta_testers
      where id = beta_feedback.tester_id and user_id = auth.uid()
    )
  );

create policy "Admins can view all feedback"
  on beta_feedback for select
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Admins can update feedback"
  on beta_feedback for update
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );
