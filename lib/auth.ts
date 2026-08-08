/**
 * Operator authentication.
 *
 * When Supabase is configured (the normal case now), this uses **real**
 * Supabase Auth: signIn() verifies an email/password against Supabase, which
 * issues a signed JWT that the Supabase client automatically attaches to every
 * request. That token is what the venues-table Row Level Security checks, so
 * only signed-in operators can publish — a guest with just the publishable key
 * can read but not write. Sessions persist and auto-refresh in localStorage
 * (handled by the Supabase client), which works fine on static hosting.
 *
 * When Supabase is NOT configured (e.g. a fork with no backend), this falls
 * back to a DEMO-ONLY localStorage gate so the editor still opens for testing.
 * That fallback is a placeholder, not security — anyone can bypass it.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";

const SESSION_KEY = "navigate:operatorSession";

/** Demo credentials, used ONLY when Supabase isn't configured (placeholder gate). */
export const DEMO_EMAIL = "operator@demo.in";
export const DEMO_PASSWORD = "navigate";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** True when real Supabase Auth is in effect (vs. the demo fallback gate). */
export function usingRealAuth(): boolean {
  return isSupabaseConfigured();
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const e = email.trim().toLowerCase();
  if (!e || !password) {
    return { ok: false, error: "Enter both your email and password." };
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password,
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Sign-in failed.",
      };
    }
  }

  // Demo fallback (no backend configured).
  if (e !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { ok: false, error: "Those credentials weren't recognized." };
  }
  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ email: e, at: Date.now() })
    );
  } catch {
    // localStorage unavailable — session simply won't persist.
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — clearing the local demo flag below is a harmless extra
    }
  }
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function isAuthed(): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    } catch {
      return false;
    }
  }
  try {
    return Boolean(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

export async function currentOperator(): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.email ?? null;
    } catch {
      return null;
    }
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { email?: string }).email ?? null;
  } catch {
    return null;
  }
}
