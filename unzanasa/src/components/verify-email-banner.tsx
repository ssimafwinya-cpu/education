"use client";

// Shown in the hub while the signed-in account's email is unverified.
// Unverified accounts can't recover a lost password, so this nudges early.

import { useState } from "react";
import { MailWarning, Send } from "lucide-react";
import { useAccount } from "@/lib/account";

export function VerifyEmailBanner() {
  const { user } = useAccount();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/auth/verify/resend", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        setState("sent");
        if (body.devLink) setDevLink(body.devLink);
      } else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[13px] text-amber-800 dark:text-amber-300">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
        <MailWarning size={15} className="shrink-0" />
        {state === "sent" ? (
          <span>
            Verification email sent to <strong>{user.email}</strong> — check your inbox.
            {devLink && <> Dev mode: <a href={devLink} className="underline">open the link</a>.</>}
          </span>
        ) : (
          <>
            <span>Verify <strong>{user.email}</strong> to enable password recovery.</span>
            <button onClick={resend} disabled={state === "sending"}
              className="inline-flex items-center gap-1 rounded-md border border-amber-600/40 px-2 py-0.5 font-medium transition hover:bg-amber-500/15 disabled:opacity-50">
              <Send size={12} /> {state === "sending" ? "Sending…" : "Resend verification email"}
            </button>
            {state === "error" && <span className="text-rose-600 dark:text-rose-400">Could not send — try again shortly.</span>}
          </>
        )}
      </div>
    </div>
  );
}
