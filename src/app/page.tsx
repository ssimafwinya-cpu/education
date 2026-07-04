"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, Sparkles, Layers, MessageSquare, LineChart, CalendarDays,
  Trophy, ListChecks, ArrowRight, Check, Zap, Shield, Github,
} from "lucide-react";
import { useTheme } from "@/components/theme";
import { Sun, Moon, Monitor } from "lucide-react";

const FEATURES = [
  { icon: MessageSquare, title: "AI Tutor", desc: "Ask anything. Get clear explanations, analogies and instant quizzing grounded in your own notes.", tone: "brand" },
  { icon: Layers, title: "Spaced Repetition", desc: "A full FSRS scheduler decides exactly when to review each card for maximum retention.", tone: "teal" },
  { icon: ListChecks, title: "Smart Quizzes", desc: "Auto-generate MCQ, cloze, short-answer and true/false questions from any material.", tone: "violet" },
  { icon: CalendarDays, title: "AI Study Planner", desc: "Enter your exam dates and available time — get a balanced, adaptive revision schedule.", tone: "amber" },
  { icon: LineChart, title: "Deep Analytics", desc: "Track retention, accuracy, streaks and weak topics with beautiful, honest charts.", tone: "sky" },
  { icon: Trophy, title: "Gamification", desc: "XP, levels, coins, streaks and achievements keep you coming back every day.", tone: "rose" },
];

const STATS = [
  { value: "17-param", label: "FSRS memory model" },
  { value: "5", label: "LLM providers supported" },
  { value: "100%", label: "Works offline" },
  { value: "WCAG AA", label: "Accessible by design" },
];

const PLANS = [
  { name: "Free", price: "$0", period: "forever", features: ["Unlimited flashcards & notes", "FSRS spaced repetition", "AI tutor (offline engine)", "3 subjects", "Core analytics"], cta: "Start free", highlight: false },
  { name: "Premium", price: "$9", period: "/month", features: ["Everything in Free", "Unlimited subjects", "Live LLM tutoring (Claude, GPT…)", "PDF → flashcards & quizzes", "Advanced analytics & predictions", "Priority support"], cta: "Go Premium", highlight: true },
  { name: "Institution", price: "Custom", period: "", features: ["Everything in Premium", "Teacher dashboards", "Classrooms & cohorts", "SSO & student verification", "Admin & moderation tools", "SLA & onboarding"], cta: "Contact sales", highlight: false },
];

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-edge/60 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
              <Brain size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight">Cognify</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-muted md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")} className="btn-ghost btn-sm" aria-label="Toggle theme">
              <ThemeIcon size={18} />
            </button>
            <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
            <Link href="/app" className="btn-primary btn-sm">Open app <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-3.5 py-1.5 text-xs font-medium text-ink-muted shadow-soft">
            <Sparkles size={13} className="text-brand-500" />
            AI tutoring · spaced repetition · adaptive quizzes — in one app
          </div>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Learn anything,{" "}
            <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-teal-500 bg-clip-text text-transparent">
              remember everything
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-ink-muted">
            Cognify combines an AI tutor, a real FSRS spaced-repetition engine, smart notes,
            auto-generated quizzes and a study planner into one beautiful, gamified workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="btn-primary px-6 py-3 text-base">
              Start learning free <ArrowRight size={18} />
            </Link>
            <Link href="/app/tutor" className="btn-secondary px-6 py-3 text-base">
              <MessageSquare size={17} /> Try the AI tutor
            </Link>
          </div>
          <p className="mt-3 text-xs text-ink-faint">No sign-up required · Works fully offline · Free forever tier</p>
        </motion.div>

        {/* App preview */}
        <motion.div
          className="mx-auto mt-14 max-w-4xl"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="glass overflow-hidden rounded-3xl border border-edge p-2 shadow-lift">
            <div className="rounded-2xl bg-surface p-6 text-left">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Brain, k: "Due today", v: "24 cards", tone: "brand" },
                  { icon: Zap, k: "Streak", v: "12 days 🔥", tone: "amber" },
                  { icon: Trophy, k: "Level", v: "Scholar · L7", tone: "teal" },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className="card flex items-center gap-3 p-4">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${c.tone}-500/12 text-${c.tone}-500`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-lg font-bold">{c.v}</div>
                        <div className="text-xs text-ink-faint">{c.k}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 card p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquare size={15} className="text-brand-500" /> AI Tutor</div>
                <div className="rounded-xl bg-brand-500/5 p-3 text-sm text-ink-muted">
                  “Explain mitochondria like I'm 12, then quiz me.” →{" "}
                  <span className="text-ink">Think of a mitochondrion as the cell's tiny power plant…</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-xl font-bold text-brand-500">{s.value}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to study smarter</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">One connected ecosystem — no more juggling Anki, Quizlet, Notion and ChatGPT.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="card card-hover p-6"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-${f.tone}-500/12 text-${f.tone}-500`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From notes to mastery in four steps</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {[
            { n: "1", t: "Add material", d: "Create notes, import decks, or paste text. Organise by subject." },
            { n: "2", t: "Generate", d: "Turn any material into flashcards, quizzes and summaries with one click." },
            { n: "3", t: "Review daily", d: "The FSRS engine schedules exactly what to review, when." },
            { n: "4", t: "Track & adapt", d: "Analytics surface weak topics; the planner adjusts your schedule." },
          ].map((s) => (
            <div key={s.n} className="card p-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">{s.n}</div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-ink-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">Start free. Upgrade when you're ready for live LLM tutoring and unlimited everything.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`card relative p-6 ${p.highlight ? "ring-2 ring-brand-500 shadow-glow" : ""}`}>
              {p.highlight && <div className="absolute -top-3 left-6 chip bg-brand-500 text-white">Most popular</div>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{p.price}</span>
                <span className="text-sm text-ink-faint">{p.period}</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-teal-500" /> <span className="text-ink-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/app" className={`mt-6 w-full ${p.highlight ? "btn-primary" : "btn-secondary"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl border border-edge p-10 text-center shadow-lift">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-500/10 via-transparent to-teal-500/10" />
          <Shield size={28} className="mx-auto text-brand-500" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Ready to learn without the grind?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">Join thousands of students studying smarter with AI + spaced repetition.</p>
          <Link href="/app" className="btn-primary mx-auto mt-6 px-6 py-3 text-base">Open Cognify <ArrowRight size={18} /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-brand-500" />
            <span className="font-semibold text-ink">Cognify</span>
            <span className="text-ink-faint">— the AI learning platform</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink"><Github size={15} /> GitHub</a>
          </div>
          <div className="text-xs text-ink-faint">© {new Date().getFullYear()} Cognify</div>
        </div>
      </footer>
    </div>
  );
}
