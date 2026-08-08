"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, isAuthed, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Skip straight to the editor.
  useEffect(() => {
    if (isAuthed()) router.replace("/editor");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = signIn(email, password);
    if (result.ok) {
      router.replace("/editor");
    } else {
      setError(result.error ?? "Sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">
            <svg viewBox="0 0 100 100" width="34" height="34">
              <circle cx="50" cy="50" r="34" fill="none" stroke="var(--accent)" strokeWidth="7" />
              <polygon points="50,26 60,50 50,74 40,50" fill="var(--accent)" />
            </svg>
          </span>
          <div>
            <p className="auth-eyebrow">Navigate · Operator console</p>
            <h1 className="auth-title">Sign in to manage your venue</h1>
          </div>
        </div>

        <p className="auth-sub">
          For venue operators and staff. Guests don&apos;t need an account —
          they just scan the QR code at your venue.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Work email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@venue.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-demo-note">
          <strong>Demo login</strong> — this is a placeholder gate, not real
          security yet. Use{" "}
          <code>
            {DEMO_EMAIL}
          </code>{" "}
          / <code>{DEMO_PASSWORD}</code>.
        </div>

        <Link className="auth-back" href="/">
          ← Back to the venue map
        </Link>
      </div>
    </div>
  );
}
