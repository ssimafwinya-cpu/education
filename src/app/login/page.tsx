"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, ArrowRight, Github, Apple, Sparkles, ShieldCheck, KeyRound } from "lucide-react";
import { useStore } from "@/lib/store";

// A visual auth experience. Real OAuth/credential flows are documented in
// docs/SECURITY.md and wired via Auth.js in production; here any provider
// simply enters the app so the full product is explorable.

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
  );
}
function MicrosoftIcon() {
  return <svg width="16" height="16" viewBox="0 0 23 23"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>;
}

export default function Login() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const enter = (provider: string) => {
    setLoading(provider);
    if (mode === "signup" && name) dispatch({ type: "UPDATE_PROFILE", patch: { name } });
    if (email) dispatch({ type: "UPDATE_PROFILE", patch: { email } });
    setTimeout(() => router.push("/app"), 450);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-teal-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur"><Brain size={22} /></div>
          <span className="text-xl font-bold">Cognify</span>
        </Link>
        <div className="relative">
          <Sparkles size={32} className="mb-4 opacity-90" />
          <h1 className="text-4xl font-extrabold leading-tight">Study smarter,<br />not harder.</h1>
          <p className="mt-4 max-w-md text-white/85">AI tutoring, spaced repetition and adaptive quizzes — the complete learning workspace loved by students worldwide.</p>
          <div className="mt-8 flex items-center gap-6 text-sm">
            <div><div className="text-2xl font-bold">FSRS</div><div className="text-white/70">memory science</div></div>
            <div><div className="text-2xl font-bold">5 LLMs</div><div className="text-white/70">AI providers</div></div>
            <div><div className="text-2xl font-bold">100%</div><div className="text-white/70">offline-ready</div></div>
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-white/75"><ShieldCheck size={16} /> GDPR-compliant · end-to-end encrypted</div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white"><Brain size={22} /></div>
              <span className="text-xl font-bold">Cognify</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p className="mt-1 text-sm text-ink-muted">{mode === "signin" ? "Log in to continue your learning streak." : "Start learning in seconds — no credit card required."}</p>

          <div className="mt-6 space-y-2.5">
            <button onClick={() => enter("google")} disabled={!!loading} className="btn-secondary w-full">
              <GoogleIcon /> Continue with Google
            </button>
            <div className="grid grid-cols-3 gap-2.5">
              <button onClick={() => enter("apple")} disabled={!!loading} className="btn-secondary"><Apple size={16} /></button>
              <button onClick={() => enter("microsoft")} disabled={!!loading} className="btn-secondary"><MicrosoftIcon /></button>
              <button onClick={() => enter("github")} disabled={!!loading} className="btn-secondary"><Github size={16} /></button>
            </div>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
            <div className="h-px flex-1 bg-edge" /> or <div className="h-px flex-1 bg-edge" />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); enter("email"); }} className="space-y-3">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-muted">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Alex Rivera" />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Email</span>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="you@school.edu" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-xs font-medium text-ink-muted">
                Password {mode === "signin" && <a href="#" className="text-brand-500 hover:underline">Forgot?</a>}
              </span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="password" className="input pl-9" placeholder="••••••••" />
              </div>
            </label>
            <button type="submit" disabled={!!loading} className="btn-primary w-full">
              {loading ? "Signing in…" : mode === "signin" ? "Log in" : "Create account"} <ArrowRight size={16} />
            </button>
          </form>

          <button onClick={() => enter("magic")} className="btn-ghost mt-2 w-full text-brand-500">
            <KeyRound size={15} /> Email me a magic link
          </button>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {mode === "signin" ? "New to Cognify?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-brand-500 hover:underline">
              {mode === "signin" ? "Create an account" : "Log in"}
            </button>
          </p>
          <p className="mt-6 text-center text-xs text-ink-faint">
            <Link href="/app" className="hover:text-ink">Skip → explore the demo</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
