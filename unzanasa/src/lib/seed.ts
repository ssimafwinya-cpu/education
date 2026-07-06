// ─── Seed content ────────────────────────────────────────────────────────────
// Realistic starter data so a brand-new account is immediately explorable.

import { newCardState } from "./fsrs";
import type {
  AppState, Deck, Flashcard, Note, Quiz, Subject, UserSettings, DayActivity,
} from "./types";
import { addDays, isoDate, uid } from "./utils";
import { emptyDay } from "./gamification";
import { defaultProgrammes } from "./courses-catalogue";
import { defaultEvents, defaultAnnouncements } from "./community";
import { defaultPastPapers } from "./past-papers";
import { defaultCommittee } from "./committee";

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  dailyReviewTarget: 30,
  dailyStudyMinutesTarget: 60,
  desiredRetention: 0.9,
  notifications: {
    reviewReminders: true,
    examReminders: true,
    achievementAlerts: true,
    motivational: true,
  },
  reducedMotion: false,
};

interface SeedCard {
  kind: Flashcard["kind"];
  front: string;
  back: string;
  options?: string[];
  answerIndex?: number;
}

interface SeedDeck {
  name: string;
  emoji: string;
  description: string;
  cards: SeedCard[];
}

interface SeedSubject {
  name: string;
  emoji: string;
  color: string;
  goal: string;
  examInDays: number;
  decks: SeedDeck[];
  note: { title: string; content: string; tags: string[] };
  quiz: { title: string; description: string; questions: Quiz["questions"] };
}

