# Navigate — indoor wayfinding for venues

An indoor wayfinding and venue-engagement app for large spaces like malls,
amusement parks, and campuses. Guests open a mobile-friendly map, find any
place, and get turn-by-turn directions along real walkways. Operators build and
publish the venue map from a browser-based editor, and every device picks up the
change — online **and** offline.

It ships three ways from one codebase:

- **Web app / PWA** — installable on phones, works offline.
- **Android app (APK)** — the same app wrapped with Capacitor.
- **3D model** — an interactive 3D view plus a downloadable `.glb`.

## Features

- **Mobile-first map** with search and category filtering, rendered as crisp SVG.
- **Turn-by-turn routing** — shortest path (Dijkstra) over a node/edge walkway
  graph.
- **3D view** — explore the venue in 3D (Three.js), preview any place, and export
  the whole venue to a `.glb` file.
- **Venue editor** — draw walkways, rooms, and points of interest; connect them
  into a routing graph; validate that every place is reachable.
- **AutoCAD / DXF import** — turn a floor-plan DXF into a starter venue.
- **Cloud sync** — an operator publishes once and every phone updates live
  (Supabase Realtime), with an offline cache so the last-seen map always loads.
- **Operator login** — publishing is gated behind real authentication; guests
  browse without an account.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router, Turbopack, static export) |
| Language | TypeScript, React 19 |
| 3D | Three.js (`GLTFExporter` for `.glb`) |
| CAD import | `dxf-parser` |
| Cloud sync & auth | Supabase (`@supabase/supabase-js`) |
| Mobile packaging | Capacitor (Android) |
| Hosting | GitHub Pages (static export) |

## Project layout

```
app/            Next.js routes: / (guest map), /editor, /login, PWA manifest
components/     VenueMap, Venue3DView, Place3DModal, VenueEditor
lib/
  pathfinding.ts   Dijkstra routing over the walkway graph
  venue.ts         Venue data model + the bundled demo venue (Eco Park)
  scene3d.ts       Three.js scene builders (incl. Eco Park replica)
  exportGLB.ts     Venue → .glb export
  dxfImport.ts     DXF floor plan → venue
  supabase.ts      Supabase client (URL + publishable key)
  auth.ts          Operator authentication (Supabase Auth)
  venueStore.ts    Cloud publish/load + realtime + offline cache
docs/
  supabase-setup.md   Full cloud-sync + auth setup guide
```

## Getting started (local development)

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the guest map loads. Visit `/editor` (via `/login`)
to build a venue.

The app works fully offline with the bundled demo venue even with no backend
configured. To turn on cross-device cloud sync, see the setup guide below.

## Cloud sync & operator accounts

Cloud sync and login are powered by Supabase. Setup — creating the `venues`
table, the Row Level Security policy that restricts publishing to signed-in
operators, enabling Realtime, and adding operator accounts — is documented step
by step in **[`docs/supabase-setup.md`](docs/supabase-setup.md)**.

The Supabase **project URL** and **publishable (anon) key** are client-safe and
committed in `lib/supabase.ts`; environment variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) override them for
forks. The **secret** key is never stored in this repo.

Guests get read-only access to the published map. Only operators created in
Supabase Auth can sign in at `/login` and publish changes; enforcement is at the
database level (RLS), not in client code.

## Building & deploying

- **Web / GitHub Pages** — the `Deploy to GitHub Pages` workflow builds a static
  export (`GITHUB_PAGES=true`) and deploys it on every push to `main`.
- **Android APK** — the `Build Android APK` workflow builds the web assets in
  Capacitor mode, assembles a debug APK, and publishes it to the `apk` branch
  for direct download.

Both workflows read the optional Supabase keys from repository **Variables**
(`Settings → Secrets and variables → Actions → Variables`), so cloud sync is
baked into the deployed site and the app.

## License

Proprietary — © WinQuest. All rights reserved.
