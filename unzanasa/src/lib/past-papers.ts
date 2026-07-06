// ─── Past-paper bank ─────────────────────────────────────────────────────────
// An admin-curated index of past examination papers, keyed to course codes.
// Papers are referenced by link (member portal / shared drive) rather than
// uploaded, which keeps the store light and works without blob storage. Pure
// selectors + defaults; unit-tested.

import type { AppState, PastPaper, ExamKind } from "./types";

export const EXAM_KINDS: ExamKind[] = ["Test", "Final", "Supplementary", "Assignment"];

/** A small starter index across the common first-year courses. */
export function defaultPastPapers(): PastPaper[] {
  return [
    { id: "pp_bio_2024_f", courseCode: "BIO 1400", courseTitle: "Introductory Biology", year: 2024, kind: "Final" },
    { id: "pp_bio_2023_f", courseCode: "BIO 1400", courseTitle: "Introductory Biology", year: 2023, kind: "Final" },
    { id: "pp_che_2024_f", courseCode: "CHE 1000", courseTitle: "Introductory Chemistry", year: 2024, kind: "Final" },
    { id: "pp_che_2024_t", courseCode: "CHE 1000", courseTitle: "Introductory Chemistry", year: 2024, kind: "Test", label: "Test 1" },
    { id: "pp_phy_2024_f", courseCode: "PHY 1010", courseTitle: "Introductory Physics", year: 2024, kind: "Final" },
    { id: "pp_mat_2024_f", courseCode: "MAT 1100", courseTitle: "Foundation Mathematics", year: 2024, kind: "Final" },
    { id: "pp_mat_2023_s", courseCode: "MAT 1100", courseTitle: "Foundation Mathematics", year: 2023, kind: "Supplementary" },
  ];
}

export function pastPapersOf(state: AppState): PastPaper[] {
  return state.pastPapers ?? defaultPastPapers();
}

export interface CourseGroup {
  courseCode: string;
  courseTitle: string;
  papers: PastPaper[];
}

/** Group papers by course, each course's papers newest-first, courses A→Z. */
export function groupByCourse(papers: PastPaper[]): CourseGroup[] {
  const map = new Map<string, CourseGroup>();
  for (const p of papers) {
    const g = map.get(p.courseCode) ?? { courseCode: p.courseCode, courseTitle: p.courseTitle, papers: [] };
    g.papers.push(p);
    g.courseTitle ||= p.courseTitle;
    map.set(p.courseCode, g);
  }
  const groups = [...map.values()];
  for (const g of groups) g.papers.sort((a, b) => b.year - a.year || a.kind.localeCompare(b.kind));
  return groups.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

/** Distinct years present, descending. */
export function paperYears(papers: PastPaper[]): number[] {
  return [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
}

export interface PaperFilter {
  courseCode?: string;
  year?: number;
  kind?: ExamKind;
  query?: string;
}

export function filterPapers(papers: PastPaper[], f: PaperFilter): PastPaper[] {
  const q = f.query?.trim().toLowerCase();
  return papers.filter((p) =>
    (!f.courseCode || p.courseCode === f.courseCode) &&
    (!f.year || p.year === f.year) &&
    (!f.kind || p.kind === f.kind) &&
    (!q || `${p.courseCode} ${p.courseTitle} ${p.label ?? ""}`.toLowerCase().includes(q)),
  );
}

export function paperLabel(p: PastPaper): string {
  return p.label ? `${p.kind} · ${p.label}` : p.kind;
}
