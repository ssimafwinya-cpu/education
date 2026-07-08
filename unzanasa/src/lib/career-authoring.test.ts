import { describe, it, expect } from "vitest";
import {
  validateCareerCourse, mergeCareerCourses, parseCareerCourseJson,
  serializeCareerCourse, blankCourse, blankQuestion, blankTopic,
} from "./career-authoring";
import { CHE1000_CAREER, CAREER_COURSES } from "./career-content";
import type { CareerCourse } from "./career";

const mcq = (id: string, over: Record<string, unknown> = {}) => ({
  id, kind: "mcq", prompt: `Prompt ${id}`, options: ["a", "b"], answerIndex: 0,
  explanation: "because", source: "exam-style", ...over,
});

const goodCourse = (): Record<string, unknown> => ({
  id: "bio1400", code: "BIO 1400", title: "Introductory Biology", emoji: "🧬", intro: "Cells up.",
  topics: [
    {
      id: "cells", title: "Cell Structure", emoji: "🔬", whyLine: "Every paper opens here.",
      examWeight: 3, prereqs: [],
      teach: [{ heading: "The cell", body: "Cells are the unit of life.", check: mcq("c1") }],
      drill: [mcq("d1"), mcq("d2")],
      moveTest: [mcq("m1")],
    },
    {
      id: "membranes", title: "Membranes", emoji: "🧫", whyLine: "", examWeight: 2, prereqs: ["cells"],
      teach: [{ heading: "Bilayer", body: "Phospholipids.", check: mcq("c2") }],
      drill: [mcq("d3")],
      moveTest: [mcq("m2")],
    },
  ],
});

describe("validateCareerCourse", () => {
  it("accepts a well-formed course and normalises strings", () => {
    const input = goodCourse();
    (input.topics as Record<string, unknown>[])[0].title = "  Cell Structure  ";
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.course.topics[0].title).toBe("Cell Structure");
      expect(r.course.topics).toHaveLength(2);
    }
  });

  it("accepts every built-in course (dog-food)", () => {
    for (const c of CAREER_COURSES) {
      const r = validateCareerCourse(c);
      expect(r.ok, `built-in ${c.code} should validate`).toBe(true);
    }
  });

  it("derives ids from code/title when missing", () => {
    const input = goodCourse();
    delete input.id;
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.course.id).toBe("bio-1400");
  });

  it("rejects a non-object and junk topics", () => {
    expect(validateCareerCourse(null).ok).toBe(false);
    expect(validateCareerCourse("x").ok).toBe(false);
    const r = validateCareerCourse({ ...goodCourse(), topics: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/at least one topic/);
  });

  it("rejects unknown and self prerequisites", () => {
    const input = goodCourse();
    (input.topics as Record<string, unknown>[])[1].prereqs = ["ghost"];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/"ghost" does not exist/);

    const input2 = goodCourse();
    (input2.topics as Record<string, unknown>[])[0].prereqs = ["cells"];
    const r2 = validateCareerCourse(input2);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.errors.join()).toMatch(/own prerequisite/);
  });

  it("rejects prerequisite cycles with the cycle spelled out", () => {
    const input = goodCourse();
    const topics = input.topics as Record<string, unknown>[];
    topics[0].prereqs = ["membranes"]; // cells → membranes → cells
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/cycle/i);
  });

  it("rejects a course with no unlocked starting topic", () => {
    const input = goodCourse();
    const topics = input.topics as Record<string, unknown>[];
    topics[0].prereqs = ["membranes"];
    topics[1].prereqs = ["cells"];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(false);
  });

  it("rejects broken questions of each kind", () => {
    const badMcq = goodCourse();
    ((badMcq.topics as Record<string, unknown>[])[0].drill as unknown[]) = [mcq("d1", { options: ["only-one"] })];
    expect(validateCareerCourse(badMcq).ok).toBe(false);

    const badIndex = goodCourse();
    ((badIndex.topics as Record<string, unknown>[])[0].drill as unknown[]) = [mcq("d1", { answerIndex: 9 })];
    expect(validateCareerCourse(badIndex).ok).toBe(false);

    const badFill = goodCourse();
    ((badFill.topics as Record<string, unknown>[])[0].drill as unknown[]) =
      [mcq("d1", { kind: "fill", answerText: [] })];
    expect(validateCareerCourse(badFill).ok).toBe(false);
  });

  it("rejects an empty mcq option instead of silently shifting the answer", () => {
    // ["", "Blue", "Red"] with answerIndex 1 means the admin picked "Blue".
    // Dropping the empty would slide answerIndex 1 onto "Red" — a silently
    // wrong answer key. It must be an error, not a silent normalise.
    const input = goodCourse();
    ((input.topics as Record<string, unknown>[])[0].drill as unknown[]) =
      [mcq("d1", { options: ["", "Blue", "Red"], answerIndex: 1 }), mcq("d2")];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/every option needs text/);
  });

  it("normalises truefalse options and requires a valid answerIndex", () => {
    const input = goodCourse();
    ((input.topics as Record<string, unknown>[])[0].drill as unknown[]) =
      [mcq("d1", { kind: "truefalse", options: ["Yes!", "No!"], answerIndex: 1 })];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.course.topics[0].drill[0].options).toEqual(["True", "False"]);
  });

  it("rejects duplicate question ids across the whole course", () => {
    const input = goodCourse();
    ((input.topics as Record<string, unknown>[])[1].drill as unknown[]) = [mcq("d1")]; // d1 already in topic 1
    expect(validateCareerCourse(input).ok).toBe(false);
  });

  it("requires a non-empty move test (the gate)", () => {
    const input = goodCourse();
    (input.topics as Record<string, unknown>[])[0].moveTest = [];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/Move Test/);
  });

  it("warns (not errors) on past-paper questions without a sourceRef", () => {
    const input = goodCourse();
    ((input.topics as Record<string, unknown>[])[0].drill as unknown[]) =
      [mcq("d1", { source: "past-paper" }), mcq("d2")];
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings.join()).toMatch(/sourceRef/);
  });

  it("drops unknown fields (nothing smuggled into shared content)", () => {
    const input = goodCourse();
    (input as Record<string, unknown>).evil = { script: "x" };
    const r = validateCareerCourse(input);
    expect(r.ok).toBe(true);
    if (r.ok) expect("evil" in r.course).toBe(false);
  });
});

