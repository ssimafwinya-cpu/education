"use client";

// Click-to-draw structure editor. Atoms are placed on a snapped grid, bonds
// are made by clicking two atoms in sequence, and every edit re-runs the same
// tested engines the SMILES studio uses (formula, functional groups, IUPAC
// name). No chemistry is computed in this file — it only edits the graph.

import { useMemo, useState } from "react";
import { analyzeMolecule, type MoleculeInfo } from "@/lib/science/smiles";
import {
  SKETCH_ELEMENTS, sketchToMolecule, validateSketch, bondOrderSum, maxValence, removeAtom,
  type SketchAtom, type SketchBond,
} from "@/lib/science/sketch";
import { detectFunctionalGroups } from "@/lib/science/functional-groups";
import { iupacName } from "@/lib/science/iupac";

const ATOM_COLOR: Record<string, string> = {
  O: "#dc2626", N: "#2563eb", S: "#ca8a04", P: "#ea580c",
  F: "#16a34a", Cl: "#16a34a", Br: "#a16207", I: "#7c3aed",
};

const W = 480, H = 340, SNAP = 20, HIT = 12;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;

type Mode = "draw" | "erase";
interface State { atoms: SketchAtom[]; bonds: SketchBond[]; }

export function MoleculeSketcher() {
  const [state, setState] = useState<State>({ atoms: [], bonds: [] });
  const [history, setHistory] = useState<State[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [element, setElement] = useState<string>("C");
  const [order, setOrder] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<Mode>("draw");

  const commit = (next: State) => {
    setHistory((h) => [...h.slice(-49), state]);
    setState(next);
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setState(prev);
    setActive(null);
  };
  const clear = () => { commit({ atoms: [], bonds: [] }); setActive(null); };

  const { atoms, bonds } = state;

  const analysis = useMemo(() => {
    if (atoms.length === 0) return null;
    const warnings = validateSketch(atoms, bonds);
    try {
      const info = analyzeMolecule(sketchToMolecule(atoms, bonds));
      return { info, warnings, groups: detectFunctionalGroups(info), name: iupacName(info) };
    } catch {
      return { info: null, warnings, groups: [], name: null };
    }
  }, [atoms, bonds]);

  const atomAt = (x: number, y: number): number | null => {
    let best: number | null = null, bestD = HIT;
    atoms.forEach((a, i) => {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bestD) { best = i; bestD = d; }
    });
    return best;
  };

  const bondAt = (x: number, y: number): number | null => {
    let best: number | null = null, bestD = 7;
    bonds.forEach((b, i) => {
      const p = atoms[b.a], q = atoms[b.b];
      const len2 = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (len2 === 0) return;
      const t = Math.max(0.2, Math.min(0.8, ((x - p.x) * (q.x - p.x) + (y - p.y) * (q.y - p.y)) / len2));
      const d = Math.hypot(x - (p.x + t * (q.x - p.x)), y - (p.y + t * (q.y - p.y)));
      if (d < bestD) { best = i; bestD = d; }
    });
    return best;
  };

  const canBond = (i: number, extra: number) => bondOrderSum(bonds, i) + extra <= maxValence(atoms[i].element);

  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const hitAtom = atomAt(x, y);
    const hitBond = hitAtom === null ? bondAt(x, y) : null;

    if (mode === "erase") {
      if (hitAtom !== null) { commit(removeAtom(atoms, bonds, hitAtom)); setActive(null); }
      else if (hitBond !== null) commit({ atoms, bonds: bonds.filter((_, i) => i !== hitBond) });
      return;
    }

    if (hitAtom !== null) {
      if (active === null || active === hitAtom) { setActive(active === hitAtom ? null : hitAtom); return; }
      const existing = bonds.findIndex((b) => (b.a === active && b.b === hitAtom) || (b.a === hitAtom && b.b === active));
      if (existing >= 0) {
        commit({ atoms, bonds: bonds.map((b, i) => (i === existing ? { ...b, order } : b)) });
      } else if (canBond(active, order) && canBond(hitAtom, order)) {
        commit({ atoms, bonds: [...bonds, { a: active, b: hitAtom, order }] });
      }
      setActive(hitAtom);
      return;
    }
    if (hitBond !== null) {
      const next = ((bonds[hitBond].order % 3) + 1) as 1 | 2 | 3;
      commit({ atoms, bonds: bonds.map((b, i) => (i === hitBond ? { ...b, order: next } : b)) });
      return;
    }
    // Empty space: place a new atom, bonded to the active atom when possible.
    const nx = Math.max(SNAP, Math.min(W - SNAP, snap(x)));
    const ny = Math.max(SNAP, Math.min(H - SNAP, snap(y)));
    if (atoms.some((a) => a.x === nx && a.y === ny)) return;
    const idx = atoms.length;
    const newAtoms = [...atoms, { x: nx, y: ny, element }];
    const bondOk = active !== null && canBond(active, order) && order <= maxValence(element);
    commit({ atoms: newAtoms, bonds: bondOk ? [...bonds, { a: active!, b: idx, order }] : bonds });
    setActive(idx);
  };

  const pickElement = (el: string) => {
    setElement(el);
    if (active !== null && atoms[active].element !== el) {
      commit({ atoms: atoms.map((a, i) => (i === active ? { ...a, element: el } : a)), bonds });
    }
  };

  const hydrogens = analysis?.info?.hydrogens ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SKETCH_ELEMENTS.map((el) => (
            <button key={el} data-testid={`el-${el}`} onClick={() => pickElement(el)}
              className={`chip border font-mono transition ${element === el ? "border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-300" : "border-edge text-ink-muted hover:border-accent-400"}`}>
              {el}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-edge" />
          {([1, 2, 3] as const).map((o) => (
            <button key={o} data-testid={`bond-${o}`} onClick={() => setOrder(o)}
              className={`chip border font-mono transition ${order === o ? "border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-300" : "border-edge text-ink-muted hover:border-accent-400"}`}>
              {o === 1 ? "—" : o === 2 ? "=" : "≡"}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-edge" />
          <button data-testid="mode-erase" onClick={() => setMode(mode === "erase" ? "draw" : "erase")}
            className={`chip border transition ${mode === "erase" ? "border-crimson-600 bg-crimson-600/10 text-crimson-600" : "border-edge text-ink-muted hover:border-crimson-600/60"}`}>
            Erase
          </button>
          <button data-testid="undo" onClick={undo} disabled={history.length === 0} className="chip border border-edge text-ink-muted transition hover:border-accent-400 disabled:opacity-40">Undo</button>
          <button data-testid="clear" onClick={clear} disabled={atoms.length === 0} className="chip border border-edge text-ink-muted transition hover:border-crimson-600/60 disabled:opacity-40">Clear</button>
        </div>

        <svg data-testid="sketch-canvas" viewBox={`0 0 ${W} ${H}`} onClick={onCanvasClick}
          className="mt-2 w-full max-w-[520px] cursor-crosshair rounded-xl border border-edge bg-surface"
          style={{ aspectRatio: `${W} / ${H}` }}>
          {/* grid dots */}
          {Array.from({ length: Math.floor(W / SNAP) - 1 }, (_, gx) =>
            Array.from({ length: Math.floor(H / SNAP) - 1 }, (_, gy) => (
              <circle key={`${gx}-${gy}`} cx={(gx + 1) * SNAP} cy={(gy + 1) * SNAP} r={0.7} className="fill-ink-faint/25" />
            )),
          )}
          {bonds.map((b, i) => {
            const p = atoms[b.a], q = atoms[b.b];
            const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const trim = (a: SketchAtom) => (a.element === "C" ? 5 : 11);
            const x1 = p.x + ux * trim(p), y1 = p.y + uy * trim(p);
            const x2 = q.x - ux * trim(q), y2 = q.y - uy * trim(q);
            const px = -uy, py = ux;
            const offsets = b.order === 1 ? [0] : b.order === 2 ? [-2.4, 2.4] : [-4, 0, 4];
            return (
              <g key={i} className="stroke-ink" strokeWidth={1.8} strokeLinecap="round">
                {offsets.map((o) => (
                  <line key={o} x1={x1 + px * o} y1={y1 + py * o} x2={x2 + px * o} y2={y2 + py * o} />
                ))}
              </g>
            );
          })}
          {atoms.map((a, i) => {
            const h = hydrogens[i] ?? 0;
            const isC = a.element === "C";
            return (
              <g key={i}>
                {active === i && <circle cx={a.x} cy={a.y} r={10.5} className="fill-none stroke-accent-500" strokeWidth={1.4} strokeDasharray="3 2.5" />}
                {isC ? (
                  <circle cx={a.x} cy={a.y} r={3.4} className="fill-ink" />
                ) : (
                  <text x={a.x} y={a.y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={ATOM_COLOR[a.element] ?? "currentColor"}>
                    {a.element}
                    {h > 0 && <tspan fontSize={11}>H</tspan>}
                    {h > 1 && <tspan fontSize={8} dy={2.5}>{h}</tspan>}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">
          Click empty space to place an atom (it bonds to the highlighted atom). Click two atoms in
          sequence to bond them; click a bond to cycle single → double → triple. With an atom
          highlighted, pick an element to change it. Click the highlighted atom to deselect.
        </p>
      </div>

      <div>
        {analysis === null ? (
          <p className="text-sm text-ink-muted">Draw a structure to analyse it — start by clicking anywhere on the canvas.</p>
        ) : (
          <>
            {analysis.warnings.length > 0 && (
              <div className="mb-3 rounded-lg border border-crimson-600/40 bg-crimson-600/5 p-2.5 text-xs text-crimson-600">
                {analysis.warnings.map((w) => <div key={w}>{w}</div>)}
              </div>
            )}
            {analysis.info && <SketchReadout info={analysis.info} groups={analysis.groups} name={analysis.name} />}
          </>
        )}
      </div>
    </div>
  );
}

function SketchReadout({ info, groups, name }: {
  info: MoleculeInfo;
  groups: { name: string; count: number }[];
  name: ReturnType<typeof iupacName> | null;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Formula" html={info.formula.replace(/(\d+)/g, "<sub>$1</sub>")} />
        <Stat label="Molar mass" html={`${info.mass} g/mol`} />
        <Stat label="Unsaturation" html={`${info.degreeOfUnsaturation ?? "—"}`} />
      </div>
      {name && ("name" in name ? (
        <div className="mt-2 rounded-lg border border-accent-400/40 bg-accent-500/5 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">IUPAC name</div>
          <div className="text-lg font-semibold text-accent-600 dark:text-accent-300">{name.name}</div>
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-ink-faint">Systematic name unavailable: {name.error}</p>
      ))}
      <div className="mt-3">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Functional groups</div>
        {groups.length === 0 ? (
          <p className="text-sm text-ink-muted">None detected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <span key={g.name} className="chip bg-accent-500/12 text-accent-600 dark:text-accent-300">
                {g.name}{g.count > 1 ? ` ×${g.count}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, html }: { label: string; html: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface-raised px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-mono text-sm font-semibold text-accent-600 dark:text-accent-300" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
