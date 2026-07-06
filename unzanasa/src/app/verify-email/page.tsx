"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAccount } from "@/lib/account";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const { refreshUser } = useAccount();

  const [state, setState] = useState<"working" | "ok" | "fail">("working");
  const [message, setMessage] = useState("");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // strict-mode double-mount guard: token is single-use
    fired.current = true;
    if (!token || !email) {
      setState("fail");
      setMessage("This verification link is incomplete — open it exactly as sent.");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const body = await res.json();
        if (res.ok) {
          setState("ok");
          await refreshUser().catch(() => {});
        } else {
          setState("fail");
          setMessage(body.error ?? "Verification failed.");
        }
      } catch {
        setState("fail");
        setMessage("Network error — reload to try again.");
      }
    })();
  }, [token, email, refreshUser]);

  if (state === "working") {
    return <p className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 size={16} className="animate-spin" /> Verifying your email…</p>;
  }
  if (state === "ok") {
    return (
      <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-4">
        <div className="flex items-start gap-2.5 text-sm">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="font-medium">Email verified</p>
            <p className="mt-1 text-ink-muted"><span className="font-medium text-ink">{email}</span> is confirmed. Password recovery is now enabled for your account.</p>
            <Link href="/hub" className="btn-primary mt-3 inline-flex">Go to the hub <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-sm">
      <div className="flex items-start gap-2.5">
        <XCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
        <div>
          <p className="font-medium text-rose-600 dark:text-rose-400">Verification failed</p>
          <p className="mt-1 text-ink-muted">{message}</p>
          <p className="mt-2 text-ink-muted">Log in and use “Resend verification email” from the banner in the hub.</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Email verification</h1>
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
