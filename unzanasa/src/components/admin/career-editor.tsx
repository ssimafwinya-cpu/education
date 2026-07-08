"use client";

// Admin editor for Career Mode courses. Courses are authored against a LOCAL
// draft and only enter the shared store (SET_CAREER_COURSES → /api/content)
// after validateCareerCourse passes — a half-edited course can never reach
// members. Built-in courses ship in code; "Customise" copies one into a
// draft whose save overrides it (same id). JSON import/export lets content
// be prepared offline or moved between deployments.

import { useState } from "react";
import {
  Plus, Trash2, Pencil, Swords, Upload, Copy, ChevronDown, ChevronRight,
  AlertTriangle, CircleAlert, Save, X, GraduationCap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui";
import type { CareerCourse, CareerQuestion, CareerTopic } from "@/lib/career";
import { CAREER_COURSES } from "@/lib/career-content";
import {
  validateCareerCourse, mergeCareerCourses, parseCareerCourseJson,
  serializeCareerCourse, blankCourse, blankTopic, blankQuestion,
} from "@/lib/career-authoring";
import { cn } from "@/lib/utils";

export function CareerEditor() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const custom = state.careerCourses ?? [];
  const [draft, setDraft] = useState<CareerCourse | null>(null);
  const [problems, setProblems] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const commit = (courses: CareerCourse[]) => dispatch({ type: "SET_CAREER_COURSES", courses });

  const saveDraft = () => {
    if (!draft) return;
    const r = validateCareerCourse(draft);
    if (!r.ok) {
      setProblems({ errors: r.errors, warnings: [] });
      toast({ emoji: "⚠️", title: `${r.errors.length} problem${r.errors.length === 1 ? "" : "s"} to fix before saving` });
      return;
    }
    commit([...custom.filter((c) => c.id !== r.course.id), r.course]);
    setProblems({ errors: [], warnings: r.warnings });
    setDraft(null);
    toast({ emoji: "🎓", title: `${r.course.code || r.course.title} saved — live for every member.` });
  };

  const deleteCourse = (id: string) => {
    if (!confirm("Remove this course from Career Mode? Student progress on it is kept but hidden.")) return;
    commit(custom.filter((c) => c.id !== id));
    toast({ emoji: "🗑️", title: "Course removed." });
  };

  const exportCourse = async (c: CareerCourse) => {
    await navigator.clipboard.writeText(serializeCareerCourse(c));
    toast({ emoji: "📋", title: `${c.code} JSON copied to the clipboard.` });
  };

  const importJson = () => {
    const r = parseCareerCourseJson(importText);
    if (!r.ok) { setProblems({ errors: r.errors, warnings: [] }); return; }
    setDraft(r.course);
    setProblems({ errors: [], warnings: r.warnings });
    setImportOpen(false);
    setImportText("");
    toast({ emoji: "📥", title: `${r.course.code || r.course.title} loaded — review and save.` });
  };

  // ── Editing a draft ────────────────────────────────────────────────────────
  if (draft) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><Pencil size={16} className="text-brand-500" /> Editing {draft.code || "new course"}</div>
          <div className="flex gap-2">
            <button onClick={() => { setDraft(null); setProblems({ errors: [], warnings: [] }); }} className="btn-secondary btn-sm"><X size={14} /> Discard</button>
            <button onClick={saveDraft} className="btn-primary btn-sm"><Save size={14} /> Save course</button>
          </div>
        </div>

        {problems.errors.length > 0 && (
          <div className="rounded-xl border border-crimson-600/40 bg-crimson-600/5 p-3 text-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-crimson-600"><AlertTriangle size={15} /> Fix before saving</div>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {problems.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <CourseForm draft={draft} onChange={setDraft} />
      </div>
    );
  }

  // ── Course list ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Swords size={17} className="text-brand-500" /> Career courses{" "}
          <span className="text-sm text-ink-faint">({mergeCareerCourses(CAREER_COURSES, custom).length} live)</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen((v) => !v)} className="btn-secondary btn-sm"><Upload size={14} /> Import JSON</button>
          <button onClick={() => { setDraft(blankCourse()); setProblems({ errors: [], warnings: [] }); }} className="btn-primary btn-sm"><Plus size={14} /> New course</button>
        </div>
      </div>

      {importOpen && (
        <div className="rounded-xl border border-edge bg-surface p-3">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder='Paste a course JSON (use "Copy JSON" on any course as a template)…'
            className="input w-full font-mono text-xs"
            aria-label="Course JSON"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setImportOpen(false)} className="btn-ghost btn-sm">Cancel</button>
            <button onClick={importJson} className="btn-primary btn-sm" disabled={!importText.trim()}><Upload size={13} /> Load into editor</button>
          </div>
        </div>
      )}

      {problems.errors.length > 0 && (
        <div className="rounded-xl border border-crimson-600/40 bg-crimson-600/5 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-crimson-600"><AlertTriangle size={15} /> Import failed</div>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {problems.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {problems.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400"><CircleAlert size={15} /> Saved with suggestions</div>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {problems.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {CAREER_COURSES.map((c) => {
          const overridden = custom.some((x) => x.id === c.id);
          if (overridden) return null;
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-edge bg-surface-raised/50 p-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.code} · {c.title}</div>
                <div className="text-xs text-ink-faint">{c.topics.length} topics · built-in</div>
              </div>
              <button onClick={() => exportCourse(c)} className="btn-ghost btn-sm" aria-label={`Copy ${c.code} JSON`}><Copy size={14} /> Copy JSON</button>
              <button
                onClick={() => { setDraft(structuredClone(c)); setProblems({ errors: [], warnings: [] }); }}
                className="btn-secondary btn-sm"
              >
                <Pencil size={13} /> Customise
              </button>
            </div>
          );
        })}

        {custom.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3">
            <span className="text-xl">{c.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{c.code} · {c.title}</div>
              <div className="text-xs text-ink-faint">
                {c.topics.length} topics · {CAREER_COURSES.some((b) => b.id === c.id) ? "overrides built-in" : "custom"}
              </div>
            </div>
            <button onClick={() => exportCourse(c)} className="btn-ghost btn-sm" aria-label={`Copy ${c.code} JSON`}><Copy size={14} /> Copy JSON</button>
            <button onClick={() => { setDraft(structuredClone(c)); setProblems({ errors: [], warnings: [] }); }} className="btn-secondary btn-sm"><Pencil size={13} /> Edit</button>
            <button onClick={() => deleteCourse(c.id)} className="btn-ghost btn-sm text-crimson-600" aria-label={`Delete ${c.code}`}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ink-faint">
        Feed in the course outline as topics, the lecture notes as teach sections, and past-paper questions
        as drills and Move Tests (mark them <em>past-paper</em> with a reference like &ldquo;2023 Final Q4&rdquo;).
        Saved courses reach every member through the shared site content.
      </p>
    </div>
  );
}

