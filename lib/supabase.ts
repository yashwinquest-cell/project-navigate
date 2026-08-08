import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These are inlined at build time (NEXT_PUBLIC_*). The anon key is designed to
// be public/client-side — it is NOT a secret. Row-level security in Supabase is
// what actually protects the data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both Supabase env vars are present, so cloud sync is available. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/**
 * The shared Supabase client, or null when unconfigured. Callers must handle
 * null and fall back to local-only behavior, so the app still works with no
 * backend set up.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
}
