import { describe, it, expect } from "vitest";
import { oxidationStates, combineIons, CATIONS, ANIONS, electronConfiguration } from "./inorganic";

const ox = (formula: string, charge = 0) => {
  const r = oxidationStates(formula, charge);
  if ("error" in r) throw new Error(r.error);
  return Object.fromEntries(r.states.map((s) => [s.element, s.oxidation]));
};

describe("oxidationStates", () => {
  it("H2O: H +1, O −2", () => {
    expect(ox("H2O")).toEqual({ H: 1, O: -2 });
  });
  it("H2SO4: S is +6", () => {
    expect(ox("H2SO4").S).toBe(6);
  });
  it("KMnO4: Mn is +7", () => {
    expect(ox("KMnO4").Mn).toBe(7);
  });
  it("Fe2O3: Fe is +3", () => {
    expect(ox("Fe2O3").Fe).toBe(3);
  });
  it("K2Cr2O7: Cr is +6", () => {
    expect(ox("K2Cr2O7").Cr).toBe(6);
  });
  it("solves for an ion charge (SO4^2- → S +6)", () => {
    expect(ox("SO4", -2).S).toBe(6);
  });
  it("peroxide H2O2: O is −1", () => {
    expect(ox("H2O2").O).toBe(-1);
  });
  it("elemental O2: O is 0", () => {
    expect(ox("O2").O).toBe(0);
  });
});

describe("combineIons", () => {
  const cat = (f: string) => CATIONS.find((c) => c.formula === f)!;
  const an = (f: string) => ANIONS.find((a) => a.formula === f)!;

  it("Na + Cl → NaCl", () => {
    const r = combineIons(cat("Na"), an("Cl"));
    expect(r.formula).toBe("NaCl");
    expect(r.name).toBe("sodium chloride");
  });
  it("Ca + Cl → CaCl2", () => {
    expect(combineIons(cat("Ca"), an("Cl")).formula).toBe("CaCl2");
  });
  it("Al + O → Al2O3", () => {
    expect(combineIons(cat("Al"), an("O")).formula).toBe("Al2O3");
  });
  it("Ca + OH → Ca(OH)2 (polyatomic gets parentheses)", () => {
    expect(combineIons(cat("Ca"), an("OH")).formula).toBe("Ca(OH)2");
  });
  it("NH4 + SO4 → (NH4)2SO4", () => {
    const r = combineIons(cat("NH4"), an("SO4"));
    expect(r.formula).toBe("(NH4)2SO4");
    expect(r.name).toBe("ammonium sulfate");
  });
  it("Al + PO4 → AlPO4 (charges cancel 3:3 → 1:1)", () => {
    expect(combineIons(cat("Al"), an("PO4")).formula).toBe("AlPO4");
  });
});

describe("electronConfiguration", () => {
  const cfg = (z: number) => {
    const r = electronConfiguration(z);
    if ("error" in r) throw new Error(r.error);
    return r;
  };

  it("hydrogen", () => {
    expect(cfg(1).full).toBe("1s¹");
    expect(cfg(1).valenceElectrons).toBe(1);
  });
  it("carbon", () => {
    expect(cfg(6).full).toBe("1s² 2s² 2p²");
    expect(cfg(6).condensed).toBe("[He] 2s² 2p²");
    expect(cfg(6).valenceElectrons).toBe(4);
  });
  it("oxygen shells are 2, 6", () => {
    expect(cfg(8).shells).toEqual([2, 6]);
  });
  it("iron uses the [Ar] core and 4s before 3d", () => {
    const c = cfg(26);
    expect(c.condensed.startsWith("[Ar]")).toBe(true);
    expect(c.condensed).toContain("4s²");
    expect(c.condensed).toContain("3d⁶");
  });
  it("sodium condensed is [Ne] 3s¹", () => {
    expect(cfg(11).condensed).toBe("[Ne] 3s¹");
  });
  it("rejects out-of-range Z", () => {
    expect("error" in electronConfiguration(0)).toBe(true);
    expect("error" in electronConfiguration(200)).toBe(true);
  });
});
