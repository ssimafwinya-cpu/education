import { describe, it, expect } from "vitest";
import {
  emptyCourseProgress, emptyTopicProgress, topicStatus, topicDepth, isCorrect,
  gradeMoveTest, scheduleAfterPass, applyMemoryCheck, dueMemoryChecks,
  memoryCheckQuestions, readinessScore, completionPercent, nextAction, rankFor,
  MOVE_TEST_PASS, SRS_INTERVALS_DAYS,
  type CareerCourse, type CareerQuestion, type CourseProgress,
} from "./career";

const DAY = 86_400_000;
const NOW = Date.parse("2026-07-06T00:00:00Z");

const q = (id: string, answerIndex = 0): CareerQuestion => ({
  id, kind: "mcq", prompt: id, options: ["right", "wrong"], answerIndex,
  explanation: "", source: "exam-style",
});

const course: CareerCourse = {
  id: "c1", code: "CHE 1000", title: "Chemistry", emoji: "⚗️", intro: "",
  topics: [
    { id: "a", title: "Atoms", emoji: "⚛️", whyLine: "", examWeight: 3, prereqs: [], teach: [], drill: [q("a1"), q("a2")], moveTest: [q("am1"), q("am2")] },
    { id: "b", title: "Bonding", emoji: "🔗", whyLine: "", examWeight: 2, prereqs: ["a"], teach: [], drill: [q("b1")], moveTest: [q("bm1")] },
    { id: "c", title: "Moles", emoji: "⚖️", whyLine: "", examWeight: 5, prereqs: ["a"], teach: [], drill: [q("c1")], moveTest: [q("cm1")] },
    { id: "d", title: "Stoichiometry", emoji: "🧮", whyLine: "", examWeight: 4, prereqs: ["b", "c"], teach: [], drill: [q("d1")], moveTest: [q("dm1")] },
  ],
};

const withPassed = (...ids: string[]): CourseProgress => {
  const p = emptyCourseProgress();
  for (const id of ids) p.topics[id] = { ...emptyTopicProgress(), passed: true, ...scheduleAfterPass(NOW) };
  return p;
};

describe("locking", () => {
  it("roots are available, dependents locked", () => {
    const p = emptyCourseProgress();
    expect(topicStatus(course, p, "a")).toBe("available");
    expect(topicStatus(course, p, "b")).toBe("locked");
    expect(topicStatus(course, p, "d")).toBe("locked");
  });
  it("passing a prereq unlocks dependents; multi-prereq waits for all", () => {
    const p = withPassed("a");
    expect(topicStatus(course, p, "b")).toBe("available");
    expect(topicStatus(course, p, "c")).toBe("available");
    expect(topicStatus(course, p, "d")).toBe("locked");
    const p2 = withPassed("a", "b", "c");
    expect(topicStatus(course, p2, "d")).toBe("available");
  });
  it("tree depth follows prerequisites", () => {
    expect(topicDepth(course, "a")).toBe(0);
    expect(topicDepth(course, "b")).toBe(1);
    expect(topicDepth(course, "d")).toBe(2);
  });
});

describe("grading", () => {
  it("grades mcq and fill answers", () => {
    expect(isCorrect(q("x", 1), 1)).toBe(true);
    expect(isCorrect(q("x", 1), 0)).toBe(false);
    const fill: CareerQuestion = { id: "f", kind: "fill", prompt: "", answerText: ["Mole", "mol"], explanation: "", source: "exam-style" };
    expect(isCorrect(fill, " mole ")).toBe(true);
    expect(isCorrect(fill, "atom")).toBe(false);
  });
  it("move test passes at 80%", () => {
    const qs = [q("1"), q("2"), q("3"), q("4"), q("5")];
    expect(gradeMoveTest(qs, [0, 0, 0, 0, 1]).passed).toBe(true); // 4/5
    expect(gradeMoveTest(qs, [0, 0, 0, 1, 1]).passed).toBe(false); // 3/5
    expect(MOVE_TEST_PASS).toBe(0.8);
  });
});

describe("memory checks (topic SRS)", () => {
  it("pass schedules the first interval; success stretches it", () => {
    const tp = { ...emptyTopicProgress(), passed: true, ...scheduleAfterPass(NOW) };
    expect(tp.srsDue).toBe(NOW + SRS_INTERVALS_DAYS[0] * DAY);
    const after = applyMemoryCheck(tp, true, NOW + DAY);
    expect(after.srsLevel).toBe(1);
    expect(after.srsDue).toBe(NOW + DAY + SRS_INTERVALS_DAYS[1] * DAY);
  });
  it("failure flags needs-review and resets the interval", () => {
    const tp = applyMemoryCheck({ ...emptyTopicProgress(), passed: true, srsLevel: 3, srsDue: NOW }, false, NOW);
    expect(tp.needsReview).toBe(true);
    expect(tp.srsLevel).toBe(0);
  });
  it("dueMemoryChecks returns overdue passed topics, most overdue first", () => {
    const p = withPassed("a", "b");
    p.topics.a.srsDue = NOW - 2 * DAY;
    p.topics.b.srsDue = NOW - 1 * DAY;
    expect(dueMemoryChecks(course, p, NOW).map((t) => t.id)).toEqual(["a", "b"]);
    expect(dueMemoryChecks(course, p, NOW - 3 * DAY)).toHaveLength(0);
  });
  it("memory-check questions rotate with review level", () => {
    const topic = course.topics[0]; // pool of 4
    const l0 = memoryCheckQuestions(topic, 0, 3).map((x) => x.id);
    const l1 = memoryCheckQuestions(topic, 1, 3).map((x) => x.id);
    expect(l0).not.toEqual(l1);
  });
});

describe("readiness & completion", () => {
  it("counts only passed weight, discounted by retention state", () => {
    const p = withPassed("a"); // weight 3 of 14
    expect(readinessScore(course, p, NOW)).toBe(Math.round((3 / 14) * 100));
    p.topics.a.srsDue = NOW - DAY; // overdue → 0.6 credit
    expect(readinessScore(course, p, NOW)).toBe(Math.round((1.8 / 14) * 100));
    p.topics.a.needsReview = true; // → 0.3 credit
    expect(readinessScore(course, p, NOW)).toBe(Math.round((0.9 / 14) * 100));
  });
  it("completion is a simple passed ratio", () => {
    expect(completionPercent(course, withPassed("a", "b"))).toBe(50);
  });
});

describe("nextAction — the one right thing today", () => {
  it("due memory checks come first, then continue, then start, then done", () => {
    const p = withPassed("a");
    p.topics.a.srsDue = NOW - DAY;
    expect(nextAction(course, p, NOW)).toMatchObject({ kind: "memory-check", topic: { id: "a" } });
    p.topics.a.srsDue = NOW + 5 * DAY;
    p.topics.b = { ...emptyTopicProgress(), taught: 1 };
    expect(nextAction(course, p, NOW)).toMatchObject({ kind: "continue", topic: { id: "b" } });
    delete p.topics.b;
    expect(nextAction(course, p, NOW)).toMatchObject({ kind: "start", topic: { id: "b" } });
    const all = withPassed("a", "b", "c", "d");
    for (const t of Object.values(all.topics)) t.srsDue = NOW + 5 * DAY;
    expect(nextAction(course, all, NOW)).toEqual({ kind: "done" });
  });
});

describe("ranks", () => {
  it("maps xp to the career ladder", () => {
    expect(rankFor(0).title).toBe("Fresher");
    expect(rankFor(120).title).toBe("Lab Assistant");
    expect(rankFor(2000).title).toBe("Professor");
    expect(rankFor(2000).next).toBeNull();
  });
});
