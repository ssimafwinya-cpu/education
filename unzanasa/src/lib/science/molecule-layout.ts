// ─── 2D molecule layout ──────────────────────────────────────────────────────
// Generates 2D coordinates for a molecule graph with a force-directed
// (spring-electrical) embedder. Bonds act as springs at a fixed rest length;
// all atom pairs repel. At equilibrium, rings settle into regular polygons and
// chains spread out — a clean, readable depiction with no external deps.
//
// Deterministic: a seeded PRNG drives the initial placement so the same
// molecule always draws the same way.

import type { Molecule } from "./smiles";

export interface Point { x: number; y: number; }

const BOND_LENGTH = 1;

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutMolecule(mol: Molecule, iterations = 500): Point[] {
  const n = mol.atoms.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: 0 }];

  const rand = mulberry32(1337 + n * 7);
  const nbr: number[][] = mol.atoms.map(() => []);
  for (const b of mol.bonds) { nbr[b.a].push(b.b); nbr[b.b].push(b.a); }

  // Initial placement: BFS tree, each atom a unit step from its parent at a
  // spread of angles — gives the solver a sensible, untangled start.
  const pos: Point[] = new Array(n);
  const placed = new Array(n).fill(false);
  const queue: number[] = [];
  pos[0] = { x: 0, y: 0 }; placed[0] = true; queue.push(0);
  let angleBase = 0;
  while (queue.length) {
    const u = queue.shift()!;
    let k = 0;
    const kids = nbr[u].filter((v) => !placed[v]);
    for (const v of kids) {
      const angle = angleBase + (k - (kids.length - 1) / 2) * (Math.PI / 3) + (rand() - 0.5) * 0.4;
      pos[v] = { x: pos[u].x + Math.cos(angle) * BOND_LENGTH, y: pos[u].y + Math.sin(angle) * BOND_LENGTH };
      placed[v] = true; queue.push(v); k++;
    }
    angleBase += Math.PI; // alternate direction for a zig-zag chain
  }
  // Any disconnected atoms (shouldn't happen for one component): scatter.
  for (let i = 0; i < n; i++) if (!placed[i]) pos[i] = { x: rand() * 4, y: rand() * 4 };

  // Force-directed relaxation.
  const kSpring = 0.08;
  const kRep = 0.9;
  for (let iter = 0; iter < iterations; iter++) {
    const disp: Point[] = pos.map(() => ({ x: 0, y: 0 }));
    const cool = 1 - iter / iterations;

    // Repulsion (all pairs).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1e-6) { dx = rand() - 0.5; dy = rand() - 0.5; d2 = 1e-3; }
        const f = kRep / d2;
        const d = Math.sqrt(d2);
        disp[i].x += (dx / d) * f; disp[i].y += (dy / d) * f;
        disp[j].x -= (dx / d) * f; disp[j].y -= (dy / d) * f;
      }
    }
    // Spring attraction along bonds toward rest length.
    for (const b of mol.bonds) {
      const dx = pos[b.b].x - pos[b.a].x, dy = pos[b.b].y - pos[b.a].y;
      const d = Math.hypot(dx, dy) || 1e-3;
      const f = kSpring * (d - BOND_LENGTH);
      const fx = (dx / d) * f, fy = (dy / d) * f;
      disp[b.a].x += fx; disp[b.a].y += fy;
      disp[b.b].x -= fx; disp[b.b].y -= fy;
    }
    // Apply with cooling + step cap.
    const maxStep = 0.1 * cool + 0.01;
    for (let i = 0; i < n; i++) {
      const dl = Math.hypot(disp[i].x, disp[i].y) || 1;
      const s = Math.min(dl, maxStep) / dl;
      pos[i].x += disp[i].x * s; pos[i].y += disp[i].y * s;
    }
  }
  return pos;
}

/** Normalise coordinates into a [pad, size-pad] box. */
export function fitToBox(points: Point[], size = 300, pad = 34): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ x: size / 2, y: size / 2 }];
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1, h = maxY - minY || 1;
  const scale = Math.min((size - pad * 2) / w, (size - pad * 2) / h);
  const offX = (size - w * scale) / 2 - minX * scale;
  const offY = (size - h * scale) / 2 - minY * scale;
  return points.map((p) => ({ x: p.x * scale + offX, y: p.y * scale + offY }));
}
