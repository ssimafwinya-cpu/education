import { describe, it, expect } from "vitest";
import {
  solveKinematics, projectile, ohmsLaw, convert, convertTemp, vDot, vCross, vMag, vAngle, CONSTANTS,
} from "./physics";
import {
  solveQuadratic, matMultiply, determinant, matInverse, matTranspose, statistics, derivative, integrate,
} from "./mathematics";
import {
  complementDNA, reverseComplement, transcribe, translate, gcContent, punnettSquare, hardyWeinbergFromQ2, isValidDNA,
} from "./biology";
import { formatCitation, type Reference } from "./citations";
import { ELEMENTS, atomicMass } from "./periodic-table";

// ── Physics ──
describe("kinematics", () => {
  it("solves v from u, a, t", () => {
    const r = solveKinematics({ u: 0, a: 9.8, t: 2 });
    expect(r?.v).toBeCloseTo(19.6, 3);
    expect(r?.s).toBeCloseTo(19.6, 3);
  });
  it("solves a and t from u, v, s", () => {
    const r = solveKinematics({ u: 0, v: 20, s: 100 });
    expect(r?.a).toBeCloseTo(2, 3);
    expect(r?.t).toBeCloseTo(10, 3);
  });
  it("needs at least 3 knowns", () => {
    expect(solveKinematics({ u: 0, v: 10 })).toBeNull();
  });
});

describe("projectile", () => {
  it("45° range is v²/g", () => {
    const r = projectile({ v0: 20, angleDeg: 45 });
    expect(r.range).toBeCloseTo((20 * 20) / CONSTANTS.g, 0);
  });
  it("max height at 90° is v²/2g", () => {
    const r = projectile({ v0: 10, angleDeg: 90 });
    expect(r.maxHeight).toBeCloseTo((100) / (2 * CONSTANTS.g), 1);
  });
  it("produces a trajectory that starts at origin", () => {
    const r = projectile({ v0: 15, angleDeg: 30 });
    expect(r.trajectory[0]).toEqual({ x: 0, y: 0 });
    expect(r.trajectory.length).toBeGreaterThan(10);
  });
});

describe("ohmsLaw", () => {
  it("computes R and P from V and I", () => {
    const r = ohmsLaw({ V: 12, I: 2 });
    expect(r?.R).toBe(6);
    expect(r?.P).toBe(24);
  });
  it("computes V from P and R", () => {
    const r = ohmsLaw({ P: 100, R: 4 });
    expect(r?.I).toBeCloseTo(5, 3);
    expect(r?.V).toBeCloseTo(20, 3);
  });
});

describe("unit conversion", () => {
  it("km to m", () => expect(convert(1, "km", "m", "length")).toBe(1000));
  it("miles to km", () => expect(convert(1, "mi", "km", "length")).toBeCloseTo(1.609, 2));
  it("Celsius to Fahrenheit", () => expect(convertTemp(100, "C", "F")).toBeCloseTo(212, 3));
  it("Fahrenheit to Kelvin", () => expect(convertTemp(32, "F", "K")).toBeCloseTo(273.15, 2));
  it("rejects unknown units", () => expect(convert(1, "zz", "m", "length")).toBeNull());
});

describe("vectors", () => {
  it("dot product", () => expect(vDot([1, 2, 3], [4, 5, 6])).toBe(32));
  it("cross product", () => expect(vCross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]));
  it("magnitude", () => expect(vMag([3, 4])).toBe(5));
  it("angle between perpendicular vectors is 90°", () => expect(vAngle([1, 0], [0, 1])).toBeCloseTo(90, 3));
});

// ── Mathematics ──
describe("quadratic", () => {
  it("two real roots", () => {
    const r = solveQuadratic(1, -3, 2) as any;
    expect(r.roots.sort()).toEqual([1, 2]);
  });
  it("repeated root", () => {
    const r = solveQuadratic(1, -2, 1) as any;
    expect(r.roots).toEqual([1]);
  });
  it("complex roots", () => {
    const r = solveQuadratic(1, 0, 1) as any;
    expect(r.complex[0].im).toBeCloseTo(1, 3);
  });
  it("degenerates to linear when a=0", () => {
    const r = solveQuadratic(0, 2, -4) as any;
    expect(r.linear).toBe(2);
  });
});

