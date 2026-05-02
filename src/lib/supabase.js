import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
  ── SUPABASE SETUP ──────────────────────────────────────────────────────────
  Run this SQL once in your Supabase project:
  Dashboard → SQL Editor → New query → paste → Run

  -- Locations
  create table locations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    name text not null,
    travel_min integer not null default 15,
    created_at timestamptz default now()
  );
  alter table locations enable row level security;
  create policy "Users own their locations" on locations
    for all using (auth.uid() = user_id);

  -- Clients
  create table clients (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    name text not null,
    phone text,
    sessions text,
    location_name text,
    notes text,
    color text default 'teal',
    archived boolean default false,
    created_at timestamptz default now()
  );
  alter table clients enable row level security;
  create policy "Users own their clients" on clients
    for all using (auth.uid() = user_id);

  -- Events
  create table events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    type text not null,       -- 'fixed' | 'personal' | 'personal-time' | 'travel'
    title text not null,
    day integer not null,     -- 0=Sun … 6=Sat
    start_hour float not null,
    dur float not null,
    location text,
    client_id uuid references clients(id) on delete set null,
    created_at timestamptz default now()
  );
  alter table events enable row level security;
  create policy "Users own their events" on events
    for all using (auth.uid() = user_id);
  ────────────────────────────────────────────────────────────────────────── */
