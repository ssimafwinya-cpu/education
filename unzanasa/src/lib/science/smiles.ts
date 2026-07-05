// ─── SMILES engine ───────────────────────────────────────────────────────────
// Parses SMILES (Simplified Molecular Input Line Entry System) into a molecule
// graph, then computes implicit hydrogens, the Hill molecular formula, molar
// mass, degree of unsaturation and ring membership. Pure and unit-tested.
//
// Supported subset (covers the vast majority of undergraduate structures):
//   · organic-subset atoms  B C N O P S F Cl Br I  (aromatic: b c n o p s)
//   · bracket atoms          [NH4+] [O-] [nH] [Fe+3]  (element, H count, charge)
//   · bonds                  -  =  #  :  and / \ (treated as single)
//   · branches               ( ... )
//   · ring closures          digits and %nn
//   · disconnected parts     .

import { atomicMass } from "./periodic-table";

export interface Atom {
  index: number;
  element: string;
  aromatic: boolean;
  charge: number;
  /** Explicit H from a bracket atom, or null for implicit-by-valence. */
  bracketH: number | null;
  isBracket: boolean;
}

export interface Bond {
  a: number;
  b: number;
  order: number; // 1,2,3
  aromatic: boolean;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
}

export interface MoleculeInfo extends Molecule {
  /** implicit + explicit H count per atom index. */
  hydrogens: number[];
  formula: string;
  counts: Record<string, number>;
  mass: number;
  degreeOfUnsaturation: number | null;
  /** bond index → is it in a ring (non-bridge). */
  ringBonds: boolean[];
  ringAtoms: boolean[];
}

const ORGANIC_SUBSET = new Set(["B", "C", "N", "O", "P", "S", "F", "Cl", "Br", "I"]);
const AROMATIC_ATOMS = new Set(["b", "c", "n", "o", "p", "s"]);

// Standard neutral valences (smallest satisfying the bond sum is chosen).
const VALENCES: Record<string, number[]> = {
  H: [1], B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6],
  F: [1], Cl: [1], Br: [1], I: [1],
};

export class SmilesError extends Error {}

/** Parse a SMILES string into a molecule graph. Throws SmilesError on bad input. */
export function parseSmiles(smiles: string): Molecule {
  const s = smiles.trim();
  if (!s) throw new SmilesError("Empty SMILES");

  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const branchStack: number[] = [];
  const ringBonds: Record<string, { atom: number; order: number }> = {};
  let prevAtom: number | null = null;
  let pendingBond: { order: number; aromatic: boolean } | null = null;
  let i = 0;

  const addBond = (a: number, b: number, order: number, aromatic: boolean) => {
    if (a === b) throw new SmilesError("Atom bonded to itself");
    if (bonds.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)))
      throw new SmilesError("Duplicate bond");
    bonds.push({ a, b, order, aromatic });
  };

  const connect = (to: number) => {
    if (prevAtom !== null) {
      const aromatic = pendingBond?.aromatic ?? (atoms[prevAtom].aromatic && atoms[to].aromatic);
      const order = pendingBond?.order ?? (aromatic ? 1 : 1);
      addBond(prevAtom, to, order, aromatic);
    }
    pendingBond = null;
  };

  const pushAtom = (element: string, aromatic: boolean, charge: number, bracketH: number | null, isBracket: boolean) => {
    const atom: Atom = { index: atoms.length, element, aromatic, charge, bracketH, isBracket };
    atoms.push(atom);
    connect(atom.index);
    prevAtom = atom.index;
  };

  while (i < s.length) {
    const c = s[i];

    if (c === "(") { if (prevAtom === null) throw new SmilesError("Branch before any atom"); branchStack.push(prevAtom); i++; continue; }
    if (c === ")") { const p = branchStack.pop(); if (p === undefined) throw new SmilesError("Unbalanced ')'"); prevAtom = p; i++; continue; }
    if (c === ".") { prevAtom = null; pendingBond = null; i++; continue; }

    if (c === "-") { pendingBond = { order: 1, aromatic: false }; i++; continue; }
    if (c === "=") { pendingBond = { order: 2, aromatic: false }; i++; continue; }
    if (c === "#") { pendingBond = { order: 3, aromatic: false }; i++; continue; }
    if (c === ":") { pendingBond = { order: 1, aromatic: true }; i++; continue; }
    if (c === "/" || c === "\\") { pendingBond = { order: 1, aromatic: false }; i++; continue; }

    // Ring closure: digit or %nn
    if (/[0-9]/.test(c) || c === "%") {
      let ringNum: string;
      if (c === "%") { ringNum = s.slice(i + 1, i + 3); if (!/^\d\d$/.test(ringNum)) throw new SmilesError("Bad %nn ring"); i += 3; }
      else { ringNum = c; i++; }
      if (prevAtom === null) throw new SmilesError("Ring bond before any atom");
      const open = ringBonds[ringNum];
      if (open) {
        const aromatic = pendingBond?.aromatic ?? (atoms[open.atom].aromatic && atoms[prevAtom].aromatic);
        const order = pendingBond?.order ?? open.order ?? 1;
        addBond(open.atom, prevAtom, order, aromatic);
        delete ringBonds[ringNum];
      } else {
        ringBonds[ringNum] = { atom: prevAtom, order: pendingBond?.order ?? 1 };
      }
      pendingBond = null;
      continue;
    }

    // Bracket atom [ ... ]
    if (c === "[") {
      const close = s.indexOf("]", i);
      if (close === -1) throw new SmilesError("Unclosed '['");
      const inner = s.slice(i + 1, close);
      const parsed = parseBracket(inner);
      pushAtom(parsed.element, parsed.aromatic, parsed.charge, parsed.hCount, true);
      i = close + 1;
      continue;
    }

    // Organic-subset atom (two-letter Cl/Br first)
    const two = s.slice(i, i + 2);
    if (two === "Cl" || two === "Br") { pushAtom(two, false, 0, null, false); i += 2; continue; }
    if (/[A-Z]/.test(c)) {
      if (!ORGANIC_SUBSET.has(c)) throw new SmilesError(`Atom '${c}' must be written in brackets, e.g. [${c}]`);
      pushAtom(c, false, 0, null, false); i++; continue;
    }
    if (AROMATIC_ATOMS.has(c)) { pushAtom(c.toUpperCase(), true, 0, null, false); i++; continue; }

    throw new SmilesError(`Unexpected character '${c}'`);
  }

  if (branchStack.length) throw new SmilesError("Unbalanced '('");
  if (Object.keys(ringBonds).length) throw new SmilesError("Unclosed ring bond");
  if (atoms.length === 0) throw new SmilesError("No atoms parsed");

  return { atoms, bonds };
}

