"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Play, Trophy, Target, TrendingUp, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, EmptyState, Segmented } from "@/components/ui";
import { QuizRunner } from "@/components/quiz-runner";
import { formatRelative, pct } from "@/lib/utils";
import type { Quiz } from "@/lib/types";

export default function ExamsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <ExamsInner />
    </Suspense>
  );
}

function ExamsInner() {
  const { state } = useStore();
  const params = useSearchParams();
  const [activeExam, setActiveExam] = useState<Quiz | null>(null);
  const [minutes, setMinutes] = useState(10);

  // Deep-link from a quiz ("take as exam").
  const linkedQuizId = params.get("quiz");
  const linkedQuiz = linkedQuizId ? state.quizzes.find((q) => q.id === linkedQuizId) : null;

  const examAttempts = state.attempts.filter((a) => a.mode === "exam").sort((a, b) => b.finishedAt - a.finishedAt);
  const quizzes = state.quizzes.filter((q) => q.questions.length >= 3);

  const startExam = (quiz: Quiz, mins: number) => setActiveExam({ ...quiz, timeLimitMinutes: mins });

  // Leaderboard: mix the user's best scores with simulated peers for context.
  const bestByQuiz = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of examAttempts) map.set(a.quizId, Math.max(map.get(a.quizId) ?? 0, a.scorePercent));
    return map;
  }, [examAttempts]);
  const userBest = examAttempts.length ? Math.max(...examAttempts.map((a) => a.scorePercent)) : 0;

  if (activeExam) {
    return <div className="pt-2"><QuizRunner quiz={activeExam} mode="exam" onExit={() => setActiveExam(null)} /></div>;
  }

  const leaderboard = [
    { name: "Maya K.", score: 96, you: false, avatar: "🦉" },
    { name: "Jordan P.", score: 91, you: false, avatar: "🐧" },
    { name: state.profile.name.split(" ")[0], score: userBest, you: true, avatar: state.profile.avatar },
    { name: "Sam R.", score: 78, you: false, avatar: "🦁" },
    { name: "Priya N.", score: 72, you: false, avatar: "🐨" },
  ].sort((a, b) => b.score - a.score);

  const avgExam = examAttempts.length ? Math.round(examAttempts.reduce((n, a) => n + a.scorePercent, 0) / examAttempts.length) : 0;

  return (
    <div>
      <PageHeader
        title="Exam Mode"
        description="Timed, shuffled practice exams under real conditions. Track performance and climb the leaderboard."
        icon={<GraduationCap className="text-brand-500" />}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: GraduationCap, label: "Exams taken", value: examAttempts.length, tone: "brand" },
          { icon: Target, label: "Avg score", value: `${avgExam}%`, tone: "teal" },
          { icon: Trophy, label: "Best score", value: `${userBest}%`, tone: "amber" },
          { icon: TrendingUp, label: "Question bank", value: state.quizzes.reduce((n, q) => n + q.questions.length, 0), tone: "violet" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${s.tone}-500/12 text-${s.tone}-500`}><Icon size={18} /></div>
              <div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-ink-muted">{s.label}</div></div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Available exams */}
        <div className="lg:col-span-2">
          {linkedQuiz && (
            <Card className="mb-4 border-brand-400 ring-1 ring-brand-500/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-brand-500">Ready to start</div>
                  <h3 className="font-semibold">{linkedQuiz.title}</h3>
                  <p className="text-xs text-ink-faint">{linkedQuiz.questions.length} questions</p>
                </div>
                <div className="flex items-center gap-2">
                  <TimeSelect minutes={minutes} onChange={setMinutes} />
                  <button onClick={() => startExam(linkedQuiz, minutes)} className="btn-primary"><Play size={15} /> Begin exam</button>
                </div>
              </div>
            </Card>
          )}

          <h2 className="mb-3 font-semibold">Available exams</h2>
          {quizzes.length === 0 ? (
            <EmptyState icon="🎓" title="No exams available" description="Create quizzes with at least 3 questions to run them as timed exams." action={<Link href="/hub/quizzes" className="btn-primary">Create a quiz</Link>} />
          ) : (
            <div className="space-y-3">
              {quizzes.map((q, i) => {
                const subj = state.subjects.find((s) => s.id === q.subjectId);
                const best = bestByQuiz.get(q.id);
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="flex flex-wrap items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-500"><GraduationCap size={22} /></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{q.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                          <span>{q.questions.length} questions</span>
                          {subj && <span>· {subj.emoji} {subj.name}</span>}
                          {best !== undefined && <Badge tone={best >= 80 ? "teal" : "amber"}>Best {best}%</Badge>}
                        </div>
                      </div>
                      <ExamStarter quiz={q} onStart={startExam} />
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Exam history */}
          {examAttempts.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 font-semibold">Exam history</h2>
              <div className="space-y-2">
                {examAttempts.slice(0, 6).map((a) => {
                  const quiz = state.quizzes.find((q) => q.id === a.quizId);
                  return (
                    <Card key={a.id} className="flex items-center gap-3 py-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-bold ${a.scorePercent >= 80 ? "bg-teal-500/12 text-teal-500" : a.scorePercent >= 50 ? "bg-amber-500/12 text-amber-500" : "bg-rose-500/12 text-rose-500"}`}>{a.scorePercent}%</div>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{quiz?.title ?? "Deleted quiz"}</div><div className="text-xs text-ink-faint">{formatRelative(a.finishedAt)}</div></div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Trophy size={17} className="text-amber-500" /> Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((p, i) => (
                <div key={p.name + i} className={`flex items-center gap-3 rounded-xl p-2.5 ${p.you ? "bg-brand-500/10 ring-1 ring-brand-500/30" : ""}`}>
                  <div className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-400 text-white" : "text-ink-faint"}`}>{i + 1}</div>
                  <span className="text-lg">{p.avatar}</span>
                  <span className="flex-1 truncate text-sm font-medium">{p.name} {p.you && <span className="text-xs text-brand-500">(you)</span>}</span>
                  <span className="text-sm font-bold tabular-nums">{p.score}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-faint">Peers shown for context in the demo. Real cohorts appear in Institution plans.</p>
          </Card>

          <Card className="mt-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Zap size={15} className="text-brand-500" /> Exam tips</h3>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              <li>• Answer easy questions first, flag the rest.</li>
              <li>• Watch the timer — pace ~1 min per question.</li>
              <li>• Review every wrong answer afterwards.</li>
              <li>• Simulate real conditions: no notes, quiet room.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimeSelect({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  return (
    <select value={minutes} onChange={(e) => onChange(+e.target.value)} className="rounded-lg border border-edge bg-surface-raised px-2 py-2 text-sm">
      {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
    </select>
  );
}

function ExamStarter({ quiz, onStart }: { quiz: Quiz; onStart: (q: Quiz, m: number) => void }) {
  const [minutes, setMinutes] = useState(Math.max(5, Math.ceil(quiz.questions.length * 1.5)));
  return (
    <div className="flex items-center gap-2">
      <TimeSelect minutes={minutes} onChange={setMinutes} />
      <button onClick={() => onStart(quiz, minutes)} className="btn-primary btn-sm"><Play size={14} /> Start</button>
    </div>
  );
}
