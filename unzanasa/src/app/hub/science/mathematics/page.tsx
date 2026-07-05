"use client";

import { useState } from "react";
import { Calculator, Sigma, Grid3x3, BarChart3, LineChart } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import { Grapher } from "@/components/science/grapher";
import { SciCalc } from "@/components/science/sci-calc";
import { solveQuadratic, determinant, matInverse, matMultiply, statistics } from "@/lib/science/mathematics";

export default function MathLab() {
  return (
    <div>
      <ToolHeader title="Mathematics AI Lab" subtitle="Graph functions, solve equations, operate on matrices and analyse data — exact numerical results." icon={<Calculator size={22} />} tone="crimson" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Tool title="Graphing calculator" icon={<LineChart size={17} className="text-crimson-600" />} className="lg:col-span-2">
          <Grapher />
        </Tool>
        <Tool title="Scientific calculator" icon={<Calculator size={17} className="text-crimson-600" />} className="lg:col-span-2">
          <SciCalc />
        </Tool>
        <Quadratic />
        <Stats />
        <MatrixTool />
      </div>
    </div>
  );
}

function Quadratic() {
  const [a, setA] = useState(1), [b, setB] = useState(-3), [c, setC] = useState(2);
  const r = solveQuadratic(a, b, c);
  return (
    <Tool title="Quadratic solver" icon={<Sigma size={17} className="text-crimson-600" />}>
      <div className="grid grid-cols-3 gap-2">
        <Field label="a"><input type="number" value={a} onChange={(e) => setA(+e.target.value)} className="input text-center" /></Field>
        <Field label="b"><input type="number" value={b} onChange={(e) => setB(+e.target.value)} className="input text-center" /></Field>
        <Field label="c"><input type="number" value={c} onChange={(e) => setC(+e.target.value)} className="input text-center" /></Field>
      </div>
      <p className="mt-2 text-center font-mono text-sm text-ink-muted">{a}x² {b >= 0 ? "+" : "−"} {Math.abs(b)}x {c >= 0 ? "+" : "−"} {Math.abs(c)} = 0</p>
      <div className="mt-3">
        {"linear" in r ? (
          <ResultBox tone="crimson"><div className="font-semibold">Linear equation · x = {r.linear ?? "no solution"}</div></ResultBox>
        ) : (
          <ResultBox tone="crimson">
            <div className="text-sm text-ink-muted">{r.nature}</div>
            <div className="mt-1 font-mono font-semibold text-crimson-600">
              {r.roots.length ? r.roots.map((x, i) => `x${i + 1} = ${x}`).join(",  ") : r.complex!.map((z, i) => `x${i + 1} = ${z.re} ${z.im >= 0 ? "+" : "−"} ${Math.abs(z.im)}i`).join(",  ")}
            </div>
            <div className="mt-1 text-xs text-ink-faint">Discriminant = {r.discriminant} · Vertex ({r.vertex.x}, {r.vertex.y})</div>
          </ResultBox>
        )}
      </div>
    </Tool>
  );
}

function Stats() {
  const [raw, setRaw] = useState("2, 4, 4, 4, 5, 5, 7, 9");
  const data = raw.split(/[,\s]+/).map(Number).filter((x) => !isNaN(x));
  const s = statistics(data);
  return (
    <Tool title="Statistics" icon={<BarChart3 size={17} className="text-crimson-600" />}>
      <Field label="Data (comma or space separated)"><input value={raw} onChange={(e) => setRaw(e.target.value)} className="input font-mono" /></Field>
      <div className="mt-3">
        {s ? (
          <div className="grid grid-cols-2 gap-2">
            <ResultRow label="Mean" value={s.mean} tone="crimson" />
            <ResultRow label="Median" value={s.median} tone="crimson" />
            <ResultRow label="Std dev" value={s.stdDev} tone="crimson" />
            <ResultRow label="Variance" value={s.variance} tone="crimson" />
            <ResultRow label="Min / Max" value={`${s.min} / ${s.max}`} tone="crimson" />
            <ResultRow label="Mode" value={s.mode.length ? s.mode.join(", ") : "none"} tone="crimson" />
          </div>
        ) : <p className="text-sm text-ink-faint">Enter some numbers.</p>}
      </div>
    </Tool>
  );
}

function MatrixTool() {
  const [text, setText] = useState("4 7\n2 6");
  const matrix = text.trim().split("\n").map((row) => row.trim().split(/[,\s]+/).map(Number));
  const square = matrix.length > 0 && matrix.every((r) => r.length === matrix.length) && matrix.every((r) => r.every((x) => !isNaN(x)));
  const det = square ? determinant(matrix) : null;
  const inv = square ? matInverse(matrix) : null;
  return (
    <Tool title="Matrix calculator" icon={<Grid3x3 size={17} className="text-crimson-600" />} className="lg:col-span-2">
      <Field label="Square matrix (rows on new lines, values space/comma separated)">
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[90px] resize-y font-mono" />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ResultBox tone="crimson">
          <div className="text-xs uppercase tracking-wide text-ink-faint">Determinant</div>
          <div className="text-2xl font-bold text-crimson-600">{square ? det : "—"}</div>
          {square && det === 0 && <div className="text-xs text-ink-faint">Singular — not invertible.</div>}
        </ResultBox>
        <ResultBox tone="crimson">
          <div className="text-xs uppercase tracking-wide text-ink-faint">Inverse</div>
          {inv ? (
            <div className="mt-1 font-mono text-sm">
              {inv.map((row, i) => <div key={i}>[{row.map((x) => x.toFixed(3)).join(", ")}]</div>)}
            </div>
          ) : <div className="text-sm text-ink-faint">{square ? "Not invertible" : "Enter a square matrix"}</div>}
        </ResultBox>
      </div>
    </Tool>
  );
}