const SEED: SeedSubject[] = [
  {
    name: "Biology · BIO 1400",
    emoji: "🧬",
    color: "emerald",
    goal: "Master cell biology & genetics for the BIO 1400 exam",
    examInDays: 21,
    decks: [
      {
        name: "Cell Biology",
        emoji: "🔬",
        description: "Organelles, membranes and cellular processes",
        cards: [
          { kind: "basic", front: "Which organelle produces most of the cell's ATP?", back: "The mitochondrion — through oxidative phosphorylation on the inner membrane." },
          { kind: "basic", front: "What is the function of ribosomes?", back: "Ribosomes synthesise proteins by translating messenger RNA (mRNA)." },
          { kind: "cloze", front: "The {{c1::endoplasmic reticulum}} is rough when studded with ribosomes and smooth when it synthesises lipids.", back: "endoplasmic reticulum" },
          { kind: "basic", front: "Name the two features present in plant cells but absent in animal cells.", back: "A cellulose cell wall and chloroplasts (plant cells also have a large central vacuole)." },
          { kind: "mcq", front: "Which organelle contains the cell's genetic material?", back: "The nucleus.", options: ["Golgi apparatus", "Nucleus", "Lysosome", "Vacuole"], answerIndex: 1 },
          { kind: "truefalse", front: "Prokaryotic cells contain a membrane-bound nucleus.", back: "False — prokaryotes lack a membrane-bound nucleus; their DNA sits in the nucleoid region." },
          { kind: "basic", front: "What is the role of the Golgi apparatus?", back: "It modifies, sorts and packages proteins and lipids for secretion or delivery." },
          { kind: "cloze", front: "{{c1::Lysosomes}} contain digestive enzymes that break down waste and cellular debris.", back: "Lysosomes" },
        ],
      },
      {
        name: "Genetics & Molecular Biology",
        emoji: "🧫",
        description: "DNA, inheritance and gene expression",
        cards: [
          { kind: "basic", front: "What are the four nitrogenous bases of DNA?", back: "Adenine (A), Thymine (T), Guanine (G) and Cytosine (C)." },
          { kind: "basic", front: "State the central dogma of molecular biology.", back: "DNA → RNA → Protein: DNA is transcribed to RNA, which is translated into protein." },
          { kind: "mcq", front: "Which base pairs with Adenine in DNA?", back: "Thymine.", options: ["Guanine", "Cytosine", "Thymine", "Uracil"], answerIndex: 2 },
          { kind: "cloze", front: "A heritable change in the DNA sequence is called a {{c1::mutation}}.", back: "mutation" },
          { kind: "basic", front: "What is an allele?", back: "One of two or more alternative versions of a gene at a given locus." },
          { kind: "basic", front: "In a monohybrid cross of two heterozygotes (Aa × Aa), what is the phenotypic ratio?", back: "3 : 1 (dominant : recessive)." },
          { kind: "truefalse", front: "In humans, males are XY and females are XX.", back: "True." },
        ],
      },
    ],
    note: {
      title: "Cell Biology — Key Concepts",
      tags: ["BIO 1400", "cells", "exam"],
      content: `# Cell Biology — Key Concepts (BIO 1400)

## The Cell
Cells are the fundamental unit of life. Two broad types:

- **Prokaryotic** — no nucleus (bacteria, archaea)
- **Eukaryotic** — membrane-bound nucleus and organelles

## Organelles at a glance

| Organelle | Function |
| --- | --- |
| Nucleus | Stores DNA, controls the cell |
| Mitochondrion | ATP production (respiration) |
| Ribosome | Protein synthesis |
| Golgi apparatus | Packaging & shipping |
| Lysosome | Digestion & recycling |
| Chloroplast | Photosynthesis (plants only) |

## Membrane transport
- **Passive**: diffusion, osmosis, facilitated diffusion (no ATP)
- **Active**: pumps move molecules against the gradient (needs ATP)

> Remember: *mitochondria are the powerhouse — but the ribosome does the building.*

\`\`\`
ATP = adenosine triphosphate — the energy currency of the cell
\`\`\`
`,
    },
    quiz: {
      title: "Cell Biology Diagnostic",
      description: "Quick check on organelles and transport",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "Which organelle is responsible for ATP synthesis?", options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"], answerIndex: 1, explanation: "Mitochondria generate ATP via oxidative phosphorylation.", topic: "Organelles" },
        { id: uid("q"), kind: "truefalse", prompt: "Osmosis requires ATP.", options: ["True", "False"], answerIndex: 1, explanation: "Osmosis is the passive diffusion of water — no ATP required.", topic: "Transport" },
        { id: uid("q"), kind: "mcq", prompt: "Where does protein synthesis occur?", options: ["Lysosome", "Ribosome", "Vacuole", "Centriole"], answerIndex: 1, explanation: "Ribosomes translate mRNA into proteins.", topic: "Organelles" },
        { id: uid("q"), kind: "fill", prompt: "The cell membrane is a phospholipid ______.", answerText: "bilayer", explanation: "Two layers of phospholipids form the bilayer.", topic: "Membranes" },
      ],
    },
  },
  {
    name: "Chemistry · CHE 1000",
    emoji: "⚗️",
    color: "teal",
    goal: "Build a solid foundation in general & organic chemistry",
    examInDays: 17,
    decks: [
      {
        name: "Atomic Structure & Bonding",
        emoji: "⚛️",
        description: "Atoms, the periodic table and chemical bonds",
        cards: [
          { kind: "basic", front: "What are the three subatomic particles and their charges?", back: "Proton (+1), neutron (0) and electron (−1)." },
          { kind: "basic", front: "What does the atomic number of an element tell you?", back: "The number of protons in the nucleus — it defines the element." },
          { kind: "cloze", front: "Atoms of the same element with different numbers of neutrons are called {{c1::isotopes}}.", back: "isotopes" },
          { kind: "mcq", front: "Which type of bond forms between a metal and a non-metal?", back: "Ionic bond.", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], answerIndex: 1 },
          { kind: "basic", front: "How many electrons fill the second (n=2) shell?", back: "Eight — 2 in the 2s subshell and 6 in the 2p subshell." },
          { kind: "truefalse", front: "A covalent bond involves the transfer of electrons.", back: "False — a covalent bond involves the sharing of electron pairs; transfer gives an ionic bond." },
          { kind: "cloze", front: "The number of moles equals the mass divided by the {{c1::molar mass}}.", back: "molar mass" },
        ],
      },
      {
        name: "Organic Foundations",
        emoji: "🧪",
        description: "Functional groups, formulae and nomenclature",
        cards: [
          { kind: "basic", front: "What is the general formula of an alkane?", back: "CₙH₂ₙ₊₂ (e.g. methane CH₄, ethane C₂H₆)." },
          { kind: "mcq", front: "Which functional group defines an alcohol?", back: "Hydroxyl (–OH).", options: ["Carbonyl (C=O)", "Hydroxyl (–OH)", "Carboxyl (–COOH)", "Amino (–NH₂)"], answerIndex: 1 },
          { kind: "basic", front: "Give the IUPAC name of CH₃CH₂OH.", back: "Ethanol." },
          { kind: "cloze", front: "A hydrocarbon with one or more C=C double bonds is an {{c1::alkene}}.", back: "alkene" },
          { kind: "basic", front: "What functional group is present in ethanoic (acetic) acid?", back: "The carboxyl group, –COOH." },
          { kind: "truefalse", front: "Structural isomers have the same molecular formula but different arrangements of atoms.", back: "True." },
          { kind: "basic", front: "Tip: which Science Lab tool draws these structures from a SMILES string?", back: "The Chemistry lab's 2D molecule studio — try CC(=O)O for ethanoic acid." },
        ],
      },
    ],
    note: {
      title: "General Chemistry — Exam Essentials",
      tags: ["CHE 1000", "chemistry", "exam"],
      content: `# General Chemistry — Exam Essentials (CHE 1000)

## The mole
$$n = \\frac{m}{M}$$

- **n** = amount (mol) · **m** = mass (g) · **M** = molar mass (g/mol)
- Avogadro's number: 1 mol = 6.022 × 10²³ particles

## Bonding types

| Bond | Between | Mechanism |
| --- | --- | --- |
| Ionic | metal + non-metal | electron transfer |
| Covalent | non-metal + non-metal | shared electron pairs |
| Metallic | metal + metal | sea of delocalised electrons |

## Organic functional groups
- **Alkane** CₙH₂ₙ₊₂ · **Alkene** C=C · **Alkyne** C≡C
- **Alcohol** –OH · **Aldehyde** –CHO · **Ketone** C=O
- **Carboxylic acid** –COOH · **Amine** –NH₂

> Practise structures in the **Chemistry Science Lab** — the molecule studio, balancer and titration simulator mirror the CHE 1000 syllabus.
`,
    },
    quiz: {
      title: "Chemistry Foundations Quiz",
      description: "Atomic structure, bonding and organic basics",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "How many protons does a carbon atom have?", options: ["4", "6", "12", "14"], answerIndex: 1, explanation: "Carbon's atomic number is 6.", topic: "Atomic structure" },
        { id: uid("q"), kind: "mcq", prompt: "What is the general formula for an alkane?", options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙHₙ", "CₙH₂ₙ₋₂"], answerIndex: 1, explanation: "Saturated hydrocarbons follow CₙH₂ₙ₊₂.", topic: "Organic" },
        { id: uid("q"), kind: "truefalse", prompt: "An ionic bond forms by sharing electron pairs.", options: ["True", "False"], answerIndex: 1, explanation: "Sharing is covalent; ionic bonding is electron transfer.", topic: "Bonding" },
        { id: uid("q"), kind: "fill", prompt: "The IUPAC name of CH₃OH is ______.", answerText: "methanol", explanation: "One carbon bearing a hydroxyl group is methanol.", topic: "Nomenclature" },
      ],
    },
  },
  {
    name: "Physics · PHY 1010",
    emoji: "🔭",
    color: "sky",
    goal: "Understand mechanics, energy and waves",
    examInDays: 24,
    decks: [
      {
        name: "Mechanics & Kinematics",
        emoji: "🚀",
        description: "Motion, forces and Newton's laws",
        cards: [
          { kind: "basic", front: "State Newton's second law of motion.", back: "The net force on a body equals its mass times acceleration: F = ma." },
          { kind: "basic", front: "What is the SI unit of force, and what is it in base units?", back: "The newton (N) = kg·m·s⁻²." },
          { kind: "cloze", front: "For an object in free fall near Earth, the acceleration g ≈ {{c1::9.81}} m/s².", back: "9.81" },
          { kind: "mcq", front: "Which quantity is a vector?", back: "Velocity.", options: ["Speed", "Mass", "Velocity", "Temperature"], answerIndex: 2 },
          { kind: "basic", front: "Write the SUVAT equation linking v, u, a and s (no time).", back: "v² = u² + 2as." },
          { kind: "truefalse", front: "Newton's first law says an object at rest stays at rest unless acted on by a net force.", back: "True — this is the law of inertia." },
          { kind: "basic", front: "Define kinetic energy and give its formula.", back: "Energy of motion: KE = ½mv²." },
        ],
      },
      {
        name: "Energy, Waves & Electricity",
        emoji: "⚡",
        description: "Work, power, waves and Ohm's law",
        cards: [
          { kind: "basic", front: "State the principle of conservation of energy.", back: "Energy cannot be created or destroyed, only transformed from one form to another." },
          { kind: "cloze", front: "Power is the rate of doing work: P = W / {{c1::t}}.", back: "t" },
          { kind: "mcq", front: "Ohm's law relates voltage, current and resistance as:", back: "V = IR.", options: ["V = I/R", "V = IR", "V = R/I", "I = VR"], answerIndex: 1 },
          { kind: "basic", front: "What is the relationship between wave speed, frequency and wavelength?", back: "v = fλ (speed = frequency × wavelength)." },
          { kind: "basic", front: "What is the SI unit of power?", back: "The watt (W) = joule per second (J/s)." },
          { kind: "truefalse", front: "In a transverse wave, the oscillation is parallel to the direction of energy travel.", back: "False — in a transverse wave the oscillation is perpendicular; parallel oscillation is a longitudinal wave." },
        ],
      },
    ],
    note: {
      title: "Mechanics — Formula Sheet",
      tags: ["PHY 1010", "mechanics", "exam"],
      content: `# Mechanics — Formula Sheet (PHY 1010)

## Kinematics (SUVAT)
Constant acceleration:

- $v = u + at$
- $s = ut + \\tfrac{1}{2}at^2$
- $v^2 = u^2 + 2as$

## Dynamics
- Newton's 2nd law: $F = ma$
- Weight: $W = mg$, with $g \\approx 9.81\\ \\text{m/s}^2$

## Energy & power

| Quantity | Formula | Unit |
| --- | --- | --- |
| Kinetic energy | $\\tfrac{1}{2}mv^2$ | J |
| Gravitational PE | $mgh$ | J |
| Work | $Fd$ | J |
| Power | $W/t$ | W |

## Waves & electricity
- Wave equation: $v = f\\lambda$
- Ohm's law: $V = IR$

> Check your working in the **Physics Science Lab** — the projectile simulator and SUVAT solver use exactly these relations.
`,
    },
    quiz: {
      title: "Mechanics Warm-up",
      description: "Newton's laws, kinematics and energy",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "A 2 kg object accelerates at 3 m/s². What net force acts on it?", options: ["1.5 N", "5 N", "6 N", "9 N"], answerIndex: 2, explanation: "F = ma = 2 × 3 = 6 N.", topic: "Dynamics" },
        { id: uid("q"), kind: "truefalse", prompt: "Velocity is a scalar quantity.", options: ["True", "False"], answerIndex: 1, explanation: "Velocity has direction, so it is a vector.", topic: "Kinematics" },
        { id: uid("q"), kind: "mcq", prompt: "Which equation is Ohm's law?", options: ["V = I/R", "V = IR", "P = IV", "F = ma"], answerIndex: 1, explanation: "Ohm's law is V = IR.", topic: "Electricity" },
        { id: uid("q"), kind: "fill", prompt: "The SI unit of energy is the ______.", answerText: "joule", explanation: "Energy and work are measured in joules (J).", topic: "Energy" },
      ],
    },
  },
  {
    name: "Mathematics · MAT 1100",
    emoji: "📐",
    color: "indigo",
    goal: "Sharpen algebra, functions and introductory calculus",
    examInDays: 14,
    decks: [
      {
        name: "Algebra & Functions",
        emoji: "🔢",
        description: "Quadratics, indices and logarithms",
        cards: [
          { kind: "basic", front: "State the quadratic formula for ax² + bx + c = 0.", back: "x = (−b ± √(b² − 4ac)) / (2a)." },
          { kind: "cloze", front: "The discriminant is {{c1::b² − 4ac}}; if it is negative there are no real roots.", back: "b² − 4ac" },
          { kind: "basic", front: "Simplify: log(a) + log(b).", back: "log(ab) — the product rule for logarithms." },
          { kind: "mcq", front: "What is x⁰ for any x ≠ 0?", back: "1.", options: ["0", "1", "x", "undefined"], answerIndex: 1 },
          { kind: "basic", front: "Expand (a + b)².", back: "a² + 2ab + b²." },
          { kind: "truefalse", front: "√(a + b) = √a + √b for all positive a, b.", back: "False — square roots do not distribute over addition." },
        ],
      },
      {
        name: "Differentiation",
        emoji: "📈",
        description: "Derivatives and rules of differentiation",
        cards: [
          { kind: "basic", front: "What is the derivative of xⁿ?", back: "n·xⁿ⁻¹ (the power rule)." },
          { kind: "cloze", front: "The derivative of sin(x) is {{c1::cos(x)}}.", back: "cos(x)" },
          { kind: "basic", front: "State the product rule for (uv)′.", back: "u′v + uv′." },
          { kind: "mcq", front: "What is d/dx of eˣ?", back: "eˣ.", options: ["x·eˣ⁻¹", "eˣ", "1", "ln x"], answerIndex: 1 },
          { kind: "basic", front: "What does the derivative represent geometrically?", back: "The gradient (slope) of the tangent to the curve at a point." },
          { kind: "cloze", front: "The derivative of ln(x) is {{c1::1/x}}.", back: "1/x" },
        ],
      },
    ],
    note: {
      title: "Differentiation Rules Cheat Sheet",
      tags: ["MAT 1100", "calculus", "exam"],
      content: `# Differentiation Rules (MAT 1100)

## Standard derivatives

| f(x) | f′(x) |
| --- | --- |
| xⁿ | n·xⁿ⁻¹ |
| sin x | cos x |
| cos x | −sin x |
| eˣ | eˣ |
| ln x | 1/x |

## Combination rules
- **Sum**: (u + v)′ = u′ + v′
- **Product**: (uv)′ = u′v + uv′
- **Quotient**: (u/v)′ = (u′v − uv′) / v²
- **Chain**: (f(g(x)))′ = f′(g(x))·g′(x)

## Worked example
$$\\frac{d}{dx}(3x^2 + 2x) = 6x + 2$$

> Plot any function and its behaviour in the **Mathematics Science Lab** graphing calculator.
`,
    },
    quiz: {
      title: "Derivatives Warm-up",
      description: "Differentiation rules and standard results",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "What is the derivative of x³?", options: ["3x²", "x²", "3x", "x⁴/4"], answerIndex: 0, explanation: "Power rule: d/dx xⁿ = n·xⁿ⁻¹.", topic: "Power rule" },
        { id: uid("q"), kind: "mcq", prompt: "d/dx of cos(x) is:", options: ["sin(x)", "−sin(x)", "−cos(x)", "tan(x)"], answerIndex: 1, explanation: "The derivative of cosine is −sine.", topic: "Trig derivatives" },
        { id: uid("q"), kind: "truefalse", prompt: "The derivative gives the slope of the tangent line.", options: ["True", "False"], answerIndex: 0, explanation: "That is the geometric meaning of the derivative.", topic: "Concept" },
        { id: uid("q"), kind: "fill", prompt: "The derivative of eˣ is ______.", answerText: "e^x", explanation: "eˣ is its own derivative.", topic: "Exponentials" },
      ],
    },
  },
];

