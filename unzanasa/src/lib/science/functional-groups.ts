// ─── Functional-group recognition ────────────────────────────────────────────
// Hand-written graph queries over a parsed molecule detect the functional
// groups that matter in undergraduate organic chemistry. Specific groups are
// detected before generic ones and mark their atoms "consumed" so, e.g., a
// carboxylic acid is not also reported as a separate alcohol + ketone.

import type { MoleculeInfo } from "./smiles";

export interface DetectedGroup {
  name: string;
  /** atom indices participating in the group. */
  atoms: number[];
  count: number;
}

interface Ctx {
  mol: MoleculeInfo;
  /** neighbours[i] = [{ idx, order, aromatic }]. */
  neighbours: { idx: number; order: number; aromatic: boolean }[][];
  H: number[];
  consumed: Set<number>;
}

function buildCtx(mol: MoleculeInfo): Ctx {
  const neighbours: { idx: number; order: number; aromatic: boolean }[][] = mol.atoms.map(() => []);
  for (const b of mol.bonds) {
    neighbours[b.a].push({ idx: b.b, order: b.order, aromatic: b.aromatic });
    neighbours[b.b].push({ idx: b.a, order: b.order, aromatic: b.aromatic });
  }
  return { mol, neighbours, H: mol.hydrogens, consumed: new Set() };
}

const el = (ctx: Ctx, i: number) => ctx.mol.atoms[i].element;
const isArom = (ctx: Ctx, i: number) => ctx.mol.atoms[i].aromatic;
const carbons = (ctx: Ctx, i: number) => ctx.neighbours[i].filter((n) => el(ctx, n.idx) === "C");

/** A carbon double-bonded to an oxygen (carbonyl carbon) → returns [C, O]. */
function carbonyl(ctx: Ctx, c: number): number | null {
  if (el(ctx, c) !== "C") return null;
  const o = ctx.neighbours[c].find((n) => el(ctx, n.idx) === "O" && n.order === 2);
  return o ? o.idx : null;
}

