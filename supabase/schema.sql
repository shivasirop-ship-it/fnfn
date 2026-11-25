-- ============================================================================
-- DQR (Dijan Quiz Rankings) — Supabase PostgreSQL Schema, Indexes & Realtime
-- Safe to run on fresh OR existing databases in Supabase SQL Editor:
-- https://supabase.com/dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Core DQR Users Table (Username + 4-9 Digit PIN)
create table if not exists public.dqr_users (
  id text primary key,
  username text unique not null,
  pin text not null check (pin ~ '^[0-9]{4,9}$'),
  full_name text not null,
  role text not null check (role in ('admin', 'member')),
  created_at text not null,
  photo_url text,
  bio text default '',
  favourite_topic text default '',
  is_online boolean default false,
  last_logged_in text default '',
  xp integer default 500,
  level integer default 1,
  rank_id text default 'rk-g4',
  streak integer default 1,
  tagline text default '',
  announcement text default '',
  announcement_checked boolean default false,
  owned_title_ids jsonb default '[]'::jsonb,
  equipped_title_id text,
  achievement_ids jsonb default '[]'::jsonb,
  equipped_achievement_ids jsonb default '[]'::jsonb,
  report_card jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.dqr_users
  add column if not exists updated_at timestamptz default now();

-- 2. App State Sync Store (settings, newspaper, ranks, titles, auctions, predictions, rivalries, trackers)
create table if not exists public.dqr_app_store (
  store_key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- 3. Individual Relational Tables
create table if not exists public.dqr_quizzes (
  id text primary key,
  quiz_name text not null,
  year_bs text not null,
  position text not null,
  host text not null,
  players jsonb not null default '[]'::jsonb,
  team_count integer default 1,
  rating integer default 8,
  extra_note text default '',
  photos jsonb default '[]'::jsonb,
  created_at bigint not null
);

create table if not exists public.dqr_territories (
  id text primary key,
  code text not null,
  name text not null,
  description text default '',
  icon_type text default 'citadel',
  custom_icon_url text,
  duration_minutes integer default 10,
  current_holder_user_id text,
  current_holder_name text,
  highest_score integer default 0,
  won_on text,
  questions jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  attempted_user_ids jsonb not null default '[]'::jsonb
);

alter table public.dqr_territories
  add column if not exists icon_type text default 'citadel';
alter table public.dqr_territories
  add column if not exists custom_icon_url text;

create table if not exists public.dqr_system_messages (
  id text primary key,
  user_id text not null,
  sender text not null check (sender in ('system', 'user')),
  text text not null,
  created_at bigint not null,
  read_by_admin boolean default false,
  read_by_user boolean default false
);

-- 4. Performance Indexes for Instant Lookups (Login, Quizzes, Messages)
create index if not exists idx_dqr_users_username_lower
  on public.dqr_users (lower(username));

create index if not exists idx_dqr_quizzes_created_at
  on public.dqr_quizzes (created_at desc);

create index if not exists idx_dqr_system_messages_user_created
  on public.dqr_system_messages (user_id, created_at asc);

-- 5. Automatic updated_at Trigger on dqr_users & dqr_app_store
create or replace function public.dqr_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dqr_users_updated_at on public.dqr_users;
create trigger trg_dqr_users_updated_at
  before update on public.dqr_users
  for each row execute function public.dqr_touch_updated_at();

drop trigger if exists trg_dqr_app_store_updated_at on public.dqr_app_store;
create trigger trg_dqr_app_store_updated_at
  before update on public.dqr_app_store
  for each row execute function public.dqr_touch_updated_at();

-- 6. Enable Row Level Security with Public Anon Policies (Custom PIN Auth Layer)
alter table public.dqr_users enable row level security;
alter table public.dqr_app_store enable row level security;
alter table public.dqr_quizzes enable row level security;
alter table public.dqr_territories enable row level security;
alter table public.dqr_system_messages enable row level security;

drop policy if exists "Allow anon access dqr_users" on public.dqr_users;
create policy "Allow anon access dqr_users" on public.dqr_users for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_app_store" on public.dqr_app_store;
create policy "Allow anon access dqr_app_store" on public.dqr_app_store for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_quizzes" on public.dqr_quizzes;
create policy "Allow anon access dqr_quizzes" on public.dqr_quizzes for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_territories" on public.dqr_territories;
create policy "Allow anon access dqr_territories" on public.dqr_territories for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_system_messages" on public.dqr_system_messages;
create policy "Allow anon access dqr_system_messages" on public.dqr_system_messages for all using (true) with check (true);

-- 7. Enable Instant Realtime Push Sync Across All Devices & Installed PWAs
alter table public.dqr_users replica identity full;
alter table public.dqr_app_store replica identity full;
alter table public.dqr_quizzes replica identity full;
alter table public.dqr_territories replica identity full;
alter table public.dqr_system_messages replica identity full;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'dqr_users',
    'dqr_app_store',
    'dqr_quizzes',
    'dqr_territories',
    'dqr_system_messages'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

-- 8. Storage Bucket for Founder Photos, Gallery, Territory Icons & Report Cards
insert into storage.buckets (id, name, public)
values ('dqr-media', 'dqr-media', true)
on conflict (id) do nothing;

drop policy if exists "Public Read dqr-media" on storage.objects;
create policy "Public Read dqr-media" on storage.objects
  for select using (bucket_id = 'dqr-media');

drop policy if exists "Public Upload dqr-media" on storage.objects;
create policy "Public Upload dqr-media" on storage.objects
  for insert with check (bucket_id = 'dqr-media');

drop policy if exists "Public Update dqr-media" on storage.objects;
create policy "Public Update dqr-media" on storage.objects
  for update using (bucket_id = 'dqr-media');
