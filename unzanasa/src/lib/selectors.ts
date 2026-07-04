// ─── Derived-data selectors ──────────────────────────────────────────────────
// Pure functions that compute view models from AppState. Keeping this logic out
// of components makes it testable and reusable across pages.

import type { AppState, Flashcard, Subject } from "./types";
import { currentRetention, dueOrder } from "./fsrs";
import { isoDate, pct } from "./utils";

/** Cards due for review at `now`, ordered by learning priority. */
export function dueCards(state: AppState, now = Date.now()): Flashcard[] {
  return state.cards
    .filter((c) => c.srs.due <= now)
    .sort((a, b) => dueOrder(a.srs.state) - dueOrder(b.srs.state) || a.srs.due - b.srs.due);
}

export function dueCountForDeck(state: AppState, deckId: string, now = Date.now()): number {
  return state.cards.filter((c) => c.deckId === deckId && c.srs.due <= now).length;
}

export function newCountForDeck(state: AppState, deckId: string): number {
  return state.cards.filter((c) => c.deckId === deckId && c.srs.state === "new").length;
}

/** Cards becoming due on each of the next `days` days (for the forecast). */
export function reviewForecast(state: AppState, days = 14, now = Date.now()): { date: string; count: number }[] {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(now + i * 86400000);
    buckets[isoDate(d)] = 0;
  }
  const horizon = now + days * 86400000;
  for (const c of state.cards) {
    if (c.srs.due <= now) {
      buckets[isoDate(now)] = (buckets[isoDate(now)] ?? 0) + 1;
    } else if (c.srs.due < horizon) {
      const key = isoDate(new Date(c.srs.due));
      if (key in buckets) buckets[key] += 1;
    }
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export interface SubjectStats {
  subject: Subject;
  cards: number;
  dueCards: number;
  notes: number;
  decks: number;
  quizzes: number;
  mastery: number; // 0..100 avg retention over reviewed cards
  daysToExam: number | null;
}

export function subjectStats(state: AppState, subjectId: string, now = Date.now()): SubjectStats {
  const subject = state.subjects.find((s) => s.id === subjectId)!;
  const deckIds = new Set(state.decks.filter((d) => d.subjectId === subjectId).map((d) => d.id));
  const cards = state.cards.filter((c) => deckIds.has(c.deckId));
  const reviewed = cards.filter((c) => c.srs.state !== "new");
  const mastery = reviewed.length
    ? Math.round((reviewed.reduce((n, c) => n + currentRetention(c.srs, now), 0) / reviewed.length) * 100)
    : 0;
  return {
    subject,
    cards: cards.length,
    dueCards: cards.filter((c) => c.srs.due <= now).length,
    notes: state.notes.filter((n) => n.subjectId === subjectId).length,
    decks: deckIds.size,
    quizzes: state.quizzes.filter((q) => q.subjectId === subjectId).length,
    mastery,
    daysToExam: subject.examDate ? Math.ceil((subject.examDate - now) / 86400000) : null,
  };
}

/** Overall mastery + weak/strong topic analysis for the analytics page. */
export function masteryBySubject(state: AppState, now = Date.now()): SubjectStats[] {
  return state.subjects
    .filter((s) => !s.archived)
    .map((s) => subjectStats(state, s.id, now))
    .sort((a, b) => a.mastery - b.mastery);
}

export function overallAccuracy(state: AppState): number {
  const reviews = state.activity.reduce((n, d) => n + d.reviews, 0);
  const correct = state.activity.reduce((n, d) => n + d.reviewsCorrect, 0);
  return pct(correct, reviews);
}

export function totalStudyMinutes(state: AppState): number {
  return state.activity.reduce((n, d) => n + d.studyMinutes, 0);
}

/** Last `days` of activity, oldest first, filling gaps with empty days. */
export function recentActivity(state: AppState, days = 14, now = Date.now()) {
  const byDate = new Map(state.activity.map((d) => [d.date, d]));
  const out: { date: string; xp: number; reviews: number; studyMinutes: number; accuracy: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = isoDate(new Date(now - i * 86400000));
    const d = byDate.get(iso);
    out.push({
      date: iso,
      xp: d?.xp ?? 0,
      reviews: d?.reviews ?? 0,
      studyMinutes: d?.studyMinutes ?? 0,
      accuracy: d ? pct(d.reviewsCorrect, d.reviews) : 0,
    });
  }
  return out;
}

export function activityHeatmapValues(state: AppState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of state.activity) out[d.date] = d.reviews + d.quizQuestions + Math.round(d.studyMinutes / 5);
  return out;
}

/** Global fuzzy search across notes, cards, decks, subjects and quizzes. */
export interface SearchHit {
  type: "note" | "card" | "deck" | "subject" | "quiz";
  id: string;
  title: string;
  snippet: string;
  href: string;
}
export function globalSearch(state: AppState, query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  const match = (s: string) => s.toLowerCase().includes(q);

  for (const s of state.subjects) {
    if (match(s.name) || match(s.goal ?? "")) {
      hits.push({ type: "subject", id: s.id, title: `${s.emoji} ${s.name}`, snippet: s.goal ?? "Subject", href: `/hub/courses/${s.id}` });
    }
  }
  for (const n of state.notes) {
    if (match(n.title) || match(n.content)) {
      const idx = n.content.toLowerCase().indexOf(q);
      const snippet = idx >= 0 ? n.content.slice(Math.max(0, idx - 20), idx + 60).replace(/[#*`>|]/g, "") : n.content.slice(0, 60);
      hits.push({ type: "note", id: n.id, title: n.title, snippet, href: `/hub/notes?id=${n.id}` });
    }
  }
  for (const d of state.decks) {
    if (match(d.name) || match(d.description)) {
      hits.push({ type: "deck", id: d.id, title: `${d.emoji} ${d.name}`, snippet: d.description || "Deck", href: `/hub/flashcards/${d.id}` });
    }
  }
  for (const c of state.cards) {
    if (match(c.front) || match(c.back)) {
      hits.push({ type: "card", id: c.id, title: c.front.slice(0, 50), snippet: c.back.slice(0, 60), href: `/hub/flashcards/${c.deckId}` });
    }
  }
  for (const qz of state.quizzes) {
    if (match(qz.title) || match(qz.description)) {
      hits.push({ type: "quiz", id: qz.id, title: qz.title, snippet: qz.description || "Quiz", href: `/hub/quizzes/${qz.id}` });
    }
  }
  return hits.slice(0, limit);
}

/** Everything the AI tutor can reference as "material" for a subject (or all). */
export function materialForContext(state: AppState, subjectId?: string | null): string {
  const notes = state.notes.filter((n) => (subjectId ? n.subjectId === subjectId : true));
  const deckIds = new Set(
    state.decks.filter((d) => (subjectId ? d.subjectId === subjectId : true)).map((d) => d.id),
  );
  const cards = state.cards.filter((c) => deckIds.has(c.deckId));
  const parts: string[] = [];
  for (const n of notes.slice(0, 8)) parts.push(`# ${n.title}\n${n.content}`);
  for (const c of cards.slice(0, 40)) parts.push(`${c.front} — ${c.back}`);
  return parts.join("\n\n").slice(0, 8000);
}