export function detectFunctionalGroups(mol: MoleculeInfo): DetectedGroup[] {
  const ctx = buildCtx(mol);
  const found = new Map<string, Set<string>>(); // name → set of sorted-atom-key (dedupe)

  const record = (name: string, atoms: number[]) => {
    const key = [...atoms].sort((a, b) => a - b).join(",");
    if (!found.has(name)) found.set(name, new Set());
    found.get(name)!.add(key);
    atoms.forEach((a) => ctx.consumed.add(a));
  };

  // ── Carbonyl-derived groups (most specific first) ──
  for (let c = 0; c < mol.atoms.length; c++) {
    const o = carbonyl(ctx, c);
    if (o === null || isArom(ctx, c)) continue;

    const singleO = ctx.neighbours[c].filter((n) => el(ctx, n.idx) === "O" && n.order === 1);
    const nNeighbours = ctx.neighbours[c].filter((n) => el(ctx, n.idx) === "N");
    const cNeighbours = carbons(ctx, c);

    // Carboxylic acid: C(=O)-OH
    const acidO = singleO.find((n) => ctx.H[n.idx] > 0);
    if (acidO) { record("Carboxylic acid", [c, o, acidO.idx]); continue; }

    // Ester: C(=O)-O-C
    const esterO = singleO.find((n) => carbons(ctx, n.idx).some((cc) => cc.idx !== c));
    if (esterO) { record("Ester", [c, o, esterO.idx]); continue; }

    // Amide: C(=O)-N
    if (nNeighbours.length) { record("Amide", [c, o, nNeighbours[0].idx]); continue; }

    // Aldehyde: carbonyl C bearing an H (terminal). Ketone: two carbons.
    if (ctx.H[c] > 0 || cNeighbours.length <= 1) record("Aldehyde", [c, o]);
    else record("Ketone", [c, o]);
  }

  // ── Nitrile: C#N ──
  for (const b of mol.bonds) {
    if (b.order === 3 && ((el(ctx, b.a) === "C" && el(ctx, b.b) === "N") || (el(ctx, b.a) === "N" && el(ctx, b.b) === "C"))) {
      record("Nitrile", [b.a, b.b]);
    }
  }

  // ── Nitro: N bonded to two O (one double, one single/charged) ──
  for (let n = 0; n < mol.atoms.length; n++) {
    if (el(ctx, n) !== "N") continue;
    const os = ctx.neighbours[n].filter((x) => el(ctx, x.idx) === "O");
    if (os.length >= 2) record("Nitro", [n, ...os.map((x) => x.idx)]);
  }

  // ── Aromatic ring ──
  if (mol.atoms.some((a) => a.aromatic)) {
    const aromaticAtoms = mol.atoms.filter((a) => a.aromatic).map((a) => a.index);
    // Phenol: aromatic C bearing an -OH
    for (const a of aromaticAtoms) {
      const oh = ctx.neighbours[a].find((n) => el(ctx, n.idx) === "O" && ctx.H[n.idx] > 0 && !ctx.consumed.has(n.idx));
      if (oh && el(ctx, a) === "C") record("Phenol", [a, oh.idx]);
    }
    found.set("Aromatic ring", new Set([aromaticAtoms.length >= 6 ? "ring" : "ring"]));
  }

  // ── Hydroxyl (alcohol): O with one heavy neighbour + H, not consumed ──
  for (let o = 0; o < mol.atoms.length; o++) {
    if (el(ctx, o) !== "O" || ctx.consumed.has(o) || ctx.H[o] === 0) continue;
    const heavy = ctx.neighbours[o].filter((n) => el(ctx, n.idx) !== "H");
    if (heavy.length === 1 && el(ctx, heavy[0].idx) === "C" && !isArom(ctx, heavy[0].idx)) {
      record("Alcohol (hydroxyl)", [o, heavy[0].idx]);
    }
  }

  // ── Ether: O with two carbon neighbours, no H, not consumed ──
  for (let o = 0; o < mol.atoms.length; o++) {
    if (el(ctx, o) !== "O" || ctx.consumed.has(o) || ctx.H[o] > 0) continue;
    const cs = carbons(ctx, o);
    if (cs.length === 2 && !cs.some((c) => carbonyl(ctx, c.idx) !== null)) record("Ether", [o, ...cs.map((c) => c.idx)]);
  }

  // ── Amine: N with only C/H neighbours, not adjacent to a carbonyl (→ amide) ──
  for (let n = 0; n < mol.atoms.length; n++) {
    if (el(ctx, n) !== "N" || ctx.consumed.has(n)) continue;
    const nbrs = ctx.neighbours[n];
    if (nbrs.some((x) => el(ctx, x.idx) === "O")) continue; // nitro handled
    const adjacentCarbonyl = nbrs.some((x) => carbonyl(ctx, x.idx) !== null);
    if (adjacentCarbonyl) continue;
    if (nbrs.every((x) => el(ctx, x.idx) === "C")) {
      const cCount = nbrs.length;
      const cls = cCount <= 1 ? "Primary amine" : cCount === 2 ? "Secondary amine" : "Tertiary amine";
      record(cls, [n]);
    }
  }

  // ── C=C alkene / C#C alkyne (non-aromatic) ──
  for (const b of mol.bonds) {
    if (b.aromatic) continue;
    if (el(ctx, b.a) === "C" && el(ctx, b.b) === "C") {
      if (b.order === 2) record("Alkene (C=C)", [b.a, b.b]);
      if (b.order === 3) record("Alkyne (C≡C)", [b.a, b.b]);
    }
  }

  // ── Halide: C-X ──
  const halogens = new Set(["F", "Cl", "Br", "I"]);
  for (let x = 0; x < mol.atoms.length; x++) {
    if (!halogens.has(el(ctx, x))) continue;
    const c = ctx.neighbours[x].find((n) => el(ctx, n.idx) === "C");
    if (c) record(`Halide (${el(ctx, x)})`, [x, c.idx]);
  }

  return [...found.entries()].map(([name, set]) => ({ name, count: set.size, atoms: [] }));
}

/** True if the molecule contains any C — a quick organic/inorganic hint. */
export function isOrganic(mol: MoleculeInfo): boolean {
  return (mol.counts.C ?? 0) > 0;
}
