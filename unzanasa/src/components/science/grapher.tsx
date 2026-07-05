"use client";

// ─── Graphing calculator ─────────────────────────────────────────────────────
// Multi-function SVG plotter driven by the expression engine. Functions of x
// with axes, gridlines, adjustable domain and per-function colours. Gaps
// (asymptotes / domain errors) break the path instead of drawing spikes.

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { sampleFunction } from "@/lib/science/expression";
import { cn } from "@/lib/utils";

const COLORS = ["#0d9488", "#f5a623", "#dc2626", "#6366f1", "#ec4899"];

interface Fn {
  expr: string;
}

export function Grapher() {
  const [fns, setFns] = useState<Fn[]>([{ expr: "sin(x)" }, { expr: "x^2/10" }]);
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);

  const W = 640, H = 380, pad = 34;

  const plots = useMemo(() => {
    const lo = Math.min(xMin, xMax), hi = Math.max(xMin, xMax);
    const domain: [number, number] = lo === hi ? [lo - 1, hi + 1] : [lo, hi];
    return fns.map((f) => ({ ...sampleFunction(f.expr, domain[0], domain[1]), expr: f.expr, domain }));
  }, [fns, xMin, xMax]);

  // Shared y-range across all functions (clamped so one blow-up doesn't flatten the rest).
  const { yMin, yMax, lo, hi } = useMemo(() => {
    const ys = plots.flatMap((p) => p.points.filter(Boolean).map((pt) => (pt as { y: number }).y));
    let yLo = Math.min(...ys, -1), yHi = Math.max(...ys, 1);
    if (!Number.isFinite(yLo) || !Number.isFinite(yHi)) { yLo = -10; yHi = 10; }
    const span = yHi - yLo || 2;
    const domain = plots[0]?.domain ?? [xMin, xMax];
    return { yMin: yLo - span * 0.08, yMax: yHi + span * 0.08, lo: domain[0], hi: domain[1] };
  }, [plots, xMin, xMax]);

  const sx = (x: number) => pad + ((x - lo) / (hi - lo)) * (W - pad * 2);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - pad * 2);

  const pathFor = (points: ({ x: number; y: number } | null)[]) => {
    let d = "";
    let pen = false;
    for (const p of points) {
      if (!p) { pen = false; continue; }
      const yClamped = Math.max(yMin, Math.min(yMax, p.y));
      d += `${pen ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(yClamped).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  // Grid tick positions (about 8 divisions).
  const ticks = (min: number, max: number) => {
    const step = niceStep((max - min) / 8);
    const out: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(Math.round(v * 1e9) / 1e9);
    return out;
  };

  return (
    <div>
      {/* Function inputs */}
      <div className="space-y-2">
        {fns.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="font-mono text-sm text-ink-muted">y =</span>
            <input
              value={f.expr}
              onChange={(e) => setFns(fns.map((x, j) => (j === i ? { expr: e.target.value } : x)))}
              className={cn("input flex-1 font-mono", plots[i]?.error && "border-crimson-600/60")}
              placeholder="e.g. sin(x) + x/2"
            />
            {fns.length > 1 && (
              <button onClick={() => setFns(fns.filter((_, j) => j !== i))} className="btn-ghost btn-sm text-crimson-600" aria-label="Remove function"><X size={14} /></button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          {fns.length < 5 && (
            <button onClick={() => setFns([...fns, { expr: "" }])} className="btn-secondary btn-sm"><Plus size={13} /> Add function</button>
          )}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-ink-faint">x from</span>
            <input type="number" value={xMin} onChange={(e) => setXMin(+e.target.value)} className="input w-20 px-2 text-center" />
            <span className="text-ink-faint">to</span>
            <input type="number" value={xMax} onChange={(e) => setXMax(+e.target.value)} className="input w-20 px-2 text-center" />
          </div>
        </div>
        {plots.map((p, i) => p.error && p.expr.trim() !== "" && (
          <p key={i} className="text-xs text-crimson-600">ƒ{i + 1}: {p.error}</p>
        ))}
      </div>

      {/* Plot */}
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full rounded-xl border border-edge bg-surface">
        {/* gridlines */}
        {ticks(lo, hi).map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} y1={pad} x2={sx(t)} y2={H - pad} stroke="rgb(var(--edge))" strokeWidth={t === 0 ? 0 : 1} />
            <text x={sx(t)} y={H - pad + 14} textAnchor="middle" fontSize={9} fill="rgb(var(--ink-faint))">{fmt(t)}</text>
          </g>
        ))}
        {ticks(yMin, yMax).map((t) => (
          <g key={`y${t}`}>
            <line x1={pad} y1={sy(t)} x2={W - pad} y2={sy(t)} stroke="rgb(var(--edge))" strokeWidth={t === 0 ? 0 : 1} />
            <text x={pad - 6} y={sy(t) + 3} textAnchor="end" fontSize={9} fill="rgb(var(--ink-faint))">{fmt(t)}</text>
          </g>
        ))}
        {/* axes */}
        {yMin < 0 && yMax > 0 && <line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} stroke="rgb(var(--ink-faint))" strokeWidth={1.4} />}
        {lo < 0 && hi > 0 && <line x1={sx(0)} y1={pad} x2={sx(0)} y2={H - pad} stroke="rgb(var(--ink-faint))" strokeWidth={1.4} />}
        {/* curves */}
        {plots.map((p, i) => (
          <path key={i} d={pathFor(p.points)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      <p className="mt-1.5 text-xs text-ink-faint">Supports +, −, ×, ÷, ^, sin/cos/tan, ln/log, sqrt, abs, exp, min/max, constants pi & e, and implicit multiplication (2x, 3(x+1)).</p>
    </div>
  );
}

function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(raw) || 1)));
  const norm = raw / mag;
  const step = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  return step * mag;
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(0);
  return String(Math.round(v * 100) / 100);
}
