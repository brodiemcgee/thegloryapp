-- Referral System Migration
-- Adds tables for referral codes, referral tracking, credit transactions, and subscriptions

-- ============================================
-- ENUM TYPES
-- ============================================

create type credit_transaction_type as enum ('referral_earning', 'subscription_payment', 'manual_adjustment');
create type subscription_tier_type as enum ('free', 'premium', 'premium_plus');
create type subscription_status_type as enum ('active', 'cancelled', 'past_due', 'trialing');

-- ============================================
-- TABLES
-- ============================================

-- Referral codes: Each user gets a unique referral code
create table referral_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  code text unique not null,
  created_at timestamp with time zone default now(),

  constraint code_format check (char_length(code) >= 6 and char_length(code) <= 12)
);

create index referral_codes_user_id_idx on referral_codes(user_id);
create index referral_codes_code_idx on referral_codes(code);

-- Referrals: Tracks who referred whom
create table referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references profiles(id) on delete cascade not null,
  referred_id uuid references profiles(id) on delete cascade not null unique,
  referral_code_used text not null,
  created_at timestamp with time zone default now(),

  constraint cannot_refer_self check (referrer_id != referred_id)
);

create index referrals_referrer_id_idx on referrals(referrer_id);
create index referrals_referred_id_idx on referrals(referred_id);

-- Credit transactions: Ledger of all credit earnings and usage
create table credit_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount_cents integer not null,  -- positive for earnings, negative for usage
  transaction_type credit_transaction_type not null,
  referral_id uuid references referrals(id) on delete set null,
  subscription_period_start timestamp with time zone,
  subscription_period_end timestamp with time zone,
  description text,
  created_at timestamp with time zone default now()
);

create index credit_transactions_user_id_idx on credit_transactions(user_id);
create index credit_transactions_created_at_idx on credit_transactions(created_at desc);
create index credit_transactions_referral_id_idx on credit_transactions(referral_id);

-- Subscriptions: Track subscription state in database
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  tier subscription_tier_type not null default 'free',
  status subscription_status_type not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  price_cents integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index subscriptions_user_id_idx on subscriptions(user_id);
create index subscriptions_stripe_subscription_id_idx on subscriptions(stripe_subscription_id);
create index subscriptions_status_idx on subscriptions(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique referral code (8-char alphanumeric)
create or replace function generate_referral_code()
returns text as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    -- Generate 8-char uppercase alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));

    select exists(select 1 from referral_codes where code = new_code) into code_exists;

    exit when not code_exists;
  end loop;

  return new_code;
end;
$$ language plpgsql;

-- Function to get user's credit balance
create or replace function get_credit_balance(p_user_id uuid)
returns integer as $$
declare
  balance integer;
begin
  select coalesce(sum(amount_cents), 0) into balance
  from credit_transactions
  where user_id = p_user_id;

  return balance;
end;
$$ language plpgsql security definer;

-- Function to create referral code for user (called by trigger)
create or replace function ensure_referral_code()
returns trigger as $$
begin
  insert into referral_codes (user_id, code)
  values (new.id, generate_referral_code())
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create referral code on profile creation
create trigger create_referral_code_on_profile
  after insert on profiles
  for each row
  execute function ensure_referral_code();

-- Function to process monthly referral credits (called when subscription renews)
create or replace function process_referral_credits(
  p_subscription_id uuid,
  p_period_start timestamp with time zone,
  p_period_end timestamp with time zone
)
returns void as $$
declare
  v_subscriber_id uuid;
  v_referrer_id uuid;
  v_price_cents integer;
  v_credit_amount integer;
  v_referral_id uuid;
  v_referred_username text;
begin
  -- Get subscription details
  select user_id, price_cents into v_subscriber_id, v_price_cents
  from subscriptions
  where id = p_subscription_id and status = 'active';

  if v_subscriber_id is null or v_price_cents = 0 then
    return;
  end if;

  -- Check if this user was referred
  select r.id, r.referrer_id into v_referral_id, v_referrer_id
  from referrals r
  where r.referred_id = v_subscriber_id;

  if v_referrer_id is null then
    return;
  end if;

  -- Calculate 10% credit (round down)
  v_credit_amount := (v_price_cents * 10) / 100;

  if v_credit_amount = 0 then
    return;
  end if;

  -- Check if credit already exists for this period (prevent duplicates)
  if exists (
    select 1 from credit_transactions
    where referral_id = v_referral_id
      and subscription_period_start = p_period_start
      and transaction_type = 'referral_earning'
  ) then
    return;
  end if;

  -- Get referred user's username for description
  select username into v_referred_username
  from profiles
  where id = v_subscriber_id;

  -- Insert credit for referrer
  insert into credit_transactions (
    user_id,
    amount_cents,
    transaction_type,
    referral_id,
    subscription_period_start,
    subscription_period_end,
    description
  ) values (
    v_referrer_id,
    v_credit_amount,
    'referral_earning',
    v_referral_id,
    p_period_start,
    p_period_end,
    'Referral credit from ' || coalesce(v_referred_username, 'user') || '''s subscription'
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table credit_transactions enable row level security;
alter table subscriptions enable row level security;

-- Referral codes: users can view their own
create policy "Users can view own referral code"
  on referral_codes for select
  using (auth.uid() = user_id);

-- Referrals: users can view referrals they made
create policy "Users can view referrals they made"
  on referrals for select
  using (auth.uid() = referrer_id);

-- Referrals: service role can insert (for signup flow)
create policy "Service can insert referrals"
  on referrals for insert
  with check (true);

-- Credit transactions: users can view their own
create policy "Users can view own credit transactions"
  on credit_transactions for select
  using (auth.uid() = user_id);

-- Subscriptions: users can view their own
create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Subscriptions: users can update their own
create policy "Users can update own subscription"
  on subscriptions for update
  using (auth.uid() = user_id);

-- Subscriptions: users can insert their own
create policy "Users can insert own subscription"
  on subscriptions for insert
  with check (auth.uid() = user_id);

-- ============================================
-- GENERATE REFERRAL CODES FOR EXISTING USERS
-- ============================================

-- Create referral codes for any existing profiles that don't have one
insert into referral_codes (user_id, code)
select p.id, generate_referral_code()
from profiles p
where not exists (
  select 1 from referral_codes rc where rc.user_id = p.id
);
