// ─── Physics engine ──────────────────────────────────────────────────────────
// Kinematics, projectile motion, vectors, Ohm's law, unit conversion and
// physical constants. Pure and unit-tested. SI units throughout.

export const CONSTANTS = {
  g: 9.80665, // m/s²
  c: 2.99792458e8, // m/s
  G: 6.674e-11, // N·m²/kg²
  h: 6.62607015e-34, // J·s
  e: 1.602176634e-19, // C
  k: 1.380649e-23, // J/K (Boltzmann)
  Na: 6.02214076e23, // /mol (Avogadro)
  R: 8.314462618, // J/(mol·K)
  epsilon0: 8.8541878128e-12,
} as const;

// ─── Kinematics (constant acceleration) ──────────────────────────────────────
// Solve using whichever of {u, v, a, t, s} are provided (need any 3).

export interface Kinematics { u?: number; v?: number; a?: number; t?: number; s?: number; }

export function solveKinematics(k: Kinematics): Kinematics | null {
  let { u, v, a, t, s } = k;
  const known = () => [u, v, a, t, s].filter((x) => x !== undefined).length;
  if (known() < 3) return null;

  // Iterate applying the SUVAT relations until nothing new can be derived.
  for (let iter = 0; iter < 6 && known() < 5; iter++) {
    if (v === undefined && u !== undefined && a !== undefined && t !== undefined) v = u + a * t;
    if (u === undefined && v !== undefined && a !== undefined && t !== undefined) u = v - a * t;
    if (a === undefined && v !== undefined && u !== undefined && t !== undefined && t !== 0) a = (v - u) / t;
    if (t === undefined && v !== undefined && u !== undefined && a !== undefined && a !== 0) t = (v - u) / a;
    if (s === undefined && u !== undefined && t !== undefined && a !== undefined) s = u * t + 0.5 * a * t * t;
    if (s === undefined && u !== undefined && v !== undefined && t !== undefined) s = 0.5 * (u + v) * t;
    if (v === undefined && u !== undefined && a !== undefined && s !== undefined) {
      const v2 = u * u + 2 * a * s;
      if (v2 >= 0) v = Math.sqrt(v2);
    }
    if (u === undefined && v !== undefined && a !== undefined && s !== undefined) {
      const u2 = v * v - 2 * a * s;
      if (u2 >= 0) u = Math.sqrt(u2);
    }
    // v² = u² + 2as  →  a  (and t from average velocity)
    if (a === undefined && v !== undefined && u !== undefined && s !== undefined && s !== 0) a = (v * v - u * u) / (2 * s);
    if (t === undefined && u !== undefined && v !== undefined && s !== undefined && u + v !== 0) t = (2 * s) / (u + v);
  }
  const round = (x?: number) => (x === undefined ? undefined : Math.round(x * 1e6) / 1e6);
  return { u: round(u), v: round(v), a: round(a), t: round(t), s: round(s) };
}

// ─── Projectile motion ───────────────────────────────────────────────────────

export interface Projectile {
  v0: number; angleDeg: number; g?: number; h0?: number;
}
export interface ProjectileResult {
  timeOfFlight: number; maxHeight: number; range: number;
  vx: number; vy0: number; trajectory: { x: number; y: number }[];
}

export function projectile({ v0, angleDeg, g = CONSTANTS.g, h0 = 0 }: Projectile): ProjectileResult {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);
  // Time to land: solve h0 + vy0 t - ½ g t² = 0.
  const disc = vy0 * vy0 + 2 * g * h0;
  const t = (vy0 + Math.sqrt(Math.max(0, disc))) / g;
  const maxHeight = h0 + (vy0 * vy0) / (2 * g);
  const range = vx * t;
  const N = 40;
  const trajectory = Array.from({ length: N + 1 }, (_, i) => {
    const ti = (t * i) / N;
    return { x: round2(vx * ti), y: round2(Math.max(0, h0 + vy0 * ti - 0.5 * g * ti * ti)) };
  });
  return {
    timeOfFlight: round2(t), maxHeight: round2(maxHeight), range: round2(range),
    vx: round2(vx), vy0: round2(vy0), trajectory,
  };
}

// ─── Vectors (2D/3D) ─────────────────────────────────────────────────────────

export type Vec = number[];
export const vAdd = (a: Vec, b: Vec): Vec => a.map((x, i) => x + (b[i] ?? 0));
export const vSub = (a: Vec, b: Vec): Vec => a.map((x, i) => x - (b[i] ?? 0));
export const vDot = (a: Vec, b: Vec): number => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
export const vMag = (a: Vec): number => Math.sqrt(vDot(a, a));
export function vCross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function vAngle(a: Vec, b: Vec): number {
  const denom = vMag(a) * vMag(b);
  if (denom === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, vDot(a, b) / denom))) * 180) / Math.PI;
}

// ─── Ohm's law & power ───────────────────────────────────────────────────────

export function ohmsLaw({ V, I, R, P }: { V?: number; I?: number; R?: number; P?: number }): { V: number; I: number; R: number; P: number } | null {
  // Need any two.
  if (V !== undefined && I !== undefined) { R = V / I; P = V * I; }
  else if (V !== undefined && R !== undefined) { I = V / R; P = V * I; }
  else if (I !== undefined && R !== undefined) { V = I * R; P = V * I; }
  else if (P !== undefined && V !== undefined) { I = P / V; R = V / I; }
  else if (P !== undefined && I !== undefined) { V = P / I; R = V / I; }
  else if (P !== undefined && R !== undefined) { I = Math.sqrt(P / R); V = I * R; }
  else return null;
  const r = (x?: number) => Math.round((x ?? 0) * 1e6) / 1e6;
  return { V: r(V), I: r(I), R: r(R), P: r(P) };
}

// ─── Unit conversion ─────────────────────────────────────────────────────────
// Each unit maps to a base SI factor within its dimension.

export const UNITS: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144, nm: 1e-9 },
  mass: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.0283495 },
  time: { s: 1, min: 60, h: 3600, day: 86400, ms: 0.001 },
  energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, eV: 1.602176634e-19, Wh: 3600 },
  temperature: {}, // handled specially
};

export function convert(value: number, from: string, to: string, dimension: string): number | null {
  if (dimension === "temperature") return convertTemp(value, from, to);
  const map = UNITS[dimension];
  if (!map || !(from in map) || !(to in map)) return null;
  return (value * map[from]) / map[to];
}

export function convertTemp(value: number, from: string, to: string): number | null {
  // to Kelvin
  let k: number;
  if (from === "C") k = value + 273.15;
  else if (from === "F") k = (value - 32) * (5 / 9) + 273.15;
  else if (from === "K") k = value;
  else return null;
  if (to === "C") return k - 273.15;
  if (to === "F") return (k - 273.15) * (9 / 5) + 32;
  if (to === "K") return k;
  return null;
}

const round2 = (x: number) => Math.round(x * 1e4) / 1e4;
