// ─── Molecule sketch model ───────────────────────────────────────────────────
// Converts a hand-drawn sketch (positioned atoms + bonds) into the Molecule
// graph consumed by analyzeMolecule / detectFunctionalGroups / iupacName, and
// validates valences so the UI can flag impossible structures instead of
// silently reporting a wrong formula.

import type { Molecule } from "./smiles";

export interface SketchAtom { x: number; y: number; element: string; }
export interface SketchBond { a: number; b: number; order: 1 | 2 | 3; }

/** Elements the sketcher offers (all have standard valences in the engine). */
export const SKETCH_ELEMENTS = ["C", "N", "O", "S", "P", "F", "Cl", "Br", "I"] as const;

/** Highest standard neutral valence — bonds beyond this are chemically impossible. */
const MAX_VALENCE: Record<string, number> = {
  C: 4, N: 3, O: 2, S: 6, P: 5, F: 1, Cl: 1, Br: 1, I: 1, B: 3,
};

export function sketchToMolecule(atoms: SketchAtom[], bonds: SketchBond[]): Molecule {
  return {
    atoms: atoms.map((a, i) => ({
      index: i, element: a.element, aromatic: false, charge: 0, bracketH: null, isBracket: false,
    })),
    bonds: bonds.map((b) => ({ a: b.a, b: b.b, order: b.order, aromatic: false })),
  };
}

/** Human-readable warnings for over-valent atoms (1-based atom numbers). */
export function validateSketch(atoms: SketchAtom[], bonds: SketchBond[]): string[] {
  const sums = new Array(atoms.length).fill(0);
  for (const b of bonds) { sums[b.a] += b.order; sums[b.b] += b.order; }
  const warnings: string[] = [];
  atoms.forEach((a, i) => {
    const max = MAX_VALENCE[a.element] ?? 4;
    if (sums[i] > max) warnings.push(`Atom ${i + 1} (${a.element}) has ${sums[i]} bonds — its maximum valence is ${max}.`);
  });
  return warnings;
}

/** Sum of bond orders at one atom (used by the UI to stop impossible bonds early). */
export function bondOrderSum(bonds: SketchBond[], atom: number): number {
  return bonds.reduce((s, b) => s + (b.a === atom || b.b === atom ? b.order : 0), 0);
}

export function maxValence(element: string): number {
  return MAX_VALENCE[element] ?? 4;
}

/** Remove an atom, its bonds, and reindex the remaining bonds. */
export function removeAtom(atoms: SketchAtom[], bonds: SketchBond[], idx: number): { atoms: SketchAtom[]; bonds: SketchBond[] } {
  const nextAtoms = atoms.filter((_, i) => i !== idx);
  const nextBonds = bonds
    .filter((b) => b.a !== idx && b.b !== idx)
    .map((b) => ({ ...b, a: b.a > idx ? b.a - 1 : b.a, b: b.b > idx ? b.b - 1 : b.b }));
  return { atoms: nextAtoms, bonds: nextBonds };
}