/** Build a full seeded AppState for a new user. */
export function buildSeedState(name = "Natural Sciences Student", email = "you@unza.zm"): AppState {
  const now = Date.now();
  const subjects: Subject[] = [];
  const decks: Deck[] = [];
  const cards: Flashcard[] = [];
  const notes: Note[] = [];
  const quizzes: Quiz[] = [];

  SEED.forEach((s, si) => {
    const subjectId = uid("subj");
    subjects.push({
      id: subjectId,
      name: s.name,
      emoji: s.emoji,
      color: s.color,
      goal: s.goal,
      examDate: addDays(new Date(now), s.examInDays).getTime(),
      pinned: si === 0,
      archived: false,
      createdAt: now - (SEED.length - si) * 86400000,
    });

    s.decks.forEach((d, di) => {
      const deckId = uid("deck");
      decks.push({
        id: deckId,
        subjectId,
        name: d.name,
        emoji: d.emoji,
        description: d.description,
        createdAt: now - di * 3600000,
      });
      d.cards.forEach((c, ci) => {
        // Stagger due dates: some due now, some already scheduled ahead so the
        // review queue and heatmap look realistic on first launch.
        const srs = newCardState(now);
        if (ci % 3 === 0) {
          srs.state = "review";
          srs.stability = 4 + ci;
          srs.difficulty = 5;
          srs.reps = 2;
          srs.lastReview = now - 2 * 86400000;
          srs.due = now - 3600000; // due now
        } else if (ci % 3 === 1) {
          srs.state = "review";
          srs.stability = 12;
          srs.difficulty = 4;
          srs.reps = 3;
          srs.lastReview = now - 86400000;
          srs.due = now + (ci + 1) * 86400000; // future
        }
        cards.push({
          id: uid("card"),
          deckId,
          kind: c.kind,
          front: c.front,
          back: c.back,
          options: c.options,
          answerIndex: c.answerIndex,
          tags: [],
          createdAt: now,
          srs,
          history: [],
        });
      });
    });

    notes.push({
      id: uid("note"),
      subjectId,
      title: s.note.title,
      content: s.note.content,
      tags: s.note.tags,
      pinned: si === 0,
      createdAt: now - si * 43200000,
      updatedAt: now - si * 43200000,
      versions: [],
    });

    quizzes.push({
      id: uid("quiz"),
      subjectId,
      title: s.quiz.title,
      description: s.quiz.description,
      questions: s.quiz.questions,
      createdAt: now,
      source: "seed",
    });
  });

  // A little historical activity so charts and streaks aren't empty.
  const activity: DayActivity[] = [];
  for (let i = 13; i >= 1; i--) {
    const date = isoDate(addDays(new Date(now), -i));
    const active = i % 4 !== 0; // an occasional rest day
    const day = emptyDay(date);
    if (active) {
      day.reviews = 8 + ((i * 7) % 22);
      day.reviewsCorrect = Math.round(day.reviews * 0.82);
      day.quizQuestions = i % 3 === 0 ? 5 : 0;
      day.quizCorrect = Math.round(day.quizQuestions * 0.8);
      day.studyMinutes = 25 + ((i * 13) % 50);
      day.xp = day.reviews * 8 + day.quizCorrect * 8;
      day.notesEdited = i % 5 === 0 ? 1 : 0;
    }
    activity.push(day);
  }

  const xp = activity.reduce((n, d) => n + d.xp, 0);

  return {
    version: 1,
    onboarded: false,
    profile: {
      id: uid("user"),
      name,
      email,
      avatar: "🦊",
      role: "student",
      joinedAt: now - 14 * 86400000,
      settings: DEFAULT_SETTINGS,
    },
    game: {
      xp,
      coins: 120,
      streak: { current: 3, best: 6, lastActiveDay: isoDate(addDays(new Date(now), -1)) },
      unlocked: {},
    },
    subjects,
    notes,
    decks,
    cards,
    quizzes,
    attempts: [],
    planner: [],
    threads: [
      {
        id: uid("thread"),
        title: "Welcome to the UNZANASA Academic Hub",
        subjectId: null,
        messages: [
          {
            id: uid("msg"),
            role: "assistant",
            content:
              "👋 Hi! I'm your AI study tutor. Ask me to explain a concept, quiz you, summarise your notes, or build a study plan. Try: *\"Explain mitosis like I'm 12\"* or *\"Make 5 flashcards about the French Revolution.\"*",
            at: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    activity,
    catalogue: { programmes: defaultProgrammes() },
    community: { events: defaultEvents(now), announcements: defaultAnnouncements(now) },
    rsvps: [],
    pastPapers: defaultPastPapers(),
    committee: defaultCommittee(),
  };
}
