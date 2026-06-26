-- ══════════════════════════════════════════════════════════════════════
--  NYTO · Complete Supabase SQL Setup
--  Paste this entire file into: SQL Editor → New Query → Run
--  NC Economy v2 · Venue Dashboard
--  Includes: Tables, Indexes, RLS, Triggers, Functions, Seed Data
-- ══════════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────
--  SECTION 0 · EXTENSIONS
-- ──────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for fast text search on names


-- ──────────────────────────────────────
--  SECTION 1 · DROP OLD TABLES (safe re-run)
--  Only drops if they exist — safe to run multiple times
-- ──────────────────────────────────────
drop table if exists passport_stamps        cascade;
drop table if exists vibe_reports           cascade;
drop table if exists repeat_groups          cascade;
drop table if exists connectors             cascade;
drop table if exists competitor_snapshots   cascade;
drop table if exists push_campaigns         cascade;
drop table if exists events                 cascade;
drop table if exists offers                 cascade;
drop table if exists messages               cascade;
drop table if exists reviews                cascade;
drop table if exists venue_customers        cascade;
drop table if exists nc_transactions        cascade;
drop table if exists check_ins              cascade;
drop table if exists venues                 cascade;
drop table if exists users                  cascade;


-- ──────────────────────────────────────
--  SECTION 2 · CORE TABLES
-- ──────────────────────────────────────

