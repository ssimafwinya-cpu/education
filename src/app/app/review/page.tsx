"use client";

import { Suspense, useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, RotateCcw, Home, Keyboard, Zap, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, ProgressRing, EmptyState, Badge } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { dueCards } from "@/lib/selectors";
import { previewIntervals } from "@/lib/fsrs";
import { cn } from "@/lib/utils";
import type { Flashcard, Rating } from "@/lib/types";

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <ReviewInner />
    </Suspense>
  );
}

const RATING_META: { rating: Rating; label: string; key: string; tone: string; hint: string }[] = [
  { rating: 1, label: "Again", key: "1", tone: "rose", hint: "Forgot" },
  { rating: 2, label: "Hard", key: "2", tone: "amber", hint: "Difficult" },
  { rating: 3, label: "Good", key: "3", tone: "teal", hint: "Recalled" },
  { rating: 4, label: "Easy", key: "4", tone: "sky", hint: "Instant" },
];

function ReviewInner() {
  const { state, dispatch } = useStore();
  const params = useSearchParams();
  const deckFilter = params.get("deck");
  const retention = state.profile.settings.desiredRetention;

  // Snapshot the due queue once at session start so the list doesn't churn
  // as we rate cards (a rated card's due date jumps forward immediately).
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 });
  const [started, setStarted] = useState(false);

  const allDue = useMemo(() => {
    const cards = dueCards(state);
    return deckFilter ? cards.filter((c) => c.deckId === deckFilter) : cards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]); // recompute only when a session (re)starts

  useEffect(() => {
    if (!started) {
      setQueue(allDue.map((c) => c.id));
    }
  }, [allDue, started]);

  const beginSession = () => {
    const cards = dueCards(state);
    const filtered = deckFilter ? cards.filter((c) => c.deckId === deckFilter) : cards;
    setQueue(filtered.map((c) => c.id));
    setIndex(0);
    setRevealed(false);
    setStats({ again: 0, hard: 0, good: 0, easy: 0, xp: 0 });
    setStarted(true);
  };

  const current: Flashcard | undefined = state.cards.find((c) => c.id === queue[index]);
  const done = started && index >= queue.length;

  const intervals = useMemo(() => (current ? previewIntervals(current.srs, retention) : null), [current, retention]);

  const rate = useCallback(
    (rating: Rating) => {
      if (!current || !revealed) return;
      dispatch({ type: "REVIEW_CARD", id: current.id, rating });
      const key = (["again", "hard", "good", "easy"] as const)[rating - 1];
      setStats((s) => ({ ...s, [key]: s[key] + 1, xp: s.xp + (rating >= 3 ? 10 : 5) }));
      // If "Again", requeue the card near the end so it comes back this session.
      if (rating === 1) {
        setQueue((q) => [...q, current.id]);
      }
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    [current, revealed, dispatch],
  );

  // Keyboard shortcuts: space/enter to reveal, 1-4 to rate.
  useEffect(() => {
    if (!started || done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRevealed(true); }
      else if (revealed && ["1", "2", "3", "4"].includes(e.key)) rate(Number(e.key) as Rating);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, done, revealed, rate]);

  const deck = deckFilter ? state.decks.find((d) => d.id === deckFilter) : null;

  // ── Start screen ──
  if (!started) {
    if (queue.length === 0) {
      return (
        <EmptyState
          icon="🎉"
          title="All caught up!"
          description={deck ? `No cards due in ${deck.name}.` : "You have no cards due for review right now. Come back later or add new cards."}
          action={<div className="flex gap-2"><Link href="/app/flashcards" className="btn-primary">Browse decks</Link><Link href="/app" className="btn-secondary">Dashboard</Link></div>}
        />
      );
    }
    return (
      <div className="mx-auto max-w-md pt-8 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid place-items-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
            <Brain size={38} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Ready to review?</h1>
          <p className="mt-1 text-ink-muted">{deck ? `${deck.emoji} ${deck.name} · ` : ""}<strong>{queue.length}</strong> cards due. Powered by the FSRS memory model.</p>
          <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
            <Card className="text-center"><div className="text-2xl font-bold">{queue.length}</div><div className="text-xs text-ink-muted">Cards queued</div></Card>
            <Card className="text-center"><div className="text-2xl font-bold">{Math.round(retention * 100)}%</div><div className="text-xs text-ink-muted">Target retention</div></Card>
          </div>
          <button onClick={beginSession} className="btn-primary mt-6 w-full py-3 text-base"><Zap size={18} /> Start reviewing</button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint"><Keyboard size={13} /> Space to flip · 1–4 to rate</p>
        </motion.div>
      </div>
    );
  }

  // ── Summary screen ──
  if (done) {
    const total = stats.again + stats.hard + stats.good + stats.easy;
    const accuracy = total > 0 ? Math.round(((stats.good + stats.easy) / total) * 100) : 0;
    return (
      <div className="mx-auto max-w-md pt-8 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-6xl">{accuracy >= 80 ? "🏆" : accuracy >= 60 ? "💪" : "📚"}</div>
          <h1 className="mt-4 text-2xl font-bold">Session complete!</h1>
          <p className="mt-1 text-ink-muted">You reviewed <strong>{total}</strong> cards.</p>
          <div className="mt-6 flex items-center justify-center">
            <ProgressRing value={accuracy} size={120} stroke={10} color="#14b8a6">
              <div><div className="text-2xl font-bold">{accuracy}%</div><div className="text-[10px] uppercase text-ink-faint">recalled</div></div>
            </ProgressRing>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {RATING_META.map((r) => (
              <Card key={r.rating} className="px-2 py-3 text-center">
                <div className={cn("text-lg font-bold", `text-${r.tone}-500`)}>{stats[(["again", "hard", "good", "easy"] as const)[r.rating - 1]]}</div>
                <div className="text-[10px] text-ink-faint">{r.label}</div>
              </Card>
            ))}
          </div>
          <Card className="mt-4 flex items-center justify-center gap-2"><Zap size={16} className="text-brand-500" /> <span className="font-semibold">+{stats.xp} XP earned</span></Card>
          <div className="mt-6 flex gap-2">
            <button onClick={beginSession} className="btn-secondary flex-1"><RotateCcw size={16} /> Review more</button>
            <Link href="/app" className="btn-primary flex-1"><Home size={16} /> Dashboard</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current) return <div className="skeleton h-96" />;

  const progress = (index / queue.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/app" className="btn-ghost btn-sm"><Home size={16} /></Link>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500" animate={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-medium tabular-nums text-ink-muted">{index}/{queue.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + index}
          initial={{ opacity: 0, y: 20, rotateX: -4 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="min-h-[300px] p-8">
            <div className="mb-4 flex items-center justify-between">
              <Badge tone="brand" className="capitalize">{current.srs.state}</Badge>
              <span className="text-xs text-ink-faint">{current.kind === "cloze" ? "Cloze" : current.kind === "mcq" ? "Multiple choice" : current.kind === "truefalse" ? "True / False" : "Basic"}</span>
            </div>

            {/* Front */}
            <div className="py-4 text-center">
              <ClozeOrText card={current} revealed={revealed} side="front" />
            </div>

            {/* Back (revealed) */}
            <AnimatePresence>
              {revealed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <div className="my-4 h-px bg-edge" />
                  <div className="py-2 text-center">
                    <ClozeOrText card={current} revealed side="back" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-5">
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="btn-primary w-full py-3.5 text-base">
            Show answer <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Space</kbd>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATING_META.map((r) => (
              <button
                key={r.rating}
                onClick={() => rate(r.rating)}
                className={cn(
                  "group flex flex-col items-center gap-0.5 rounded-xl border-2 py-3 transition",
                  `border-${r.tone}-500/30 hover:border-${r.tone}-500 hover:bg-${r.tone}-500/10`,
                )}
              >
                <span className={cn("text-sm font-bold", `text-${r.tone}-500`)}>{r.label}</span>
                <span className="text-[10px] text-ink-faint">{intervals?.[r.rating]}</span>
                <kbd className="mt-0.5 rounded border border-edge px-1 text-[9px] text-ink-faint">{r.key}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session mini-stats */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1"><Target size={12} /> {stats.good + stats.easy} recalled</span>
        <span className="flex items-center gap-1"><Zap size={12} /> +{stats.xp} XP</span>
      </div>
    </div>
  );
}

/** Renders the card, handling cloze deletion masking. */
function ClozeOrText({ card, revealed, side }: { card: Flashcard; revealed: boolean; side: "front" | "back" }) {
  if (card.kind === "cloze") {
    const masked = card.front.replace(/\{\{c\d+::(.*?)\}\}/g, (_, ans) => (revealed && side === "back" ? `**${ans}**` : "［ … ］"));
    if (side === "back") {
      const full = card.front.replace(/\{\{c\d+::(.*?)\}\}/g, "**$1**");
      return <div className="text-lg"><Markdown content={full} /></div>;
    }
    return <div className="text-lg"><Markdown content={masked} /></div>;
  }

  if (side === "front") {
    if (card.kind === "mcq" && card.options) {
      return (
        <div>
          <div className="text-xl font-semibold">{card.front}</div>
          <ol className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
            {card.options.map((o, i) => (
              <li key={i} className={cn("rounded-lg border border-edge px-3 py-2 text-sm", revealed && i === card.answerIndex && "border-teal-500 bg-teal-500/10 font-semibold")}>
                {String.fromCharCode(65 + i)}. {o}
              </li>
            ))}
          </ol>
        </div>
      );
    }
    return <div className="text-xl font-semibold leading-relaxed">{card.front}</div>;
  }

  // back
  return <div className="text-lg text-ink"><Markdown content={card.back} /></div>;
}
