import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

let counter = 0;
/** Collision-safe id: timestamp + random + monotonic counter. */
export function uid(prefix = "id"): string {
  counter = (counter + 1) % 1000;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}${counter}`;
}

/** ISO date (yyyy-mm-dd) in local time. */
export function isoDate(d: Date | number = new Date()): string {
  const date = typeof d === "number" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00");
  const b = new Date(bIso + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function formatDate(ts: number, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(ts).toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric" });
}

export function formatRelative(ts: number, now = Date.now()): string {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const min = 60_000, hour = 3_600_000, day = 86_400_000;
  const fmt = (n: number, unit: string) => `${n}${unit} ${diff < 0 ? "ago" : ""}`.trim();
  if (abs < min) return diff < 0 ? "just now" : "now";
  if (abs < hour) return fmt(Math.round(abs / min), "m");
  if (abs < day) return fmt(Math.round(abs / hour), "h");
  if (abs < 30 * day) return fmt(Math.round(abs / day), "d");
  return formatDate(ts, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function pct(n: number, of: number): number {
  return of === 0 ? 0 : Math.round((n / of) * 100);
}

/** Subject accent palette. Keys are stored on entities; values are CSS-ready. */
export const SUBJECT_COLORS: Record<string, { bg: string; text: string; solid: string }> = {
  indigo: { bg: "bg-indigo-500/12", text: "text-indigo-600 dark:text-indigo-300", solid: "#6366f1" },
  teal: { bg: "bg-teal-500/12", text: "text-teal-600 dark:text-teal-300", solid: "#14b8a6" },
  rose: { bg: "bg-rose-500/12", text: "text-rose-600 dark:text-rose-300", solid: "#f43f5e" },
  amber: { bg: "bg-amber-500/12", text: "text-amber-600 dark:text-amber-300", solid: "#f59e0b" },
  sky: { bg: "bg-sky-500/12", text: "text-sky-600 dark:text-sky-300", solid: "#0ea5e9" },
  violet: { bg: "bg-violet-500/12", text: "text-violet-600 dark:text-violet-300", solid: "#8b5cf6" },
  emerald: { bg: "bg-emerald-500/12", text: "text-emerald-600 dark:text-emerald-300", solid: "#10b981" },
  orange: { bg: "bg-orange-500/12", text: "text-orange-600 dark:text-orange-300", solid: "#f97316" },
};

export function subjectColor(key: string) {
  return SUBJECT_COLORS[key] ?? SUBJECT_COLORS.indigo;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Loose text-answer matcher for short/fill questions. */
export function answersMatch(given: string, expected: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().trim().replace(/[.,!?;:'"()]/g, "").replace(/\s+/g, " ");
  const g = norm(given);
  const e = norm(expected);
  if (!g) return false;
  if (g === e) return true;
  // Accept answers that contain the expected phrase (or vice versa for long answers)
  return e.length > 3 && (g.includes(e) || (g.length > 3 && e.includes(g)));
}
