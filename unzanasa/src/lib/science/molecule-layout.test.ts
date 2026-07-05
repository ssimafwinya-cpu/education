import { describe, it, expect } from "vitest";
import { parseSmiles } from "./smiles";
import { layoutMolecule, fitToBox } from "./molecule-layout";

function bondLengths(smiles: string) {
  const mol = parseSmiles(smiles);
  const pts = layoutMolecule(mol, 600);
  return mol.bonds.map((b) => Math.hypot(pts[b.a].x - pts[b.b].x, pts[b.a].y - pts[b.b].y));
}

describe("layoutMolecule", () => {
  it("places every atom", () => {
    const pts = layoutMolecule(parseSmiles("CCO"));
    expect(pts).toHaveLength(3);
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it("is deterministic (same input → same output)", () => {
    const a = layoutMolecule(parseSmiles("CC(=O)O"));
    const b = layoutMolecule(parseSmiles("CC(=O)O"));
    expect(a).toEqual(b);
  });

  it("relaxes bonds to roughly uniform length", () => {
    const lens = bondLengths("CCCCCC");
    const mean = lens.reduce((s, x) => s + x, 0) / lens.length;
    // every bond within 40% of the mean — no collapsed or stretched bonds
    expect(lens.every((l) => l > mean * 0.6 && l < mean * 1.4)).toBe(true);
  });

  it("draws a benzene ring without atoms collapsing together", () => {
    const mol = parseSmiles("c1ccccc1");
    const pts = layoutMolecule(mol, 800);
    // minimum pairwise distance should be a meaningful fraction of a bond
    let minD = Infinity;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        minD = Math.min(minD, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    expect(minD).toBeGreaterThan(0.4);
  });

  it("handles a single atom", () => {
    expect(layoutMolecule(parseSmiles("O"))).toHaveLength(1);
  });
});

describe("fitToBox", () => {
  it("maps coordinates inside the padded box", () => {
    const fitted = fitToBox(layoutMolecule(parseSmiles("CCCCCC")), 300, 30);
    expect(fitted.every((p) => p.x >= 29 && p.x <= 271 && p.y >= 29 && p.y <= 271)).toBe(true);
  });
  it("centres a single atom", () => {
    expect(fitToBox([{ x: 5, y: 5 }], 300)).toEqual([{ x: 150, y: 150 }]);
  });
});
