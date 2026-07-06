import { describe, it, expect } from "vitest";
import { defaultPastPapers, groupByCourse, paperYears, filterPapers, paperLabel } from "./past-papers";
import type { PastPaper } from "./types";

const sample: PastPaper[] = [
  { id: "1", courseCode: "CHE 1000", courseTitle: "Introductory Chemistry", year: 2023, kind: "Final" },
  { id: "2", courseCode: "CHE 1000", courseTitle: "Introductory Chemistry", year: 2024, kind: "Test", label: "Test 1" },
  { id: "3", courseCode: "BIO 1400", courseTitle: "Introductory Biology", year: 2024, kind: "Final" },
];

describe("defaults", () => {
  it("provides a starter index across first-year courses", () => {
    const p = defaultPastPapers();
    expect(p.length).toBeGreaterThan(0);
    expect(new Set(p.map((x) => x.courseCode))).toContain("BIO 1400");
  });
});

describe("groupByCourse", () => {
  it("groups by course (A→Z), papers newest-first", () => {
    const groups = groupByCourse(sample);
    expect(groups.map((g) => g.courseCode)).toEqual(["BIO 1400", "CHE 1000"]);
    const che = groups.find((g) => g.courseCode === "CHE 1000")!;
    expect(che.papers.map((p) => p.year)).toEqual([2024, 2023]);
  });
});

describe("paperYears", () => {
  it("returns distinct years descending", () => {
    expect(paperYears(sample)).toEqual([2024, 2023]);
  });
});

describe("filterPapers", () => {
  it("filters by course, year, kind and query", () => {
    expect(filterPapers(sample, { courseCode: "CHE 1000" })).toHaveLength(2);
    expect(filterPapers(sample, { year: 2024 })).toHaveLength(2);
    expect(filterPapers(sample, { kind: "Final" })).toHaveLength(2);
    expect(filterPapers(sample, { query: "biology" })).toHaveLength(1);
    expect(filterPapers(sample, { courseCode: "CHE 1000", kind: "Test" })).toHaveLength(1);
  });
});

describe("paperLabel", () => {
  it("includes the optional label when present", () => {
    expect(paperLabel(sample[1])).toBe("Test · Test 1");
    expect(paperLabel(sample[0])).toBe("Final");
  });
});
