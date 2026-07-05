// ─── Reaction stoichiometry & solution chemistry ────────────────────────────
// Limiting-reagent + yield analysis (built on the equation balancer), empirical
// / molecular formula from percent composition, the ideal-gas law, and
// weak-acid pH. Pure and unit-tested.

import { balanceEquation, molarMass } from "./chemistry";

// ─── Limiting reagent & theoretical yield ────────────────────────────────────

export interface ReactantAmount {
  formula: string;
  /** Amount value with its unit. */
  value: number;
  unit: "g" | "mol";
}

export interface YieldResult {
  balanced: string;
  coefficients: number[];
  limiting: string;
  /** Reaction extent = min(moles / coefficient) over reactants. */
  extent: number;
  reactants: { formula: string; moles: number; coefficient: number; extentSupported: number; isLimiting: boolean }[];
  products: { formula: string; coefficient: number; moles: number; grams: number }[];
}

function toMoles(a: ReactantAmount): number | null {
  if (a.unit === "mol") return a.value;
  const mm = molarMass(a.formula);
  return mm ? a.value / mm : null;
}

/**
 * Given a (possibly unbalanced) equation and the amount of each reactant,
 * find the limiting reagent and the theoretical yield of every product.
 */
export function limitingReagent(equation: string, amounts: ReactantAmount[]): YieldResult | { error: string } {
  const bal = balanceEquation(equation);
  if (!bal.ok) return { error: bal.error };

  const coeffOf = (formula: string, side: "left" | "right"): number | null => {
    const list = side === "left" ? bal.left : bal.right;
    const idx = list.indexOf(formula);
    if (idx === -1) return null;
    return bal.coefficients[side === "left" ? idx : bal.left.length + idx];
  };

  // Match each provided amount to a reactant in the equation.
  const reactants: YieldResult["reactants"] = [];
  for (const r of bal.left) {
    const provided = amounts.find((a) => a.formula === r);
    if (!provided) return { error: `Provide an amount for reactant ${r}.` };
    const moles = toMoles(provided);
    if (moles === null) return { error: `Cannot compute molar mass for ${r}.` };
    const coefficient = coeffOf(r, "left")!;
    reactants.push({ formula: r, moles, coefficient, extentSupported: moles / coefficient, isLimiting: false });
  }

  const extent = Math.min(...reactants.map((r) => r.extentSupported));
  const limitingR = reactants.reduce((min, r) => (r.extentSupported < min.extentSupported ? r : min), reactants[0]);
  limitingR.isLimiting = true;

  const products: YieldResult["products"] = bal.right.map((p) => {
    const coefficient = coeffOf(p, "right")!;
    const moles = extent * coefficient;
    const mm = molarMass(p) ?? 0;
    return { formula: p, coefficient, moles: round(moles), grams: round(moles * mm) };
  });

  return {
    balanced: bal.balanced, coefficients: bal.coefficients,
    limiting: limitingR.formula, extent: round(extent),
    reactants: reactants.map((r) => ({ ...r, moles: round(r.moles), extentSupported: round(r.extentSupported) })),
    products,
  };
}

/** Percent yield = actual / theoretical × 100. */
export function percentYield(actual: number, theoretical: number): number | null {
  if (theoretical <= 0) return null;
  return round((actual / theoretical) * 100);
}

// ─── Empirical / molecular formula from composition ──────────────────────────

export interface EmpiricalResult {
  empirical: string;
  empiricalMass: number;
  ratios: { element: string; moles: number; ratio: number }[];
  molecular?: string;
  multiple?: number;
}

/**
 * From element → mass-percent (or mass in g), derive the empirical formula
 * (smallest whole-number ratio) and, given a molar mass, the molecular formula.
 */
