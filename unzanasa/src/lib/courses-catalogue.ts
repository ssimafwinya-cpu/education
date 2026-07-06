// ─── School of Natural Sciences — course catalogue ───────────────────────────
// A reference list of the undergraduate courses offered under the School of
// Natural Sciences, compiled from the departments. First-year foundation
// courses have a dedicated stream for medical-programme students in Chemistry,
// Physics and Mathematics. Course codes are shown where confirmed; where a
// course is known by name only, the title is listed without a code.
//
// This is a living list — additions and corrections are welcome via the
// Academic Affairs Secretary.

export interface CatalogueCourse {
  code?: string;
  title: string;
  /** Marks the medical-programme stream of a first-year foundation course. */
  medical?: boolean;
}

export interface CatalogueDiscipline {
  discipline: string;
  emoji: string;
  courses: CatalogueCourse[];
}

export interface CatalogueYear {
  year: string;
  blurb: string;
  disciplines: CatalogueDiscipline[];
}

export const COURSE_CATALOGUE: CatalogueYear[] = [
  {
    year: "First Year",
    blurb: "Foundation courses taken across the School of Natural Sciences. Students on medical programmes follow dedicated Chemistry, Physics and Mathematics streams.",
    disciplines: [
      {
        discipline: "Biology",
        emoji: "🧬",
        courses: [{ code: "BIO 1400", title: "Introductory Biology" }],
      },
      {
        discipline: "Chemistry",
        emoji: "⚗️",
        courses: [
          { code: "CHE 1000", title: "Introductory Chemistry" },
          { code: "CHE 1010", title: "Chemistry (medical stream)", medical: true },
        ],
      },
      {
        discipline: "Physics",
        emoji: "🔭",
        courses: [
          { code: "PHY 1010", title: "Introductory Physics" },
          { code: "PHY 1015", title: "Physics (medical stream)", medical: true },
        ],
      },
      {
        discipline: "Mathematics",
        emoji: "📐",
        courses: [
          { code: "MAT 1100", title: "Foundation Mathematics" },
          { title: "Mathematics (medical stream)", medical: true },
        ],
      },
    ],
  },
  {
    year: "Second Year",
    blurb: "Departmental courses that build on the first-year foundation, deepening theory and laboratory work in the chemical and biological sciences.",
    disciplines: [
      {
        discipline: "Chemistry",
        emoji: "⚗️",
        courses: [
          { title: "Inorganic Chemistry" },
          { title: "Basic Organic Chemistry" },
          { title: "Arene Chemistry" },
          { title: "Analytical & Inorganic Chemistry" },
        ],
      },
      {
        discipline: "Biological Sciences",
        emoji: "🧫",
        courses: [
          { title: "Plant Diversity" },
          { title: "Animal Diversity" },
          { title: "Microbiology" },
          { title: "Biochemistry" },
          { title: "Basic Physiology (plant & human)" },
        ],
      },
    ],
  },
];

/** Total number of catalogued courses (for summary counts). */
export const CATALOGUE_COURSE_COUNT = COURSE_CATALOGUE.reduce(
  (n, y) => n + y.disciplines.reduce((m, d) => m + d.courses.length, 0),
  0,
);
