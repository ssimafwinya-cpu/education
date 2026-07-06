"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const linkBroken = !token || !email;

  const submit = async () => {
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const body = await res.json();
      if (res.ok) setDone(true);
      else setError(body.error ?? "Something went wrong — try again.");
    } catch {
      setError("Network error — check your connection.");
    }
    setLoading(false);
  };

  if (linkBroken) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-sm">
        <p className="font-medium text-rose-600 dark:text-rose-400">This reset link is incomplete.</p>
        <p className="mt-1 text-ink-muted">Open the link from the email exactly as sent, or <Link href="/forgot-password" className="text-brand-500 underline">request a new one</Link>.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-4">
        <div className="flex items-start gap-2.5 text-sm">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="font-medium">Password updated</p>
            <p className="mt-1 text-ink-muted">You can now log in with your new password.</p>
            <Link href="/login" className="btn-primary mt-3 inline-flex">Log in <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <p className="text-sm text-ink-muted">Choosing a new password for <span className="font-medium text-ink">{email}</span>.</p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">New password</span>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" placeholder="••••••••  (min 8 characters)" />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">Confirm password</span>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input pl-9" placeholder="••••••••" />
        </div>
      </label>
      {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Choose a new password</h1>
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
