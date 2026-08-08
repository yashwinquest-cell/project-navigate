# Cloud sync setup (Supabase)

This turns on online + offline venue sync: an operator publishes a venue once,
and every phone running the app picks up the change — live if it's open, or on
next launch. Without this, the app still works fully offline with the bundled
venue; cloud sync just stays off.

## 1. Create a Supabase project

1. Go to https://supabase.com, sign up (free), and create a new project.
2. Once it's ready, open **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key (this is a client key, safe to ship in the app)

## 2. Create the venues table

Open **SQL Editor** in Supabase and run:

```sql
create table if not exists public.venues (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security.
alter table public.venues enable row level security;

-- Guests: anyone may READ the published venue.
create policy "public read venues"
  on public.venues for select
  using (true);

-- Operators: allow writes. NOTE — this currently allows writes with the anon
-- key, which is fine for testing but not production-safe. Lock this down once
-- the operator login is wired to Supabase Auth (then change to:
--   using (auth.role() = 'authenticated') / with check (auth.role() = 'authenticated')
create policy "anon write venues"
  on public.venues for all
  using (true)
  with check (true);
```

## 3. Turn on Realtime for live updates

In **Database → Replication** (or **Realtime**), enable realtime for the
`public.venues` table. This is what pushes an operator's change to every open
app instantly.

## 4. Add the keys

**Local development** — copy `.env.local.example` to `.env.local` and fill in
both values, then `npm run dev`.

**Deployed site + APK** — the keys are read at *build* time, so add them as
GitHub repository **Variables** (Settings → Secrets and variables → Actions →
Variables tab), named exactly:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The deploy and APK workflows already pass these through to the build. Push (or
re-run the workflows) after adding them, and cloud sync goes live everywhere.

## How it behaves

- **Operator:** edits a venue in `/editor`, clicks **Publish to all devices** →
  saved to Supabase.
- **Guests:** the app loads the published venue from the cloud, caches it
  locally for offline use, and (while open) updates live when you publish.
- **Offline:** the last-seen venue is served from the local cache; it refreshes
  next time there's a connection.
