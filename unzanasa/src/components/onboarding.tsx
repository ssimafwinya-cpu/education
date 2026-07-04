"use client";

// First-run onboarding wizard. Shown once (gated by the `onboarded` flag) to
// personalise the account: name, avatar, goal, daily target and a study focus.
// Keeps the seeded demo content so the app is immediately populated.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowRight, ArrowLeft, Check, Sparkles, Target, Zap, GraduationCap } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const AVATARS = ["🦊", "🦉", "🐧", "🦁", "🐨", "🐼", "🦅", "🐙", "🦄", "🐰", "🐯", "🦋"];
const FOCUS = [
  { key: "exams", label: "Ace my exams", emoji: "🎓", target: 40 },
  { key: "consistency", label: "Study consistently", emoji: "🔥", target: 25 },
  { key: "deep", label: "Understand deeply", emoji: "🧠", target: 30 },
  { key: "casual", label: "Learn casually", emoji: "🌱", target: 15 },
];

export function Onboarding() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profile.name === "Alex Rivera" ? "" : state.profile.name);
  const [avatar, setAvatar] = useState(state.profile.avatar);
  const [focus, setFocus] = useState<string>("exams");

  const finish = () => {
    const chosen = FOCUS.find((f) => f.key === focus) ?? FOCUS[0];
    if (name.trim()) dispatch({ type: "UPDATE_PROFILE", patch: { name: name.trim() } });
    dispatch({ type: "UPDATE_PROFILE", patch: { avatar } });
    dispatch({ type: "UPDATE_SETTINGS", patch: { dailyReviewTarget: chosen.target } });
    dispatch({ type: "SET_ONBOARDED", value: true });
  };

  const steps = [
    // 0 — welcome
    (
      <div key="welcome" className="text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
          <Brain size={40} />
        </motion.div>
        <h2 className="mt-5 text-2xl font-bold">Welcome to the UNZANASA Academic Hub</h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-muted">Your AI-powered learning workspace — tutoring, spaced repetition, quizzes and planning in one place. Let's set it up in 30 seconds.</p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[{ i: Sparkles, t: "AI Tutor" }, { i: Zap, t: "Spaced repetition" }, { i: Target, t: "Study planner" }].map((x, k) => {
            const Icon = x.i;
            return <div key={k} className="rounded-xl border border-edge p-3"><Icon size={18} className="mx-auto text-brand-500" /><div className="mt-1 text-xs text-ink-muted">{x.t}</div></div>;
          })}
        </div>
      </div>
    ),
    // 1 — name + avatar
    (
      <div key="identity">
        <h2 className="text-xl font-bold">What should we call you?</h2>
        <p className="mt-1 text-sm text-ink-muted">Pick a name and an avatar.</p>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input mt-4" placeholder="Your name" />
        <div className="mt-4 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button key={a} onClick={() => setAvatar(a)} className={cn("grid h-11 w-11 place-items-center rounded-xl text-2xl transition", avatar === a ? "bg-brand-500/15 ring-2 ring-brand-500" : "hover:bg-surface")}>{a}</button>
          ))}
        </div>
      </div>
    ),
    // 2 — focus
    (
      <div key="focus">
        <h2 className="text-xl font-bold">What's your main goal?</h2>
        <p className="mt-1 text-sm text-ink-muted">We'll tune your daily targets to match.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {FOCUS.map((f) => (
            <button key={f.key} onClick={() => setFocus(f.key)} className={cn("flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition", focus === f.key ? "border-brand-500 bg-brand-500/10" : "border-edge hover:border-edge-strong")}>
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-sm font-semibold">{f.label}</span>
              <span className="text-xs text-ink-faint">{f.target} cards/day</span>
            </button>
          ))}
        </div>
      </div>
    ),
    // 3 — ready
    (
      <div key="ready" className="text-center">
        <div className="text-6xl">🚀</div>
        <h2 className="mt-4 text-2xl font-bold">You're all set{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-muted">We've loaded some example subjects so you can explore right away. Add your own material anytime.</p>
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1.5"><GraduationCap size={16} className="text-brand-500" /> {state.subjects.length} subjects</div>
          <div className="flex items-center gap-1.5"><Zap size={16} className="text-teal-500" /> {state.cards.length} cards ready</div>
        </div>
      </div>
    ),
  ];

  const last = step === steps.length - 1;
  const canNext = step !== 1 || name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md glass rounded-3xl p-7 shadow-lift"
      >
        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-brand-500" : i < step ? "w-1.5 bg-brand-500/50" : "w-1.5 bg-edge-strong")} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-ghost btn-sm"><ArrowLeft size={15} /> Back</button>
          ) : (
            <button onClick={finish} className="btn-ghost btn-sm text-ink-faint">Skip</button>
          )}
          {last ? (
            <button onClick={finish} className="btn-primary"><Check size={16} /> Start learning</button>
          ) : (
            <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext} className="btn-primary">Continue <ArrowRight size={16} /></button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
