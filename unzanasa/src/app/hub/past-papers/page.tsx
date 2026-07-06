"use client";

import { useMemo, useState } from "react";
import { ScrollText, ExternalLink, Search, Plus, Trash2, FileText, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, EmptyState, useToast } from "@/components/ui";
import {
  pastPapersOf, groupByCourse, paperYears, filterPapers, paperLabel, EXAM_KINDS,
} from "@/lib/past-papers";
import type { PastPaper, ExamKind } from "@/lib/types";
import { uid } from "@/lib/utils";

export default function PastPapersPage() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const isAdmin = state.profile.role === "admin";
  const papers = pastPapersOf(state);

  const [q, setQ] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [kind, setKind] = useState<ExamKind | "">("");

  const years = paperYears(papers);
  const filtered = useMemo(
    () => filterPapers(papers, { query: q, year: year || undefined, kind: kind || undefined }),
    [papers, q, year, kind],
  );
  const groups = groupByCourse(filtered);

  const setPapers = (next: PastPaper[]) => dispatch({ type: "SET_PAST_PAPERS", papers: next });
  const patch = (id: string, p: Partial<PastPaper>) => setPapers(papers.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const addPaper = () => {
    setPapers([...papers, { id: uid("pp"), courseCode: "", courseTitle: "", year: new Date().getFullYear(), kind: "Final" }]);
    toast({ emoji: "📄", title: "Paper added — fill in the course and link." });
  };

  return (
    <div>
      <PageHeader
        title="Past Papers"
        description="A shared bank of past examination papers, organised by course."
        icon={<ScrollText className="text-brand-500" />}
        actions={isAdmin ? <button onClick={addPaper} className="btn-primary btn-sm"><Plus size={15} /> Add paper</button> : undefined}
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search course or code…" className="input pl-9" />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} className="input w-32">
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as ExamKind | "")} className="input w-40">
          <option value="">All types</option>
          {EXAM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="📄" title="No papers found" description={papers.length === 0 ? "No past papers have been added yet." : "Try clearing the filters."} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <Card key={g.courseCode}>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-brand-500" />
                <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-300">{g.courseCode}</span>
                <span className="font-semibold">{g.courseTitle || "Untitled course"}</span>
                <Badge tone="brand" className="ml-auto">{g.papers.length} paper{g.papers.length === 1 ? "" : "s"}</Badge>
              </div>
              <div className="divide-y divide-edge">
                {g.papers.map((p) => (
                  isAdmin
                    ? <AdminRow key={p.id} p={p} onPatch={patch} onDelete={() => setPapers(papers.filter((x) => x.id !== p.id))} />
                    : <StudentRow key={p.id} p={p} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isAdmin && (
        <p className="mt-6 text-center text-xs text-ink-faint">
          Missing a paper? Ask the Academic Affairs Secretary to add it to the bank.
        </p>
      )}
    </div>
  );
}

function StudentRow({ p }: { p: PastPaper }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <FileText size={16} className="shrink-0 text-ink-faint" />
      <span className="text-sm font-medium tabular-nums">{p.year}</span>
      <Badge tone="accent">{paperLabel(p)}</Badge>
      <div className="ml-auto">
        {p.url
          ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Open <ExternalLink size={13} /></a>
          : <span className="text-xs text-ink-faint">link coming soon</span>}
      </div>
    </div>
  );
}

function AdminRow({ p, onPatch, onDelete }: { p: PastPaper; onPatch: (id: string, patch: Partial<PastPaper>) => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-[110px_1fr_90px_130px_1fr_auto] items-center gap-2 py-2">
      <input value={p.courseCode} onChange={(e) => onPatch(p.id, { courseCode: e.target.value })} className="input font-mono text-xs" placeholder="CODE" aria-label="Course code" />
      <input value={p.courseTitle} onChange={(e) => onPatch(p.id, { courseTitle: e.target.value })} className="input text-sm" placeholder="Course title" aria-label="Course title" />
      <input type="number" value={p.year} onChange={(e) => onPatch(p.id, { year: Number(e.target.value) })} className="input text-sm" aria-label="Year" />
      <select value={p.kind} onChange={(e) => onPatch(p.id, { kind: e.target.value as ExamKind })} className="input text-sm" aria-label="Exam type">
        {EXAM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <input value={p.url ?? ""} onChange={(e) => onPatch(p.id, { url: e.target.value || undefined })} className="input text-sm" placeholder="Link URL" aria-label="Link" />
      <button onClick={onDelete} className="btn-ghost btn-sm text-crimson-600" aria-label="Delete paper"><Trash2 size={14} /></button>
    </div>
  );
}
