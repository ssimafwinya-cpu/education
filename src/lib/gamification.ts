// ─── Gamification: XP, levels, coins, streaks, achievements ─────────────────

import type { AppState, DayActivity } from "./types";

export const XP = {
  reviewCard: 5,
  reviewCardCorrect: 10,
  quizQuestionCorrect: 8,
  quizCompleted: 40,
  examCompleted: 80,
  noteCreated: 15,
  noteEdited: 5,
  cardCreated: 5,
  deckCreated: 20,
  plannerTaskDone: 12,
  tutorSession: 10,
  dailyGoalHit: 50,
} as const;

/** Total XP required to *reach* a level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Smooth quadratic-ish curve: 100, 282, 520, 800, 1118 …
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number): { level: number; into: number; needed: number; pctToNext: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - base;
  const needed = next - base;
  return { level, into, needed, pctToNext: Math.min(100, Math.round((into / needed) * 100)) };
}

export const LEVEL_TITLES = [
  "Newcomer", "Learner", "Student", "Scholar", "Adept",
  "Specialist", "Expert", "Master", "Sage", "Luminary",
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))];
}

// ─── Achievements ────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  coins: number;
  /** Returns true when the achievement condition is met. */
  test: (s: AppState) => boolean;
}

const totalReviews = (s: AppState) => s.activity.reduce((n, d) => n + d.reviews, 0);
const totalQuizQuestions = (s: AppState) => s.activity.reduce((n, d) => n + d.quizQuestions, 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-steps", name: "First Steps", description: "Review your first flashcard", emoji: "👣", coins: 10, test: (s) => totalReviews(s) >= 1 },
  { id: "card-shark", name: "Card Shark", description: "Review 100 flashcards", emoji: "🃏", coins: 50, test: (s) => totalReviews(s) >= 100 },
  { id: "memory-machine", name: "Memory Machine", description: "Review 1,000 flashcards", emoji: "🧠", coins: 200, test: (s) => totalReviews(s) >= 1000 },
  { id: "quiz-rookie", name: "Quiz Rookie", description: "Complete your first quiz", emoji: "📝", coins: 15, test: (s) => s.attempts.length >= 1 },
  { id: "perfectionist", name: "Perfectionist", description: "Score 100% on a quiz", emoji: "💯", coins: 60, test: (s) => s.attempts.some((a) => a.scorePercent === 100) },
  { id: "exam-ready", name: "Exam Ready", description: "Complete a timed exam", emoji: "⏱️", coins: 40, test: (s) => s.attempts.some((a) => a.mode === "exam") },
  { id: "scribe", name: "Scribe", description: "Create 5 notes", emoji: "✍️", coins: 25, test: (s) => s.notes.length >= 5 },
  { id: "architect", name: "Architect", description: "Create 3 subjects", emoji: "🏛️", coins: 25, test: (s) => s.subjects.filter((x) => !x.archived).length >= 3 },
  { id: "deck-builder", name: "Deck Builder", description: "Own 50 flashcards", emoji: "🗂️", coins: 30, test: (s) => s.cards.length >= 50 },
  { id: "on-fire", name: "On Fire", description: "Reach a 7-day streak", emoji: "🔥", coins: 70, test: (s) => s.game.streak.current >= 7 || s.game.streak.best >= 7 },
  { id: "unstoppable", name: "Unstoppable", description: "Reach a 30-day streak", emoji: "⚡", coins: 300, test: (s) => s.game.streak.best >= 30 },
  { id: "curious-mind", name: "Curious Mind", description: "Ask the AI tutor 10 questions", emoji: "💬", coins: 30, test: (s) => s.threads.reduce((n, t) => n + t.messages.filter((m) => m.role === "user").length, 0) >= 10 },
  { id: "planner-pro", name: "Planner Pro", description: "Complete 10 planner tasks", emoji: "📅", coins: 40, test: (s) => s.planner.filter((t) => t.done).length >= 10 },
  { id: "sharpshooter", name: "Sharpshooter", description: "Answer 50 quiz questions correctly", emoji: "🎯", coins: 50, test: (s) => s.activity.reduce((n, d) => n + d.quizCorrect, 0) >= 50 },
  { id: "night-owl", name: "Level 5", description: "Reach level 5", emoji: "🦉", coins: 80, test: (s) => levelFromXp(s.game.xp) >= 5 },
  { id: "centurion", name: "Centurion", description: "Answer 100 quiz questions", emoji: "🏆", coins: 100, test: (s) => totalQuizQuestions(s) >= 100 },
];

/** Evaluate achievements; returns ids newly unlocked (not yet in `unlocked`). */
export function newlyUnlocked(state: AppState): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !state.game.unlocked[a.id] && a.test(state));
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

/**
 * Update the streak for activity happening on `todayIso`.
 * Consecutive-day activity extends the streak; a gap resets it to 1.
 */
export function bumpStreak(
  streak: { current: number; best: number; lastActiveDay: string | null },
  todayIso: string,
): { current: number; best: number; lastActiveDay: string } {
  if (streak.lastActiveDay === todayIso) {
    return { ...streak, lastActiveDay: todayIso };
  }
  let current = 1;
  if (streak.lastActiveDay) {
    const prev = new Date(streak.lastActiveDay + "T00:00:00");
    const today = new Date(todayIso + "T00:00:00");
    const gap = Math.round((today.getTime() - prev.getTime()) / 86400000);
    current = gap === 1 ? streak.current + 1 : 1;
  }
  return { current, best: Math.max(streak.best, current), lastActiveDay: todayIso };
}

/** Streak still alive if last activity was today or yesterday. */
export function streakAlive(lastActiveDay: string | null, todayIso: string): boolean {
  if (!lastActiveDay) return false;
  const prev = new Date(lastActiveDay + "T00:00:00");
  const today = new Date(todayIso + "T00:00:00");
  const gap = Math.round((today.getTime() - prev.getTime()) / 86400000);
  return gap <= 1;
}

export function emptyDay(date: string): DayActivity {
  return { date, xp: 0, reviews: 0, reviewsCorrect: 0, quizQuestions: 0, quizCorrect: 0, studyMinutes: 0, notesEdited: 0 };
}
