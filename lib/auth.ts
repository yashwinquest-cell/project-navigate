/**
 * ⚠️ DEMO AUTH ONLY — NOT REAL SECURITY.
 *
 * The site ships as a static export (GitHub Pages / static Capacitor APK),
 * which has no backend to verify credentials against. This module is a
 * client-side placeholder gate for the operator editor: it checks a
 * hardcoded demo credential (visible in the bundle, therefore NOT secret)
 * and stores a flag in localStorage. Anyone can bypass it via devtools.
 *
 * To make this real, swap signIn() for a hosted auth provider (Supabase /
 * Firebase / Clerk — all work with static hosting) or a real backend, and
 * gate on a verified session/token instead of this localStorage flag.
 */

const SESSION_KEY = "navigate:operatorSession";

/** Demo credentials, intentionally shown on the login page since this is a placeholder. */
export const DEMO_EMAIL = "operator@demo.in";
export const DEMO_PASSWORD = "navigate";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export function signIn(email: string, password: string): AuthResult {
  const e = email.trim().toLowerCase();
  if (!e || !password) {
    return { ok: false, error: "Enter both your email and password." };
  }
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

export function signOut(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function isAuthed(): boolean {
  try {
    return Boolean(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

export function currentOperator(): string | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { email?: string }).email ?? null;
  } catch {
    return null;
  }
}
