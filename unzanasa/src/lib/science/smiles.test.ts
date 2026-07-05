import { describe, it, expect } from "vitest";
import { parseSmiles, fromSmiles, hillFormula, degreeOfUnsaturation, SmilesError } from "./smiles";

describe("parseSmiles — structure", () => {
  it("parses a simple chain", () => {
    const m = parseSmiles("CCO");
    expect(m.atoms.map((a) => a.element)).toEqual(["C", "C", "O"]);
    expect(m.bonds).toHaveLength(2);
    expect(m.bonds.every((b) => b.order === 1)).toBe(true);
  });
  it("parses double and triple bonds", () => {
    expect(parseSmiles("C=C").bonds[0].order).toBe(2);
    expect(parseSmiles("C#N").bonds[0].order).toBe(3);
  });
  it("parses branches", () => {
    const m = parseSmiles("CC(=O)O"); // acetic acid
    expect(m.atoms).toHaveLength(4);
    expect(m.bonds.find((b) => b.order === 2)).toBeTruthy();
  });
  it("parses rings via ring-closure digits", () => {
    const m = parseSmiles("C1CCCCC1"); // cyclohexane
    expect(m.atoms).toHaveLength(6);
    expect(m.bonds).toHaveLength(6); // 5 chain + 1 closure
  });
  it("parses two-letter halogens", () => {
    const m = parseSmiles("CCl");
    expect(m.atoms[1].element).toBe("Cl");
  });
  it("parses bracket atoms with charge and H", () => {
    const m = parseSmiles("[NH4+]");
    expect(m.atoms[0].element).toBe("N");
    expect(m.atoms[0].charge).toBe(1);
    expect(m.atoms[0].bracketH).toBe(4);
  });
  it("parses aromatic lowercase atoms", () => {
    const m = parseSmiles("c1ccccc1");
    expect(m.atoms.every((a) => a.aromatic && a.element === "C")).toBe(true);
  });
});

describe("parseSmiles — errors", () => {
  it("rejects unbalanced parentheses and rings", () => {
    expect(() => parseSmiles("CC(")).toThrow(SmilesError);
    expect(() => parseSmiles("C1CC")).toThrow(SmilesError);
  });
  it("rejects unbracketed non-organic elements", () => {
    expect(() => parseSmiles("Na")).toThrow(SmilesError);
  });
  it("rejects empty input", () => {
    expect(() => parseSmiles("")).toThrow(SmilesError);
  });
});

describe("molecular formula & mass", () => {
  const cases: [string, string, number][] = [
    ["C", "CH4", 16.043],
    ["CCO", "C2H6O", 46.069],
    ["CC(=O)O", "C2H4O2", 60.052],
    ["c1ccccc1", "C6H6", 78.114],
    ["CC(=O)Oc1ccccc1C(=O)O", "C9H8O4", 180.159], // aspirin
    ["CC(=O)C", "C3H6O", 58.08],  // acetone
    ["C=C", "C2H4", 28.054],
    ["C#C", "C2H2", 26.038],
    ["Oc1ccccc1", "C6H6O", 94.113], // phenol
    ["Nc1ccccc1", "C6H7N", 93.129], // aniline
  ];
  it.each(cases)("%s → %s", (smiles, formula, mass) => {
    const info = fromSmiles(smiles);
    expect(info.formula).toBe(formula);
    expect(info.mass).toBeCloseTo(mass, 1);
  });

  it("water from a lone O gets 2 implicit H", () => {
    expect(fromSmiles("O").formula).toBe("H2O");
  });
  it("pyridine keeps its nitrogen and correct H count", () => {
    expect(fromSmiles("c1ccncc1").formula).toBe("C5H5N");
  });
});

describe("degree of unsaturation", () => {
  it("alkanes have DoU 0", () => {
    expect(fromSmiles("CCC").degreeOfUnsaturation).toBe(0);
  });
  it("one C=C or one ring gives DoU 1", () => {
    expect(fromSmiles("C=C").degreeOfUnsaturation).toBe(1);
    expect(fromSmiles("C1CCCCC1").degreeOfUnsaturation).toBe(1);
  });
  it("benzene has DoU 4 (3 π + 1 ring)", () => {
    expect(fromSmiles("c1ccccc1").degreeOfUnsaturation).toBe(4);
  });
  it("returns null when non-CHNOPSX atoms are present", () => {
    expect(degreeOfUnsaturation({ Fe: 1, C: 2 })).toBeNull();
  });
});

describe("ring detection", () => {
  it("marks ring atoms/bonds and excludes chain bonds", () => {
    const info = fromSmiles("c1ccccc1C"); // toluene: 6 ring atoms + 1 methyl
    const ringAtomCount = info.ringAtoms.filter(Boolean).length;
    expect(ringAtomCount).toBe(6);
    const ringBondCount = info.ringBonds.filter(Boolean).length;
    expect(ringBondCount).toBe(6); // the 6 aromatic ring bonds; the methyl bond is a bridge
  });
  it("an acyclic molecule has no ring bonds", () => {
    expect(fromSmiles("CCO").ringBonds.every((b) => !b)).toBe(true);
  });
});

describe("hillFormula", () => {
  it("orders C, H, then alphabetical", () => {
    expect(hillFormula({ O: 2, C: 1, H: 4 })).toBe("CH4O2");
    expect(hillFormula({ Cl: 3, C: 1, H: 1 })).toBe("CHCl3");
  });
});