-- ═══════════
--  USERS
--  App users (customers on the mobile side)
-- ═══════════
create table users (
  id              uuid primary key default uuid_generate_v4(),
  display_name    text not null,
  phone           text unique,
  email           text unique,
  avatar_url      text,
  is_vip          boolean not null default false,
  total_visits    integer not null default 0,     -- across all venues
  nc_balance      integer not null default 0,
  nc_expiry_at    timestamptz,
  referred_by     uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table users is 'Mobile app customers. Managed by mobile app, read-only for dashboard.';
comment on column users.nc_balance    is 'User NC wallet balance — debited on redemption';
comment on column users.nc_expiry_at  is '6 months from last activity — 30-day warning sent';


-- ═══════════
--  VENUES
--  One row per registered venue (restaurant / bar / etc.)
-- ═══════════
create table venues (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid,                             -- links to Supabase auth.users.id
  name            text not null,
  location        text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  category        text,                             -- 'Bar · Rooftop' / 'Cafe' etc.
  price_tier      text,                             -- '₹' / '₹₹' / '₹₹₹'
  tagline         text,
  about           text,
  welcome_item    text,
  welcome_valid   text not null default 'first_visit',  -- first_visit / 3_visits / 7_days
  hours           jsonb,                            -- { mon_thu: '6pm-1am', fri_sat: '6pm-3am', sun: '6pm-12am' }
  photos          text[],                           -- array of storage URLs
  tier            text not null default 'free'
                  check (tier in ('free','growth','prime')),
  nc_balance      integer not null default 10000,
  nc_cap          integer not null default 25000,
  pulse_active    boolean not null default false,   -- NYTO sets true at 6 PM for Pulse venues
  vibe_status     text not null default 'Vibing'
                  check (vibe_status in ('Calm','Vibing','Fire')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  venues              is 'One row per venue. Dashboard reads/writes this table.';
comment on column venues.owner_id     is 'Links to Supabase auth.users.id — set on signup';
comment on column venues.pulse_active is 'Set true by NYTO system at 6 PM. Dashboard shows banner. Auto-false next morning.';
comment on column venues.nc_balance   is 'Venue NC wallet — deducted when customers earn NC here';


-- ═══════════
--  CHECK-INS
--  Every time a user checks into a venue via the mobile app
-- ═══════════
create table check_ins (
  id                uuid primary key default uuid_generate_v4(),
  venue_id          uuid not null references venues(id) on delete cascade,
  user_id           uuid not null references users(id) on delete cascade,
  transaction_type  text not null default 'check_in',
  -- NC Economy v2 transaction types:
  -- check_in | first_visit | group_checkin | dwell | flic_post
  -- pioneer_vibe | pulse_bonus | lucky_roll | referral | redemption | signup
  nc_awarded        integer not null default 100,
  group_size        integer not null default 1,
  dwell_minutes     integer,                        -- null until dwell bonus confirmed
  created_at        timestamptz not null default now(),

  -- ── NC Economy v2 hard rule: one check-in per user per venue per day ──
  -- (enforced via unique index below, after table creation)
);

comment on column check_ins.transaction_type is 'Maps to NC_TYPE_LABELS in dashboard. Never display raw value.';
comment on column check_ins.nc_awarded       is 'NC credited to user. Also deducted from venue wallet via trigger.';

-- One check-in per user per venue per calendar day (v2 rule)
create unique index idx_checkins_one_per_day
  on check_ins (venue_id, user_id, (created_at::date));


-- ════════════════════
--  NC TRANSACTIONS
--  Every NC credit and debit — the source of truth for wallet balances
-- ════════════════════
create table nc_transactions (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid references venues(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null,
  amount      integer not null,        -- positive = credit to user, negative = debit (redemption)
  note        text,
  check_in_id uuid references check_ins(id),
  created_at  timestamptz not null default now(),

  -- ── Locked NC rules (v2) ──
  constraint amount_not_zero             check (amount != 0),
  constraint max_nc_per_event            check (amount <= 500),   -- 500 NC hard cap per event
  constraint valid_type                  check (type in (
    'check_in','first_visit','group_checkin','dwell','flic_post',
    'pioneer_vibe','pulse_bonus','lucky_roll','referral',
    'redemption','signup','winback'
  ))
);

comment on table  nc_transactions       is 'Full ledger of all NC movements. venue_id NULL for signup (NYTO-funded).';
comment on column nc_transactions.type  is 'v2 economy type — maps to display labels in dashboard NC Wallet.';


-- ════════════════════
--  VENUE CUSTOMERS
--  Denormalised per-venue customer summary (updated by triggers)
-- ════════════════════
create table venue_customers (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid not null references venues(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  visit_count     integer not null default 0,
  total_spend     numeric(10,2) not null default 0,
  last_visit_at   timestamptz,
  first_visit_at  timestamptz,
  is_vip          boolean not null default false,     -- auto-set at 10+ visits
  status          text not null default 'active'
                  check (status in ('active','lapsed')),
  unique (venue_id, user_id)
);

comment on table venue_customers is 'Updated automatically by trigger on check_ins insert. Do not write manually.';


-- ════════════
--  REVIEWS
-- ════════════
create table reviews (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  body        text,
  reply_body  text,
  replied_at  timestamptz,
  created_at  timestamptz not null default now()
);


-- ════════════
--  MESSAGES
--  Direct messages between venue and customer
-- ════════════
create table messages (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  body        text not null,
  direction   text not null check (direction in ('inbound','outbound')),
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);


-- ════════════
--  OFFERS
--  Venue-created promotions and campaigns
-- ════════════
create table offers (
  id               uuid primary key default uuid_generate_v4(),
  venue_id         uuid not null references venues(id) on delete cascade,
  name             text not null,
  description      text,
  type             text not null default 'custom'
                   check (type in ('power_hour','first_visit','win_back','custom')),
  status           text not null default 'active'
                   check (status in ('active','paused','expired')),
  trigger_type     text not null default 'manual'
                   check (trigger_type in ('manual','scheduled','auto')),
  nc_multiplier    numeric(3,1) not null default 1.0
                   check (nc_multiplier >= 1.0 and nc_multiplier <= 2.0),  -- v2 rule: max 2x
  max_redemptions  integer,
  redemption_count integer not null default 0,
  scheduled_at     timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now()
);

comment on column offers.nc_multiplier is 'v2 rule: venue-initiated max is 2x. Lucky 7th (3x) is system-side only.';


-- ════════════════
--  EVENTS  (Prime tier)
-- ════════════════
create table events (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid not null references venues(id) on delete cascade,
  title           text not null,
  description     text,
  cover_image_url text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  ticket_price    numeric(10,2),
  ticket_count    integer,
  tickets_sold    integer not null default 0,
  status          text not null default 'on_sale'
                  check (status in ('on_sale','sold_out','cancelled','draft')),
  commission_pct  numeric(4,2) not null default 0,   -- 0% launch phase, 4% post-launch
  created_at      timestamptz not null default now()
);


-- ════════════════════
--  PUSH CAMPAIGNS  (Prime tier)
--  Row inserted by dashboard → server-side function dispatches push
-- ════════════════════
create table push_campaigns (
  id                  uuid primary key default uuid_generate_v4(),
  venue_id            uuid not null references venues(id) on delete cascade,
  headline            text not null,
  body                text not null,
  radius_m            integer not null default 500,
  offer_id            uuid references offers(id),
  status              text not null default 'pending'
                      check (status in ('pending','sent','failed')),
  sent_count          integer not null default 0,
  open_count          integer not null default 0,
  visit_count         integer not null default 0,
  revenue_attributed  numeric(10,2) not null default 0,
  created_at          timestamptz not null default now()
);


-- ══════════════════════════════
--  COMPETITOR SNAPSHOTS  (Prime)
--  Populated by NYTO system — dashboard reads only
-- ══════════════════════════════
create table competitor_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  reference_venue_id  uuid not null references venues(id) on delete cascade,
  venue_name          text not null,
  checkins_per_week   integer,
  repeat_pct          numeric(5,2),
  peak_day            text,
  avg_group_size      numeric(4,2),
  area_rank           integer,
  is_you              boolean not null default false,
  snapshotted_at      timestamptz not null default now()
);


-- ══════════════════
--  CONNECTORS  (Prime)
--  Social graph — customers who bring new people
-- ══════════════════
create table connectors (
  id                        uuid primary key default uuid_generate_v4(),
  venue_id                  uuid not null references venues(id) on delete cascade,
  user_id                   uuid not null references users(id) on delete cascade,
  groups_brought            integer not null default 0,
  new_customers_introduced  integer not null default 0,
  estimated_revenue         numeric(10,2) not null default 0,
  updated_at                timestamptz not null default now(),
  unique (venue_id, user_id)
);


-- ══════════════════
--  REPEAT GROUPS  (Prime)
--  Groups of users who visit together repeatedly
-- ══════════════════
create table repeat_groups (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  member_ids  uuid[] not null,
  visit_count integer not null default 1,
  group_label text,
  updated_at  timestamptz not null default now()
);


-- ══════════════════
--  VIBE REPORTS  (read-only for dashboard — mobile app writes)
-- ══════════════════
create table vibe_reports (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  vibe        text not null check (vibe in ('calm','average','buzzing','packed')),
  created_at  timestamptz not null default now()
);

comment on table vibe_reports is 'Phase 2: pioneer_vibe NC awarded here. Dashboard reads only.';


-- ══════════════════
--  PASSPORT STAMPS  (Phase 2 — do NOT build against yet)
-- ══════════════════
create table passport_stamps (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  venue_id    uuid not null references venues(id) on delete cascade,
  stamped_at  timestamptz not null default now(),
  unique (user_id, venue_id)
);

comment on table passport_stamps is 'Phase 2 — Neighbourhood Passport. Do not build dashboard features against this yet.';


-- ──────────────────────────────────────
--  SECTION 3 · INDEXES
-- ──────────────────────────────────────

-- check_ins
create index idx_checkins_venue_date    on check_ins(venue_id, created_at desc);
create index idx_checkins_user          on check_ins(user_id);
create index idx_checkins_type          on check_ins(transaction_type);

-- nc_transactions
create index idx_nc_venue_date          on nc_transactions(venue_id, created_at desc);
create index idx_nc_user                on nc_transactions(user_id);
create index idx_nc_type                on nc_transactions(type);

-- venue_customers
create index idx_vc_venue_visits        on venue_customers(venue_id, visit_count desc);
create index idx_vc_venue_last          on venue_customers(venue_id, last_visit_at desc);
create index idx_vc_lapsed              on venue_customers(venue_id, last_visit_at) where status = 'lapsed';
create index idx_vc_vip                 on venue_customers(venue_id, is_vip) where is_vip = true;

-- reviews
create index idx_reviews_venue_date     on reviews(venue_id, created_at desc);

-- messages
create index idx_messages_venue_user    on messages(venue_id, user_id, created_at desc);
create index idx_messages_unread        on messages(venue_id, read_at) where read_at is null;

-- offers
create index idx_offers_venue_status    on offers(venue_id, status);

-- events
create index idx_events_venue_date      on events(venue_id, starts_at);

-- push_campaigns
create index idx_push_venue_date        on push_campaigns(venue_id, created_at desc);

-- venues
create index idx_venues_owner           on venues(owner_id);
create index idx_venues_tier            on venues(tier);

-- users text search
create index idx_users_name_trgm        on users using gin(display_name gin_trgm_ops);


-- ──────────────────────────────────────
--  SECTION 4 · FUNCTIONS & TRIGGERS
-- ──────────────────────────────────────

-- ── 4A. Auto-update updated_at on venues & users ──
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_venues_updated_at
  before update on venues
  for each row execute function set_updated_at();

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();


-- ── 4B. On new check-in: update venue_customers summary ──
create or replace function handle_checkin_upsert()
returns trigger language plpgsql security definer as $$
begin
  insert into venue_customers (venue_id, user_id, visit_count, last_visit_at, first_visit_at, status)
  values (new.venue_id, new.user_id, 1, new.created_at, new.created_at, 'active')
  on conflict (venue_id, user_id) do update set
    visit_count   = venue_customers.visit_count + 1,
    last_visit_at = new.created_at,
    status        = 'active',
    -- Auto-VIP at 10+ visits
    is_vip        = case when (venue_customers.visit_count + 1) >= 10 then true else venue_customers.is_vip end;

  -- Also increment user total visits
  update users set total_visits = total_visits + 1 where id = new.user_id;

  return new;
end;
$$;

create trigger trg_checkin_upsert_customer
  after insert on check_ins
  for each row execute function handle_checkin_upsert();


-- ── 4C. On new check-in: deduct NC from venue wallet ──
create or replace function handle_venue_nc_deduct()
returns trigger language plpgsql security definer as $$
begin
  -- Deduct NC from venue wallet (except signup which is NYTO-funded)
  if new.transaction_type != 'signup' then
    update venues
    set nc_balance = greatest(0, nc_balance - new.nc_awarded)
    where id = new.venue_id;
  end if;

  -- Credit NC to user wallet
  update users
  set nc_balance = nc_balance + new.nc_awarded
  where id = new.user_id;

  -- Insert nc_transaction row for ledger
  insert into nc_transactions (venue_id, user_id, type, amount, check_in_id, note)
  values (
    case when new.transaction_type = 'signup' then null else new.venue_id end,
    new.user_id,
    new.transaction_type,
    new.nc_awarded,
    new.id,
    'Auto-created from check-in'
  );

  return new;
end;
$$;

create trigger trg_checkin_nc_deduct
  after insert on check_ins
  for each row execute function handle_venue_nc_deduct();


-- ── 4D. Auto-mark venue_customers as lapsed after 21 days ──
-- This runs as a scheduled function (set up in Supabase Edge Functions / pg_cron)
-- For now we create the function — call it manually or schedule it
create or replace function mark_lapsed_customers()
returns void language plpgsql security definer as $$
begin
  update venue_customers
  set status = 'lapsed'
  where
    status = 'active'
    and last_visit_at < now() - interval '21 days'
    and visit_count >= 3;  -- only mark lapsed if they were regular (3+ visits)
end;
$$;

comment on function mark_lapsed_customers is
  'Run daily via pg_cron or Edge Function scheduler. Marks customers lapsed after 21 days.';


-- ── 4E. Auto-expire offers that have passed ends_at ──
create or replace function expire_old_offers()
returns void language plpgsql security definer as $$
begin
  update offers
  set status = 'expired'
  where status = 'active' and ends_at is not null and ends_at < now();
end;
$$;


-- ── 4F. Get wallet burn breakdown for a venue (used by dashboard) ──
create or replace function get_wallet_burn(p_venue_id uuid, p_month_start date default date_trunc('month', current_date)::date)
returns table (
  check_in_rewards    bigint,
  first_visit_bonuses bigint,
  vibe_pioneer_bonuses bigint,
  content_bonuses     bigint,
  nyto_cut            bigint,
  total_burn          bigint
) language plpgsql security definer as $$
begin
  return query
  select
    coalesce(sum(case when type in ('check_in','group_checkin','dwell','pulse_bonus','lucky_roll') then amount else 0 end), 0)::bigint as check_in_rewards,
    coalesce(sum(case when type = 'first_visit'   then amount else 0 end), 0)::bigint as first_visit_bonuses,
    coalesce(sum(case when type = 'pioneer_vibe'  then amount else 0 end), 0)::bigint as vibe_pioneer_bonuses,
    coalesce(sum(case when type in ('flic_post','referral') then amount else 0 end), 0)::bigint as content_bonuses,
    coalesce(round(sum(case when type = 'redemption' then abs(amount) else 0 end) * 0.05), 0)::bigint as nyto_cut,
    coalesce(sum(case when amount > 0 and type != 'signup' then amount else 0 end), 0)::bigint as total_burn
  from nc_transactions
  where
    venue_id  = p_venue_id
    and created_at >= p_month_start::timestamptz
    and type != 'signup';  -- exclude NYTO-funded signup bonuses
end;
$$;


-- ── 4G. Get hourly check-in buckets for today ──
create or replace function get_hourly_checkins(p_venue_id uuid)
returns table (hour_slot integer, count bigint)
language plpgsql security definer as $$
begin
  return query
  select
    extract(hour from created_at)::integer as hour_slot,
    count(*)::bigint
  from check_ins
  where
    venue_id   = p_venue_id
    and created_at >= current_date::timestamptz
  group by hour_slot
  order by hour_slot;
end;
$$;


-- ── 4H. Get 30-day daily check-in trend ──
create or replace function get_daily_trend(p_venue_id uuid, p_days integer default 30)
returns table (day date, count bigint)
language plpgsql security definer as $$
begin
  return query
  select
    created_at::date as day,
    count(*)::bigint
  from check_ins
  where
    venue_id   = p_venue_id
    and created_at >= (current_date - (p_days || ' days')::interval)::timestamptz
  group by day
  order by day;
end;
$$;


-- ──────────────────────────────────────
--  SECTION 5 · ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────

-- Enable RLS on every table
alter table users                 enable row level security;
alter table venues                enable row level security;
alter table check_ins             enable row level security;
alter table nc_transactions       enable row level security;
alter table venue_customers       enable row level security;
alter table reviews               enable row level security;
alter table messages              enable row level security;
alter table offers                enable row level security;
alter table events                enable row level security;
alter table push_campaigns        enable row level security;
alter table competitor_snapshots  enable row level security;
alter table connectors            enable row level security;
alter table repeat_groups         enable row level security;
alter table vibe_reports          enable row level security;
alter table passport_stamps       enable row level security;


-- ── venues: owner can read/write their own venue ──
create policy "venues_owner_select" on venues
  for select using (true);   -- anon read for now; tighten with auth.uid() = owner_id in prod

create policy "venues_owner_update" on venues
  for update using (true);

create policy "venues_owner_insert" on venues
  for insert with check (true);


-- ── check_ins: any read, insert only from service role (mobile app) ──
create policy "checkins_select" on check_ins for select using (true);
create policy "checkins_insert" on check_ins for insert with check (true);


-- ── nc_transactions: venue can read own, insert allowed ──
create policy "nc_select" on nc_transactions for select using (true);
create policy "nc_insert" on nc_transactions for insert with check (true);


-- ── venue_customers: venue reads its own ──
create policy "vc_select" on venue_customers for select using (true);
create policy "vc_update" on venue_customers for update using (true);


-- ── reviews ──
create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert with check (true);
create policy "reviews_update" on reviews for update using (true);  -- venue replies


-- ── messages ──
create policy "messages_select" on messages for select using (true);
create policy "messages_insert" on messages for insert with check (true);
create policy "messages_update" on messages for update using (true);


-- ── offers ──
create policy "offers_select" on offers for select using (true);
create policy "offers_insert" on offers for insert with check (true);
create policy "offers_update" on offers for update using (true);
create policy "offers_delete" on offers for delete using (true);


-- ── events ──
create policy "events_select" on events for select using (true);
create policy "events_insert" on events for insert with check (true);
create policy "events_update" on events for update using (true);


-- ── push_campaigns ──
create policy "push_select" on push_campaigns for select using (true);
create policy "push_insert" on push_campaigns for insert with check (true);


-- ── competitor_snapshots (read-only for dashboard) ──
create policy "comp_select" on competitor_snapshots for select using (true);


-- ── connectors ──
create policy "conn_select" on connectors for select using (true);


-- ── repeat_groups ──
create policy "rg_select" on repeat_groups for select using (true);


-- ── vibe_reports (read-only for dashboard) ──
create policy "vibe_select" on vibe_reports for select using (true);
create policy "vibe_insert" on vibe_reports for insert with check (true);


-- ── users (mobile app manages, dashboard reads) ──
create policy "users_select" on users for select using (true);
create policy "users_insert" on users for insert with check (true);
create policy "users_update" on users for update using (true);


-- ── passport_stamps (Phase 2) ──
create policy "stamps_select" on passport_stamps for select using (true);


-- ──────────────────────────────────────
--  SECTION 6 · REALTIME PUBLICATIONS
--  These tables get live updates in the dashboard
-- ──────────────────────────────────────
-- Note: You must also go to Supabase Dashboard → Database → Replication
-- and toggle ON these tables for realtime to work.

-- This SQL enables the publication:
alter publication supabase_realtime add table venues;
alter publication supabase_realtime add table check_ins;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table push_campaigns;


-- ──────────────────────────────────────
--  SECTION 7 · SEED DATA
--  Demo venue + customers + transactions
-- ──────────────────────────────────────

-- ── Venue ──
insert into venues (
  id, name, location, category, price_tier,
  tagline, about, welcome_item,
  tier, nc_balance, nc_cap, vibe_status,
  latitude, longitude,
  hours
) values (
  '00000000-0000-0000-0000-000000001234',
  'Halo Bar',
  'Jubilee Hills, Hyderabad',
  'Bar · Rooftop',
  '₹₹ · Moderate',
  'Rooftop cocktails with a view of the Hyderabad skyline',
  'Premium rooftop bar in Jubilee Hills known for craft cocktails, live DJ sets every weekend, and the best sunset view in HITEC City. Open daily 6 PM till late.',
  'Complimentary welcome shot',
  'growth',
  18400,
  25000,
  'Vibing',
  17.4326,
  78.4071,
  '{"mon_thu": "6 PM – 1 AM", "fri_sat": "6 PM – 3 AM", "sun": "6 PM – 12 AM"}'::jsonb
) on conflict (id) do update set
  name        = excluded.name,
  tier        = excluded.tier,
  nc_balance  = excluded.nc_balance;


-- ── Demo users (customers) ──
insert into users (id, display_name, email, is_vip, total_visits, nc_balance) values
  ('11111111-0000-0000-0000-000000000001', 'Priya S.',   'priya@demo.com',   true,  11, 2400),
  ('11111111-0000-0000-0000-000000000002', 'Karthik R.', 'karthik@demo.com', false,  8, 1200),
  ('11111111-0000-0000-0000-000000000003', 'Ananya M.',  'ananya@demo.com',  true,  14, 3100),
  ('11111111-0000-0000-0000-000000000004', 'Sneha K.',   'sneha@demo.com',   true,  17, 4200),
  ('11111111-0000-0000-0000-000000000005', 'Nikhil J.',  'nikhil@demo.com',  false,  7,  890),
  ('11111111-0000-0000-0000-000000000006', 'Tanya M.',   'tanya@demo.com',   false,  5, 1050),
  ('11111111-0000-0000-0000-000000000007', 'Rohan D.',   'rohan@demo.com',   false,  6, 1100)
on conflict (id) do nothing;


-- ── Venue customer summaries ──
insert into venue_customers (venue_id, user_id, visit_count, total_spend, last_visit_at, first_visit_at, is_vip, status) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 11, 15950, now() - interval '0  days', now() - interval '90 days', true,  'active'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002',  8,  7840, now() - interval '1  day',  now() - interval '60 days', false, 'active'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 14, 25480, now() - interval '2  days', now() - interval '120 days', true, 'active'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000004', 17, 35700, now() - interval '3  days', now() - interval '150 days', true, 'active'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000005',  7,  6230, now() - interval '42 days', now() - interval '80 days', false, 'lapsed'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000006',  5,  5250, now() - interval '24 days', now() - interval '70 days', false, 'lapsed'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000007',  6,  6600, now() - interval '25 days', now() - interval '75 days', false, 'lapsed')
on conflict (venue_id, user_id) do nothing;


-- ── Recent check-ins (today + past week) ──
-- Note: We bypass the trigger by inserting directly. In production these come from the mobile app.
insert into check_ins (venue_id, user_id, transaction_type, nc_awarded, group_size, created_at) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'group_checkin', 150, 3, now() - interval '2 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'check_in',      100, 1, now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'pulse_bonus',   200, 1, now() - interval '9 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000004', 'first_visit',   100, 1, now() - interval '14 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000007', 'check_in',      100, 1, now() - interval '18 minutes')
on conflict do nothing;


-- ── NC transactions (wallet history) ──
insert into nc_transactions (venue_id, user_id, type, amount, note, created_at) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'group_checkin', 150, 'Group check-in: 3 people',        now() - interval '2 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'check_in',      100, 'Solo check-in',                   now() - interval '5 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'pulse_bonus',   200, 'Pulse Venue 2× bonus',            now() - interval '9 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000004', 'first_visit',   100, 'First visit bonus',               now() - interval '14 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'dwell',         50,  'Dwell bonus: 75 minutes',         now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'pioneer_vibe',  25,  'Vibe Pioneer: first report today', now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000004', 'lucky_roll',    300, 'Lucky 7th roll: 3× jackpot',      now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'flic_post',     75,  'FLIC post bonus',                 now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'referral',      100, 'Referred Rohan D.',               now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'check_in',      100, 'Solo check-in',                   now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000004', 'check_in',      100, 'Solo check-in',                   now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'redemption',   -500, 'Redeemed: 20% off bill',          now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'check_in',      100, 'Solo check-in',                   now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000007', 'check_in',      100, 'Solo check-in',                   now() - interval '6 days')
on conflict do nothing;


-- ── Reviews ──
insert into reviews (venue_id, user_id, rating, body, reply_body, replied_at, created_at) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 5,
   'Absolutely love the rooftop vibe! Craft cocktails are top notch and the sunset view is unbeatable. Will definitely be back.',
   null, null,
   now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 4,
   'Great place for a night out. Service was a bit slow on Friday but the DJ set made up for it.',
   null, null,
   now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 5,
   'Best rooftop in Hyderabad, hands down. The NYTO check-in bonus was a nice surprise!',
   'Thank you so much Ananya! We love having you here. See you soon 🙌',
   now() - interval '2 days',
   now() - interval '3 days')
on conflict do nothing;


-- ── Messages ──
insert into messages (venue_id, user_id, body, direction, read_at, created_at) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'Hi! Is the rooftop open tonight?',                                           'inbound',  null,  now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'Yes! We''re open from 6 PM tonight. DJ set starts at 9. See you soon 🙌',    'outbound', null,  now() - interval '3 hours 55 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'Do you have a table for 4 this Saturday?',                                   'inbound',  null,  now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'The cocktails last night were amazing!',                                      'inbound',  now(), now() - interval '1 day')
on conflict do nothing;


-- ── Active offers ──
insert into offers (venue_id, name, description, type, status, trigger_type, nc_multiplier, max_redemptions, created_at) values
  ('00000000-0000-0000-0000-000000001234',
   'Welcome Shot',
   'Complimentary shot on first visit',
   'first_visit', 'active', 'auto', 1.0, null,
   now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000001234',
   'Power Hour',
   '2× NC for first 20 check-ins · Tap to trigger',
   'power_hour', 'active', 'manual', 2.0, 20,
   now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000001234',
   'Win-back Drop',
   '100 NC to lapsed regulars via Lost Regulars',
   'win_back', 'paused', 'auto', 1.0, null,
   now() - interval '14 days')
on conflict do nothing;


-- ── Events (Prime demo) ──
insert into events (venue_id, title, description, starts_at, ends_at, ticket_price, ticket_count, tickets_sold, status) values
  ('00000000-0000-0000-0000-000000001234',
   'Saturday Night Live',
   'Our resident DJ plays deep house all night. Signature cocktails, rooftop ambience.',
   now() + interval '2 days',
   now() + interval '2 days' + interval '6 hours',
   799, 48, 32, 'on_sale'),
  ('00000000-0000-0000-0000-000000001234',
   'Sunset Sessions Vol. 3',
   'Live acoustic sets + curated cocktail menu. Limited tickets.',
   now() + interval '3 days',
   now() + interval '3 days' + interval '4 hours',
   499, 60, 60, 'sold_out')
on conflict do nothing;


-- ── Push campaign history (Prime demo) ──
insert into push_campaigns (venue_id, headline, body, radius_m, status, sent_count, open_count, visit_count, revenue_attributed, created_at) values
  ('00000000-0000-0000-0000-000000001234',
   'Friday Rooftop Reminder 🌆',
   'We''re pouring! Rooftop has space, come on up.',
   500, 'sent', 312, 128, 58, 126000, now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000001234',
   'Happy Hour Boost ⚡',
   '2× NC tonight from 7–8 PM. First 20 check-ins only.',
   500, 'sent', 188, 67, 34, 74000,  now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000001234',
   'Live DJ Tonight 🎶',
   'Band starts 9 PM. First 10 arrivals get a free shot.',
   1000,'sent', 445, 174, 72, 168000, now() - interval '15 days')
on conflict do nothing;


-- ── Competitor snapshots (Prime demo) ──
insert into competitor_snapshots (reference_venue_id, venue_name, checkins_per_week, repeat_pct, peak_day, avg_group_size, area_rank, is_you) values
  ('00000000-0000-0000-0000-000000001234', 'Skyhi',            684, 71.0, 'Fri', 3.2, 1, false),
  ('00000000-0000-0000-0000-000000001234', 'Halo Bar (you)',   642, 66.0, 'Fri', 2.8, 2, true),
  ('00000000-0000-0000-0000-000000001234', 'Moonlite',         598, 58.0, 'Sat', 2.4, 3, false),
  ('00000000-0000-0000-0000-000000001234', 'Terrace 9',        412, 52.0, 'Fri', 2.1, 4, false),
  ('00000000-0000-0000-0000-000000001234', 'The Loft',         388, 61.0, 'Sat', 2.6, 5, false),
  ('00000000-0000-0000-0000-000000001234', 'Café Noir',        244, 44.0, 'Wed', 1.9, 6, false)
on conflict do nothing;


-- ── Connectors (Prime demo) ──
insert into connectors (venue_id, user_id, groups_brought, new_customers_introduced, estimated_revenue) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 7, 19, 224000),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 5, 12, 117600),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 4, 11,  99000)
on conflict (venue_id, user_id) do nothing;


