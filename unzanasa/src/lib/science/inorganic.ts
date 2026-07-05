// ─── Inorganic chemistry ─────────────────────────────────────────────────────
// Oxidation-state solving, ionic-compound naming and electron configuration.
// Pure and unit-tested.

import { parseFormula } from "./chemistry";
import { ELEMENTS, BY_SYMBOL } from "./periodic-table";

// ─── Oxidation states ────────────────────────────────────────────────────────
// Solves the unknown oxidation number(s) in a neutral formula (or ion of a
// given charge) using standard rules: fixed states for common elements, then
// the remaining element balances so the sum equals the overall charge.

const FIXED_OX: Record<string, number> = {
  F: -1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1,
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Zn: 2, Ag: 1,
};

export interface OxidationResult {
  states: { element: string; count: number; oxidation: number; assumed: boolean }[];
  ok: boolean;
  note: string;
}

export function oxidationStates(formula: string, overallCharge = 0): OxidationResult | { error: string } {
  const parsed = parseFormula(formula);
  if (!parsed.ok) return { error: parsed.error ?? "Invalid formula" };
  const counts = parsed.counts;
  const elements = Object.keys(counts);

  // Elemental form (one distinct element): oxidation number is charge / atoms.
  if (elements.length === 1) {
    const el = elements[0];
    return {
      ok: true, note: overallCharge === 0 ? "Free element — oxidation state 0." : "Monatomic ion.",
      states: [{ element: el, count: counts[el], oxidation: round1(overallCharge / counts[el]), assumed: false }],
    };
  }

  const assigned: Record<string, number> = {};
  const assumed: Record<string, boolean> = {};

  const has = (el: string) => el in counts;

  // Hydrogen: +1, unless a metal hydride (H with a group-1/2 metal only).
  if (has("H")) {
    const metals = elements.filter((e) => FIXED_OX[e] && FIXED_OX[e] > 0);
    assigned.H = metals.length && elements.every((e) => e === "H" || FIXED_OX[e] > 0) ? -1 : 1;
    assumed.H = true;
  }
  // Oxygen: −2, unless peroxide (H2O2) → −1.
  if (has("O")) {
    assigned.O = formula.replace(/\s/g, "") === "H2O2" ? -1 : -2;
    assumed.O = true;
  }
  // Fixed metals / fluorine.
  for (const el of elements) {
    if (el in FIXED_OX && !(el in assigned)) { assigned[el] = FIXED_OX[el]; assumed[el] = true; }
  }

  const unknowns = elements.filter((e) => !(e in assigned));
  if (unknowns.length > 1) {
    return { states: [], ok: false, note: "Too many unknown oxidation states to solve uniquely." };
  }

  let note = "Solved by the sum rule.";
  if (unknowns.length === 1) {
    const el = unknowns[0];
    let sum = 0;
    for (const [e, n] of Object.entries(counts)) if (e !== el) sum += assigned[e] * n;
    const ox = (overallCharge - sum) / counts[el];
    assigned[el] = ox;
    assumed[el] = false;
    if (!Number.isInteger(ox * 2)) note = "Non-integer result — check the formula.";
  } else {
    // all known: just verify
    let sum = 0;
    for (const [e, n] of Object.entries(counts)) sum += assigned[e] * n;
    if (sum !== overallCharge) note = `Sum is ${sum}, expected ${overallCharge} — formula may be unusual.`;
  }

  return {
    ok: true, note,
    states: elements.map((el) => ({ element: el, count: counts[el], oxidation: round1(assigned[el]), assumed: !!assumed[el] })),
  };
}

// ─── Ionic compound naming ───────────────────────────────────────────────────

export interface Ion { formula: string; name: string; charge: number; kind: "cation" | "anion"; }

export const CATIONS: Ion[] = [
  { formula: "Na", name: "sodium", charge: 1, kind: "cation" },
  { formula: "K", name: "potassium", charge: 1, kind: "cation" },
  { formula: "Li", name: "lithium", charge: 1, kind: "cation" },
  { formula: "NH4", name: "ammonium", charge: 1, kind: "cation" },
  { formula: "Ag", name: "silver", charge: 1, kind: "cation" },
  { formula: "Mg", name: "magnesium", charge: 2, kind: "cation" },
  { formula: "Ca", name: "calcium", charge: 2, kind: "cation" },
  { formula: "Ba", name: "barium", charge: 2, kind: "cation" },
  { formula: "Zn", name: "zinc", charge: 2, kind: "cation" },
  { formula: "Fe", name: "iron(II)", charge: 2, kind: "cation" },
  { formula: "Cu", name: "copper(II)", charge: 2, kind: "cation" },
  { formula: "Al", name: "aluminium", charge: 3, kind: "cation" },
  { formula: "Fe3", name: "iron(III)", charge: 3, kind: "cation" },
];

