// ─── Chemistry engine ────────────────────────────────────────────────────────
// Formula parsing, molar mass, equation balancing (nullspace over rationals),
// pH/pOH and stoichiometry. Pure and unit-tested.

import { atomicMass } from "./periodic-table";

// ─── Formula parsing ─────────────────────────────────────────────────────────

export interface ParseResult {
  counts: Record<string, number>;
  mass: number;
  ok: boolean;
  error?: string;
}

/** Parse a chemical formula (supports parentheses and hydrates like CuSO4·5H2O). */
export function parseFormula(formula: string): ParseResult {
  const counts: Record<string, number> = {};
  const clean = formula.replace(/\s+/g, "");
  if (!clean) return { counts, mass: 0, ok: false, error: "Empty formula" };

  // Handle hydrate dot notation by splitting and summing.
  const parts = clean.split(/[·.*]/);
  if (parts.length > 1) {
    for (const part of parts) {
      // A leading coefficient like 5H2O.
      const m = part.match(/^(\d+)(.*)$/);
      const mult = m ? parseInt(m[1], 10) : 1;
      const sub = m ? m[2] : part;
      const r = parseFormula(sub);
      if (!r.ok) return r;
      for (const [el, n] of Object.entries(r.counts)) counts[el] = (counts[el] ?? 0) + n * mult;
    }
    return finalize(counts);
  }

  let i = 0;
  const stack: Record<string, number>[] = [{}];

  const addTo = (target: Record<string, number>, el: string, n: number) => {
    target[el] = (target[el] ?? 0) + n;
  };

  while (i < clean.length) {
    const ch = clean[i];
    if (ch === "(" || ch === "[") {
      stack.push({});
      i++;
    } else if (ch === ")" || ch === "]") {
      i++;
      let num = "";
      while (i < clean.length && /\d/.test(clean[i])) num += clean[i++];
      const mult = num ? parseInt(num, 10) : 1;
      const group = stack.pop()!;
      const top = stack[stack.length - 1];
      for (const [el, n] of Object.entries(group)) addTo(top, el, n * mult);
    } else if (/[A-Z]/.test(ch)) {
      let sym = ch;
      i++;
      while (i < clean.length && /[a-z]/.test(clean[i])) sym += clean[i++];
      let num = "";
      while (i < clean.length && /\d/.test(clean[i])) num += clean[i++];
      if (atomicMass(sym) === null) return { counts: {}, mass: 0, ok: false, error: `Unknown element: ${sym}` };
      addTo(stack[stack.length - 1], sym, num ? parseInt(num, 10) : 1);
    } else {
      return { counts: {}, mass: 0, ok: false, error: `Unexpected character: ${ch}` };
    }
  }
  if (stack.length !== 1) return { counts: {}, mass: 0, ok: false, error: "Unbalanced parentheses" };
  for (const [el, n] of Object.entries(stack[0])) addTo(counts, el, n);
  return finalize(counts);
}

function finalize(counts: Record<string, number>): ParseResult {
  let mass = 0;
  for (const [el, n] of Object.entries(counts)) {
    const m = atomicMass(el);
    if (m === null) return { counts: {}, mass: 0, ok: false, error: `Unknown element: ${el}` };
    mass += m * n;
  }
  return { counts, mass: Math.round(mass * 1000) / 1000, ok: true };
}

export function molarMass(formula: string): number | null {
  const r = parseFormula(formula);
  return r.ok ? r.mass : null;
}

// ─── Equation balancing ──────────────────────────────────────────────────────

interface Species { formula: string; counts: Record<string, number>; }

/**
 * Balance a chemical equation "H2 + O2 -> H2O".
 * Builds the element-conservation matrix and finds the integer nullspace vector
 * via Gaussian elimination over rationals. Returns coefficients or an error.
 */
export function balanceEquation(equation: string): { ok: true; coefficients: number[]; left: string[]; right: string[]; balanced: string } | { ok: false; error: string } {
  const sideSplit = equation.split(/->|=>|=|→/);
  if (sideSplit.length !== 2) return { ok: false, error: "Use '->' to separate reactants and products." };

  const parseSide = (s: string) => s.split("+").map((t) => t.trim()).filter(Boolean);
  const left = parseSide(sideSplit[0]);
  const right = parseSide(sideSplit[1]);
  if (left.length === 0 || right.length === 0) return { ok: false, error: "Both sides need at least one species." };

  const species: Species[] = [];
  for (const f of [...left, ...right]) {
    const r = parseFormula(f);
    if (!r.ok) return { ok: false, error: r.error ?? `Bad formula: ${f}` };
    species.push({ formula: f, counts: r.counts });
  }

  const elements = [...new Set(species.flatMap((s) => Object.keys(s.counts)))];
  const n = species.length;
  // Matrix A (elements × species): reactants positive, products negative.
  const A: number[][] = elements.map((el) =>
    species.map((sp, j) => (sp.counts[el] ?? 0) * (j < left.length ? 1 : -1)),
  );

  const coeffs = integerNullspace(A, n);
  if (!coeffs) return { ok: false, error: "This equation cannot be balanced (check the formulas)." };

  const fmt = (arr: string[], offset: number) =>
    arr.map((f, k) => `${coeffs[offset + k] === 1 ? "" : coeffs[offset + k]}${f}`).join(" + ");
  const balanced = `${fmt(left, 0)} → ${fmt(right, left.length)}`;

  return { ok: true, coefficients: coeffs, left, right, balanced };
}

