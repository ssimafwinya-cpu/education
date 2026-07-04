"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Clock, RotateCcw, Home, Award } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, ProgressRing } from "@/components/ui";
import { answersMatch, cn, pct, shuffle, uid } from "@/lib/utils";
import type { Quiz, QuizQuestion } from "@/lib/types";

interface Props {
  quiz: Quiz;
  mode: "practice" | "exam";
  onExit?: () => void;
}

export function QuizRunner({ quiz, mode, onExit }: Props) {
  const { dispatch } = useStore();
  const questions = useMemo(() => (mode === "exam" ? shuffle(quiz.questions) : quiz.questions), [quiz, mode]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({}); // practice: revealed per question
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState((quiz.timeLimitMinutes ?? 0) * 60);
  const [recorded, setRecorded] = useState(false);

  const q = questions[index];
  const total = questions.length;

  const isCorrect = (question: QuizQuestion, given: string): boolean => {
    if (given === undefined || given === "") return false;
    if (question.kind === "mcq" || question.kind === "truefalse") return Number(given) === question.answerIndex;
    return answersMatch(given, question.answerText ?? "");
  };

  const results = useMemo(
    () => questions.map((question) => ({ question, given: answers[question.id] ?? "", correct: isCorrect(question, answers[question.id] ?? "") })),
    [questions, answers],
  );
  const score = pct(results.filter((r) => r.correct).length, total);

  const finish = () => setFinished(true);

  // Exam timer.
  useEffect(() => {
    if (mode !== "exam" || !quiz.timeLimitMinutes || finished) return;
    if (timeLeft <= 0) { finish(); return; }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [mode, timeLeft, finished, quiz.timeLimitMinutes]);

  // Record the attempt once when finished.
  useEffect(() => {
    if (finished && !recorded) {
      dispatch({
        type: "RECORD_ATTEMPT",
        attempt: {
          id: uid("att"), quizId: quiz.id, startedAt, finishedAt: Date.now(), mode,
          answers: results.map((r) => ({ questionId: r.question.id, given: r.given, correct: r.correct })),
          scorePercent: score,
        },
      });
      setRecorded(true);
    }
  }, [finished, recorded, dispatch, quiz.id, startedAt, mode, results, score]);

  const setAnswer = (val: string) => setAnswers((a) => ({ ...a, [q.id]: val }));
  const revealPractice = () => setChecked((c) => ({ ...c, [q.id]: true }));
  const next = () => (index + 1 >= total ? finish() : setIndex(index + 1));

  const isRevealed = mode === "practice" && checked[q?.id];

  if (finished) {
    return <QuizSummary quiz={quiz} mode={mode} results={results} score={score} onExit={onExit} onRetry={() => { setAnswers({}); setChecked({}); setIndex(0); setFinished(false); setRecorded(false); setTimeLeft((quiz.timeLimitMinutes ?? 0) * 60); }} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500" animate={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-sm font-medium tabular-nums text-ink-muted">{index + 1}/{total}</span>
        {mode === "exam" && quiz.timeLimitMinutes && (
          <Badge tone={timeLeft < 60 ? "rose" : "brand"}><Clock size={12} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Badge tone="amber" className="uppercase">{q.kind}</Badge>
              {q.topic && <span className="text-xs text-ink-faint">{q.topic}</span>}
            </div>
            <h2 className="text-lg font-semibold leading-relaxed">{q.prompt}</h2>

            <div className="mt-5 space-y-2.5">
              {(q.kind === "mcq" || q.kind === "truefalse") ? (
                (q.kind === "truefalse" ? ["True", "False"] : q.options ?? []).map((opt, i) => {
                  const selected = answers[q.id] === String(i);
                  const correct = q.answerIndex === i;
                  const showResult = isRevealed;
                  return (
                    <button
                      key={i}
                      disabled={isRevealed}
                      onClick={() => setAnswer(String(i))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition",
                        !showResult && selected && "border-brand-500 bg-brand-500/10",
                        !showResult && !selected && "border-edge hover:border-edge-strong",
                        showResult && correct && "border-teal-500 bg-teal-500/10",
                        showResult && selected && !correct && "border-rose-500 bg-rose-500/10",
                        showResult && !correct && !selected && "border-edge opacity-60",
                      )}
                    >
                      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold", selected ? "border-current" : "border-edge")}>{String.fromCharCode(65 + i)}</span>
                      <span className="flex-1">{opt}</span>
                      {showResult && correct && <Check size={16} className="text-teal-500" />}
                      {showResult && selected && !correct && <X size={16} className="text-rose-500" />}
                    </button>
                  );
                })
              ) : (
                <input
                  value={answers[q.id] ?? ""}
                  disabled={isRevealed}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "practice" ? revealPractice() : next())}
                  className="input text-base"
                  placeholder="Type your answer…"
                  autoFocus
                />
              )}
            </div>

            {/* Practice: explanation after reveal */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <div className={cn("mt-4 rounded-xl border p-3.5 text-sm", results[index].correct ? "border-teal-500/40 bg-teal-500/5" : "border-rose-500/40 bg-rose-500/5")}>
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      {results[index].correct ? <><Check size={15} className="text-teal-500" /> Correct!</> : <><X size={15} className="text-rose-500" /> Not quite</>}
                    </div>
                    {(q.kind === "short" || q.kind === "fill") && <div className="text-ink-muted">Answer: <strong>{q.answerText}</strong></div>}
                    <div className="mt-1 text-ink-muted">{q.explanation}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onExit ? onExit : undefined} className="btn-ghost btn-sm">Exit</button>
        {mode === "practice" && !isRevealed ? (
          <button onClick={revealPractice} disabled={!answers[q.id]} className="btn-secondary flex-1 sm:flex-none">Check answer</button>
        ) : (
          <button onClick={next} className="btn-primary flex-1 sm:flex-none">
            {index + 1 >= total ? "Finish" : "Next"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function QuizSummary({ quiz, mode, results, score, onExit, onRetry }: { quiz: Quiz; mode: string; results: { question: QuizQuestion; given: string; correct: boolean }[]; score: number; onExit?: () => void; onRetry: () => void }) {
  const correct = results.filter((r) => r.correct).length;
  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="text-center">
          <div className="text-6xl">{score >= 80 ? "🏆" : score >= 50 ? "👍" : "📚"}</div>
          <h1 className="mt-3 text-2xl font-bold">{mode === "exam" ? "Exam" : "Quiz"} complete</h1>
          <p className="text-ink-muted">{quiz.title}</p>
          <div className="mt-5 flex items-center justify-center">
            <ProgressRing value={score} size={120} stroke={10} color={score >= 80 ? "#14b8a6" : score >= 50 ? "#f59e0b" : "#f43f5e"}>
              <div><div className="text-2xl font-bold">{score}%</div><div className="text-[10px] uppercase text-ink-faint">{correct}/{results.length}</div></div>
            </ProgressRing>
          </div>
          {score >= 80 && <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-teal-500"><Award size={15} /> Great work!</div>}
        </Card>
      </motion.div>

      {/* Review answers */}
      <h2 className="mb-3 mt-6 font-semibold">Review answers</h2>
      <div className="space-y-3">
        {results.map((r, i) => {
          const q = r.question;
          const givenLabel = q.kind === "mcq" ? q.options?.[Number(r.given)] ?? "—" : q.kind === "truefalse" ? (r.given === "0" ? "True" : r.given === "1" ? "False" : "—") : r.given || "—";
          const answerLabel = q.kind === "mcq" ? q.options?.[q.answerIndex ?? 0] : q.kind === "truefalse" ? (q.answerIndex === 0 ? "True" : "False") : q.answerText;
          return (
            <Card key={i} className={cn("border-l-4", r.correct ? "border-l-teal-500" : "border-l-rose-500")}>
              <div className="flex items-start gap-2">
                {r.correct ? <Check size={16} className="mt-0.5 text-teal-500" /> : <X size={16} className="mt-0.5 text-rose-500" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{i + 1}. {q.prompt}</div>
                  <div className="mt-1 text-xs">
                    <span className="text-ink-muted">Your answer: </span>
                    <span className={r.correct ? "text-teal-500" : "text-rose-500"}>{givenLabel}</span>
                    {!r.correct && <><span className="text-ink-muted"> · Correct: </span><span className="text-teal-500">{answerLabel}</span></>}
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">{q.explanation}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={onRetry} className="btn-secondary flex-1"><RotateCcw size={16} /> Retry</button>
        {onExit ? <button onClick={onExit} className="btn-primary flex-1"><Home size={16} /> Done</button> : <Link href="/app/quizzes" className="btn-primary flex-1"><Home size={16} /> Done</Link>}
      </div>
    </div>
  );
}
