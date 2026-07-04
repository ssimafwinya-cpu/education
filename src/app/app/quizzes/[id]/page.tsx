"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Play, ListChecks, Clock, History } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, EmptyState } from "@/components/ui";
import { QuizRunner } from "@/components/quiz-runner";
import { formatRelative } from "@/lib/utils";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useStore();
  const [running, setRunning] = useState(false);

  const quiz = state.quizzes.find((q) => q.id === id);
  if (!quiz) return <EmptyState icon="🔍" title="Quiz not found" action={<Link href="/app/quizzes" className="btn-primary">Back to quizzes</Link>} />;

  const attempts = state.attempts.filter((a) => a.quizId === id).sort((a, b) => b.finishedAt - a.finishedAt);
  const subj = state.subjects.find((s) => s.id === quiz.subjectId);

  if (running) return <div className="pt-2"><QuizRunner quiz={quiz} mode="practice" onExit={() => setRunning(false)} /></div>;

  return (
    <div>
      <Link href="/app/quizzes" className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Quizzes</Link>

      <Card className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500"><ListChecks size={30} /></div>
        <h1 className="mt-4 text-2xl font-bold">{quiz.title}</h1>
        <p className="text-ink-muted">{quiz.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Badge tone="amber">{quiz.questions.length} questions</Badge>
          {subj && <Badge tone="teal">{subj.emoji} {subj.name}</Badge>}
          {quiz.source === "ai" && <Badge tone="brand">✨ AI-generated</Badge>}
        </div>
        <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2">
          <button onClick={() => setRunning(true)} className="btn-primary py-3"><Play size={17} /> Start practice</button>
          <button onClick={() => router.push(`/app/exams?quiz=${id}`)} className="btn-secondary"><Clock size={15} /> Take as timed exam</button>
        </div>
      </Card>

      {attempts.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><History size={17} className="text-brand-500" /> Attempt history</h2>
          <div className="space-y-2">
            {attempts.map((a) => (
              <Card key={a.id} className="flex items-center gap-4 py-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${a.scorePercent >= 80 ? "bg-teal-500/12 text-teal-500" : a.scorePercent >= 50 ? "bg-amber-500/12 text-amber-500" : "bg-rose-500/12 text-rose-500"}`}>{a.scorePercent}%</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.answers.filter((x) => x.correct).length}/{a.answers.length} correct</div>
                  <div className="text-xs text-ink-faint">{formatRelative(a.finishedAt)} · {Math.round((a.finishedAt - a.startedAt) / 1000)}s</div>
                </div>
                <Badge tone={a.mode === "exam" ? "rose" : "brand"} className="capitalize">{a.mode}</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