// Rational arithmetic helpers.
function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function lcm(a: number, b: number): number { return Math.abs(a * b) / gcd(a, b); }

/** Find the smallest positive-integer nullspace vector of an m×n matrix. */
function integerNullspace(matrix: number[][], n: number): number[] | null {
  // Work with fractions [num, den]. Row-reduce.
  const m = matrix.length;
  const A = matrix.map((row) => row.map((v) => [v, 1] as [number, number]));

  const sub = (a: [number, number], b: [number, number]): [number, number] => reduceFrac([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
  const mul = (a: [number, number], b: [number, number]): [number, number] => reduceFrac([a[0] * b[0], a[1] * b[1]]);
  const div = (a: [number, number], b: [number, number]): [number, number] => reduceFrac([a[0] * b[1], a[1] * b[0]]);

  let pivotRow = 0;
  const pivotCols: number[] = [];
  for (let col = 0; col < n && pivotRow < m; col++) {
    let sel = -1;
    for (let r = pivotRow; r < m; r++) if (A[r][col][0] !== 0) { sel = r; break; }
    if (sel === -1) continue;
    [A[pivotRow], A[sel]] = [A[sel], A[pivotRow]];
    const pv = A[pivotRow][col];
    for (let c = 0; c < n; c++) A[pivotRow][c] = div(A[pivotRow][c], pv);
    for (let r = 0; r < m; r++) {
      if (r === pivotRow) continue;
      const factor = A[r][col];
      if (factor[0] === 0) continue;
      for (let c = 0; c < n; c++) A[r][c] = sub(A[r][c], mul(factor, A[pivotRow][c]));
    }
    pivotCols.push(col);
    pivotRow++;
  }

  const freeCols = [];
  for (let c = 0; c < n; c++) if (!pivotCols.includes(c)) freeCols.push(c);
  if (freeCols.length !== 1) return null; // need exactly one degree of freedom

  const free = freeCols[0];
  const sol: [number, number][] = new Array(n).fill(null).map(() => [0, 1]);
  sol[free] = [1, 1];
  for (let r = 0; r < pivotCols.length; r++) {
    const pc = pivotCols[r];
    // pivot var = -A[r][free] * free
    sol[pc] = reduceFrac([-A[r][free][0], A[r][free][1]]);
  }

  // Scale to smallest positive integers.
  let denLcm = 1;
  for (const [, d] of sol) denLcm = lcm(denLcm, d);
  let ints = sol.map(([nu, d]) => (nu * denLcm) / d);
  // make all positive (flip sign if needed)
  if (ints.some((v) => v < 0) && ints.every((v) => v <= 0)) ints = ints.map((v) => -v);
  if (ints.some((v) => v < 0)) ints = ints.map((v) => -v); // reactant/product signs already handled
  let g = 0;
  for (const v of ints) g = gcd(g, Math.round(v));
  ints = ints.map((v) => Math.round(v) / (g || 1));
  if (ints.some((v) => v <= 0 || !Number.isFinite(v))) return null;
  return ints;
}

function reduceFrac([n, d]: [number, number]): [number, number] {
  if (d === 0) return [0, 1];
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  let nn = n / g, dd = d / g;
  if (dd < 0) { nn = -nn; dd = -dd; }
  return [nn, dd];
}

// ─── pH / pOH ────────────────────────────────────────────────────────────────

export function phFromH(concentrationH: number): number {
  return -Math.log10(concentrationH);
}
export function hFromPh(ph: number): number {
  return Math.pow(10, -ph);
}
export function acidBase(ph: number): { pOH: number; classification: "acidic" | "neutral" | "basic"; h: number; oh: number } {
  const h = hFromPh(ph);
  const oh = 1e-14 / h;
  return {
    pOH: 14 - ph,
    classification: ph < 6.99 ? "acidic" : ph > 7.01 ? "basic" : "neutral",
    h, oh,
  };
}

// ─── Stoichiometry ───────────────────────────────────────────────────────────

/** moles = mass / molar mass */
export function molesFromMass(mass: number, formula: string): number | null {
  const mm = molarMass(formula);
  return mm ? mass / mm : null;
}
/** mass = moles × molar mass */
export function massFromMoles(moles: number, formula: string): number | null {
  const mm = molarMass(formula);
  return mm ? moles * mm : null;
}
/** molarity = moles / litres */
export function molarity(moles: number, litres: number): number {
  return litres === 0 ? 0 : moles / litres;
}
