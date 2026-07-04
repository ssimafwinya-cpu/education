import { describe, it, expect } from "vitest";
import { generatePlan, productivityScore } from "./planner";
import { buildSeedState } from "./seed";

describe("generatePlan", () => {
  const state = buildSeedState();

  it("creates tasks across the requested number of days", () => {
    const tasks = generatePlan(state, { days: 5, minutesPerDay: 90, subjectIds: [], includeWeekends: true });
    expect(tasks.length).toBeGreaterThan(0);
    const days = new Set(tasks.map((t) => t.date));
    expect(days.size).toBeLessThanOrEqual(5);
    expect(days.size).toBeGreaterThan(0);
  });

  it("always includes a review block and marks tasks as auto-generated", () => {
    const tasks = generatePlan(state, { days: 3, minutesPerDay: 120, subjectIds: [], includeWeekends: true });
    expect(tasks.some((t) => t.kind === "review")).toBe(true);
    expect(tasks.every((t) => t.auto)).toBe(true);
  });

  it("respects the includeWeekends flag", () => {
    const withWeekends = generatePlan(state, { days: 14, minutesPerDay: 60, subjectIds: [], includeWeekends: true });
    const noWeekends = generatePlan(state, { days: 14, minutesPerDay: 60, subjectIds: [], includeWeekends: false });
    const hasWeekend = (tasks: typeof withWeekends) =>
      tasks.some((t) => { const d = new Date(t.date + "T00:00:00").getDay(); return d === 0 || d === 6; });
    expect(hasWeekend(noWeekends)).toBe(false);
    expect(withWeekends.length).toBeGreaterThanOrEqual(noWeekends.length);
  });

  it("returns an empty plan when no subjects match", () => {
    expect(generatePlan(state, { days: 5, minutesPerDay: 60, subjectIds: ["nonexistent"], includeWeekends: true })).toEqual([]);
  });

  it("schedules more total time when minutesPerDay is higher", () => {
    const light = generatePlan(state, { days: 5, minutesPerDay: 30, subjectIds: [], includeWeekends: true });
    const heavy = generatePlan(state, { days: 5, minutesPerDay: 180, subjectIds: [], includeWeekends: true });
    const total = (tasks: typeof light) => tasks.reduce((n, t) => n + t.durationMin, 0);
    expect(total(heavy)).toBeGreaterThan(total(light));
  });
});

describe("productivityScore", () => {
  it("is between 0 and 100", () => {
    const score = productivityScore(buildSeedState());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
