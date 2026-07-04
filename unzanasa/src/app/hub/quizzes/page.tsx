"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ListChecks, Sparkles, Trash2, Clock, TrendingUp, X, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, EmptyState, Modal, useToast, ConfirmButton } from "@/components/ui";
import { generateQuizQuestions } from "@/lib/ai/client";
import { uid, pct } from "@/lib/utils";
import type { Quiz } from "@/lib/types";

export default function QuizzesPage() {
  const { state, dispatch } = useStore();
  const [genOpen, setGenOpen] = useState(false);

  const quizzes = [...state.quizzes].sort((a, b) => b.createdAt - a.createdAt);
  const bestScore = (quizId: string) => {
    const attempts = state.attempts.filter((a) => a.quizId === quizId);
    return attempts.length ? Math.max(...attempts.map((a) => a.scorePercent)) : null;
  };

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Auto-marked practice quizzes with instant explanations. Generate from any material."
        actions={<button onClick={() => setGenOpen(true)} className="btn-primary"><Sparkles size={16} /> Generate quiz</button>}
      />

      {quizzes.length === 0 ? (
        <EmptyState icon="📝" title="No quizzes yet" description="Generate a quiz from your notes or any text — MCQ, true/false, short answer and fill-in-the-blank." action={<button onClick={() => setGenOpen(true)} className="btn-primary"><Sparkles size={16} /> Generate your first quiz</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q, i) => {
            const subj = state.subjects.find((s) => s.id === q.subjectId);
            const best = bestScore(q.id);
            const attempts = state.attempts.filter((a) => a.quizId === q.id).length;
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card hover className="group h-full">
                  <div className="flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-500"><ListChecks size={20} /></div>
                    <div className="flex items-center gap-1.5">
                      {q.source === "ai" && <Badge tone="brand"><Sparkles size={11} /> AI</Badge>}
                      <ConfirmButton onConfirm={() => dispatch({ type: "DELETE_QUIZ", id: q.id })} className="btn-ghost btn-sm text-rose-500 opacity-0 group-hover:opacity-100" confirmLabel="?"><Trash2 size={14} /></ConfirmButton>
                    </div>
                  </div>
                  <Link href={`/hub/quizzes/${q.id}`} className="mt-3 block">
                    <h3 className="font-semibold">{q.title}</h3>
                    <p className="line-clamp-1 text-xs text-ink-faint">{q.description || `${q.questions.length} questions`}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{q.questions.length} questions{subj ? ` · ${subj.emoji}` : ""}</span>
                      {best !== null ? <Badge tone={best >= 80 ? "teal" : best >= 50 ? "amber" : "rose"}><TrendingUp size={11} /> {best}%</Badge> : <span className="text-ink-faint">Not attempted</span>}
                    </div>
                    {attempts > 0 && <div className="mt-1 text-[11px] text-ink-faint">{attempts} attempt{attempts > 1 ? "s" : ""}</div>}
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <GenerateQuizModal open={genOpen} onClose={() => setGenOpen(false)} onCreate={(quiz) => { dispatch({ type: "ADD_QUIZ", quiz }); setGenOpen(false); }} />
    </div>
  );
}

function GenerateQuizModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (q: Quiz) => void }) {
  const { state } = useStore();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<import("@/lib/ai/tutor-engine").GeneratedQuestion[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateQuizQuestions(text, count);
      setQuestions(result);
      if (result.length === 0) toast({ emoji: "🤔", title: "Add more text to generate from" });
    } catch (e) { toast({ emoji: "⚠️", title: "Generation failed", description: String((e as Error).message) }); }
    setLoading(false);
  };

  const save = () => {
    onCreate({
      id: uid("quiz"),
      subjectId: subjectId || null,
      title: title.trim() || "AI-generated quiz",
      description: `${questions.length} questions`,
      questions: questions.map((qq) => ({ id: uid("q"), kind: qq.kind, prompt: qq.prompt, options: qq.options, answerIndex: qq.answerIndex, answerText: qq.answerText, explanation: qq.explanation, topic: qq.topic })),
      createdAt: Date.now(),
      source: "ai",
    });
    setText(""); setQuestions([]); setTitle("");
    toast({ emoji: "🎉", title: "Quiz created" });
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Sparkles size={18} className="text-brand-500" /> Generate a quiz</span>} size="lg">
      {questions.length === 0 ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Cell Biology Quiz" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
                <option value="">No subject</option>
                {state.subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Source material</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[140px] resize-y" placeholder="Paste notes or study text — the AI turns it into quiz questions…" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-muted">Questions: <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, +e.target.value)))} className="input w-20" /></label>
            <button onClick={generate} disabled={loading || text.trim().length < 20} className="btn-primary">{loading ? "Generating…" : <><Sparkles size={15} /> Generate</>}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted"><strong>{questions.length}</strong> questions generated.</p>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {questions.map((qq, i) => (
              <div key={i} className="rounded-xl border border-edge p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge tone="amber" className="uppercase">{qq.kind}</Badge>
                  <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="btn-ghost btn-sm text-rose-500"><X size={13} /></button>
                </div>
                <div className="text-sm font-medium">{qq.prompt}</div>
                <div className="mt-1 text-xs text-teal-500">Answer: {qq.kind === "mcq" && qq.options ? qq.options[qq.answerIndex ?? 0] : qq.answerText ?? (qq.answerIndex === 0 ? "True" : "False")}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-edge pt-3">
            <button onClick={() => setQuestions([])} className="btn-secondary">Back</button>
            <button onClick={save} className="btn-primary"><Check size={15} /> Create quiz</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
