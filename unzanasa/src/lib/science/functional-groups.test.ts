import { describe, it, expect } from "vitest";
import { fromSmiles } from "./smiles";
import { detectFunctionalGroups } from "./functional-groups";

const groups = (smiles: string) => detectFunctionalGroups(fromSmiles(smiles)).map((g) => g.name);

describe("detectFunctionalGroups", () => {
  it("ethanol → alcohol", () => {
    expect(groups("CCO")).toContain("Alcohol (hydroxyl)");
  });
  it("acetic acid → carboxylic acid (not alcohol/ketone)", () => {
    const g = groups("CC(=O)O");
    expect(g).toContain("Carboxylic acid");
    expect(g).not.toContain("Alcohol (hydroxyl)");
    expect(g).not.toContain("Ketone");
  });
  it("acetone → ketone", () => {
    const g = groups("CC(=O)C");
    expect(g).toContain("Ketone");
    expect(g).not.toContain("Aldehyde");
  });
  it("acetaldehyde → aldehyde", () => {
    expect(groups("CC=O")).toContain("Aldehyde");
  });
  it("ethyl acetate → ester", () => {
    const g = groups("CC(=O)OCC");
    expect(g).toContain("Ester");
    expect(g).not.toContain("Carboxylic acid");
    expect(g).not.toContain("Ether");
  });
  it("acetamide → amide (not amine)", () => {
    const g = groups("CC(=O)N");
    expect(g).toContain("Amide");
    expect(g.some((x) => x.includes("amine"))).toBe(false);
  });
  it("diethyl ether → ether", () => {
    expect(groups("CCOCC")).toContain("Ether");
  });
  it("aniline → primary amine + aromatic ring", () => {
    const g = groups("Nc1ccccc1");
    expect(g).toContain("Primary amine");
    expect(g).toContain("Aromatic ring");
  });
  it("phenol → phenol + aromatic ring (not plain alcohol)", () => {
    const g = groups("Oc1ccccc1");
    expect(g).toContain("Phenol");
    expect(g).not.toContain("Alcohol (hydroxyl)");
  });
  it("acetonitrile → nitrile", () => {
    expect(groups("CC#N")).toContain("Nitrile");
  });
  it("ethene → alkene, ethyne → alkyne", () => {
    expect(groups("C=C")).toContain("Alkene (C=C)");
    expect(groups("C#C")).toContain("Alkyne (C≡C)");
  });
  it("chloroethane → halide", () => {
    expect(groups("CCCl")).toContain("Halide (Cl)");
  });
  it("benzene → aromatic ring only", () => {
    expect(groups("c1ccccc1")).toEqual(["Aromatic ring"]);
  });
  it("aspirin → ester + carboxylic acid + aromatic ring", () => {
    const g = groups("CC(=O)Oc1ccccc1C(=O)O");
    expect(g).toContain("Ester");
    expect(g).toContain("Carboxylic acid");
    expect(g).toContain("Aromatic ring");
  });
  it("secondary amine classified by substitution", () => {
    expect(groups("CNC")).toContain("Secondary amine");
    expect(groups("CN(C)C")).toContain("Tertiary amine");
  });
  it("a pure alkane has no functional groups", () => {
    expect(groups("CCCC")).toEqual([]);
  });
});
