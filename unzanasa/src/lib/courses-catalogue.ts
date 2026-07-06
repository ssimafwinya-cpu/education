// ─── School of Natural Sciences — academic structure ─────────────────────────
// A reference model of how study is organised in the UNZA School of Natural
// Sciences, compiled from the departments:
//
//   · Every first-year student takes the SAME four foundation courses
//     (Biology, Chemistry, Mathematics, Physics). This common first year is
//     also taken by students bound for health programmes at Ridgeway Campus and
//     for Mines, Agriculture, Veterinary Medicine and Engineering — they pass
//     through Natural Sciences in first year, then move to their school in
//     second year. Health-programme students take designated stream variants of
//     Chemistry, Physics and Mathematics.
//   · From second year, a student follows their PROGRAMME, registering for the
//     courses its home and contributing DEPARTMENTS require.
//
// Course codes are shown where confirmed; a course known by name only is listed
// without a code. This is a living list — corrections are welcome via the
// Academic Affairs Secretary.

import type { AppState, CatalogueProgramme } from "./types";

export const SCHOOL = {
  name: "School of Natural Sciences",
  university: "The University of Zambia",
  campus: "Great East Road Campus",
};

// ─── Common first year ───────────────────────────────────────────────────────

export interface FoundationCourse {
  discipline: string;
  emoji: string;
  general: { code?: string; title: string };
  /** Stream taken by health-programme (medical) students, where it differs. */
  healthStream?: { code?: string; title: string };
}

export const FIRST_YEAR: FoundationCourse[] = [
  { discipline: "Biology", emoji: "🧬", general: { code: "BIO 1400", title: "Introductory Biology" } },
  {
    discipline: "Chemistry", emoji: "⚗️",
    general: { code: "CHE 1000", title: "Introductory Chemistry" },
    healthStream: { code: "CHE 1010", title: "Chemistry (health stream)" },
  },
  {
    discipline: "Physics", emoji: "🔭",
    general: { code: "PHY 1010", title: "Introductory Physics" },
    healthStream: { code: "PHY 1015", title: "Physics (health stream)" },
  },
  {
    discipline: "Mathematics", emoji: "📐",
    general: { code: "MAT 1100", title: "Foundation Mathematics" },
    healthStream: { title: "Mathematics (health stream)" },
  },
];

// ─── Departments ─────────────────────────────────────────────────────────────

export interface Department {
  name: string;
  emoji: string;
  blurb: string;
}

export const DEPARTMENTS: Department[] = [
  { name: "Biological Sciences", emoji: "🧬", blurb: "Cell biology, diversity, physiology and microbiology." },
  { name: "Chemistry", emoji: "⚗️", blurb: "Inorganic, organic, physical and analytical chemistry." },
  { name: "Physics", emoji: "🔭", blurb: "Mechanics, electromagnetism, thermodynamics and modern physics." },
  { name: "Mathematics & Statistics", emoji: "📐", blurb: "Analysis, algebra, statistics and actuarial methods." },
  { name: "Computer Science", emoji: "💻", blurb: "Programming, algorithms, systems and data." },
];

// ─── Programmes ──────────────────────────────────────────────────────────────

export interface ProgrammeCourse {
  code?: string;
  title: string;
  /** Department that offers the course. */
  dept: string;
}

export interface Programme {
  name: string;
  emoji: string;
  /** Second-year courses, when the programme's list has been confirmed. */
  secondYear?: ProgrammeCourse[];
}

export const PROGRAMMES: Programme[] = [
  {
    name: "Microbiology",
    emoji: "🦠",
    secondYear: [
      { title: "Plant Diversity", dept: "Biological Sciences" },
      { title: "Animal Diversity", dept: "Biological Sciences" },
      { title: "Basic Physiology (plant & human)", dept: "Biological Sciences" },
      { title: "Microbiology", dept: "Biological Sciences" },
      { title: "Biochemistry", dept: "Biological Sciences" },
      { title: "Basic Organic Chemistry", dept: "Chemistry" },
      { title: "Arene Chemistry", dept: "Chemistry" },
      { title: "Analytical & Inorganic Chemistry", dept: "Chemistry" },
    ],
  },
  { name: "Biochemistry", emoji: "🧪" },
  { name: "Chemistry", emoji: "⚗️" },
  { name: "Physics", emoji: "🔭" },
  { name: "Geology", emoji: "🪨" },
  { name: "Computer Science", emoji: "💻" },
  { name: "Actuarial Science", emoji: "📊" },
];

export const FOUNDATION_COURSE_COUNT = FIRST_YEAR.length;

// ─── Editable catalogue (admin-managed, stored in AppState) ───────────────────

/** The seed programmes as an editable catalogue (stable, deterministic ids). */
export function defaultProgrammes(): CatalogueProgramme[] {
  return PROGRAMMES.map((p, i) => ({
    id: `prog_${i}`,
    name: p.name,
    emoji: p.emoji,
    courses: (p.secondYear ?? []).map((c, j) => ({
      id: `prog_${i}_c_${j}`, code: c.code, title: c.title, dept: c.dept,
    })),
  }));
}

/** Programmes to display: the admin-managed list, or the defaults. */
export function programmesOf(state: AppState): CatalogueProgramme[] {
  return state.catalogue?.programmes ?? defaultProgrammes();
}

/** Department names offered in the editor's course picker. */
export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.name);
