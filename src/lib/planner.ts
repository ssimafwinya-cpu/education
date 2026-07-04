// ─── AI study-plan generator ─────────────────────────────────────────────────
// Builds a balanced, exam-aware weekly schedule. The algorithm:
//  1. Weights each subject by urgency (days to exam) and weakness (low mastery).
//  2. Distributes the daily study budget across subjects by weight.
//  3. Interleaves subjects day-to-day (proven better than blocking) and always
//     front-loads a spaced-repetition review block plus a break.

import type { AppState, PlannerTask } from "./types";
import { subjectStats } from "./selectors";
import { addDays, isoDate, uid } from "./utils";

export interface PlanConfig {
  days: number;
  minutesPerDay: number;
  subjectIds: string[]; // empty = all active subjects
  includeWeekends: boolean;
}

const SESSION_MIN = 25; // one focused block

export function generatePlan(state: AppState, cfg: PlanConfig, now = Date.now()): PlannerTask[] {
  const active = state.subjects.filter((s) => !s.archived && (cfg.subjectIds.length === 0 || cfg.subjectIds.includes(s.id)));
  if (active.length === 0) return [];

  // Urgency + weakness weighting.
  const weights = active.map((s) => {
    const st = subjectStats(state, s.id, now);
    const urgency = st.daysToExam !== null ? Math.max(1, 30 - Math.min(30, st.daysToExam)) / 30 : 0.4;
    const weakness = (100 - st.mastery) / 100;
    const weight = 0.6 * urgency + 0.4 * weakness + 0.1;
    return { subject: s, weight, dueCards: st.dueCards };
  });
  const totalWeight = weights.reduce((n, w) => n + w.weight, 0);

  const tasks: PlannerTask[] = [];

  for (let d = 0; d < cfg.days; d++) {
    const date = new Date(now + d * 86400000);
    const dow = date.getDay();
    if (!cfg.includeWeekends && (dow === 0 || dow === 6)) continue;
    const iso = isoDate(date);

    // Daily review block first (spaced repetition).
    const dueToday = state.cards.filter((c) => c.srs.due <= addDays(date, 1).getTime()).length;
    if (dueToday > 0 || d === 0) {
      tasks.push(task(iso, "Flashcard review", null, "review", Math.min(30, Math.max(10, Math.round(dueToday * 0.5)) || 15)));
    }

    // Study blocks distributed by weight, interleaving subjects across days.
    let remaining = cfg.minutesPerDay - SESSION_MIN * 0.4;
    const ordered = [...weights].sort((a, b) => {
      // Rotate priority so different subjects lead on different days.
      const rot = (i: number) => (i + d) % weights.length;
      return b.weight - a.weight + (rot(weights.indexOf(a)) - rot(weights.indexOf(b))) * 0.01;
    });

    for (const w of ordered) {
      if (remaining < SESSION_MIN * 0.6) break;
      const share = w.weight / totalWeight;
      const minutes = Math.max(SESSION_MIN, Math.round((cfg.minutesPerDay * share) / SESSION_MIN) * SESSION_MIN);
      const capped = Math.min(minutes, remaining);
      if (capped < 15) continue;
      const st = subjectStats(state, w.subject.id, now);
      const kind = st.mastery < 50 ? "study" : "quiz";
      const title = kind === "quiz" ? `Practice quiz — ${w.subject.name}` : `Study ${w.subject.name}`;
      tasks.push(task(iso, title, w.subject.id, kind, Math.round(capped)));
      remaining -= capped;
    }

    // A break reminder mid-way.
    if (cfg.minutesPerDay >= 60) tasks.push(task(iso, "Take a 10-min break", null, "break", 10));
  }

  return tasks;
}

function task(date: string, title: string, subjectId: string | null, kind: PlannerTask["kind"], durationMin: number): PlannerTask {
  return { id: uid("plan"), date, title, subjectId, kind, durationMin, done: false, auto: true };
}

/** A rough "productivity score" (0-100) from recent completion + consistency. */
export function productivityScore(state: AppState, now = Date.now()): number {
  const last7 = new Set<string>();
  for (let i = 0; i < 7; i++) last7.add(isoDate(new Date(now - i * 86400000)));
  const relevant = state.planner.filter((t) => last7.has(t.date));
  const completion = relevant.length ? relevant.filter((t) => t.done).length / relevant.length : 0;
  const activeDays = state.activity.filter((d) => last7.has(d.date) && (d.reviews > 0 || d.studyMinutes > 0)).length / 7;
  return Math.round((0.6 * completion + 0.4 * activeDays) * 100);
}