export function empiricalFormula(composition: Record<string, number>, molar?: number): EmpiricalResult | { error: string } {
  const entries = Object.entries(composition).filter(([, v]) => v > 0);
  if (entries.length === 0) return { error: "Enter at least one element." };

  const moles = entries.map(([el, pct]) => {
    const mm = molarMass(el);
    if (!mm) return null;
    return { element: el, moles: pct / mm };
  });
  if (moles.some((m) => m === null)) return { error: "Unknown element in composition." };

  const valid = moles as { element: string; moles: number }[];
  const minMoles = Math.min(...valid.map((m) => m.moles));
  let ratios = valid.map((m) => ({ ...m, ratio: m.moles / minMoles }));

  // Scale to near-integers (handles ×1.5 → ×3 etc.).
  const factor = smallestIntegerFactor(ratios.map((r) => r.ratio));
  ratios = ratios.map((r) => ({ ...r, ratio: Math.round(r.ratio * factor) }));

  const counts: Record<string, number> = {};
  ratios.forEach((r) => { counts[r.element] = r.ratio; });
  const empirical = formatCounts(counts);
  const empiricalMass = round(ratios.reduce((s, r) => s + (molarMass(r.element) ?? 0) * r.ratio, 0));

  const out: EmpiricalResult = {
    empirical, empiricalMass,
    ratios: ratios.map((r) => ({ element: r.element, moles: round(r.moles), ratio: r.ratio })),
  };

  if (molar && empiricalMass > 0) {
    const multiple = Math.round(molar / empiricalMass);
    if (multiple >= 1) {
      const molCounts: Record<string, number> = {};
      ratios.forEach((r) => { molCounts[r.element] = r.ratio * multiple; });
      out.molecular = formatCounts(molCounts);
      out.multiple = multiple;
    }
  }
  return out;
}

function smallestIntegerFactor(ratios: number[]): number {
  for (let f = 1; f <= 6; f++) {
    if (ratios.every((r) => Math.abs(r * f - Math.round(r * f)) < 0.1)) return f;
  }
  return 1;
}

function formatCounts(counts: Record<string, number>): string {
  const order = Object.keys(counts).sort((a, b) => (a === "C" ? -1 : b === "C" ? 1 : a === "H" ? -1 : b === "H" ? 1 : a.localeCompare(b)));
  return order.map((el) => (counts[el] === 1 ? el : `${el}${counts[el]}`)).join("");
}

// ─── Ideal gas law: PV = nRT ─────────────────────────────────────────────────

const R = 8.314462618; // J/(mol·K), with P in kPa·L or Pa·m³

export interface GasKnowns { P?: number; V?: number; n?: number; T?: number; }

/** Solve the ideal gas law for the single missing variable. Units: P in kPa, V in L, T in K. */
export function idealGas(k: GasKnowns): (GasKnowns & { solvedFor: keyof GasKnowns }) | { error: string } {
  const given = (["P", "V", "n", "T"] as const).filter((key) => k[key] !== undefined);
  if (given.length !== 3) return { error: "Provide exactly three of P, V, n, T." };
  const missing = (["P", "V", "n", "T"] as const).find((key) => k[key] === undefined)!;
  const { P, V, n, T } = k;
  let value: number;
  switch (missing) {
    case "P": value = (n! * R * T!) / V!; break;
    case "V": value = (n! * R * T!) / P!; break;
    case "n": value = (P! * V!) / (R * T!); break;
    case "T": value = (P! * V!) / (n! * R); break;
  }
  return { ...k, [missing]: round(value), solvedFor: missing };
}

// ─── Weak-acid pH ────────────────────────────────────────────────────────────

/** pH of a weak monoprotic acid from Ka and analytical concentration (exact quadratic). */
export function weakAcidPH(Ka: number, concentration: number): { pH: number; percentIonised: number } | { error: string } {
  if (Ka <= 0 || concentration <= 0) return { error: "Ka and concentration must be positive." };
  // Ka = x²/(C − x)  →  x² + Ka·x − Ka·C = 0
  const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * concentration)) / 2;
  const pH = -Math.log10(x);
  return { pH: round(pH), percentIonised: round((x / concentration) * 100) };
}

export function pKa(Ka: number): number { return round(-Math.log10(Ka)); }

function round(x: number): number { return Math.round(x * 10000) / 10000; }
