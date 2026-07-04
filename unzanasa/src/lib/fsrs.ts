// ─── FSRS (Free Spaced Repetition Scheduler) ────────────────────────────────
// Implementation of the FSRS-4.5 memory model with Anki-style learning steps.
// Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
//
// The model tracks two memory variables per card:
//   - stability  S: days for retrievability to fall from 100% to 90%
//   - difficulty D: 1 (easy) … 10 (hard), how quickly stability grows
//
// Retrievability after t days: R(t, S) = (1 + FACTOR · t / S)^DECAY

import type { CardState, FsrsState, Rating } from "./types";

/** Default FSRS-4.5 weights (trained on millions of Anki reviews). */
export const FSRS_WEIGHTS = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81; // so that R(S, S) = 0.9

const MIN_STABILITY = 0.01;
const MAX_INTERVAL_DAYS = 365 * 2;

/** Learning steps (minutes) before a card graduates to review. */
const LEARNING_STEPS_MIN = [1, 10];
/** Relearning steps (minutes) after a lapse. */
const RELEARNING_STEPS_MIN = [10];

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Probability of recall after `elapsedDays` for a card with stability S. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Interval (days) at which retrievability decays to `requestedRetention`. */
export function nextIntervalDays(stability: number, requestedRetention: number): number {
  const interval = (stability / FACTOR) * (Math.pow(requestedRetention, 1 / DECAY) - 1);
  return clamp(Math.round(interval), 1, MAX_INTERVAL_DAYS);
}

function initStability(rating: Rating): number {
  return Math.max(FSRS_WEIGHTS[rating - 1], MIN_STABILITY);
}

function initDifficulty(rating: Rating): number {
  return clamp(FSRS_WEIGHTS[4] - (rating - 3) * FSRS_WEIGHTS[5], 1, 10);
}

function nextDifficulty(d: number, rating: Rating): number {
  const raw = d - FSRS_WEIGHTS[6] * (rating - 3);
  // Mean reversion toward the initial difficulty of an "easy" first rating
  // keeps difficulty from drifting to the extremes over many reviews.
  const reverted = FSRS_WEIGHTS[7] * initDifficulty(4) + (1 - FSRS_WEIGHTS[7]) * raw;
  return clamp(reverted, 1, 10);
}

/** Stability after a successful review (Hard / Good / Easy). */
function nextRecallStability(d: number, s: number, r: number, rating: Rating): number {
  const hardPenalty = rating === 2 ? FSRS_WEIGHTS[15] : 1;
  const easyBonus = rating === 4 ? FSRS_WEIGHTS[16] : 1;
  const growth =
    Math.exp(FSRS_WEIGHTS[8]) *
    (11 - d) *
    Math.pow(s, -FSRS_WEIGHTS[9]) *
    (Math.exp(FSRS_WEIGHTS[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(s * (1 + growth), MIN_STABILITY);
}

/** Stability after forgetting (Again). */
function nextForgetStability(d: number, s: number, r: number): number {
  const sf =
    FSRS_WEIGHTS[11] *
    Math.pow(d, -FSRS_WEIGHTS[12]) *
    (Math.pow(s + 1, FSRS_WEIGHTS[13]) - 1) *
    Math.exp(FSRS_WEIGHTS[14] * (1 - r));
  return clamp(sf, MIN_STABILITY, s); // a lapse can never increase stability
}

/** A brand-new card, due immediately. */
export function newCardState(now = Date.now()): FsrsState {
  return {
    state: "new",
    due: now,
    stability: 0,
    difficulty: 0,
    step: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
  };
}

export interface ReviewResult {
  next: FsrsState;
  elapsedDays: number;
  /** Human-readable interval, e.g. "10m", "3d", "2.1mo". */
  intervalLabel: string;
}

function labelFor(ms: number): string {
  if (ms < 60 * MIN_MS) return `${Math.max(1, Math.round(ms / MIN_MS))}m`;
  if (ms < DAY_MS) return `${Math.round(ms / (60 * MIN_MS))}h`;
  const days = ms / DAY_MS;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${(days / 30.44).toFixed(1)}mo`;
  return `${(days / 365.25).toFixed(1)}y`;
}

/**
 * Apply a rating to a card and return the next scheduling state.
 * Pure function — callers persist the result.
 */
export function reviewCard(
  prev: FsrsState,
  rating: Rating,
  requestedRetention = 0.9,
  now = Date.now(),
): ReviewResult {
  const elapsedDays = prev.lastReview === null ? 0 : Math.max(0, (now - prev.lastReview) / DAY_MS);

  let stability: number;
  let difficulty: number;

  if (prev.state === "new" || prev.stability === 0) {
    stability = initStability(rating);
    difficulty = initDifficulty(rating);
  } else {
    const r = retrievability(elapsedDays, prev.stability);
    difficulty = nextDifficulty(prev.difficulty, rating);
    stability =
      rating === 1
        ? nextForgetStability(prev.difficulty, prev.stability, r)
        : nextRecallStability(prev.difficulty, prev.stability, r, rating);
  }

  const base: FsrsState = {
    ...prev,
    stability,
    difficulty,
    reps: prev.reps + 1,
    lastReview: now,
  };

  let next: FsrsState;

  const graduate = (): FsrsState => ({
    ...base,
    state: "review",
    step: 0,
    due: now + nextIntervalDays(stability, requestedRetention) * DAY_MS,
  });

  const inSteps = (steps: number[], state: CardState): FsrsState | null => {
    if (rating === 1) {
      return { ...base, state, step: 0, due: now + steps[0] * MIN_MS };
    }
    if (rating === 4) return null; // Easy always graduates immediately
    const nextStep = rating === 3 ? prev.step + 1 : prev.step; // Hard repeats the step
    if (nextStep >= steps.length) return null;
    return { ...base, state, step: nextStep, due: now + steps[nextStep] * MIN_MS };
  };

  switch (prev.state) {
    case "new":
    case "learning": {
      next = inSteps(LEARNING_STEPS_MIN, "learning") ?? graduate();
      break;
    }
    case "relearning": {
      next = inSteps(RELEARNING_STEPS_MIN, "relearning") ?? graduate();
      break;
    }
    case "review": {
      if (rating === 1) {
        next = {
          ...base,
          state: "relearning",
          step: 0,
          lapses: prev.lapses + 1,
          due: now + RELEARNING_STEPS_MIN[0] * MIN_MS,
        };
      } else {
        next = graduate();
      }
      break;
    }
  }

  return { next, elapsedDays, intervalLabel: labelFor(next.due - now) };
}

/** Preview the interval each rating would produce (for the review buttons). */
export function previewIntervals(
  prev: FsrsState,
  requestedRetention = 0.9,
  now = Date.now(),
): Record<Rating, string> {
  const out = {} as Record<Rating, string>;
  ([1, 2, 3, 4] as Rating[]).forEach((rating) => {
    out[rating] = reviewCard(prev, rating, requestedRetention, now).intervalLabel;
  });
  return out;
}

/** Cards due at `now`, ordered: relearning → learning → review → new. */
export function dueOrder(state: CardState): number {
  switch (state) {
    case "relearning": return 0;
    case "learning": return 1;
    case "review": return 2;
    case "new": return 3;
  }
}

/** Current retention estimate for a card (1 for unseen cards). */
export function currentRetention(srs: FsrsState, now = Date.now()): number {
  if (srs.state === "new" || srs.stability <= 0 || srs.lastReview === null) return 1;
  return retrievability((now - srs.lastReview) / DAY_MS, srs.stability);
}
