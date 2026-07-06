"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (res.ok) {
        setSent(true);
        if (body.devLink) setDevLink(body.devLink);
      } else {
        setError(body.error ?? "Something went wrong — try again.");
      }
    } catch {
      setError("Network error — check your connection.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter the email on your account and we&apos;ll send a link to choose a new password.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-brand-500/40 bg-brand-500/5 p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
              <div className="text-sm">
                <p className="font-medium">Check your inbox</p>
                <p className="mt-1 text-ink-muted">
                  If an account exists for <span className="font-medium text-ink">{email}</span>, a reset
                  link is on its way. It&apos;s valid for 30 minutes.
                </p>
                {devLink && (
                  <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                    Dev mode (no mail provider configured): <a className="underline" href={devLink}>open the reset link</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Email</span>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="you@school.edu" />
              </div>
            </label>
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"} <Send size={15} />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="inline-flex items-center gap-1 text-brand-500 hover:underline">
            <ArrowLeft size={14} /> Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
