// ─── Career Mode engine ──────────────────────────────────────────────────────
// A locked path through a course: teach → drill on exam-style questions →
// pass the Examiner's Move Test → unlock the next topic. Passed topics enter
// topic-level spaced repetition ("memory checks") so they don't decay, and a
// readiness score tells the student how prepared they actually are — not just
// how far they've clicked. Everything here is pure and unit-tested; the UI is
// a thin shell over these functions.

// ─── Content model (what gets fed in) ────────────────────────────────────────

export interface CareerQuestion {
  id: string;
  kind: "mcq" | "truefalse" | "fill";
  prompt: string;
  options?: string[];
  answerIndex?: number;
  /** For fill questions: accepted answers (case-insensitive). */
  answerText?: string[];
  explanation: string;
  /** Where it came from — real past paper (with ref) or exam-style generated. */
  source: "past-paper" | "exam-style";
  sourceRef?: string;
}

export interface TeachSection {
  heading: string;
  /** The teaching script for this piece of the notes (markdown-ish plain text). */
  body: string;
  /** Comprehension check — must be answered before moving on. */
  check: CareerQuestion;
}

export interface CareerTopic {
  id: string;
  title: string;
  emoji: string;
  /** Why this gate exists — exam-frequency guidance shown before starting. */
  whyLine: string;
  /** Relative exam weight (drives the readiness score). */
  examWeight: number;
  /** Topic ids that must be passed before this unlocks. */
  prereqs: string[];
  teach: TeachSection[];
  /** Phase 2 drill — every question must be attempted before the Move Test. */
  drill: CareerQuestion[];
  /** Phase 3 — held-back questions the student has not seen. */
  moveTest: CareerQuestion[];
}

export interface CareerCourse {
  id: string;
  code: string;
  title: string;
  emoji: string;
  intro: string;
  topics: CareerTopic[];
}

// ─── Progress model (what the student has done) ──────────────────────────────

export interface TopicProgress {
  /** Teach sections completed (by index). */
  taught: number;
  /** Drill question ids attempted. */
  drilled: string[];
  /** Confidence per drill question: sure | guessed. */
  confidence: Record<string, "sure" | "guessed">;
  passed: boolean;
  failedAttempts: number;
  bestScore: number;
  /** Spaced repetition (memory checks) once passed. */
  srsDue: number | null;
  srsLevel: number;
  needsReview: boolean;
}

export interface CourseProgress {
  topics: Record<string, TopicProgress>;
  xp: number;
}

export const emptyTopicProgress = (): TopicProgress => ({
  taught: 0, drilled: [], confidence: {}, passed: false,
  failedAttempts: 0, bestScore: 0, srsDue: null, srsLevel: 0, needsReview: false,
});

export const emptyCourseProgress = (): CourseProgress => ({ topics: {}, xp: 0 });

export function topicProgress(p: CourseProgress, topicId: string): TopicProgress {
  return p.topics[topicId] ?? emptyTopicProgress();
}

// ─── Locking / status ────────────────────────────────────────────────────────

export type TopicStatus = "locked" | "available" | "in-progress" | "passed" | "needs-review";

export function topicStatus(course: CareerCourse, p: CourseProgress, topicId: string): TopicStatus {
  const topic = course.topics.find((t) => t.id === topicId);
  if (!topic) return "locked";
  const tp = topicProgress(p, topicId);
  if (tp.passed) return tp.needsReview ? "needs-review" : "passed";
  const unlocked = topic.prereqs.every((pr) => topicProgress(p, pr).passed);
  if (!unlocked) return "locked";
  return tp.taught > 0 || tp.drilled.length > 0 ? "in-progress" : "available";
}

/** Depth of a topic in the prerequisite tree (0 = roots), for tree layout. */
export function topicDepth(course: CareerCourse, topicId: string): number {
  const topic = course.topics.find((t) => t.id === topicId);
  if (!topic || topic.prereqs.length === 0) return 0;
  return 1 + Math.max(...topic.prereqs.map((pr) => topicDepth(course, pr)));
}

// ─── Grading ─────────────────────────────────────────────────────────────────

export function isCorrect(q: CareerQuestion, answer: number | string): boolean {
  if (q.kind === "fill") {
    const given = String(answer).trim().toLowerCase();
    return (q.answerText ?? []).some((a) => a.trim().toLowerCase() === given);
  }
  return Number(answer) === q.answerIndex;
}

export const MOVE_TEST_PASS = 0.8;

export interface MoveTestVerdict {
  passed: boolean;
  score: number; // 0..1
  correct: number;
  total: number;
  /** Per-question feedback for the Examiner's report. */
  feedback: { question: CareerQuestion; correct: boolean }[];
}

export function gradeMoveTest(questions: CareerQuestion[], answers: (number | string)[]): MoveTestVerdict {
  const feedback = questions.map((q, i) => ({ question: q, correct: isCorrect(q, answers[i] ?? -1) }));
  const correct = feedback.filter((f) => f.correct).length;
  const score = questions.length === 0 ? 0 : correct / questions.length;
  return { passed: score >= MOVE_TEST_PASS, score, correct, total: questions.length, feedback };
}

