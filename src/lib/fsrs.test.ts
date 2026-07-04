import { describe, it, expect } from "vitest";
import {
  newCardState, reviewCard, retrievability, nextIntervalDays,
  previewIntervals, currentRetention, dueOrder,
} from "./fsrs";
import type { FsrsState, Rating } from "./types";

const DAY = 86400000;

describe("retrievability", () => {
  it("is 1 at t=0", () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 5);
  });
  it("is ~0.9 after t = stability days", () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 2);
  });
  it("decreases monotonically with elapsed time", () => {
    const r1 = retrievability(1, 10);
    const r5 = retrievability(5, 10);
    const r20 = retrievability(20, 10);
    expect(r1).toBeGreaterThan(r5);
    expect(r5).toBeGreaterThan(r20);
  });
  it("returns 0 for non-positive stability", () => {
    expect(retrievability(5, 0)).toBe(0);
  });
});

describe("nextIntervalDays", () => {
  it("grows with stability", () => {
    expect(nextIntervalDays(20, 0.9)).toBeGreaterThan(nextIntervalDays(5, 0.9));
  });
  it("higher requested retention → shorter interval", () => {
    const low = nextIntervalDays(50, 0.8);
    const high = nextIntervalDays(50, 0.95);
    expect(high).toBeLessThan(low);
  });
  it("never returns less than 1 day", () => {
    expect(nextIntervalDays(0.1, 0.99)).toBeGreaterThanOrEqual(1);
  });
});

describe("reviewCard — new cards", () => {
  it("a new card enters learning after a 'Good' rating", () => {
    const s = newCardState(0);
    const { next } = reviewCard(s, 3, 0.9, 0);
    expect(next.state).toBe("learning");
    expect(next.reps).toBe(1);
    expect(next.stability).toBeGreaterThan(0);
    expect(next.difficulty).toBeGreaterThanOrEqual(1);
    expect(next.difficulty).toBeLessThanOrEqual(10);
  });

  it("'Easy' on a new card graduates it straight to review", () => {
    const s = newCardState(0);
    const { next } = reviewCard(s, 4, 0.9, 0);
    expect(next.state).toBe("review");
    expect(next.due).toBeGreaterThan(DAY); // scheduled at least a day out
  });

  it("harder ratings produce higher difficulty than easier ones", () => {
    const s = newCardState(0);
    const again = reviewCard(s, 1, 0.9, 0).next.difficulty;
    const easy = reviewCard(s, 4, 0.9, 0).next.difficulty;
    expect(again).toBeGreaterThan(easy);
  });
});

describe("reviewCard — review cards", () => {
  const reviewState = (over: Partial<FsrsState> = {}): FsrsState => ({
    state: "review", due: 0, stability: 10, difficulty: 5, step: 0,
    reps: 3, lapses: 0, lastReview: -10 * DAY, ...over,
  });

  it("'Again' on a review card sends it to relearning and increments lapses", () => {
    const { next } = reviewCard(reviewState(), 1, 0.9, 0);
    expect(next.state).toBe("relearning");
    expect(next.lapses).toBe(1);
  });

  it("'Again' reduces stability (never increases it)", () => {
    const prev = reviewState({ stability: 20 });
    const { next } = reviewCard(prev, 1, 0.9, 0);
    expect(next.stability).toBeLessThanOrEqual(prev.stability);
  });

  it("'Good' on a review card keeps it in review and grows stability", () => {
    const prev = reviewState({ stability: 10, lastReview: -10 * DAY });
    const { next } = reviewCard(prev, 3, 0.9, 0);
    expect(next.state).toBe("review");
    expect(next.stability).toBeGreaterThan(prev.stability);
  });

  it("'Easy' grows stability more than 'Good'", () => {
    const prev = reviewState();
    const good = reviewCard(prev, 3, 0.9, 0).next.stability;
    const easy = reviewCard(prev, 4, 0.9, 0).next.stability;
    expect(easy).toBeGreaterThan(good);
  });

  it("intervals are ordered Again ≤ Hard ≤ Good ≤ Easy (by due date)", () => {
    const prev = reviewState();
    const dues = ([1, 2, 3, 4] as Rating[]).map((r) => reviewCard(prev, r, 0.9, 0).next.due);
    expect(dues[0]).toBeLessThanOrEqual(dues[1]);
    expect(dues[1]).toBeLessThanOrEqual(dues[2]);
    expect(dues[2]).toBeLessThanOrEqual(dues[3]);
  });
});

describe("learning steps", () => {
  it("walks through learning steps before graduating on repeated 'Good'", () => {
    let s = newCardState(0);
    // First Good → learning step 1 (short interval)
    let res = reviewCard(s, 3, 0.9, 0);
    expect(res.next.state).toBe("learning");
    // Second Good → graduates to review
    res = reviewCard(res.next, 3, 0.9, res.next.due);
    expect(res.next.state).toBe("review");
  });

  it("'Again' during learning resets to the first step", () => {
    let s = newCardState(0);
    let res = reviewCard(s, 3, 0.9, 0); // learning, step 1
    res = reviewCard(res.next, 1, 0.9, res.next.due); // Again
    expect(res.next.state).toBe("learning");
    expect(res.next.step).toBe(0);
  });
});

describe("previewIntervals", () => {
  it("returns a human label for every rating", () => {
    const labels = previewIntervals(newCardState(0), 0.9, 0);
    expect(Object.keys(labels)).toHaveLength(4);
    for (const l of Object.values(labels)) expect(typeof l).toBe("string");
  });
});

describe("currentRetention", () => {
  it("is 1 for a brand-new card", () => {
    expect(currentRetention(newCardState(0), 0)).toBe(1);
  });
  it("decays for a reviewed card as time passes", () => {
    const s: FsrsState = { state: "review", due: 0, stability: 10, difficulty: 5, step: 0, reps: 2, lapses: 0, lastReview: 0 };
    const now = 15 * DAY;
    expect(currentRetention(s, now)).toBeLessThan(1);
  });
});

describe("dueOrder", () => {
  it("prioritises relearning and learning ahead of review and new", () => {
    expect(dueOrder("relearning")).toBeLessThan(dueOrder("learning"));
    expect(dueOrder("learning")).toBeLessThan(dueOrder("review"));
    expect(dueOrder("review")).toBeLessThan(dueOrder("new"));
  });
});

describe("simulated learning trajectory", () => {
  it("a card answered 'Good' repeatedly grows to a multi-week interval", () => {
    let s = newCardState(0);
    let now = 0;
    for (let i = 0; i < 6; i++) {
      const res = reviewCard(s, 3, 0.9, now);
      s = res.next;
      now = s.due; // review exactly when due
    }
    // After several successful reviews the interval should be well over a week.
    const intervalDays = (s.due - s.lastReview!) / DAY;
    expect(intervalDays).toBeGreaterThan(7);
    expect(s.state).toBe("review");
  });
});
