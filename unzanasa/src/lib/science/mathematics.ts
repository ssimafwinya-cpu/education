// ─── Mathematics engine ──────────────────────────────────────────────────────
// Equation solvers, matrix operations and statistics. Pure and unit-tested.

// ─── Quadratic / linear ──────────────────────────────────────────────────────

export interface QuadraticResult {
  discriminant: number;
  roots: number[];
  complex?: { re: number; im: number }[];
  vertex: { x: number; y: number };
  nature: string;
}

/** Solve ax² + bx + c = 0. */
export function solveQuadratic(a: number, b: number, c: number): QuadraticResult | { linear: number | null } {
  if (a === 0) {
    return { linear: b === 0 ? null : -c / b };
  }
  const disc = b * b - 4 * a * c;
  const vx = -b / (2 * a);
  const vertex = { x: round(vx), y: round(a * vx * vx + b * vx + c) };
  if (disc > 0) {
    const sq = Math.sqrt(disc);
    return { discriminant: round(disc), roots: [round((-b + sq) / (2 * a)), round((-b - sq) / (2 * a))], vertex, nature: "Two distinct real roots" };
  }
  if (disc === 0) {
    return { discriminant: 0, roots: [round(-b / (2 * a))], vertex, nature: "One repeated real root" };
  }
  const sq = Math.sqrt(-disc);
  return {
    discriminant: round(disc), roots: [],
    complex: [{ re: round(-b / (2 * a)), im: round(sq / (2 * a)) }, { re: round(-b / (2 * a)), im: round(-sq / (2 * a)) }],
    vertex, nature: "Two complex conjugate roots",
  };
}

// ─── Matrices ────────────────────────────────────────────────────────────────

export type Matrix = number[][];

export function matMultiply(a: Matrix, b: Matrix): Matrix | null {
  if (a[0].length !== b.length) return null;
  return a.map((row) => b[0].map((_, j) => round(row.reduce((s, v, k) => s + v * b[k][j], 0))));
}

export function matTranspose(a: Matrix): Matrix {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

export function determinant(m: Matrix): number | null {
  const n = m.length;
  if (n === 0 || m.some((r) => r.length !== n)) return null;
  // LU-style elimination with partial pivoting.
  const a = m.map((r) => [...r]);
  let det = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    if (Math.abs(a[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) { [a[i], a[pivot]] = [a[pivot], a[i]]; det = -det; }
    det *= a[i][i];
    for (let r = i + 1; r < n; r++) {
      const f = a[r][i] / a[i][i];
      for (let c = i; c < n; c++) a[r][c] -= f * a[i][c];
    }
  }
  return round(det);
}

export function matInverse(m: Matrix): Matrix | null {
  const n = m.length;
  if (m.some((r) => r.length !== n)) return null;
  // Gauss-Jordan on the augmented [m | I].
  const a = m.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    if (Math.abs(a[pivot][i]) < 1e-12) return null; // singular
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const pv = a[i][i];
    for (let c = 0; c < 2 * n; c++) a[i][c] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = a[r][i];
      for (let c = 0; c < 2 * n; c++) a[r][c] -= f * a[i][c];
    }
  }
  return a.map((row) => row.slice(n).map(round));
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface Stats {
  n: number; sum: number; mean: number; median: number; mode: number[];
  variance: number; stdDev: number; min: number; max: number; range: number;
}

export function statistics(data: number[]): Stats | null {
  const n = data.length;
  if (n === 0) return null;
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / n;

  const freq = new Map<number, number>();
  for (const x of data) freq.set(x, (freq.get(x) ?? 0) + 1);
  const maxFreq = Math.max(...freq.values());
  const mode = maxFreq > 1 ? [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v).sort((a, b) => a - b) : [];

  return {
    n, sum: round(sum), mean: round(mean), median: round(median), mode,
    variance: round(variance), stdDev: round(Math.sqrt(variance)),
    min: sorted[0], max: sorted[n - 1], range: round(sorted[n - 1] - sorted[0]),
  };
}

/** Numerical derivative of f at x (central difference). */
export function derivative(f: (x: number) => number, x: number, h = 1e-6): number {
  return round((f(x + h) - f(x - h)) / (2 * h));
}

/** Definite integral via Simpson's rule. */
export function integrate(f: (x: number) => number, a: number, b: number, n = 1000): number {
  if (n % 2) n++;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return round((h / 3) * sum);
}

function round(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}
