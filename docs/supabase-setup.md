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

-- Operators: only SIGNED-IN users may write (insert/update/delete). Guests
-- using just the publishable key can read but never publish. This is enforced
-- by the database, so it can't be bypassed from the client.
create policy "authenticated write venues"
  on public.venues for all
  to authenticated
  using (true)
  with check (true);
```

> **Upgrading an existing project?** If you previously ran the older
> `anon write venues` policy, drop it first so anonymous writes are no longer
> allowed:
>
> ```sql
> drop policy if exists "anon write venues" on public.venues;
> ```
>
> then run the `authenticated write venues` policy above.

## 3. Create operator accounts

Publishing is now restricted to signed-in operators (Supabase Auth). There is
no public sign-up page — you add operators yourself:

1. In Supabase, open **Authentication → Users → Add user**.
2. Enter the operator's email and a password, and tick **Auto Confirm User**
   (so they can sign in immediately without an email-confirmation step).
3. Give those credentials to the operator. They sign in at `/login`, which now
   verifies against Supabase — guests never need an account.

To stop anyone from self-registering, also open **Authentication → Providers →
Email** and turn **off** "Allow new users to sign up".

## 4. Turn on Realtime for live updates

In **Database → Replication** (or **Realtime**), enable realtime for the
`public.venues` table. This is what pushes an operator's change to every open
app instantly.

## 5. Add the keys

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