function parseBracket(inner: string): { element: string; aromatic: boolean; hCount: number; charge: number } {
  // [isotope? element Hn? charge?]  — isotope & stereo ignored.
  let rest = inner.replace(/^\d+/, ""); // drop isotope
  rest = rest.replace(/@+H?|@@/g, ""); // drop stereo markers
  const m = rest.match(/^([A-Z][a-z]?|[bcnops])/);
  if (!m) throw new SmilesError(`Bad bracket atom [${inner}]`);
  const raw = m[0];
  const aromatic = /^[bcnops]$/.test(raw);
  const element = aromatic ? raw.toUpperCase() : raw;
  rest = rest.slice(raw.length);

  let hCount = 0;
  const hm = rest.match(/H(\d*)/);
  if (hm) { hCount = hm[1] ? parseInt(hm[1], 10) : 1; rest = rest.replace(/H\d*/, ""); }

  let charge = 0;
  const cm = rest.match(/([+-])(\d*)/);
  if (cm) {
    const sign = cm[1] === "+" ? 1 : -1;
    charge = cm[2] ? sign * parseInt(cm[2], 10) : sign * (rest.match(/[+-]/g)?.length ?? 1);
  }
  return { element, aromatic, hCount, charge };
}

// ─── Analysis ────────────────────────────────────────────────────────────────

/** Sum of bond orders incident on an atom (aromatic counts as 1). */
function bondSum(mol: Molecule, atomIndex: number): { sum: number; aromatic: boolean } {
  let sum = 0;
  let aromatic = false;
  for (const b of mol.bonds) {
    if (b.a === atomIndex || b.b === atomIndex) {
      sum += b.order;
      if (b.aromatic) aromatic = true;
    }
  }
  return { sum, aromatic };
}

function implicitHydrogens(mol: Molecule): number[] {
  return mol.atoms.map((atom) => {
    if (atom.isBracket) return atom.bracketH ?? 0; // bracket atoms have no implicit H
    const { sum, aromatic } = bondSum(mol, atom.index);
    const effective = sum + (atom.aromatic || aromatic ? 1 : 0);
    const valences = VALENCES[atom.element] ?? [0];
    const v = valences.find((x) => x >= effective) ?? valences[valences.length - 1];
    return Math.max(0, v - effective);
  });
}

/** Bridge detection (Tarjan) → a bond is a ring bond iff it is NOT a bridge. */
function ringBonds(mol: Molecule): { ringBonds: boolean[]; ringAtoms: boolean[] } {
  const n = mol.atoms.length;
  const adj: { to: number; bond: number }[][] = Array.from({ length: n }, () => []);
  mol.bonds.forEach((b, i) => { adj[b.a].push({ to: b.b, bond: i }); adj[b.b].push({ to: b.a, bond: i }); });

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const isBridge = new Array(mol.bonds.length).fill(false);
  let timer = 0;

  const dfs = (u: number, parentBond: number) => {
    disc[u] = low[u] = timer++;
    for (const { to, bond } of adj[u]) {
      if (bond === parentBond) continue;
      if (disc[to] === -1) {
        dfs(to, bond);
        low[u] = Math.min(low[u], low[to]);
        if (low[to] > disc[u]) isBridge[bond] = true;
      } else {
        low[u] = Math.min(low[u], disc[to]);
      }
    }
  };
  for (let u = 0; u < n; u++) if (disc[u] === -1) dfs(u, -1);

  const rb = isBridge.map((b) => !b);
  const ra = new Array(n).fill(false);
  mol.bonds.forEach((b, i) => { if (rb[i]) { ra[b.a] = true; ra[b.b] = true; } });
  return { ringBonds: rb, ringAtoms: ra };
}