// ─── Course form ─────────────────────────────────────────────────────────────

function CourseForm({ draft, onChange }: { draft: CareerCourse; onChange: (c: CareerCourse) => void }) {
  const patch = (p: Partial<CareerCourse>) => onChange({ ...draft, ...p });
  const patchTopic = (ti: number, p: Partial<CareerTopic>) =>
    patch({ topics: draft.topics.map((t, i) => (i === ti ? { ...t, ...p } : t)) });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-edge bg-surface p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><GraduationCap size={15} className="text-brand-500" /> Course</div>
        <div className="grid gap-2 sm:grid-cols-[70px_140px_1fr]">
          <input value={draft.emoji} onChange={(e) => patch({ emoji: e.target.value })} className="input text-center text-lg" aria-label="Course emoji" maxLength={4} />
          <input value={draft.code} onChange={(e) => patch({ code: e.target.value })} className="input font-mono" placeholder="BIO 1400" aria-label="Course code" />
          <input value={draft.title} onChange={(e) => patch({ title: e.target.value })} className="input" placeholder="Course title" aria-label="Course title" />
        </div>
        <textarea
          value={draft.intro} onChange={(e) => patch({ intro: e.target.value })} rows={2}
          className="input mt-2 w-full text-sm" placeholder="One-paragraph intro students see at the top of the path…" aria-label="Course intro"
        />
      </div>

      {draft.topics.map((t, ti) => (
        <TopicForm
          key={t.id}
          topic={t}
          index={ti}
          siblings={draft.topics}
          onChange={(p) => patchTopic(ti, p)}
          onDelete={() => patch({ topics: draft.topics.filter((_, i) => i !== ti) })}
        />
      ))}

      <button onClick={() => patch({ topics: [...draft.topics, blankTopic()] })} className="btn-secondary btn-sm">
        <Plus size={13} /> Add topic
      </button>
    </div>
  );
}

// ─── Topic form ──────────────────────────────────────────────────────────────

