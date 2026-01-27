-- Beta Capacity Settings Migration
-- Adds settings table for managing beta tester capacity

-- ============================================
-- SETTINGS TABLE
-- ============================================

-- Beta program settings (singleton table)
create table beta_settings (
  id integer primary key default 1 check (id = 1), -- Ensures only one row
  max_testers integer default 50,
  is_open boolean default true,
  updated_at timestamp with time zone default now(),
  updated_by uuid references admin_roles(id) on delete set null
);

-- Insert default settings
insert into beta_settings (id, max_testers, is_open) values (1, 50, true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get beta program status (public, no auth required)
create or replace function get_beta_status()
returns json as $$
declare
  v_max_testers integer;
  v_is_open boolean;
  v_current_count integer;
  v_spots_available integer;
begin
  -- Get settings
  select max_testers, is_open into v_max_testers, v_is_open
  from beta_settings
  where id = 1;

  -- Count current active testers
  select count(*) into v_current_count
  from beta_testers
  where status in ('active', 'completed');

  -- Calculate spots available
  v_spots_available := greatest(0, v_max_testers - v_current_count);

  return json_build_object(
    'is_open', v_is_open and v_spots_available > 0,
    'max_testers', v_max_testers,
    'current_count', v_current_count,
    'spots_available', v_spots_available,
    'is_full', v_spots_available = 0
  );
end;
$$ language plpgsql security definer;

-- Function to join beta program (no invitation code needed)
create or replace function join_beta_program(p_user_id uuid)
returns json as $$
declare
  v_status json;
  v_tester_id uuid;
  v_existing_tester uuid;
begin
  -- Check if user is already a beta tester
  select id into v_existing_tester
  from beta_testers
  where user_id = p_user_id;

  if v_existing_tester is not null then
    return json_build_object(
      'success', false,
      'error', 'already_enrolled',
      'message', 'You are already enrolled in the beta program'
    );
  end if;

  -- Get current beta status
  v_status := get_beta_status();

  -- Check if program is open and has spots
  if not (v_status->>'is_open')::boolean then
    return json_build_object(
      'success', false,
      'error', 'program_full',
      'message', 'The beta program is currently full. Please check back later.'
    );
  end if;

  -- Create beta tester record
  insert into beta_testers (user_id)
  values (p_user_id)
  returning id into v_tester_id;

  return json_build_object(
    'success', true,
    'tester_id', v_tester_id,
    'message', 'Welcome to the beta program!'
  );
end;
$$ language plpgsql security definer;

-- Function to update beta settings (admin only)
create or replace function update_beta_settings(
  p_max_testers integer default null,
  p_is_open boolean default null
)
returns json as $$
declare
  v_admin_id uuid;
begin
  -- Get admin role id
  select id into v_admin_id
  from admin_roles
  where user_id = auth.uid() and status = 'active';

  if v_admin_id is null then
    return json_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Admin access required'
    );
  end if;

  -- Update settings
  update beta_settings
  set max_testers = coalesce(p_max_testers, max_testers),
      is_open = coalesce(p_is_open, is_open),
      updated_at = now(),
      updated_by = v_admin_id
  where id = 1;

  return json_build_object(
    'success', true,
    'message', 'Settings updated'
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table beta_settings enable row level security;

-- Everyone can read settings (needed for splash page)
create policy "Anyone can view beta settings"
  on beta_settings for select
  using (true);

-- Only admins can update settings
create policy "Admins can update beta settings"
  on beta_settings for update
  using (
    exists (
      select 1 from admin_roles
      where user_id = auth.uid() and status = 'active'
    )
  );
