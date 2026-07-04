import { describe, it, expect } from "vitest";
import {
  parseFormula, molarMass, balanceEquation, phFromH, acidBase,
  molesFromMass, massFromMoles, molarity,
} from "./chemistry";

describe("parseFormula", () => {
  it("parses simple formulas", () => {
    expect(parseFormula("H2O").counts).toEqual({ H: 2, O: 1 });
    expect(parseFormula("CO2").counts).toEqual({ C: 1, O: 2 });
  });
  it("parses parentheses with multipliers", () => {
    expect(parseFormula("Ca(OH)2").counts).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("Al2(SO4)3").counts).toEqual({ Al: 2, S: 3, O: 12 });
  });
  it("parses hydrates", () => {
    const r = parseFormula("CuSO4·5H2O");
    expect(r.counts).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });
  it("flags unknown elements", () => {
    expect(parseFormula("Xx2").ok).toBe(false);
  });
});

describe("molarMass", () => {
  it("computes water ≈ 18.015", () => {
    expect(molarMass("H2O")).toBeCloseTo(18.015, 2);
  });
  it("computes glucose C6H12O6 ≈ 180.156", () => {
    expect(molarMass("C6H12O6")).toBeCloseTo(180.156, 1);
  });
  it("computes calcium carbonate CaCO3 ≈ 100.086", () => {
    expect(molarMass("CaCO3")).toBeCloseTo(100.086, 1);
  });
  it("returns null for invalid formulas", () => {
    expect(molarMass("Zz")).toBeNull();
  });
});

describe("balanceEquation", () => {
  const bal = (eq: string) => {
    const r = balanceEquation(eq);
    if (!r.ok) throw new Error(r.error);
    return r.coefficients;
  };

  it("balances H2 + O2 -> H2O", () => {
    expect(bal("H2 + O2 -> H2O")).toEqual([2, 1, 2]);
  });
  it("balances combustion of methane", () => {
    expect(bal("CH4 + O2 -> CO2 + H2O")).toEqual([1, 2, 1, 2]);
  });
  it("balances Fe + O2 -> Fe2O3", () => {
    expect(bal("Fe + O2 -> Fe2O3")).toEqual([4, 3, 2]);
  });
  it("balances a neutralisation", () => {
    expect(bal("HCl + NaOH -> NaCl + H2O")).toEqual([1, 1, 1, 1]);
  });
  it("balances photosynthesis-like CO2 + H2O -> C6H12O6 + O2", () => {
    expect(bal("CO2 + H2O -> C6H12O6 + O2")).toEqual([6, 6, 1, 6]);
  });
  it("balances aluminium + oxygen", () => {
    expect(bal("Al + O2 -> Al2O3")).toEqual([4, 3, 2]);
  });
  it("returns the balanced string", () => {
    const r = balanceEquation("H2 + O2 -> H2O");
    if (!r.ok) throw new Error("should balance");
    expect(r.balanced).toContain("2H2");
    expect(r.balanced).toContain("→");
  });
  it("errors without an arrow", () => {
    const r = balanceEquation("H2 O2 H2O");
    expect(r.ok).toBe(false);
  });
  it("errors on a bad formula", () => {
    const r = balanceEquation("Zz -> Xx");
    expect(r.ok).toBe(false);
  });
});

describe("pH / acid-base", () => {
  it("pH of 1e-7 is ~7", () => {
    expect(phFromH(1e-7)).toBeCloseTo(7, 5);
  });
  it("pH 3 is acidic with pOH 11", () => {
    const r = acidBase(3);
    expect(r.classification).toBe("acidic");
    expect(r.pOH).toBeCloseTo(11, 5);
  });
  it("pH 7 is neutral, pH 10 basic", () => {
    expect(acidBase(7).classification).toBe("neutral");
    expect(acidBase(10).classification).toBe("basic");
  });
});

describe("stoichiometry", () => {
  it("moles from mass of water", () => {
    expect(molesFromMass(18.015, "H2O")).toBeCloseTo(1, 2);
  });
  it("mass from moles", () => {
    expect(massFromMoles(2, "H2O")).toBeCloseTo(36.03, 1);
  });
  it("molarity", () => {
    expect(molarity(0.5, 2)).toBe(0.25);
    expect(molarity(1, 0)).toBe(0);
  });
});