function TopicForm({ topic, index, siblings, onChange, onDelete }: {
  topic: CareerTopic;
  index: number;
  siblings: CareerTopic[];
  onChange: (p: Partial<CareerTopic>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const others = siblings.filter((s) => s.id !== topic.id);

  const togglePrereq = (id: string) =>
    onChange({ prereqs: topic.prereqs.includes(id) ? topic.prereqs.filter((p) => p !== id) : [...topic.prereqs, id] });

  const patchTeach = (si: number, p: Partial<CareerTopic["teach"][number]>) =>
    onChange({ teach: topic.teach.map((s, i) => (i === si ? { ...s, ...p } : s)) });
  const patchList = (which: "drill" | "moveTest", qi: number, q: CareerQuestion) =>
    onChange({ [which]: topic[which].map((x, i) => (i === qi ? q : x)) } as Partial<CareerTopic>);
  const dropFrom = (which: "drill" | "moveTest", qi: number) =>
    onChange({ [which]: topic[which].filter((_, i) => i !== qi) } as Partial<CareerTopic>);

  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen((v) => !v)} className="btn-ghost btn-sm" aria-label={open ? "Collapse topic" : "Expand topic"} aria-expanded={open}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <input value={topic.emoji} onChange={(e) => onChange({ emoji: e.target.value })} className="input w-14 text-center" aria-label="Topic emoji" maxLength={4} />
        <input value={topic.title} onChange={(e) => onChange({ title: e.target.value })} className="input flex-1 font-semibold" placeholder={`Topic ${index + 1} title`} aria-label="Topic title" />
        <label className="flex items-center gap-1 text-xs text-ink-muted">
          weight
          <input
            type="number" min={1} value={topic.examWeight}
            onChange={(e) => onChange({ examWeight: Number(e.target.value) })}
            className="input w-16 text-center" aria-label="Exam weight"
          />
        </label>
        <button onClick={onDelete} className="btn-ghost btn-sm text-crimson-600" aria-label={`Delete topic ${topic.title || index + 1}`}><Trash2 size={14} /></button>
      </div>

      {open && (
        <div className="mt-3 space-y-4">
          <input
            value={topic.whyLine} onChange={(e) => onChange({ whyLine: e.target.value })}
            className="input w-full text-sm" aria-label="Why this topic"
            placeholder='Why this gate exists — e.g. "Worth 20 of 60 marks on the 2023 final."'
          />

          {others.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-ink-muted">Unlocks after:</span>
              {others.map((o) => (
                <label key={o.id} className={cn("chip cursor-pointer border", topic.prereqs.includes(o.id) ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300" : "border-edge text-ink-muted")}>
                  <input type="checkbox" className="sr-only" checked={topic.prereqs.includes(o.id)} onChange={() => togglePrereq(o.id)} />
                  {o.emoji} {o.title || o.id}
                </label>
              ))}
              {topic.prereqs.length === 0 && <span className="text-ink-faint">nothing — a starting topic</span>}
            </div>
          )}

          {/* Teach sections */}
          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Teach — from the notes</div>
            <div className="space-y-3">
              {topic.teach.map((s, si) => (
                <div key={si} className="rounded-lg border border-edge bg-surface-raised/50 p-3">
                  <div className="flex items-center gap-2">
                    <input value={s.heading} onChange={(e) => patchTeach(si, { heading: e.target.value })} className="input flex-1 text-sm font-medium" placeholder="Section heading" aria-label="Section heading" />
                    <button
                      onClick={() => onChange({ teach: topic.teach.filter((_, i) => i !== si) })}
                      className="btn-ghost btn-sm text-crimson-600" aria-label="Delete teach section"
                    ><Trash2 size={13} /></button>
                  </div>
                  <textarea
                    value={s.body} onChange={(e) => patchTeach(si, { body: e.target.value })} rows={3}
                    className="input mt-2 w-full text-sm" placeholder="The teaching script for this piece of the notes…" aria-label="Section body"
                  />
                  <div className="mt-2">
                    <div className="mb-1 text-[11px] font-medium text-ink-faint">Comprehension check (answered before moving on)</div>
                    <QuestionForm value={s.check} onChange={(q) => patchTeach(si, { check: q })} />
                  </div>
                </div>
              ))}
              <button onClick={() => onChange({ teach: [...topic.teach, { heading: "", body: "", check: blankQuestion() }] })} className="btn-secondary btn-sm"><Plus size={13} /> Add section</button>
            </div>
          </section>

          {/* Drill + Move Test */}
          {(["drill", "moveTest"] as const).map((which) => (
            <section key={which}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {which === "drill" ? "Drill — practised open-book with feedback" : "Move Test — the closed-book gate (80% to pass)"}
              </div>
              <div className="space-y-2">
                {topic[which].map((q, qi) => (
                  <div key={q.id} className="rounded-lg border border-edge bg-surface-raised/50 p-3">
                    <QuestionForm value={q} onChange={(next) => patchList(which, qi, next)} onDelete={() => dropFrom(which, qi)} />
                  </div>
                ))}
                <button onClick={() => onChange({ [which]: [...topic[which], blankQuestion()] } as Partial<CareerTopic>)} className="btn-secondary btn-sm">
                  <Plus size={13} /> Add question
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question form ───────────────────────────────────────────────────────────

function QuestionForm({ value: q, onChange, onDelete }: {
  value: CareerQuestion;
  onChange: (q: CareerQuestion) => void;
  onDelete?: () => void;
}) {
  const setKind = (kind: CareerQuestion["kind"]) => {
    if (kind === "fill") onChange({ ...q, kind, options: undefined, answerIndex: undefined, answerText: q.answerText ?? [""] });
    else if (kind === "truefalse") onChange({ ...q, kind, options: ["True", "False"], answerIndex: q.answerIndex === 1 ? 1 : 0, answerText: undefined });
    else onChange({ ...q, kind, options: q.options && q.options.length >= 2 ? q.options : ["", ""], answerIndex: q.answerIndex ?? 0, answerText: undefined });
  };
  const options = q.options ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select value={q.kind} onChange={(e) => setKind(e.target.value as CareerQuestion["kind"])} className="input w-28 text-xs" aria-label="Question type">
          <option value="mcq">Multiple choice</option>
          <option value="truefalse">True / False</option>
          <option value="fill">Fill in</option>
        </select>
        <input value={q.prompt} onChange={(e) => onChange({ ...q, prompt: e.target.value })} className="input flex-1 text-sm" placeholder="Question prompt" aria-label="Question prompt" />
        {onDelete && <button onClick={onDelete} className="btn-ghost btn-sm text-crimson-600" aria-label="Delete question"><Trash2 size={13} /></button>}
      </div>

      {q.kind === "mcq" && (
        <div className="space-y-1.5">
          {options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input
                type="radio" name={`ans-${q.id}`} checked={q.answerIndex === oi}
                onChange={() => onChange({ ...q, answerIndex: oi })} aria-label={`Option ${oi + 1} is correct`}
              />
              <input
                value={opt}
                onChange={(e) => onChange({ ...q, options: options.map((o, i) => (i === oi ? e.target.value : o)) })}
                className="input flex-1 text-sm" placeholder={`Option ${oi + 1}`} aria-label={`Option ${oi + 1}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => onChange({
                    ...q,
                    options: options.filter((_, i) => i !== oi),
                    answerIndex: q.answerIndex === oi ? 0 : (q.answerIndex ?? 0) > oi ? (q.answerIndex ?? 0) - 1 : q.answerIndex,
                  })}
                  className="btn-ghost btn-sm text-crimson-600" aria-label={`Remove option ${oi + 1}`}
                ><X size={13} /></button>
              )}
            </div>
          ))}
          <button onClick={() => onChange({ ...q, options: [...options, ""] })} className="btn-ghost btn-sm"><Plus size={12} /> Option</button>
        </div>
      )}

      {q.kind === "truefalse" && (
        <div className="flex gap-3 text-sm">
          {["True", "False"].map((label, oi) => (
            <label key={label} className="flex items-center gap-1.5">
              <input type="radio" name={`ans-${q.id}`} checked={q.answerIndex === oi} onChange={() => onChange({ ...q, answerIndex: oi })} />
              {label} is correct
            </label>
          ))}
        </div>
      )}

      {q.kind === "fill" && (
        <input
          value={(q.answerText ?? []).join(" | ")}
          onChange={(e) => onChange({ ...q, answerText: e.target.value.split("|").map((s) => s.trim()) })}
          className="input w-full text-sm" aria-label="Accepted answers"
          placeholder="Accepted answers, separated by | (case-insensitive)"
        />
      )}

      <input
        value={q.explanation} onChange={(e) => onChange({ ...q, explanation: e.target.value })}
        className="input w-full text-xs" placeholder="Explanation shown after answering — the why" aria-label="Explanation"
      />
      <div className="flex items-center gap-2 text-xs">
        <select
          value={q.source}
          onChange={(e) => onChange({ ...q, source: e.target.value as CareerQuestion["source"] })}
          className="input w-32 text-xs" aria-label="Question source"
        >
          <option value="past-paper">Past paper</option>
          <option value="exam-style">Exam-style</option>
        </select>
        <input
          value={q.sourceRef ?? ""}
          onChange={(e) => onChange({ ...q, sourceRef: e.target.value || undefined })}
          className="input flex-1 text-xs" placeholder='Reference, e.g. "2023 Final Q4"' aria-label="Source reference"
          disabled={q.source !== "past-paper"}
        />
      </div>
    </div>
  );
}