describe("mergeCareerCourses", () => {
  const custom: CareerCourse = { ...CHE1000_CAREER, id: "bio1400", code: "BIO 1400", title: "Bio" };

  it("appends custom courses after built-ins", () => {
    const merged = mergeCareerCourses(CAREER_COURSES, [custom]);
    expect(merged).toHaveLength(CAREER_COURSES.length + 1);
    expect(merged[merged.length - 1].id).toBe("bio1400");
  });

  it("lets a custom course override a built-in with the same id", () => {
    const override: CareerCourse = { ...CHE1000_CAREER, title: "CHE 1000 (2026 syllabus)" };
    const merged = mergeCareerCourses(CAREER_COURSES, [override]);
    expect(merged).toHaveLength(CAREER_COURSES.length);
    expect(merged.find((c) => c.id === CHE1000_CAREER.id)?.title).toBe("CHE 1000 (2026 syllabus)");
  });

  it("returns built-ins untouched for empty custom", () => {
    expect(mergeCareerCourses(CAREER_COURSES, undefined)).toBe(CAREER_COURSES);
    expect(mergeCareerCourses(CAREER_COURSES, [])).toBe(CAREER_COURSES);
  });
});

describe("JSON round trip", () => {
  it("serialize → parse reproduces the course", () => {
    const r = parseCareerCourseJson(serializeCareerCourse(CHE1000_CAREER));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.course).toEqual(CHE1000_CAREER);
  });

  it("reports invalid JSON as an error, not a crash", () => {
    const r = parseCareerCourseJson("{nope");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/Not valid JSON/);
  });
});

describe("blank templates", () => {
  it("produce unique ids and the expected shape", () => {
    const a = blankQuestion();
    const b = blankQuestion();
    expect(a.id).not.toBe(b.id);
    expect(blankTopic().teach).toHaveLength(1);
    expect(blankCourse().topics).toHaveLength(1);
  });
});
