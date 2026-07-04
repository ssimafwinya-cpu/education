"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Layers, StickyNote, ListChecks, Brain, Plus, Target,
  CalendarDays, TrendingUp, MessageSquare,
} from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { Card, Progress, Badge, ProgressRing, EmptyState } from "@/components/ui";
import { subjectStats, dueCountForDeck } from "@/lib/selectors";
import { subjectColor, cn, formatRelative } from "@/lib/utils";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();

  const subject = state.subjects.find((s) => s.id === id);
  const st = useMemo(() => (subject ? subjectStats(state, id) : null), [state, id, subject]);

  if (!subject || !st) {
    return (
      <EmptyState icon="🔍" title="Course not found" description="This subject may have been deleted." action={<Link href="/hub/courses" className="btn-primary">Back to courses</Link>} />
    );
  }

  const c = subjectColor(subject.color);
  const decks = state.decks.filter((d) => d.subjectId === id);
  const notes = state.notes.filter((n) => n.subjectId === id).sort((a, b) => b.updatedAt - a.updatedAt);
  const quizzes = state.quizzes.filter((q) => q.subjectId === id);

  const addDeck = () => {
    const deck = actions.newDeck({ name: `${subject.name} deck`, subjectId: id, emoji: subject.emoji });
    dispatch({ type: "ADD_DECK", deck });
    router.push(`/hub/flashcards/${deck.id}`);
  };
  const addNote = () => {
    const note = actions.newNote({ title: "Untitled note", subjectId: id, content: "# Untitled note\n\nStart writing…" });
    dispatch({ type: "ADD_NOTE", note });
    router.push(`/hub/notes?id=${note.id}`);
  };

  return (
    <div>
      <Link href="/hub/courses" className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Courses</Link>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 opacity-10" style={{ background: `radial-gradient(circle, ${c.solid}, transparent 70%)` }} />
          <div className="flex flex-wrap items-start gap-5">
            <div className={cn("grid h-16 w-16 place-items-center rounded-2xl text-4xl", c.bg)}>{subject.emoji}</div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
              {subject.goal && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Target size={14} /> {subject.goal}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand"><Layers size={12} /> {st.decks} decks</Badge>
                <Badge tone="teal"><Brain size={12} /> {st.cards} cards</Badge>
                <Badge tone="violet"><StickyNote size={12} /> {st.notes} notes</Badge>
                <Badge tone="amber"><ListChecks size={12} /> {st.quizzes} quizzes</Badge>
                {st.daysToExam !== null && <Badge tone={st.daysToExam <= 7 ? "rose" : "sky"}><CalendarDays size={12} /> Exam in {st.daysToExam}d</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing value={st.mastery} size={84} stroke={8} color={c.solid}>
                <div className="text-center">
                  <div className="text-lg font-bold">{st.mastery}%</div>
                  <div className="text-[9px] uppercase text-ink-faint">mastery</div>
                </div>
              </ProgressRing>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {st.dueCards > 0 && <Link href="/hub/review" className="btn-primary btn-sm"><Brain size={14} /> Review {st.dueCards} due</Link>}
            <Link href={`/hub/tutor?subject=${id}`} className="btn-secondary btn-sm"><MessageSquare size={14} /> Ask AI about {subject.name}</Link>
          </div>
        </Card>
      </motion.div>

      {/* Decks */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Layers size={17} className="text-brand-500" /> Flashcard decks</h2>
          <button onClick={addDeck} className="btn-ghost btn-sm"><Plus size={14} /> Add deck</button>
        </div>
        {decks.length === 0 ? (
          <EmptyState icon="🗂️" title="No decks yet" description="Create a deck and generate flashcards from your notes." action={<button onClick={addDeck} className="btn-primary btn-sm"><Plus size={14} /> New deck</button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => {
              const cards = state.cards.filter((x) => x.deckId === d.id);
              const due = dueCountForDeck(state, d.id);
              return (
                <Link key={d.id} href={`/hub/flashcards/${d.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between">
                      <div className="text-2xl">{d.emoji}</div>
                      {due > 0 && <Badge tone="rose">{due} due</Badge>}
                    </div>
                    <h3 className="mt-2 font-semibold">{d.name}</h3>
                    <p className="line-clamp-1 text-xs text-ink-faint">{d.description || "No description"}</p>
                    <p className="mt-2 text-xs text-ink-muted">{cards.length} cards</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Notes + quizzes */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><StickyNote size={17} className="text-violet-500" /> Notes</h2>
            <button onClick={addNote} className="btn-ghost btn-sm"><Plus size={14} /> Add note</button>
          </div>
          {notes.length === 0 ? (
            <Card><p className="py-4 text-center text-sm text-ink-faint">No notes yet.</p></Card>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 5).map((n) => (
                <Link key={n.id} href={`/hub/notes?id=${n.id}`}>
                  <Card hover className="flex items-center gap-3 py-3">
                    <StickyNote size={16} className="text-ink-faint" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{n.title}</div><div className="text-xs text-ink-faint">{formatRelative(n.updatedAt)}</div></div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><ListChecks size={17} className="text-amber-500" /> Quizzes</h2>
            <Link href="/hub/quizzes" className="btn-ghost btn-sm"><Plus size={14} /> New quiz</Link>
          </div>
          {quizzes.length === 0 ? (
            <Card><p className="py-4 text-center text-sm text-ink-faint">No quizzes yet.</p></Card>
          ) : (
            <div className="space-y-2">
              {quizzes.map((q) => (
                <Link key={q.id} href={`/hub/quizzes/${q.id}`}>
                  <Card hover className="flex items-center gap-3 py-3">
                    <ListChecks size={16} className="text-ink-faint" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{q.title}</div><div className="text-xs text-ink-faint">{q.questions.length} questions</div></div>
                    <TrendingUp size={15} className="text-ink-faint" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
