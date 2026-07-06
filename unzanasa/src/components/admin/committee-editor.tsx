"use client";

// Admin editor for the executive committee. The ten Article 8 offices are
// fixed; an admin fills in who currently holds each. Written to the store
// (SET_COMMITTEE) and shown on the public About page.

import { useStore } from "@/lib/store";
import { committeeOf, officeDef, filledCount } from "@/lib/committee";
import type { ExecMember } from "@/lib/types";
import { DEPARTMENT_NAMES } from "@/lib/courses-catalogue";
import { RotateCcw } from "lucide-react";
import { defaultCommittee } from "@/lib/committee";
import { useToast } from "@/components/ui";

export function CommitteeEditor() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const committee = committeeOf(state);

  const commit = (next: ExecMember[]) => dispatch({ type: "SET_COMMITTEE", committee: next });
  const patch = (id: string, p: Partial<ExecMember>) => commit(committee.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const clearAll = () => {
    if (confirm("Clear all committee holders? The offices remain but names are removed.")) {
      commit(defaultCommittee());
      toast({ emoji: "↩️", title: "Committee cleared." });
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-muted">{filledCount(committee)} of {committee.length} offices filled.</p>
        <button onClick={clearAll} className="btn-secondary btn-sm"><RotateCcw size={14} /> Clear holders</button>
      </div>
      <div className="space-y-2.5">
        {committee.map((m) => {
          const def = officeDef(m.id);
          return (
            <div key={m.id} className="rounded-xl border border-edge bg-surface p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{def?.emoji}</span>
                <span className="font-semibold">{m.office}</span>
                {!m.name.trim() && <span className="chip bg-ink-faint/10 text-ink-faint">Vacant</span>}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} className="input text-sm" placeholder="Holder's name" aria-label={`${m.office} name`} />
                <select value={m.affiliation ?? ""} onChange={(e) => patch(m.id, { affiliation: e.target.value || undefined })} className="input text-sm" aria-label={`${m.office} department`}>
                  <option value="">Department…</option>
                  {DEPARTMENT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input value={m.email ?? ""} onChange={(e) => patch(m.id, { email: e.target.value || undefined })} className="input text-sm" placeholder="Contact email (optional)" aria-label={`${m.office} email`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
