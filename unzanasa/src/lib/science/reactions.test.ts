import { describe, it, expect } from "vitest";
import { limitingReagent, percentYield, empiricalFormula, idealGas, weakAcidPH, pKa } from "./reactions";

describe("limitingReagent", () => {
  it("finds the limiting reagent and product yield (H2 + O2 -> H2O)", () => {
    const r = limitingReagent("H2 + O2 -> H2O", [
      { formula: "H2", value: 4, unit: "mol" },
      { formula: "O2", value: 4, unit: "mol" },
    ]);
    if ("error" in r) throw new Error(r.error);
    // coefficients 2,1,2 → extent H2 = 4/2 = 2, O2 = 4/1 = 4 → H2 limits
    expect(r.limiting).toBe("H2");
    expect(r.extent).toBe(2);
    expect(r.products[0].moles).toBe(4); // 2 × 2
  });

  it("works with masses (N2 + 3H2 -> 2NH3)", () => {
    const r = limitingReagent("N2 + H2 -> NH3", [
      { formula: "N2", value: 28.014, unit: "g" }, // ~1 mol
      { formula: "H2", value: 10, unit: "g" },     // ~4.96 mol
    ]);
    if ("error" in r) throw new Error(r.error);
    // N2: 1/1 = 1 ; H2: 4.96/3 = 1.65 → N2 limits
    expect(r.limiting).toBe("N2");
    const nh3 = r.products.find((p) => p.formula === "NH3")!;
    expect(nh3.moles).toBeCloseTo(2, 1); // 2 × extent(1)
    expect(nh3.grams).toBeCloseTo(34, 0);
  });

  it("errors if a reactant amount is missing", () => {
    const r = limitingReagent("H2 + O2 -> H2O", [{ formula: "H2", value: 1, unit: "mol" }]);
    expect("error" in r).toBe(true);
  });
});

describe("percentYield", () => {
  it("computes percent yield", () => {
    expect(percentYield(8, 10)).toBe(80);
    expect(percentYield(5, 0)).toBeNull();
  });
});

describe("empiricalFormula", () => {
  it("water from mass percent", () => {
    const r = empiricalFormula({ H: 11.19, O: 88.81 });
    if ("error" in r) throw new Error(r.error);
    expect(r.empirical).toBe("H2O");
  });

  it("benzene: CH empirical, C6H6 molecular from molar mass", () => {
    const r = empiricalFormula({ C: 92.3, H: 7.7 }, 78);
    if ("error" in r) throw new Error(r.error);
    expect(r.empirical).toBe("CH");
    expect(r.molecular).toBe("C6H6");
    expect(r.multiple).toBe(6);
  });

  it("glucose: CH2O empirical", () => {
    const r = empiricalFormula({ C: 40, H: 6.7, O: 53.3 }, 180);
    if ("error" in r) throw new Error(r.error);
    expect(r.empirical).toBe("CH2O");
    expect(r.molecular).toBe("C6H12O6");
  });

  it("handles a 1.5 ratio that scales to whole numbers", () => {
    // Fe2O3: Fe 69.9%, O 30.1% → Fe:O = 1:1.5 → Fe2O3
    const r = empiricalFormula({ Fe: 69.9, O: 30.1 });
    if ("error" in r) throw new Error(r.error);
    expect(r.empirical).toBe("Fe2O3");
  });
});

describe("idealGas", () => {
  it("solves for V (n=1, T=273.15, P=101.325 kPa → ~22.4 L)", () => {
    const r = idealGas({ P: 101.325, n: 1, T: 273.15 });
    if ("error" in r) throw new Error(r.error);
    expect(r.solvedFor).toBe("V");
    expect(r.V).toBeCloseTo(22.41, 1);
  });
  it("solves for n", () => {
    const r = idealGas({ P: 101.325, V: 22.414, T: 273.15 });
    if ("error" in r) throw new Error(r.error);
    expect(r.solvedFor).toBe("n");
    expect(r.n).toBeCloseTo(1, 2);
  });
  it("requires exactly three knowns", () => {
    expect("error" in idealGas({ P: 100, V: 1 })).toBe(true);
  });
});

describe("weakAcidPH", () => {
  it("0.1 M acetic acid (Ka 1.8e-5) → pH ≈ 2.87", () => {
    const r = weakAcidPH(1.8e-5, 0.1);
    if ("error" in r) throw new Error(r.error);
    expect(r.pH).toBeCloseTo(2.87, 1);
    expect(r.percentIonised).toBeCloseTo(1.33, 0);
  });
  it("rejects non-positive inputs", () => {
    expect("error" in weakAcidPH(0, 0.1)).toBe(true);
  });
  it("pKa of acetic acid ≈ 4.74", () => {
    expect(pKa(1.8e-5)).toBeCloseTo(4.74, 1);
  });
});
