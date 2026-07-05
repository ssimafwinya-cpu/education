import { describe, it, expect } from "vitest";
import { descriptorsFromSmiles, lipinski } from "./descriptors";

describe("describeMolecule — donors, acceptors, rings", () => {
  it("ethanol CCO: 1 donor, 1 acceptor, no rings", () => {
    const d = descriptorsFromSmiles("CCO");
    expect(d.formula).toBe("C2H6O");
    expect(d.hBondDonors).toBe(1);
    expect(d.hBondAcceptors).toBe(1);
    expect(d.rotatableBonds).toBe(0); // both bonds touch a terminal atom
    expect(d.ringCount).toBe(0);
    expect(d.heavyAtoms).toBe(3);
  });

  it("benzene c1ccccc1: one ring, aromatic atoms, no donors", () => {
    const d = descriptorsFromSmiles("c1ccccc1");
    expect(d.ringCount).toBe(1);
    expect(d.aromaticAtoms).toBe(6);
    expect(d.hBondDonors).toBe(0);
    expect(d.hBondAcceptors).toBe(0);
    expect(d.degreeOfUnsaturation).toBe(4);
  });

  it("acetic acid CC(=O)O: 1 donor (OH), 2 acceptors (2 O)", () => {
    const d = descriptorsFromSmiles("CC(=O)O");
    expect(d.hBondDonors).toBe(1);
    expect(d.hBondAcceptors).toBe(2);
  });
});

describe("rotatable bonds", () => {
  it("ethane CC: none", () => {
    expect(descriptorsFromSmiles("CC").rotatableBonds).toBe(0);
  });
  it("butane CCCC: the central C–C only", () => {
    expect(descriptorsFromSmiles("CCCC").rotatableBonds).toBe(1);
  });
  it("excludes the amide C–N bond (CC(=O)NCC → 1, not 2)", () => {
    const d = descriptorsFromSmiles("CC(=O)NCC");
    expect(d.rotatableBonds).toBe(1); // only N–CH2; the carbonyl C–N is excluded
  });
});

describe("aspirin descriptors", () => {
  const d = descriptorsFromSmiles("CC(=O)Oc1ccccc1C(=O)O");
  it("has the right formula and mass", () => {
    expect(d.formula).toBe("C9H8O4");
    expect(d.molarMass).toBeCloseTo(180.159, 1);
  });
  it("1 donor (carboxyl OH), 4 acceptors (4 O), one ring", () => {
    expect(d.hBondDonors).toBe(1);
    expect(d.hBondAcceptors).toBe(4);
    expect(d.ringCount).toBe(1);
  });
});

describe("lipinski", () => {
  it("aspirin passes all three graph-derivable criteria", () => {
    const l = lipinski(descriptorsFromSmiles("CC(=O)Oc1ccccc1C(=O)O"));
    expect(l.passes).toBe(true);
    expect(l.violations).toBe(0);
  });
  it("flags a heavy, donor-rich sugar chain", () => {
    // sucrose-like polyol: many O–H donors and O acceptors
    const l = lipinski(descriptorsFromSmiles("OCC(O)C(O)C(O)C(O)CO"));
    // 6 OH donors > 5 → at least one violation
    expect(l.criteria.find((c) => c.label === "H-bond donors")!.ok).toBe(false);
    expect(l.passes).toBe(false);
  });
});
