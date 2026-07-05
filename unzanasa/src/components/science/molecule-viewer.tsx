"use client";

// ─── 2D molecule viewer ──────────────────────────────────────────────────────
// Renders a parsed molecule as a skeletal-formula SVG: carbons are implicit
// vertices, heteroatoms and their hydrogens are labelled, and bonds are drawn
// as single / double / triple / aromatic lines. Layout comes from the
// force-directed embedder.

import { useMemo } from "react";
import type { MoleculeInfo } from "@/lib/science/smiles";
import { layoutMolecule, fitToBox } from "@/lib/science/molecule-layout";

// Heteroatom label colours (CPK-ish).
const ATOM_COLOR: Record<string, string> = {
  O: "#dc2626", N: "#2563eb", S: "#ca8a04", P: "#ea580c",
  F: "#16a34a", Cl: "#16a34a", Br: "#a16207", I: "#7c3aed", B: "#f59e0b", H: "#64748b",
};

export function MoleculeViewer({ mol, size = 320 }: { mol: MoleculeInfo; size?: number }) {
  const pts = useMemo(() => fitToBox(layoutMolecule(mol), size, 38), [mol, size]);

  // A carbon vertex with ≥1 heavy neighbour is drawn as a bare point (skeletal).
  const showLabel = (i: number) => {
    const a = mol.atoms[i];
    if (a.element !== "C") return true;
    if (a.charge !== 0) return true;
    // lone carbon (methane) → show "CH4"
    const heavy = mol.bonds.some((b) => b.a === i || b.b === i);
    return !heavy;
  };

  const labelText = (i: number) => {
    const a = mol.atoms[i];
    const h = mol.hydrogens[i];
    let t = a.element;
    if (h === 1) t += "H";
    else if (h > 1) t += `H${h}`;
    if (a.charge > 0) t += a.charge === 1 ? "⁺" : `${a.charge}⁺`;
    if (a.charge < 0) t += a.charge === -1 ? "⁻" : `${-a.charge}⁻`;
    return t;
  };

  // Draw a bond: single/double/triple parallels, aromatic = line + inner line.
  const renderBond = (b: MoleculeInfo["bonds"][number], k: number) => {
    const p1 = pts[b.a], p2 = pts[b.b];
    // Shorten toward labelled atoms so the line doesn't cross the text.
    const shrink = (p: Point, other: Point, labelled: boolean) => {
      if (!labelled) return p;
      const dx = other.x - p.x, dy = other.y - p.y, d = Math.hypot(dx, dy) || 1;
      return { x: p.x + (dx / d) * 11, y: p.y + (dy / d) * 11 };
    };
    const a = shrink(p1, p2, showLabel(b.a));
    const c = shrink(p2, p1, showLabel(b.b));
    const dx = c.x - a.x, dy = c.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * 3.2, oy = (dx / len) * 3.2; // perpendicular offset

    const line = (x1: number, y1: number, x2: number, y2: number, extra?: object) => (
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--ink))" strokeWidth={1.8} strokeLinecap="round" {...extra} />
    );

    if (b.aromatic) {
      // main line + shorter inner line
      const inx = (dx / len) * len * 0.15, iny = (dy / len) * len * 0.15;
      return (
        <g key={k}>
          {line(a.x, a.y, c.x, c.y)}
          {line(a.x + ox + inx, a.y + oy + iny, c.x + ox - inx, c.y + oy - iny, { strokeWidth: 1.4 })}
        </g>
      );
    }
    if (b.order === 2) {
      return <g key={k}>{line(a.x + ox, a.y + oy, c.x + ox, c.y + oy)}{line(a.x - ox, a.y - oy, c.x - ox, c.y - oy)}</g>;
    }
    if (b.order === 3) {
      return <g key={k}>{line(a.x, a.y, c.x, c.y)}{line(a.x + ox * 1.6, a.y + oy * 1.6, c.x + ox * 1.6, c.y + oy * 1.6)}{line(a.x - ox * 1.6, a.y - oy * 1.6, c.x - ox * 1.6, c.y - oy * 1.6)}</g>;
    }
    return <g key={k}>{line(a.x, a.y, c.x, c.y)}</g>;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full rounded-xl border border-edge bg-surface-raised" style={{ maxHeight: size }}>
      {mol.bonds.map(renderBond)}
      {mol.atoms.map((a, i) =>
        showLabel(i) ? (
          <g key={i}>
            <circle cx={pts[i].x} cy={pts[i].y} r={11} fill="rgb(var(--surface-raised))" />
            <text x={pts[i].x} y={pts[i].y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={ATOM_COLOR[a.element] ?? "rgb(var(--ink))"}>
              {labelText(i)}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  );
}

type Point = { x: number; y: number };
