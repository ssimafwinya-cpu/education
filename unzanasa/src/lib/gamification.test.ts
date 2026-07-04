import { describe, it, expect } from "vitest";
import {
  xpForLevel, levelFromXp, levelProgress, levelTitle,
  bumpStreak, streakAlive, newlyUnlocked, ACHIEVEMENTS,
} from "./gamification";
import { buildSeedState } from "./seed";
import type { AppState } from "./types";

describe("levels", () => {
  it("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it("XP required increases with level", () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });
  it("levelFromXp is the inverse of xpForLevel", () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(levelFromXp(xpForLevel(lvl))).toBe(lvl);
      // Just below the threshold is the previous level
      if (lvl > 1) expect(levelFromXp(xpForLevel(lvl) - 1)).toBe(lvl - 1);
    }
  });
  it("levelProgress reports progress within the current level", () => {
    const p = levelProgress(xpForLevel(3) + 10);
    expect(p.level).toBe(3);
    expect(p.into).toBe(10);
    expect(p.needed).toBe(xpForLevel(4) - xpForLevel(3));
    expect(p.pctToNext).toBeGreaterThanOrEqual(0);
    expect(p.pctToNext).toBeLessThanOrEqual(100);
  });
  it("assigns a title for every level", () => {
    for (let lvl = 1; lvl <= 30; lvl++) {
      expect(typeof levelTitle(lvl)).toBe("string");
      expect(levelTitle(lvl).length).toBeGreaterThan(0);
    }
  });
});

describe("streaks", () => {
  it("starts a streak at 1 with no prior activity", () => {
    const s = bumpStreak({ current: 0, best: 0, lastActiveDay: null }, "2026-01-10");
    expect(s.current).toBe(1);
    expect(s.best).toBe(1);
    expect(s.lastActiveDay).toBe("2026-01-10");
  });
  it("extends the streak on a consecutive day", () => {
    const s = bumpStreak({ current: 3, best: 5, lastActiveDay: "2026-01-10" }, "2026-01-11");
    expect(s.current).toBe(4);
    expect(s.best).toBe(5);
  });
  it("updates best when the current streak surpasses it", () => {
    const s = bumpStreak({ current: 5, best: 5, lastActiveDay: "2026-01-10" }, "2026-01-11");
    expect(s.current).toBe(6);
    expect(s.best).toBe(6);
  });
  it("resets to 1 after a gap", () => {
    const s = bumpStreak({ current: 7, best: 7, lastActiveDay: "2026-01-10" }, "2026-01-13");
    expect(s.current).toBe(1);
    expect(s.best).toBe(7); // best is preserved
  });
  it("is idempotent on the same day", () => {
    const s = bumpStreak({ current: 4, best: 4, lastActiveDay: "2026-01-10" }, "2026-01-10");
    expect(s.current).toBe(4);
  });
  it("streakAlive is true today or yesterday, false after a gap", () => {
    expect(streakAlive("2026-01-10", "2026-01-10")).toBe(true);
    expect(streakAlive("2026-01-10", "2026-01-11")).toBe(true);
    expect(streakAlive("2026-01-10", "2026-01-12")).toBe(false);
    expect(streakAlive(null, "2026-01-12")).toBe(false);
  });
});

describe("achievements", () => {
  it("all achievement ids are unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a fresh seed state has unlockable achievements available", () => {
    const state = buildSeedState();
    const unlocked = newlyUnlocked(state);
    // Seed data creates 3 subjects, so 'architect' should be earnable.
    expect(unlocked.some((a) => a.id === "architect")).toBe(true);
  });

  it("does not re-report already-unlocked achievements", () => {
    const state = buildSeedState();
    const first = newlyUnlocked(state);
    expect(first.length).toBeGreaterThan(0);
    // Mark them unlocked and confirm they're not reported again.
    const stamped: AppState = {
      ...state,
      game: { ...state.game, unlocked: Object.fromEntries(first.map((a) => [a.id, Date.now()])) },
    };
    const second = newlyUnlocked(stamped);
    expect(second.some((a) => first.find((f) => f.id === a.id))).toBe(false);
  });

  it("perfectionist unlocks only after a 100% attempt", () => {
    const state = buildSeedState();
    expect(newlyUnlocked(state).some((a) => a.id === "perfectionist")).toBe(false);
    state.attempts.push({ id: "a1", quizId: "q1", startedAt: 0, finishedAt: 1, mode: "practice", answers: [], scorePercent: 100 });
    expect(newlyUnlocked(state).some((a) => a.id === "perfectionist")).toBe(true);
  });
});