// ─── Spaced repetition on passed topics (memory checks) ─────────────────────

const DAY = 86_400_000;
/** Review intervals in days: quick at first, stretching out. */
export const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export function scheduleAfterPass(now: number): { srsDue: number; srsLevel: number } {
  return { srsDue: now + SRS_INTERVALS_DAYS[0] * DAY, srsLevel: 0 };
}

/** Apply a memory-check result: success stretches the interval, failure flags review. */
export function applyMemoryCheck(tp: TopicProgress, success: boolean, now: number): TopicProgress {
  if (success) {
    const level = Math.min(tp.srsLevel + 1, SRS_INTERVALS_DAYS.length - 1);
    return { ...tp, srsLevel: level, srsDue: now + SRS_INTERVALS_DAYS[level] * DAY, needsReview: false };
  }
  return { ...tp, srsLevel: 0, srsDue: now + SRS_INTERVALS_DAYS[0] * DAY, needsReview: true };
}

/** Passed topics whose memory check is due, most overdue first. */
export function dueMemoryChecks(course: CareerCourse, p: CourseProgress, now: number): CareerTopic[] {
  return course.topics
    .filter((t) => {
      const tp = topicProgress(p, t.id);
      return tp.passed && tp.srsDue !== null && tp.srsDue <= now;
    })
    .sort((a, b) => (topicProgress(p, a.id).srsDue ?? 0) - (topicProgress(p, b.id).srsDue ?? 0));
}

/** A short memory check: a slice of the topic's pool, rotated by review level. */
export function memoryCheckQuestions(topic: CareerTopic, level: number, count = 3): CareerQuestion[] {
  const pool = [...topic.drill, ...topic.moveTest];
  if (pool.length <= count) return pool;
  const start = (level * count) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

// ─── Readiness (the number to check before a real test) ─────────────────────

/**
 * Exam readiness 0–100: how much past-paper weight is covered by topics that
 * are passed AND still retained. Overdue reviews earn partial credit; topics
 * flagged needs-review earn less; unpassed topics earn nothing.
 */
export function readinessScore(course: CareerCourse, p: CourseProgress, now: number): number {
  const totalWeight = course.topics.reduce((s, t) => s + t.examWeight, 0);
  if (totalWeight === 0) return 0;
  let earned = 0;
  for (const t of course.topics) {
    const tp = topicProgress(p, t.id);
    if (!tp.passed) continue;
    let factor = 1;
    if (tp.needsReview) factor = 0.3;
    else if (tp.srsDue !== null && tp.srsDue <= now) factor = 0.6;
    earned += t.examWeight * factor;
  }
  return Math.round((earned / totalWeight) * 100);
}

export function completionPercent(course: CareerCourse, p: CourseProgress): number {
  if (course.topics.length === 0) return 0;
  const passed = course.topics.filter((t) => topicProgress(p, t.id).passed).length;
  return Math.round((passed / course.topics.length) * 100);
}

// ─── The one right thing to do next ──────────────────────────────────────────

export type NextAction =
  | { kind: "memory-check"; topic: CareerTopic }
  | { kind: "continue"; topic: CareerTopic }
  | { kind: "start"; topic: CareerTopic }
  | { kind: "done" };

export function nextAction(course: CareerCourse, p: CourseProgress, now: number): NextAction {
  const due = dueMemoryChecks(course, p, now);
  if (due.length > 0) return { kind: "memory-check", topic: due[0] };
  const inProgress = course.topics.find((t) => topicStatus(course, p, t.id) === "in-progress");
  if (inProgress) return { kind: "continue", topic: inProgress };
  const available = course.topics.find((t) => topicStatus(course, p, t.id) === "available");
  if (available) return { kind: "start", topic: available };
  return { kind: "done" };
}

// ─── XP & ranks ──────────────────────────────────────────────────────────────

export const XP_DRILL_CORRECT = 5;
export const XP_MOVE_TEST_PASS = 50;
export const XP_MEMORY_CHECK = 15;

export const RANKS: { at: number; title: string; emoji: string }[] = [
  { at: 0, title: "Fresher", emoji: "🌱" },
  { at: 100, title: "Lab Assistant", emoji: "🧪" },
  { at: 250, title: "Demonstrator", emoji: "🔬" },
  { at: 500, title: "Research Assistant", emoji: "📊" },
  { at: 900, title: "Scientist", emoji: "⚗️" },
  { at: 1400, title: "Professor", emoji: "🎓" },
];

export function rankFor(xp: number): { title: string; emoji: string; next: number | null; progress: number } {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].at) idx = i;
  const current = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const progress = next ? Math.round(((xp - current.at) / (next.at - current.at)) * 100) : 100;
  return { title: current.title, emoji: current.emoji, next: next?.at ?? null, progress };
}
