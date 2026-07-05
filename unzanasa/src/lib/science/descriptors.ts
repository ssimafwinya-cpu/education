// ─── Molecular descriptors & drug-likeness ───────────────────────────────────
// Computes the standard graph-derivable descriptors from a parsed SMILES
// molecule (molar mass, H-bond donors/acceptors, rotatable bonds, ring count,
// heavy atoms) and evaluates Lipinski's Rule of Five. Everything here is a
// rigorous count over the molecule graph — nothing is estimated or fabricated.
//
// Note on logP: a reliable octanol/water logP needs an atom-typing model
// (Crippen/Wildman) beyond the scope of this graph, so it is intentionally not
// reported rather than guessed. Lipinski is evaluated on the three criteria we
// can derive exactly.

import { fromSmiles, type MoleculeInfo } from "./smiles";

export interface Descriptors {
  formula: string;
  molarMass: number;
  heavyAtoms: number;
  hBondDonors: number; // Lipinski: H attached to N or O
  hBondAcceptors: number; // Lipinski: count of N and O atoms
  rotatableBonds: number; // non-ring single bonds between two non-terminal heavy atoms, amide C–N excluded
  ringCount: number; // cyclomatic (SSSR count)
  aromaticAtoms: number;
  degreeOfUnsaturation: number | null;
}

export interface Lipinski {
  passes: boolean;
  violations: number;
  criteria: { label: string; value: number; limit: string; ok: boolean }[];
}

/** Degree of each atom = number of heavy-atom bonds it participates in. */
function heavyDegrees(mol: MoleculeInfo): number[] {
  const deg = new Array(mol.atoms.length).fill(0);
  for (const b of mol.bonds) { deg[b.a]++; deg[b.b]++; }
  return deg;
}

/** True if `c` is a carbonyl carbon (carbon double-bonded to oxygen). */
function isCarbonylCarbon(mol: MoleculeInfo, c: number): boolean {
  if (mol.atoms[c].element !== "C") return false;
  return mol.bonds.some(
    (b) => b.order === 2 &&
      ((b.a === c && mol.atoms[b.b].element === "O") ||
       (b.b === c && mol.atoms[b.a].element === "O")),
  );
}

export function describeMolecule(mol: MoleculeInfo): Descriptors {
  const deg = heavyDegrees(mol);

  let hBondDonors = 0;
  let hBondAcceptors = 0;
  let aromaticAtoms = 0;
  mol.atoms.forEach((a, i) => {
    if (a.element === "N" || a.element === "O") {
      hBondAcceptors++;
      hBondDonors += mol.hydrogens[i]; // number of N–H / O–H hydrogens
    }
    if (a.aromatic) aromaticAtoms++;
  });

  // Rotatable bonds: single, acyclic, both ends non-terminal (heavy degree ≥ 2),
  // excluding the C–N bond of an amide (restricted rotation).
  let rotatableBonds = 0;
  mol.bonds.forEach((b, i) => {
    if (b.order !== 1 || b.aromatic || mol.ringBonds[i]) return;
    if (deg[b.a] < 2 || deg[b.b] < 2) return;
    const els = [mol.atoms[b.a].element, mol.atoms[b.b].element];
    if (els.includes("C") && els.includes("N")) {
      const carbon = mol.atoms[b.a].element === "C" ? b.a : b.b;
      if (isCarbonylCarbon(mol, carbon)) return; // amide C–N
    }
    rotatableBonds++;
  });

  // Ring count via the cyclomatic number: E − V + connected components.
  const components = countComponents(mol);
  const ringCount = mol.bonds.length - mol.atoms.length + components;

  return {
    formula: mol.formula,
    molarMass: mol.mass,
    heavyAtoms: mol.atoms.length,
    hBondDonors,
    hBondAcceptors,
    rotatableBonds,
    ringCount,
    aromaticAtoms,
    degreeOfUnsaturation: mol.degreeOfUnsaturation,
  };
}

function countComponents(mol: MoleculeInfo): number {
  const seen = new Array(mol.atoms.length).fill(false);
  const adj: number[][] = mol.atoms.map(() => []);
  for (const b of mol.bonds) { adj[b.a].push(b.b); adj[b.b].push(b.a); }
  let components = 0;
  for (let start = 0; start < mol.atoms.length; start++) {
    if (seen[start]) continue;
    components++;
    const stack = [start];
    seen[start] = true;
    while (stack.length) {
      const n = stack.pop()!;
      for (const m of adj[n]) if (!seen[m]) { seen[m] = true; stack.push(m); }
    }
  }
  return components;
}

/** Lipinski's Rule of Five (three graph-derivable criteria + count). */
export function lipinski(d: Descriptors): Lipinski {
  const criteria = [
    { label: "Molar mass", value: d.molarMass, limit: "≤ 500 g/mol", ok: d.molarMass <= 500 },
    { label: "H-bond donors", value: d.hBondDonors, limit: "≤ 5", ok: d.hBondDonors <= 5 },
    { label: "H-bond acceptors", value: d.hBondAcceptors, limit: "≤ 10", ok: d.hBondAcceptors <= 10 },
  ];
  const violations = criteria.filter((c) => !c.ok).length;
  return { passes: violations === 0, violations, criteria };
}

/** Convenience: SMILES → descriptors. */
export function descriptorsFromSmiles(smiles: string): Descriptors {
  return describeMolecule(fromSmiles(smiles));
}
