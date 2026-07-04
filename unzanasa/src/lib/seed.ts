// ─── Seed content ────────────────────────────────────────────────────────────
// Realistic starter data so a brand-new account is immediately explorable.

import { newCardState } from "./fsrs";
import type {
  AppState, Deck, Flashcard, Note, Quiz, Subject, UserSettings, DayActivity,
} from "./types";
import { addDays, isoDate, uid } from "./utils";
import { emptyDay } from "./gamification";

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
    name: "Biology",
    emoji: "🧬",
    color: "emerald",
    goal: "Ace the cell biology & genetics final",
    examInDays: 21,
    decks: [
      {
        name: "Cell Biology",
        emoji: "🔬",
        description: "Organelles, membranes and cellular processes",
        cards: [
          { kind: "basic", front: "What is the powerhouse of the cell?", back: "The mitochondrion — it produces ATP through oxidative phosphorylation." },
          { kind: "basic", front: "What is the function of ribosomes?", back: "Ribosomes synthesise proteins by translating messenger RNA (mRNA)." },
          { kind: "cloze", front: "The {{c1::endoplasmic reticulum}} is rough when studded with ribosomes and smooth when it synthesises lipids.", back: "endoplasmic reticulum" },
          { kind: "basic", front: "What separates the interior of a cell from its environment?", back: "The plasma (cell) membrane — a phospholipid bilayer with embedded proteins." },
          { kind: "mcq", front: "Which organelle contains the cell's genetic material?", back: "The nucleus.", options: ["Golgi apparatus", "Nucleus", "Lysosome", "Vacuole"], answerIndex: 1 },
          { kind: "truefalse", front: "Prokaryotic cells contain a membrane-bound nucleus.", back: "False — prokaryotes lack a membrane-bound nucleus; their DNA sits in the nucleoid region." },
          { kind: "basic", front: "What is the role of the Golgi apparatus?", back: "It modifies, sorts and packages proteins and lipids for secretion or delivery." },
          { kind: "cloze", front: "{{c1::Lysosomes}} contain digestive enzymes that break down waste and cellular debris.", back: "Lysosomes" },
        ],
      },
      {
        name: "Genetics",
        emoji: "🧫",
        description: "DNA, inheritance and gene expression",
        cards: [
          { kind: "basic", front: "What are the four bases of DNA?", back: "Adenine (A), Thymine (T), Guanine (G) and Cytosine (C)." },
          { kind: "basic", front: "State the central dogma of molecular biology.", back: "DNA → RNA → Protein: DNA is transcribed to RNA, which is translated into protein." },
          { kind: "mcq", front: "Which base pairs with Adenine in DNA?", back: "Thymine.", options: ["Guanine", "Cytosine", "Thymine", "Uracil"], answerIndex: 2 },
          { kind: "cloze", front: "A change in the DNA sequence is called a {{c1::mutation}}.", back: "mutation" },
          { kind: "basic", front: "What is an allele?", back: "One of two or more alternative versions of a gene at a given locus." },
          { kind: "truefalse", front: "In humans, males are XY and females are XX.", back: "True." },
        ],
      },
    ],
    note: {
      title: "Cell Biology — Key Concepts",
      tags: ["cells", "exam", "summary"],
      content: `# Cell Biology — Key Concepts

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

## Membrane transport
- **Passive**: diffusion, osmosis, facilitated diffusion (no ATP)
- **Active**: pumps move molecules against the gradient (needs ATP)

> Remember: *mitochondria are the powerhouse — but the ribosome does the building.*

\`\`\`
ATP = adenosine triphosphate
Energy currency of the cell
\`\`\`
`,
    },
    quiz: {
      title: "Cell Biology Diagnostic",
      description: "Quick check on organelles and transport",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "Which organelle is responsible for ATP synthesis?", options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"], answerIndex: 1, explanation: "Mitochondria generate ATP via oxidative phosphorylation.", topic: "Organelles" },
        { id: uid("q"), kind: "truefalse", prompt: "Osmosis requires ATP.", options: ["True", "False"], answerIndex: 1, explanation: "Osmosis is passive diffusion of water — no ATP required.", topic: "Transport" },
        { id: uid("q"), kind: "mcq", prompt: "Where does protein synthesis occur?", options: ["Lysosome", "Ribosome", "Vacuole", "Centriole"], answerIndex: 1, explanation: "Ribosomes translate mRNA into proteins.", topic: "Organelles" },
        { id: uid("q"), kind: "fill", prompt: "The cell membrane is a phospholipid ______.", answerText: "bilayer", explanation: "Two layers of phospholipids form the bilayer.", topic: "Membranes" },
      ],
    },
  },
  {
    name: "Calculus",
    emoji: "📐",
    color: "indigo",
    goal: "Master derivatives and integrals",
    examInDays: 35,
    decks: [
      {
        name: "Derivatives",
        emoji: "📈",
        description: "Rules of differentiation",
        cards: [
          { kind: "basic", front: "What is the derivative of xⁿ?", back: "n·xⁿ⁻¹ (the power rule)." },
          { kind: "basic", front: "What is the derivative of sin(x)?", back: "cos(x)." },
          { kind: "basic", front: "What is the derivative of eˣ?", back: "eˣ — it is its own derivative." },
          { kind: "cloze", front: "The {{c1::product rule}} states (uv)' = u'v + uv'.", back: "product rule" },
          { kind: "basic", front: "State the chain rule.", back: "If y = f(g(x)) then dy/dx = f'(g(x)) · g'(x)." },
          { kind: "mcq", front: "What is the derivative of ln(x)?", back: "1/x.", options: ["x", "1/x", "ln(x)", "eˣ"], answerIndex: 1 },
        ],
      },
      {
        name: "Integrals",
        emoji: "∫",
        description: "Antiderivatives and the fundamental theorem",
        cards: [
          { kind: "basic", front: "What is ∫ xⁿ dx (n ≠ −1)?", back: "xⁿ⁺¹ / (n+1) + C." },
          { kind: "basic", front: "What is ∫ 1/x dx?", back: "ln|x| + C." },
          { kind: "cloze", front: "The {{c1::Fundamental Theorem of Calculus}} links differentiation and integration.", back: "Fundamental Theorem of Calculus" },
          { kind: "basic", front: "What is ∫ eˣ dx?", back: "eˣ + C." },
        ],
      },
    ],
    note: {
      title: "Differentiation Rules Cheat Sheet",
      tags: ["derivatives", "formulas"],
      content: `# Differentiation Cheat Sheet

## Core rules
- **Power rule:** $\\frac{d}{dx} x^n = n x^{n-1}$
- **Product rule:** $(uv)' = u'v + uv'$
- **Quotient rule:** $(u/v)' = \\frac{u'v - uv'}{v^2}$
- **Chain rule:** $\\frac{d}{dx} f(g(x)) = f'(g(x)) g'(x)$

## Common derivatives
- $\\frac{d}{dx}\\sin x = \\cos x$
- $\\frac{d}{dx}\\cos x = -\\sin x$
- $\\frac{d}{dx} e^x = e^x$
- $\\frac{d}{dx}\\ln x = \\frac{1}{x}$

**Tip:** always simplify *before* differentiating — it saves algebra later.
`,
    },
    quiz: {
      title: "Derivatives Warm-up",
      description: "Test your differentiation rules",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "d/dx of x³ = ?", options: ["3x²", "x²", "3x", "x⁴/4"], answerIndex: 0, explanation: "Power rule: 3x^(3-1) = 3x².", topic: "Power rule" },
        { id: uid("q"), kind: "mcq", prompt: "d/dx of cos(x) = ?", options: ["sin(x)", "−sin(x)", "cos(x)", "−cos(x)"], answerIndex: 1, explanation: "The derivative of cosine is negative sine.", topic: "Trig" },
        { id: uid("q"), kind: "fill", prompt: "∫ eˣ dx = ______ + C", answerText: "eˣ", explanation: "e^x is its own antiderivative.", topic: "Integrals" },
      ],
    },
  },
  {
    name: "World History",
    emoji: "🌍",
    color: "amber",
    goal: "Understand the 20th century",
    examInDays: 14,
    decks: [
      {
        name: "20th Century",
        emoji: "🏛️",
        description: "World wars and the modern era",
        cards: [
          { kind: "basic", front: "When did World War I begin?", back: "1914 (it ended in 1918)." },
          { kind: "basic", front: "What event triggered World War I?", back: "The assassination of Archduke Franz Ferdinand of Austria in Sarajevo, June 1914." },
          { kind: "mcq", front: "In which year did World War II end?", back: "1945.", options: ["1918", "1939", "1945", "1950"], answerIndex: 2 },
          { kind: "cloze", front: "The {{c1::Cold War}} was a period of geopolitical tension between the US and the USSR.", back: "Cold War" },
          { kind: "truefalse", front: "The Berlin Wall fell in 1989.", back: "True." },
          { kind: "basic", front: "What was the Marshall Plan?", back: "A US programme (1948) providing aid to rebuild Western European economies after WWII." },
        ],
      },
    ],
    note: {
      title: "Timeline — The 20th Century",
      tags: ["timeline", "wars"],
      content: `# 20th Century Timeline

- **1914–1918** — World War I
- **1929** — The Great Depression begins
- **1939–1945** — World War II
- **1945** — United Nations founded
- **1947–1991** — The Cold War
- **1969** — First Moon landing
- **1989** — Fall of the Berlin Wall
- **1991** — Dissolution of the Soviet Union

## Causes of WWI (M.A.I.N.)
1. **M**ilitarism
2. **A**lliances
3. **I**mperialism
4. **N**ationalism
`,
    },
    quiz: {
      title: "20th Century Quick Quiz",
      description: "Key dates and events",
      questions: [
        { id: uid("q"), kind: "mcq", prompt: "When did WWII end?", options: ["1918", "1945", "1963", "1989"], answerIndex: 1, explanation: "World War II ended in 1945.", topic: "WWII" },
        { id: uid("q"), kind: "truefalse", prompt: "The Cold War was fought primarily between the US and the USSR.", options: ["True", "False"], answerIndex: 0, explanation: "It was the standoff between the two post-war superpowers.", topic: "Cold War" },
        { id: uid("q"), kind: "fill", prompt: "The Berlin Wall fell in the year ______.", answerText: "1989", explanation: "The wall fell on 9 November 1989.", topic: "Cold War" },
      ],
    },
  },
];

/** Build a full seeded AppState for a new user. */
export function buildSeedState(name = "Alex Rivera", email = "you@cognify.app"): AppState {
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
  };
}