/** Hill-notation molecular formula: C, then H, then other elements alphabetically. */
export function hillFormula(counts: Record<string, number>): string {
  const keys = Object.keys(counts).filter((k) => counts[k] > 0);
  const ordered: string[] = [];
  if (counts.C) ordered.push("C");
  if (counts.H) ordered.push("H");
  ordered.push(...keys.filter((k) => k !== "C" && k !== "H").sort());
  return ordered.map((k) => (counts[k] === 1 ? k : `${k}${counts[k]}`)).join("");
}

/** Full analysis of a parsed molecule. */
export function analyzeMolecule(mol: Molecule): MoleculeInfo {
  const hydrogens = implicitHydrogens(mol);
  const counts: Record<string, number> = {};
  mol.atoms.forEach((a, i) => {
    counts[a.element] = (counts[a.element] ?? 0) + 1;
    if (hydrogens[i] > 0) counts.H = (counts.H ?? 0) + hydrogens[i];
  });

  let mass = 0;
  for (const [el, n] of Object.entries(counts)) {
    const m = el === "H" ? 1.008 : atomicMass(el);
    if (m === null) throw new SmilesError(`No atomic mass for ${el}`);
    mass += m * n;
  }

  const dou = degreeOfUnsaturation(counts);
  const { ringBonds: rb, ringAtoms: ra } = ringBonds(mol);

  return {
    ...mol, hydrogens, counts, formula: hillFormula(counts),
    mass: Math.round(mass * 1000) / 1000, degreeOfUnsaturation: dou,
    ringBonds: rb, ringAtoms: ra,
  };
}

/** DoU = (2C + 2 + N + P − H − halogens) / 2, when only CHNOPS+halogens present. */
export function degreeOfUnsaturation(counts: Record<string, number>): number | null {
  const allowed = new Set(["C", "H", "N", "O", "P", "S", "F", "Cl", "Br", "I"]);
  if (Object.keys(counts).some((k) => !allowed.has(k))) return null;
  const C = counts.C ?? 0, H = counts.H ?? 0, N = counts.N ?? 0, P = counts.P ?? 0;
  const X = (counts.F ?? 0) + (counts.Cl ?? 0) + (counts.Br ?? 0) + (counts.I ?? 0);
  const dou = (2 * C + 2 + N + P - H - X) / 2;
  return dou < 0 || !Number.isInteger(dou) ? (dou < 0 ? null : dou) : dou;
}

/** Convenience: parse + analyze in one call. */
export function fromSmiles(smiles: string): MoleculeInfo {
  return analyzeMolecule(parseSmiles(smiles));
}

/** A curated library of common molecules for the viewer. */
export const MOLECULE_PRESETS: { name: string; smiles: string; category: string }[] = [
  { name: "Methane", smiles: "C", category: "Alkane" },
  { name: "Ethanol", smiles: "CCO", category: "Alcohol" },
  { name: "Acetic acid", smiles: "CC(=O)O", category: "Carboxylic acid" },
  { name: "Acetone", smiles: "CC(=O)C", category: "Ketone" },
  { name: "Benzene", smiles: "c1ccccc1", category: "Aromatic" },
  { name: "Phenol", smiles: "Oc1ccccc1", category: "Phenol" },
  { name: "Toluene", smiles: "Cc1ccccc1", category: "Aromatic" },
  { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O", category: "Ester" },
  { name: "Glucose", smiles: "OCC(O)C(O)C(O)C(O)C=O", category: "Sugar" },
  { name: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(C)c(=O)n2C", category: "Alkaloid" },
  { name: "Aniline", smiles: "Nc1ccccc1", category: "Amine" },
  { name: "Ethene", smiles: "C=C", category: "Alkene" },
  { name: "Ethyne", smiles: "C#C", category: "Alkyne" },
  { name: "Diethyl ether", smiles: "CCOCC", category: "Ether" },
  { name: "Acetamide", smiles: "CC(=O)N", category: "Amide" },
  { name: "Chloroform", smiles: "C(Cl)(Cl)Cl", category: "Haloalkane" },
  { name: "Pyridine", smiles: "c1ccncc1", category: "Heterocycle" },
  { name: "Cyclohexane", smiles: "C1CCCCC1", category: "Cycloalkane" },
];
