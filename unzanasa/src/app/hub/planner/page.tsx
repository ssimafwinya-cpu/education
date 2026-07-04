"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Sparkles, Plus, Check, Trash2, Clock, Coffee,
  Brain, BookOpen, ListChecks, Gauge, Wand2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, EmptyState, Modal, ProgressRing, useToast, Segmented } from "@/components/ui";
import { generatePlan, productivityScore, type PlanConfig } from "@/lib/planner";
import { isoDate, addDays, cn, uid, formatDuration } from "@/lib/utils";
import type { PlannerTask, PlanKind } from "@/lib/types";

const KIND_ICON: Record<PlanKind, typeof Brain> = { study: BookOpen, review: Brain, quiz: ListChecks, break: Coffee, exam: CalendarDays };
const KIND_TONE: Record<PlanKind, string> = { study: "brand", review: "teal", quiz: "amber", break: "sky", exam: "rose" };

export default function PlannerPage() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [genOpen, setGenOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [range, setRange] = useState<"today" | "week">("week");

  const score = useMemo(() => productivityScore(state), [state]);

  const days = useMemo(() => {
    const count = range === "today" ? 1 : 7;
    return Array.from({ length: count }, (_, i) => {
      const date = isoDate(addDays(new Date(), i));
      const tasks = state.planner.filter((t) => t.date === date).sort((a, b) => Number(a.done) - Number(b.done));
      return { date, tasks };
    });
  }, [state.planner, range]);

  const totalTasks = state.planner.length;
  const doneTasks = state.planner.filter((t) => t.done).length;
  const totalMinutes = state.planner.filter((t) => !t.done && t.kind !== "break").reduce((n, t) => n + t.durationMin, 0);

  return (
    <div>
      <PageHeader
        title="Study Planner"
        description="Let AI build a balanced, exam-aware schedule — or add your own tasks."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(true)} className="btn-secondary"><Plus size={16} /> Add task</button>
            <button onClick={() => setGenOpen(true)} className="btn-primary"><Sparkles size={16} /> Auto-generate</button>
          </div>
        }
      />

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="flex items-center gap-3">
          <ProgressRing value={score} size={56} stroke={6} color={score >= 70 ? "#14b8a6" : score >= 40 ? "#f59e0b" : "#f43f5e"}>
            <Gauge size={18} className="text-ink-muted" />
          </ProgressRing>
          <div><div className="text-xl font-bold">{score}</div><div className="text-xs text-ink-muted">Productivity</div></div>
        </Card>
        <Card className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/12 text-brand-500"><Check size={18} /></div><div><div className="text-xl font-bold">{doneTasks}/{totalTasks}</div><div className="text-xs text-ink-muted">Tasks done</div></div></Card>
        <Card className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/12 text-teal-500"><Clock size={18} /></div><div><div className="text-xl font-bold">{formatDuration(totalMinutes)}</div><div className="text-xs text-ink-muted">Planned time</div></div></Card>
        <Card className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/12 text-amber-500"><CalendarDays size={18} /></div><div><div className="text-xl font-bold">{new Set(state.planner.map((t) => t.date)).size}</div><div className="text-xs text-ink-muted">Days scheduled</div></div></Card>
      </div>

      <div className="mb-4">
        <Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }]} />
      </div>

      {totalTasks === 0 ? (
        <EmptyState
          icon="📅"
          title="No study plan yet"
          description="Auto-generate a personalised schedule based on your exam dates, weak subjects and available time."
          action={<button onClick={() => setGenOpen(true)} className="btn-primary"><Sparkles size={16} /> Generate my plan</button>}
        />
      ) : (
        <div className={cn("grid gap-4", range === "week" ? "sm:grid-cols-2 lg:grid-cols-3" : "")}>
          {days.map(({ date, tasks }, di) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === isoDate();
            const done = tasks.filter((t) => t.done).length;
            return (
              <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.04 }}>
                <Card className={cn("h-full", isToday && "ring-1 ring-brand-500/30")}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "long" })}</div>
                      <div className="text-xs text-ink-faint">{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                    </div>
                    {tasks.length > 0 && <Badge tone={done === tasks.length ? "teal" : "brand"}>{done}/{tasks.length}</Badge>}
                  </div>
                  {tasks.length === 0 ? (
                    <p className="py-4 text-center text-xs text-ink-faint">Rest day</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((t) => {
                        const Icon = KIND_ICON[t.kind];
                        const subj = state.subjects.find((s) => s.id === t.subjectId);
                        return (
                          <div key={t.id} className={cn("group flex items-center gap-2.5 rounded-xl border border-edge p-2.5 transition", t.done && "opacity-55")}>
                            <button onClick={() => dispatch({ type: "TOGGLE_PLANNER_TASK", id: t.id })} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition", t.done ? "border-teal-500 bg-teal-500 text-white" : "border-edge-strong hover:border-brand-500")}>
                              {t.done && <Check size={13} />}
                            </button>
                            <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", `bg-${KIND_TONE[t.kind]}-500/12 text-${KIND_TONE[t.kind]}-500`)}><Icon size={14} /></div>
                            <div className="min-w-0 flex-1">
                              <div className={cn("truncate text-sm", t.done && "line-through")}>{t.title}</div>
                              <div className="text-[11px] text-ink-faint">{subj ? `${subj.emoji} · ` : ""}{t.durationMin} min</div>
                            </div>
                            <button onClick={() => dispatch({ type: "DELETE_PLANNER_TASK", id: t.id })} className="btn-ghost btn-sm text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <GeneratePlanModal open={genOpen} onClose={() => setGenOpen(false)} />
      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function GeneratePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const active = state.subjects.filter((s) => !s.archived);
  const [days, setDays] = useState(7);
  const [minutesPerDay, setMinutesPerDay] = useState(state.profile.settings.dailyStudyMinutesTarget || 60);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [preview, setPreview] = useState<PlannerTask[] | null>(null);

  const build = () => {
    const cfg: PlanConfig = { days, minutesPerDay, subjectIds, includeWeekends };
    setPreview(generatePlan(state, cfg));
  };

  const apply = () => {
    if (!preview) return;
    dispatch({ type: "ADD_PLANNER_TASKS", tasks: preview, replaceAuto: true });
    toast({ emoji: "📅", title: "Study plan generated", description: `${preview.length} tasks across ${days} days.` });
    setPreview(null); onClose();
  };

  const toggle = (id: string) => setSubjectIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Wand2 size={18} className="text-brand-500" /> Generate study plan</span>} size="lg">
      {!preview ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">Days to plan</label>
              <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, Math.min(30, +e.target.value)))} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">Minutes per day</label>
              <input type="number" min={15} max={480} step={15} value={minutesPerDay} onChange={(e) => setMinutesPerDay(Math.max(15, +e.target.value))} className="input" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Subjects (none = all)</label>
            <div className="flex flex-wrap gap-2">
              {active.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)} className={cn("chip border transition", subjectIds.includes(s.id) ? "border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-300" : "border-edge text-ink-muted")}>{s.emoji} {s.name}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeWeekends} onChange={(e) => setIncludeWeekends(e.target.checked)} className="accent-brand-500" /> Include weekends
          </label>
          <div className="rounded-xl bg-brand-500/5 p-3 text-xs text-ink-muted">
            💡 The planner prioritises subjects with <strong>closer exams</strong> and <strong>lower mastery</strong>, interleaves them across days, and always schedules a spaced-repetition review block.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={build} disabled={active.length === 0} className="btn-primary"><Sparkles size={15} /> Preview plan</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">Generated <strong>{preview.length}</strong> tasks. This replaces any existing auto-generated tasks.</p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {preview.length === 0 ? <p className="py-4 text-center text-sm text-ink-faint">No tasks — try more minutes per day or add subjects with exam dates.</p> :
              Object.entries(preview.reduce((acc, t) => { (acc[t.date] ??= []).push(t); return acc; }, {} as Record<string, PlannerTask[]>)).map(([date, tasks]) => (
                <div key={date}>
                  <div className="px-1 py-1 text-xs font-semibold text-ink-faint">{new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                  {tasks.map((t) => {
                    const Icon = KIND_ICON[t.kind];
                    return <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"><Icon size={14} className={`text-${KIND_TONE[t.kind]}-500`} /> <span className="flex-1">{t.title}</span> <span className="text-xs text-ink-faint">{t.durationMin}m</span></div>;
                  })}
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-edge pt-3">
            <button onClick={() => setPreview(null)} className="btn-secondary">Back</button>
            <button onClick={apply} disabled={preview.length === 0} className="btn-primary"><Check size={15} /> Apply plan</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(isoDate());
  const [subjectId, setSubjectId] = useState("");
  const [kind, setKind] = useState<PlanKind>("study");
  const [durationMin, setDurationMin] = useState(30);

  const save = () => {
    const task: PlannerTask = { id: uid("plan"), date, title: title.trim(), subjectId: subjectId || null, kind, durationMin, done: false, auto: false };
    dispatch({ type: "ADD_PLANNER_TASKS", tasks: [task] });
    setTitle(""); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add task">
      <div className="space-y-4">
        <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Title</label><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Review chapter 4" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Duration (min)</label><input type="number" min={5} step={5} value={durationMin} onChange={(e) => setDurationMin(+e.target.value)} className="input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as PlanKind)} className="input">
              {(["study", "review", "quiz", "break", "exam"] as PlanKind[]).map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}
            </select>
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-ink-muted">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
              <option value="">None</option>
              {state.subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={save} disabled={!title.trim()} className="btn-primary">Add task</button></div>
      </div>
    </Modal>
  );
}
