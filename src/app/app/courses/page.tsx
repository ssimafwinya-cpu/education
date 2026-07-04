"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Star, Archive, Search, Pin, PinOff, Trash2 } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Progress, Badge, Modal, EmptyState, Segmented, ConfirmButton } from "@/components/ui";
import { subjectStats } from "@/lib/selectors";
import { subjectColor, cn, SUBJECT_COLORS } from "@/lib/utils";
import { isoDate } from "@/lib/utils";

const EMOJIS = ["🧬", "📐", "🌍", "⚗️", "💻", "🎨", "📚", "🩺", "⚖️", "🧠", "🎵", "🏛️", "🔬", "📊", "🌡️", "🗣️"];

export default function CoursesPage() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<"active" | "archived">("active");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const subjects = useMemo(() => {
    return state.subjects
      .filter((s) => (view === "archived" ? s.archived : !s.archived))
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);
  }, [state.subjects, view, query]);

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Organise everything you're learning by subject. Track mastery and time to exam."
        actions={<button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New subject</button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "active", label: "Active" },
            { value: "archived", label: <span className="flex items-center gap-1"><Archive size={13} /> Archived</span> },
          ]}
        />
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses…" className="input pl-9" />
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon="📚"
          title={view === "archived" ? "No archived courses" : "No courses yet"}
          description={view === "archived" ? "Archived courses will appear here." : "Create your first subject to start organising your studies."}
          action={view === "active" && <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New subject</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => {
            const st = subjectStats(state, s.id);
            const c = subjectColor(s.color);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card hover className="group relative h-full">
                  <div className="flex items-start justify-between">
                    <Link href={`/app/courses/${s.id}`} className={cn("grid h-12 w-12 place-items-center rounded-xl text-2xl", c.bg)}>{s.emoji}</Link>
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => dispatch({ type: "UPDATE_SUBJECT", id: s.id, patch: { pinned: !s.pinned } })}
                        className="btn-ghost btn-sm" title={s.pinned ? "Unpin" : "Pin"}
                      >
                        {s.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                      </button>
                      <button
                        onClick={() => dispatch({ type: "UPDATE_SUBJECT", id: s.id, patch: { archived: !s.archived } })}
                        className="btn-ghost btn-sm" title={s.archived ? "Restore" : "Archive"}
                      >
                        <Archive size={15} />
                      </button>
                      <ConfirmButton onConfirm={() => dispatch({ type: "DELETE_SUBJECT", id: s.id })} className="btn-ghost btn-sm text-rose-500" confirmLabel="Delete?">
                        <Trash2 size={15} />
                      </ConfirmButton>
                    </div>
                  </div>
                  <Link href={`/app/courses/${s.id}`} className="mt-3 block">
                    <div className="flex items-center gap-1.5">
                      {s.pinned && <Star size={13} className="fill-amber-400 text-amber-400" />}
                      <h3 className="font-semibold">{s.name}</h3>
                    </div>
                    {s.goal && <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{s.goal}</p>}
                    <p className="mt-2 text-xs text-ink-faint">{st.decks} decks · {st.cards} cards · {st.notes} notes · {st.quizzes} quizzes</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={st.mastery} tone="brand" />
                      <span className="text-xs font-semibold tabular-nums" style={{ color: c.solid }}>{st.mastery}%</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {st.daysToExam !== null ? (
                        <Badge tone={st.daysToExam <= 7 ? "rose" : st.daysToExam <= 21 ? "amber" : "teal"}>Exam in {st.daysToExam}d</Badge>
                      ) : <span className="text-xs text-ink-faint">No exam set</span>}
                      {st.dueCards > 0 && <Badge tone="rose">{st.dueCards} due</Badge>}
                    </div>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateSubjectModal open={creating} onClose={() => setCreating(false)} onCreate={(s) => { dispatch({ type: "ADD_SUBJECT", subject: s }); setCreating(false); }} />
    </div>
  );
}

function CreateSubjectModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (s: ReturnType<typeof actions.newSubject>) => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState("indigo");
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");

  const reset = () => { setName(""); setEmoji(EMOJIS[0]); setColor("indigo"); setGoal(""); setExamDate(""); };

  return (
    <Modal open={open} onClose={onClose} title="New subject">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Organic Chemistry" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className={cn("grid h-9 w-9 place-items-center rounded-lg text-lg transition", emoji === e ? "bg-brand-500/15 ring-2 ring-brand-500" : "hover:bg-surface")}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Colour</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SUBJECT_COLORS).map(([key, c]) => (
              <button key={key} onClick={() => setColor(key)} className={cn("h-8 w-8 rounded-full transition", color === key && "ring-2 ring-offset-2 ring-offset-surface")} style={{ background: c.solid, boxShadow: color === key ? `0 0 0 2px ${c.solid}` : undefined }} aria-label={key} />
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Goal (optional)</label>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} className="input" placeholder="e.g. Pass the final with an A" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Exam date (optional)</label>
          <input type="date" value={examDate} min={isoDate()} onChange={(e) => setExamDate(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => {
              onCreate(actions.newSubject({
                name: name.trim(), emoji, color, goal: goal.trim() || undefined,
                examDate: examDate ? new Date(examDate + "T09:00:00").getTime() : undefined,
              }));
              reset();
            }}
            className="btn-primary"
          >
            Create subject
          </button>
        </div>
      </div>
    </Modal>
  );
}