describe("matrices", () => {
  it("multiplies", () => {
    expect(matMultiply([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
  });
  it("transposes", () => {
    expect(matTranspose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
  });
  it("determinant of 2×2 and 3×3", () => {
    expect(determinant([[1, 2], [3, 4]])).toBe(-2);
    expect(determinant([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).toBe(-306);
  });
  it("inverts and A·A⁻¹ = I", () => {
    const inv = matInverse([[4, 7], [2, 6]])!;
    const prod = matMultiply([[4, 7], [2, 6]], inv)!;
    expect(prod[0][0]).toBeCloseTo(1, 5);
    expect(prod[0][1]).toBeCloseTo(0, 5);
    expect(prod[1][1]).toBeCloseTo(1, 5);
  });
  it("returns null for singular matrices", () => {
    expect(matInverse([[1, 2], [2, 4]])).toBeNull();
  });
});

describe("statistics", () => {
  it("computes mean/median/sd", () => {
    const s = statistics([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.stdDev).toBeCloseTo(2, 3);
    expect(s.mode).toEqual([4]);
  });
  it("returns null for empty data", () => expect(statistics([])).toBeNull());
});

describe("calculus", () => {
  it("derivative of x² at 3 ≈ 6", () => expect(derivative((x) => x * x, 3)).toBeCloseTo(6, 3));
  it("integral of x² from 0 to 3 ≈ 9", () => expect(integrate((x) => x * x, 0, 3)).toBeCloseTo(9, 3));
});

// ── Biology ──
describe("nucleic acids", () => {
  it("validates DNA", () => { expect(isValidDNA("ATGC")).toBe(true); expect(isValidDNA("ATBX")).toBe(false); });
  it("complements DNA", () => expect(complementDNA("ATGC")).toBe("TACG"));
  it("reverse complement", () => expect(reverseComplement("ATGC")).toBe("GCAT"));
  it("transcribes to mRNA", () => expect(transcribe("ATGC")).toBe("AUGC"));
  it("GC content", () => expect(gcContent("ATGC")).toBe(50));
  it("translates start codon and a peptide", () => {
    const { peptide } = translate("AUGGCUUAA");
    expect(peptide).toBe("MA"); // Met-Ala then stop
  });
  it("translates from DNA (auto-transcribe) and stops at stop codon", () => {
    const { peptide } = translate("ATGTTTTAA", true);
    expect(peptide).toBe("MF");
  });
});

describe("genetics", () => {
  it("monohybrid cross Aa × Aa gives 1:2:1", () => {
    const r = punnettSquare("Aa", "Aa")!;
    expect(r.genotypes["AA"]).toBe(1);
    expect(r.genotypes["Aa"]).toBe(2);
    expect(r.genotypes["aa"]).toBe(1);
  });
  it("Hardy-Weinberg from q²=0.01", () => {
    const hw = hardyWeinbergFromQ2(0.01)!;
    expect(hw.q).toBeCloseTo(0.1, 3);
    expect(hw.p).toBeCloseTo(0.9, 3);
    expect(hw.Aa).toBeCloseTo(0.18, 3);
  });
  it("rejects out-of-range q²", () => expect(hardyWeinbergFromQ2(2)).toBeNull());
});

// ── Periodic table ──
describe("periodic table", () => {
  it("has 118 elements", () => expect(ELEMENTS.length).toBe(118));
  it("atomic masses are correct", () => {
    expect(atomicMass("H")).toBeCloseTo(1.008, 3);
    expect(atomicMass("Fe")).toBeCloseTo(55.845, 3);
    expect(atomicMass("Zz")).toBeNull();
  });
  it("all atomic numbers are sequential 1..118", () => {
    ELEMENTS.forEach((e, i) => expect(e.z).toBe(i + 1));
  });
});

// ── Citations ──
describe("citations", () => {
  const ref: Reference = {
    authors: ["Mulenga, Chanda", "Phiri, Natasha"],
    year: "2025", title: "Spaced repetition in science education",
    source: "Journal of Zambian Science", volume: "12", issue: "3", pages: "45-58",
    doi: "10.1000/xyz123",
  };
  it("APA includes authors, year and DOI", () => {
    const s = formatCitation(ref, "APA");
    expect(s).toContain("(2025)");
    expect(s).toContain("Mulenga");
    expect(s).toContain("https://doi.org/10.1000/xyz123");
  });
  it("Vancouver uses journal abbreviation style", () => {
    expect(formatCitation(ref, "Vancouver")).toContain("2025;12(3):45-58");
  });
  it("IEEE quotes the title and lists initials-first", () => {
    const s = formatCitation(ref, "IEEE");
    expect(s).toContain('"Spaced repetition in science education,"');
    expect(s).toContain("C. Mulenga");
  });
  it("MLA and Harvard produce non-empty distinct strings", () => {
    expect(formatCitation(ref, "MLA").length).toBeGreaterThan(20);
    expect(formatCitation(ref, "Harvard")).toContain("2025");
  });
});
