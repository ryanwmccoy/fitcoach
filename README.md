# FitCoach

A personal trainer scheduling app. Built with React + Vite + Supabase.

---

## 1. Supabase setup (5 minutes)

1. Go to https://supabase.com and create a free account
2. Create a new project (pick any name, any region close to you)
3. Once it's ready, go to **SQL Editor → New query** and paste this entire block:

```sql
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
  type text not null,
  title text not null,
  day integer not null,
  start_hour float not null,
  dur float not null,
  location text,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now()
);
alter table events enable row level security;
create policy "Users own their events" on events
  for all using (auth.uid() = user_id);
```

4. Click **Run**
5. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

---

## 2. Local setup

```bash
# Clone and install
git clone <your-repo-url>
cd fitcoach
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and paste your Supabase URL and anon key

# Run locally
npm run dev
# → open http://localhost:5173
```

---

## 3. Deploy to Vercel (free, 2 minutes)

1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → import your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Click Deploy

That's it. Vercel gives you a URL like `fitcoach-xyz.vercel.app`.
Every time you push to GitHub, it redeploys automatically.

---

## Optional: Custom domain

In Vercel → your project → Settings → Domains → add any domain you own.

---

## First time she opens it

She'll see a sign-in screen. She creates her account with email + password.
After confirming her email, she's in and her data is hers alone (Supabase RLS
ensures no one else can see it).

**First steps:**
1. Settings → add her locations with travel times
2. Clients → add each client
3. Calendar → add her fixed group classes (these can't be deleted)
4. Use "Find a slot" whenever someone needs to reschedule



Movin with Mad Client Scheduler

zgrrhpdpyrsptgulkvtx