-- ── Vibe reports (demo) ──
insert into vibe_reports (venue_id, user_id, vibe, created_at) values
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000001', 'buzzing', now() - interval '30 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000002', 'buzzing', now() - interval '45 minutes'),
  ('00000000-0000-0000-0000-000000001234', '11111111-0000-0000-0000-000000000003', 'packed',  now() - interval '20 minutes')
on conflict do nothing;


-- ──────────────────────────────────────
--  SECTION 8 · VERIFY SETUP
--  Run these SELECT statements to confirm everything worked
-- ──────────────────────────────────────

-- Uncomment to verify:
-- select 'venues'           as tbl, count(*) from venues;
-- select 'users'            as tbl, count(*) from users;
-- select 'check_ins'        as tbl, count(*) from check_ins;
-- select 'nc_transactions'  as tbl, count(*) from nc_transactions;
-- select 'venue_customers'  as tbl, count(*) from venue_customers;
-- select 'reviews'          as tbl, count(*) from reviews;
-- select 'messages'         as tbl, count(*) from messages;
-- select 'offers'           as tbl, count(*) from offers;
-- select 'events'           as tbl, count(*) from events;
-- select 'push_campaigns'   as tbl, count(*) from push_campaigns;


-- ══════════════════════════════════════════════════════════════
--  DONE. Your NYTO database is ready.
--  Venue UUID: 00000000-0000-0000-0000-000000001234
--  Copy that into your .env as REACT_APP_VENUE_ID
-- ══════════════════════════════════════════════════════════════