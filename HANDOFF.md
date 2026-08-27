# Navigate — project handoff

This document orients a new developer taking over the project. Read it together
with `README.md` (overview) and `docs/supabase-setup.md` (backend setup).

## What this is

**Navigate** is an indoor wayfinding + venue-engagement app for large venues
(parks, malls, campuses). The demo venue is **Eco Park (New Town, Kolkata)**,
digitized from the HIDCO master plan. Guests get a mobile map with search and
turn-by-turn walking routes; operators build and publish the venue from an
in-browser editor, and every device syncs — online and offline.

One codebase ships three ways:

1. **Web app / PWA** — deployed to GitHub Pages:
   https://yashwinquest-cell.github.io/project-navigate/
2. **Android APK** — built by GitHub Actions (Capacitor). The latest debug APK
   is committed to the `apk` branch of the repo as `navigate.apk`.
3. **3D model** — interactive 3D view in-app plus downloadable `.glb`.

Repository: https://github.com/yashwinquest-cell/project-navigate

## How to run it

Requires **Node.js 22+**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export (also used by CI)
```

Routes:
- `/` — guest map (2D / 3D / Location tabs, search, routing, 3D previews)
- `/login` — operator sign-in (Supabase Auth)
- `/editor` — venue editor (auth-gated): draw walkways/rooms/POIs, build the
  routing graph, import DXF floor plans, export GLB, publish to all devices

## Architecture in one paragraph

Next.js 16 (App Router, **static export** — there is no server) + React 19 +
TypeScript. The venue is a JSON document (`lib/venue.ts`: rooms, POIs, and a
node/edge walkway graph); routing is Dijkstra (`lib/pathfinding.ts`); the 2D
map is SVG (`components/VenueMap.tsx`); 3D is Three.js (`lib/scene3d.ts`,
`components/Venue3DView.tsx`); the real-world Location tab is MapLibre GL +
OpenStreetMap (`components/LocationMap.tsx`). Cloud sync is Supabase
(`lib/supabase.ts`, `lib/venueStore.ts`): operators upsert the venue JSON into
a `venues` table, guests read it (cached in localStorage for offline) and
subscribe to Realtime for live updates. Auth is Supabase email/password
(`lib/auth.ts`); write access is enforced by Row Level Security, not client
code. Capacitor wraps the static export into an Android app.

## What's been done so far

- Mobile-first guest map: SVG venue map, category search, Dijkstra
  turn-by-turn routes with distance/walk-time
- Venue data model + Eco Park demo venue traced from the HIDCO master plan
- Venue editor with validation (all places reachable), JSON import/export
- 3D: full-venue 3D view, per-place 3D preview modal, GLB export; a
  geographically-accurate Eco Park replica scene
- AutoCAD DXF import → starter venue (rooms from polylines, MST connectivity)
- PWA manifest + offline-capable static build
- CI/CD: GitHub Pages deploy workflow (`.github/workflows/deploy-pages.yml`),
  Android APK build workflow (`.github/workflows/build-apk.yml`, publishes the
  APK to the `apk` branch)
- Supabase cloud sync: publish/load/realtime + offline cache
- Real Supabase Auth for operators; login page; auth-gated editor
- Real-world "Location" tab (MapLibre + OpenStreetMap) with get-directions link
- Project docs: `README.md`, `docs/supabase-setup.md`

## Backend (Supabase) — state and keys

- Project URL: `https://vzikysvqykgydkxniqpf.supabase.co` (committed in
  `lib/supabase.ts` together with the **publishable/anon key** — that key is
  client-safe by design; data is protected by RLS, not by hiding it).
- The **secret** (`sb_secret_...` / `service_role`) key is NOT in the repo and
  must never be committed or shared.
- Setup that must exist in the Supabase dashboard (see
  `docs/supabase-setup.md` for exact SQL/clicks):
  1. `public.venues` table with RLS: public read, **authenticated-only write**
     (drop the older `anon write venues` policy if present).
  2. Realtime enabled on `public.venues`.
  3. Operator account(s) in Authentication → Users (no public sign-up).
  Verify all three — they were documented and requested, but only the
  dashboard owner can confirm they were actually applied.
- Env overrides for forks: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`); the CI workflows
  read the same names from GitHub repository **Variables**.

## Known limitations / sensible next steps

- Single venue (`eco-park`) — multi-venue means keying `venues` rows by slug
  and adding a venue picker (groundwork noted in `lib/venueStore.ts`).
- Editor has no geo-location field yet, so a venue published from the editor
  omits `geo` and the Location tab shows its empty state; add lat/lng inputs
  in the editor to fix.
- The demo login fallback in `lib/auth.ts` only activates when Supabase is
  unconfigured (forks); with the live keys committed, real auth is always on.
- OpenStreetMap's free tile server is fine for light traffic; switch the tile
  URL in `components/LocationMap.tsx` to a provider (e.g. MapTiler free tier)
  before heavy production use.
- APK is a debug build; a Play Store release needs a signing key + release
  workflow.
- If `next dev` re-adds an AGENTS.md notice block, that is expected tooling
  behavior (see the note at the top of `AGENTS.md`).

## Development conventions

- Active development branch: `claude/indoor-wayfinding-research-be2fk8`;
  work merges to `main` via PRs, and every merge to `main` auto-deploys Pages
  and rebuilds the APK.
- After changing venue data or editor logic, run the app and confirm the
  editor's validation banner still reports every place reachable.