export const ANIONS: Ion[] = [
  { formula: "F", name: "fluoride", charge: -1, kind: "anion" },
  { formula: "Cl", name: "chloride", charge: -1, kind: "anion" },
  { formula: "Br", name: "bromide", charge: -1, kind: "anion" },
  { formula: "I", name: "iodide", charge: -1, kind: "anion" },
  { formula: "OH", name: "hydroxide", charge: -1, kind: "anion" },
  { formula: "NO3", name: "nitrate", charge: -1, kind: "anion" },
  { formula: "HCO3", name: "hydrogencarbonate", charge: -1, kind: "anion" },
  { formula: "O", name: "oxide", charge: -2, kind: "anion" },
  { formula: "S", name: "sulfide", charge: -2, kind: "anion" },
  { formula: "SO4", name: "sulfate", charge: -2, kind: "anion" },
  { formula: "CO3", name: "carbonate", charge: -2, kind: "anion" },
  { formula: "PO4", name: "phosphate", charge: -3, kind: "anion" },
  { formula: "N", name: "nitride", charge: -3, kind: "anion" },
];

function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

/** Real chemical symbol of an ion (strips a Roman-numeral disambiguator like "Fe3"). */
export function ionSymbol(ion: Ion): string {
  // Cations named with an oxidation-state tag ("iron(III)") carry a trailing
  // digit only to make the key unique — remove it. Polyatomic ions keep theirs.
  return ion.name.includes("(") ? ion.formula.replace(/\d+$/, "") : ion.formula;
}

/** True if the ion is polyatomic (more than one atom) and needs parentheses. */
function isPolyatomic(sym: string): boolean {
  return !/^[A-Z][a-z]?$/.test(sym);
}

/** Combine a cation and anion into a neutral ionic compound. */
export function combineIons(cation: Ion, anion: Ion): { formula: string; name: string; ratio: [number, number] } {
  const c = cation.charge, a = -anion.charge;
  const l = (c * a) / gcd(c, a);
  const nCat = l / c;
  const nAn = l / a;

  const wrap = (ion: Ion, count: number) => {
    const sym = ionSymbol(ion);
    if (count === 1) return sym;
    return isPolyatomic(sym) ? `(${sym})${count}` : `${sym}${count}`;
  };

  const formula = wrap(cation, nCat) + wrap(anion, nAn);
  const name = `${cation.name} ${anion.name}`;
  return { formula, name, ratio: [nCat, nAn] };
}

// ─── Electron configuration ──────────────────────────────────────────────────

const SUBSHELL_ORDER = [
  ["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10],
  ["4p", 6], ["5s", 2], ["4d", 10], ["5p", 6], ["6s", 2], ["4f", 14], ["5d", 10],
  ["6p", 6], ["7s", 2], ["5f", 14], ["6d", 10], ["7p", 6],
] as const;

const NOBLE_GASES: [number, string][] = [
  [2, "He"], [10, "Ne"], [18, "Ar"], [36, "Kr"], [54, "Xe"], [86, "Rn"],
];

export interface ElectronConfig {
  full: string;
  condensed: string;
  valenceElectrons: number;
  shells: number[];
}

export function electronConfiguration(z: number): ElectronConfig | { error: string } {
  if (z < 1 || z > 118 || !Number.isInteger(z)) return { error: "Atomic number must be 1–118." };
  let remaining = z;
  const filled: { sub: string; count: number }[] = [];
  for (const [sub, cap] of SUBSHELL_ORDER) {
    if (remaining <= 0) break;
    const c = Math.min(cap, remaining);
    filled.push({ sub, count: c });
    remaining -= c;
  }
  const full = filled.map((f) => `${f.sub}${sup(f.count)}`).join(" ");

  // Condensed: [noble gas] + subshells beyond it.
  let core: [number, string] | null = null;
  for (const ng of NOBLE_GASES) if (ng[0] < z) core = ng;
  let condensed = full;
  if (core) {
    const coreFilled = electronsUpTo(core[0]);
    const outer = filled.filter((f) => !coreFilled.includes(`${f.sub}`) || true);
    // rebuild: subshells whose cumulative electron count exceeds the core
    let acc = 0;
    const outerSubs = filled.filter((f) => { const before = acc; acc += f.count; return before >= core![0]; });
    condensed = `[${core[1]}] ` + outerSubs.map((f) => `${f.sub}${sup(f.count)}`).join(" ");
  }

  // Shells (by principal quantum number).
  const shellMap: Record<number, number> = {};
  for (const f of filled) {
    const n = parseInt(f.sub[0], 10);
    shellMap[n] = (shellMap[n] ?? 0) + f.count;
  }
  const shells = Object.keys(shellMap).map(Number).sort((a, b) => a - b).map((n) => shellMap[n]);
  const maxShell = Math.max(...Object.keys(shellMap).map(Number));
  const valenceElectrons = filled.filter((f) => parseInt(f.sub[0], 10) === maxShell && (f.sub.includes("s") || f.sub.includes("p"))).reduce((s, f) => s + f.count, 0);

  return { full, condensed, valenceElectrons, shells };
}

function electronsUpTo(z: number): string[] {
  const out: string[] = [];
  let remaining = z;
  for (const [sub, cap] of SUBSHELL_ORDER) {
    if (remaining <= 0) break;
    out.push(sub);
    remaining -= Math.min(cap, remaining);
  }
  return out;
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function sup(n: number): string {
  return String(n).split("").map((d) => SUP[+d]).join("");
}
function round1(x: number): number { return Math.round(x * 10) / 10; }

export function elementByNumber(z: number) {
  return ELEMENTS.find((e) => e.z === z) ?? null;
}
export { BY_SYMBOL };
