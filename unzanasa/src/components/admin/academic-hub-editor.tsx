"use client";

// Admin editor for the academic-hub programme catalogue. Edits are written to
// the store (SET_PROGRAMMES) and picked up live by the public /academics page.
// The first-year foundation and departments are fixed structure and shown for
// reference; programmes and their second-year courses are fully editable so an
// admin can fill in each programme's course list over time.

import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui";
import { programmesOf, defaultProgrammes, DEPARTMENT_NAMES, FIRST_YEAR, DEPARTMENTS } from "@/lib/courses-catalogue";
import type { CatalogueProgramme, CatalogueCourse } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Plus, Trash2, RotateCcw, GraduationCap, BookOpen } from "lucide-react";

export function AcademicHubEditor() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const programmes = programmesOf(state);

  const commit = (next: CatalogueProgramme[]) => dispatch({ type: "SET_PROGRAMMES", programmes: next });
  const patchProgramme = (id: string, patch: Partial<CatalogueProgramme>) =>
    commit(programmes.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const patchCourse = (pid: string, cid: string, patch: Partial<CatalogueCourse>) =>
    patchProgramme(pid, { courses: programmes.find((p) => p.id === pid)!.courses.map((c) => (c.id === cid ? { ...c, ...patch } : c)) });

  const addProgramme = () => {
    commit([...programmes, { id: uid("prog"), name: "New programme", emoji: "🎓", courses: [] }]);
    toast({ emoji: "🎓", title: "Programme added — give it a name and courses." });
  };
  const deleteProgramme = (id: string) => commit(programmes.filter((p) => p.id !== id));
  const addCourse = (pid: string) => {
    const prog = programmes.find((p) => p.id === pid)!;
    patchProgramme(pid, { courses: [...prog.courses, { id: uid("crs"), title: "", dept: DEPARTMENT_NAMES[0] }] });
  };
  const deleteCourse = (pid: string, cid: string) =>
    patchProgramme(pid, { courses: programmes.find((p) => p.id === pid)!.courses.filter((c) => c.id !== cid) });

  const resetDefaults = () => {
    if (confirm("Reset all programmes to the built-in defaults? Your edits will be lost.")) {
      commit(defaultProgrammes());
      toast({ emoji: "↩️", title: "Programmes reset to defaults." });
    }
  };

  return (
    <div className="space-y-5">
      {/* Reference: fixed structure */}
      <div className="rounded-xl border border-edge bg-surface-raised/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><BookOpen size={15} className="text-brand-500" /> Fixed structure (reference)</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="text-xs text-ink-muted">
            <span className="font-medium text-ink">Common first year:</span>{" "}
            {FIRST_YEAR.map((f) => `${f.discipline} (${f.general?.code ?? "health stream only"})`).join(", ")}.
          </div>
          <div className="text-xs text-ink-muted">
            <span className="font-medium text-ink">Departments:</span> {DEPARTMENTS.map((d) => d.name).join(", ")}.
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">Programme edits below appear live on the public Academics page.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><GraduationCap size={17} className="text-brand-500" /> Programmes <span className="text-sm text-ink-faint">({programmes.length})</span></div>
        <div className="flex gap-2">
          <button onClick={resetDefaults} className="btn-secondary btn-sm"><RotateCcw size={14} /> Reset</button>
          <button onClick={addProgramme} className="btn-primary btn-sm"><Plus size={14} /> Add programme</button>
        </div>
      </div>

      <div className="space-y-4">
        {programmes.map((p) => (
          <div key={p.id} className="rounded-xl border border-edge bg-surface p-4">
            <div className="flex items-center gap-2">
              <input value={p.emoji} onChange={(e) => patchProgramme(p.id, { emoji: e.target.value })} className="input w-14 text-center text-lg" aria-label="Programme emoji" maxLength={4} />
              <input value={p.name} onChange={(e) => patchProgramme(p.id, { name: e.target.value })} className="input flex-1 font-semibold" placeholder="Programme name" aria-label="Programme name" />
              <span className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300">{p.courses.length} course{p.courses.length === 1 ? "" : "s"}</span>
              <button onClick={() => deleteProgramme(p.id)} className="btn-ghost btn-sm text-crimson-600" aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button>
            </div>

            <div className="mt-3 space-y-2">
              {p.courses.length === 0 && <p className="text-xs text-ink-faint">No courses yet — add this programme&apos;s second-year courses below.</p>}
              {p.courses.map((c) => (
                <div key={c.id} className="grid grid-cols-[110px_1fr_170px_auto] items-center gap-2">
                  <input value={c.code ?? ""} onChange={(e) => patchCourse(p.id, c.id, { code: e.target.value || undefined })} className="input font-mono text-xs" placeholder="CODE" aria-label="Course code" />
                  <input value={c.title} onChange={(e) => patchCourse(p.id, c.id, { title: e.target.value })} className="input text-sm" placeholder="Course title" aria-label="Course title" />
                  <select value={c.dept} onChange={(e) => patchCourse(p.id, c.id, { dept: e.target.value })} className="input text-sm" aria-label="Department">
                    {DEPARTMENT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button onClick={() => deleteCourse(p.id, c.id)} className="btn-ghost btn-sm text-crimson-600" aria-label="Delete course"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => addCourse(p.id)} className="btn-secondary btn-sm mt-1"><Plus size={13} /> Add course</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
