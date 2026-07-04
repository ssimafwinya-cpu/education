import { describe, it, expect } from "vitest";
import { buildLabReport, missingSections, type LabReportInput } from "./lab-report";

const base: LabReportInput = {
  title: "Titration of Vinegar",
  aim: "To determine acetic acid concentration.",
  materials: "Burette\nPipette\nNaOH",
  methods: "Fill burette\nTitrate\nRecord",
  observations: "Trial\tTitre\n1\t23.4\n2\t23.2",
};

describe("buildLabReport", () => {
  it("includes all standard sections", () => {
    const r = buildLabReport(base);
    for (const section of ["# Titration", "## Aim", "## Objectives", "## Background", "## Materials", "## Method", "## Results", "## Discussion", "## Sources of Error", "## Conclusion", "## References"]) {
      expect(r).toContain(section);
    }
  });

  it("renders tab-separated observations as a markdown table", () => {
    const r = buildLabReport(base);
    expect(r).toContain("| Trial | Titre |");
    expect(r).toContain("| --- | --- |");
    expect(r).toContain("| 1 | 23.4 |");
  });

  it("never fabricates data — includes the integrity warning", () => {
    const r = buildLabReport(base);
    expect(r).toContain("not generated");
  });

  it("flags missing sections with placeholders", () => {
    const r = buildLabReport(base);
    // background, discussion, sources, conclusion, references empty → 5 placeholders
    expect(missingSections(r)).toBe(5);
  });

  it("no placeholders when everything is provided", () => {
    const full: LabReportInput = {
      ...base, background: "Acids react with bases.", discussion: "Concordant titres obtained.",
      sourcesOfError: "Parallax error", conclusion: "Concentration was 0.09 M", references: "Atkins, Physical Chemistry",
      objectives: "Measure titre",
    };
    expect(missingSections(buildLabReport(full))).toBe(0);
  });

  it("derives an objective from the aim when none given", () => {
    const r = buildLabReport(base);
    expect(r).toMatch(/## Objectives\n- To investigate/);
  });
});
