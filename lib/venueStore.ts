import type { Venue } from "./venue";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Cloud-backed venue storage with an offline cache.
 *
 * - Operators call publishVenue() to save a venue to Supabase; every phone
 *   reading that venue then sees the update (and subscribeVenue() pushes it
 *   live to already-open apps).
 * - Guests call loadPublishedVenue() which returns the cloud copy when online,
 *   falls back to the last cached copy when offline, and returns null when
 *   there is neither (caller then uses the bundled demo venue).
 *
 * When Supabase isn't configured, everything degrades to a local-only cache so
 * the app keeps working exactly as before.
 */

const TABLE = "venues";
// Single active venue for now. Multi-venue support keys rows by slug instead.
export const ACTIVE_VENUE_ID = "eco-park";
const CACHE_PREFIX = "navigate:venueCache:";

interface VenueRow {
  id: string;
  data: Venue;
  updated_at?: string;
}

function cacheKey(id: string): string {
  return `${CACHE_PREFIX}${id}`;
}

function readCache(id: string): Venue | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Venue;
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.pois)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(id: string, venue: Venue): void {
  try {
    window.localStorage.setItem(cacheKey(id), JSON.stringify(venue));
  } catch {
    // storage full/unavailable — cloud still works, just no offline copy
  }
}

/** Loads the published venue: cloud when online, else the offline cache, else null. */
export async function loadPublishedVenue(
  id: string = ACTIVE_VENUE_ID
): Promise<Venue | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("id", id)
        .maybeSingle();
      if (!error && data?.data) {
        const venue = data.data as Venue;
        writeCache(id, venue); // refresh offline copy
        return venue;
      }
    } catch {
      // network/offline — fall through to cache
    }
  }
  return readCache(id);
}

/** Saves a venue to the cloud so other devices pick it up. Returns an error message on failure. */
export async function publishVenue(
  venue: Venue,
  id: string = ACTIVE_VENUE_ID
): Promise<{ ok: boolean; error?: string }> {
  writeCache(id, venue);
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Cloud sync isn't configured yet — saved locally only. Add your Supabase keys to publish to other devices.",
    };
  }
  try {
    const row: VenueRow = { id, data: venue, updated_at: new Date().toISOString() };
    const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed." };
  }
}

/**
 * Subscribes to live updates for a venue. The callback fires whenever another
 * device publishes a change. Returns an unsubscribe function. No-op when
 * Supabase isn't configured.
 */
export function subscribeVenue(
  onChange: (venue: Venue) => void,
  id: string = ACTIVE_VENUE_ID
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`venue:${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${id}` },
      (payload) => {
        const next = (payload.new as VenueRow | null)?.data;
        if (next && Array.isArray(next.nodes) && Array.isArray(next.pois)) {
          writeCache(id, next);
          onChange(next);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export { isSupabaseConfigured };
