"use client";

import { useState } from "react";
import { Atom, Rocket, Gauge, Zap, ArrowLeftRight, Move3d } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import {
  solveKinematics, projectile, ohmsLaw, convert, convertTemp, UNITS,
  vAdd, vSub, vDot, vCross, vMag, vAngle, CONSTANTS,
} from "@/lib/science/physics";

export default function PhysicsLab() {
  return (
    <div>
      <ToolHeader title="Physics AI Lab" subtitle="Simulate motion, solve SUVAT, analyse circuits and convert units — with real, worked physics." icon={<Atom size={22} />} tone="gold" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ProjectileSim />
        <Kinematics />
        <OhmsLaw />
        <UnitConverter />
        <VectorCalc />
        <Constants />
      </div>
    </div>
  );
}

function ProjectileSim() {
  const [v0, setV0] = useState(20);
  const [angle, setAngle] = useState(45);
  const r = projectile({ v0, angleDeg: angle });
  const W = 320, H = 160, pad = 10;
  const maxX = Math.max(...r.trajectory.map((p) => p.x), 1);
  const maxY = Math.max(...r.trajectory.map((p) => p.y), 1);
  const sx = (x: number) => pad + (x / maxX) * (W - pad * 2);
  const sy = (y: number) => H - pad - (y / maxY) * (H - pad * 2);
  const path = r.trajectory.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <Tool title="Projectile motion simulator" icon={<Rocket size={17} className="text-gold-500" />}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Launch speed: ${v0} m/s`}><input type="range" min={1} max={60} value={v0} onChange={(e) => setV0(+e.target.value)} className="w-full accent-gold-500" /></Field>
        <Field label={`Angle: ${angle}°`}><input type="range" min={1} max={90} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full accent-gold-500" /></Field>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full rounded-xl border border-edge bg-surface">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgb(var(--edge-strong))" />
        <path d={path} fill="none" stroke="#f5a623" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={sx(r.range)} cy={sy(0)} r={4} fill="#dc2626" />
        <circle cx={sx(r.range / 2)} cy={sy(r.maxHeight)} r={3} fill="#0d9488" />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <ResultRow label="Range" value={`${r.range} m`} tone="gold" />
        <ResultRow label="Max height" value={`${r.maxHeight} m`} tone="gold" />
        <ResultRow label="Flight time" value={`${r.timeOfFlight} s`} tone="gold" />
      </div>
    </Tool>
  );
}

function Kinematics() {
  const [vals, setVals] = useState<Record<string, string>>({ u: "0", a: "9.8", t: "2", v: "", s: "" });
  const known: Record<string, number> = {};
  for (const k of ["u", "v", "a", "t", "s"]) if (vals[k] !== "") known[k] = parseFloat(vals[k]);
  const result = solveKinematics(known);
  return (
    <Tool title="Kinematics solver (SUVAT)" icon={<Gauge size={17} className="text-gold-500" />}>
      <p className="mb-2 text-xs text-ink-faint">Enter any 3 of u, v, a, t, s — the rest are solved.</p>
      <div className="grid grid-cols-5 gap-2">
        {[["u", "u (m/s)"], ["v", "v (m/s)"], ["a", "a (m/s²)"], ["t", "t (s)"], ["s", "s (m)"]].map(([k, label]) => (
          <Field key={k} label={label}><input value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className="input px-2 text-center" placeholder="—" /></Field>
        ))}
      </div>
      <div className="mt-3">
        {result ? (
          <ResultBox tone="gold">
            <div className="grid grid-cols-5 gap-2 text-center">
              {(["u", "v", "a", "t", "s"] as const).map((k) => (
                <div key={k}><div className="text-[10px] uppercase text-ink-faint">{k}</div><div className="font-mono text-sm font-semibold">{result[k] ?? "—"}</div></div>
              ))}
            </div>
          </ResultBox>
        ) : <p className="text-sm text-ink-faint">Provide at least 3 values.</p>}
      </div>
    </Tool>
  );
}

function OhmsLaw() {
  const [vals, setVals] = useState<Record<string, string>>({ V: "12", I: "2", R: "", P: "" });
  const known: Record<string, number> = {};
  for (const k of ["V", "I", "R", "P"]) if (vals[k] !== "") known[k] = parseFloat(vals[k]);
  const result = ohmsLaw(known);
  return (
    <Tool title="Ohm's law & power" icon={<Zap size={17} className="text-gold-500" />}>
      <p className="mb-2 text-xs text-ink-faint">Enter any 2 of V, I, R, P.</p>
      <div className="grid grid-cols-4 gap-2">
        {[["V", "V (volts)"], ["I", "I (amps)"], ["R", "R (Ω)"], ["P", "P (watts)"]].map(([k, label]) => (
          <Field key={k} label={label}><input value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className="input px-2 text-center" placeholder="—" /></Field>
        ))}
      </div>
      <div className="mt-3">
        {result ? (
          <div className="grid grid-cols-4 gap-2">
            <ResultRow label="V" value={result.V} tone="gold" /><ResultRow label="I" value={result.I} tone="gold" />
            <ResultRow label="R" value={result.R} tone="gold" /><ResultRow label="P" value={result.P} tone="gold" />
          </div>
        ) : <p className="text-sm text-ink-faint">Provide any two values.</p>}
      </div>
    </Tool>
  );
}

function UnitConverter() {
  const [dim, setDim] = useState("length");
  const units = dim === "temperature" ? ["C", "F", "K"] : Object.keys(UNITS[dim]);
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1] ?? units[0]);
  const [value, setValue] = useState(1);
  const out = dim === "temperature" ? convertTemp(value, from, to) : convert(value, from, to, dim);

  const onDim = (d: string) => {
    setDim(d);
    const u = d === "temperature" ? ["C", "F", "K"] : Object.keys(UNITS[d]);
    setFrom(u[0]); setTo(u[1] ?? u[0]);
  };
  return (
    <Tool title="Unit converter" icon={<ArrowLeftRight size={17} className="text-gold-500" />}>
      <Field label="Dimension">
        <select value={dim} onChange={(e) => onDim(e.target.value)} className="input capitalize">
          {["length", "mass", "time", "energy", "temperature"].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="Value"><input type="number" value={value} onChange={(e) => setValue(+e.target.value)} className="input" /></Field>
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="input">{units.map((u) => <option key={u}>{u}</option>)}</select>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="input">{units.map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      <ResultBox tone="gold" >
        <div className="text-lg font-bold text-gold-600">{out !== null ? `${Math.round(out * 1e6) / 1e6} ${to}` : "—"}</div>
      </ResultBox>
    </Tool>
  );
}

function VectorCalc() {
  const [a, setA] = useState("1,2,3");
  const [b, setB] = useState("4,5,6");
  const pa = a.split(",").map(Number);
  const pb = b.split(",").map(Number);
  const valid = pa.every((x) => !isNaN(x)) && pb.every((x) => !isNaN(x)) && pa.length === pb.length;
  return (
    <Tool title="Vector calculator" icon={<Move3d size={17} className="text-gold-500" />}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Vector A (comma-separated)"><input value={a} onChange={(e) => setA(e.target.value)} className="input font-mono" /></Field>
        <Field label="Vector B"><input value={b} onChange={(e) => setB(e.target.value)} className="input font-mono" /></Field>
      </div>
      <div className="mt-3 space-y-2">
        {valid ? (
          <>
            <ResultRow label="A + B" value={`[${vAdd(pa, pb).join(", ")}]`} tone="gold" />
            <ResultRow label="A − B" value={`[${vSub(pa, pb).join(", ")}]`} tone="gold" />
            <ResultRow label="A · B (dot)" value={vDot(pa, pb)} tone="gold" />
            {pa.length === 3 && <ResultRow label="A × B (cross)" value={`[${vCross(pa, pb).join(", ")}]`} tone="gold" />}
            <ResultRow label="|A|" value={vMag(pa).toFixed(3)} tone="gold" />
            <ResultRow label="Angle A,B" value={`${vAngle(pa, pb).toFixed(2)}°`} tone="gold" />
          </>
        ) : <p className="text-sm text-crimson-600">Enter two vectors of equal length.</p>}
      </div>
    </Tool>
  );
}

function Constants() {
  const rows: [string, string, string][] = [
    ["g", "Gravity", `${CONSTANTS.g} m/s²`],
    ["c", "Speed of light", `${CONSTANTS.c.toExponential(3)} m/s`],
    ["G", "Gravitation", `${CONSTANTS.G.toExponential(3)} N·m²/kg²`],
    ["h", "Planck", `${CONSTANTS.h.toExponential(3)} J·s`],
    ["e", "Elementary charge", `${CONSTANTS.e.toExponential(3)} C`],
    ["Nₐ", "Avogadro", `${CONSTANTS.Na.toExponential(3)} /mol`],
    ["R", "Gas constant", `${CONSTANTS.R} J/(mol·K)`],
  ];
  return (
    <Tool title="Physical constants" icon={<Atom size={17} className="text-gold-500" />}>
      <div className="space-y-1.5">
        {rows.map(([sym, name, val]) => (
          <div key={sym} className="flex items-center justify-between rounded-lg border border-edge px-3 py-1.5 text-sm">
            <span><span className="font-mono font-semibold text-gold-600">{sym}</span> <span className="text-ink-muted">{name}</span></span>
            <span className="font-mono text-xs">{val}</span>
          </div>
        ))}
      </div>
    </Tool>
  );
}
