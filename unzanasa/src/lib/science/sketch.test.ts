import { describe, it, expect } from "vitest";
import { sketchToMolecule, validateSketch, bondOrderSum, removeAtom, type SketchAtom, type SketchBond } from "./sketch";
import { analyzeMolecule } from "./smiles";
import { iupacName } from "./iupac";

const C = (x: number): SketchAtom => ({ x, y: 0, element: "C" });
const at = (element: string, x = 0): SketchAtom => ({ x, y: 0, element });

describe("sketchToMolecule + analyzeMolecule", () => {
  it("hand-drawn ethanol gives C2H6O and the name ethanol", () => {
    const atoms = [C(0), C(20), at("O", 40)];
    const bonds: SketchBond[] = [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }];
    const info = analyzeMolecule(sketchToMolecule(atoms, bonds));
    expect(info.formula).toBe("C2H6O");
    const nm = iupacName(info);
    expect("name" in nm && nm.name).toBe("ethanol");
  });

  it("a drawn double bond counts toward the formula (ethene C2H4)", () => {
    const info = analyzeMolecule(sketchToMolecule([C(0), C(20)], [{ a: 0, b: 1, order: 2 }]));
    expect(info.formula).toBe("C2H4");
    expect(info.degreeOfUnsaturation).toBe(1);
  });

  it("a drawn ring is detected (cyclopropane)", () => {
    const atoms = [C(0), C(20), C(10)];
    const bonds: SketchBond[] = [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 0, order: 1 }];
    const info = analyzeMolecule(sketchToMolecule(atoms, bonds));
    expect(info.formula).toBe("C3H6");
    expect(info.ringAtoms.every(Boolean)).toBe(true);
  });
});

describe("validateSketch", () => {
  it("flags a five-bonded carbon", () => {
    const atoms = [C(0), C(1), C(2), C(3), C(4), C(5)];
    const bonds: SketchBond[] = [1, 2, 3, 4, 5].map((b) => ({ a: 0, b, order: 1 as const }));
    const warnings = validateSketch(atoms, bonds);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("maximum valence is 4");
  });
  it("accepts a valid structure silently", () => {
    expect(validateSketch([C(0), at("O", 1)], [{ a: 0, b: 1, order: 2 }])).toHaveLength(0);
  });
  it("flags oxygen with three bonds", () => {
    const atoms = [at("O"), C(1), C(2), C(3)];
    const bonds: SketchBond[] = [1, 2, 3].map((b) => ({ a: 0, b, order: 1 as const }));
    expect(validateSketch(atoms, bonds)).toHaveLength(1);
  });
});

describe("bondOrderSum / removeAtom", () => {
  it("sums bond orders at an atom", () => {
    const bonds: SketchBond[] = [{ a: 0, b: 1, order: 2 }, { a: 2, b: 0, order: 1 }];
    expect(bondOrderSum(bonds, 0)).toBe(3);
    expect(bondOrderSum(bonds, 1)).toBe(2);
  });
  it("removes an atom and reindexes bonds", () => {
    const atoms = [C(0), C(1), C(2)];
    const bonds: SketchBond[] = [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }];
    const r = removeAtom(atoms, bonds, 0);
    expect(r.atoms).toHaveLength(2);
    expect(r.bonds).toEqual([{ a: 0, b: 1, order: 1 }]);
  });
});
