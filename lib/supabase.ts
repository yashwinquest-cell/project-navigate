import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase project config. Env vars win if set (e.g. to point a fork at a
// different project); otherwise these committed defaults are used.
//
// The publishable key below is a CLIENT key by design — Supabase intends it to
// ship in the browser/app bundle, so committing it is fine. It is NOT the
// `sb_secret_...` key (which must never be exposed). Data is protected by
// Row Level Security in Supabase, not by hiding this key.
const DEFAULT_SUPABASE_URL = "https://vzikysvqykgydkxniqpf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_U4ZXON_4sboiAIrdgaUvDw_bsfJA3pS";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
      // Persist the operator's login across reloads and auto-refresh the JWT.
      // This works on static hosting (session lives in localStorage), and the
      // token is what the venues-table RLS checks to authorize writes.
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return client;
}
