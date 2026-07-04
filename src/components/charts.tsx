"use client";

// Dependency-free, theme-aware SVG charts. Kept intentionally small so the
// bundle stays lean and the visuals match the design system exactly.

import React from "react";
import { cn } from "@/lib/utils";

// ─── Line / area chart ───────────────────────────────────────────────────────
export function AreaChart({
  data,
  height = 160,
  color = "#6366f1",
  labels,
  valueFormat = (n) => String(n),
}: {
  data: number[];
  height?: number;
  color?: string;
  labels?: string[];
  valueFormat?: (n: number) => string;
}) {
  const w = 520;
  const pad = 8;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const pts = data.map((v, i) => [pad + i * step, y(v)] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pad + (data.length - 1) * step},${height - pad} L${pad},${height - pad} Z`;
  const gid = React.useId();

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={height * f} y2={height * f} stroke="rgb(var(--edge))" strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} className="opacity-0 hover:opacity-100">
            <title>{`${labels?.[i] ?? i}: ${valueFormat(data[i])}`}</title>
          </circle>
        ))}
      </svg>
      {labels && (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-ink-faint">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────────────
export function BarChart({
  data,
  height = 160,
  color = "#14b8a6",
  labels,
}: {
  data: number[];
  height?: number;
  color?: string;
  labels?: string[];
}) {
  const max = Math.max(1, ...data);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((v, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 3 : 0, background: `linear-gradient(180deg, ${color}, ${color}bb)` }}
              title={`${labels?.[i] ?? i}: ${v}`}
            />
          </div>
        ))}
      </div>
      {labels && (
        <div className="mt-1.5 flex gap-1.5 text-[10px] text-ink-faint">
          {labels.map((l, i) => (
            <div key={i} className="flex-1 text-center">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Donut ───────────────────────────────────────────────────────────────────
export function Donut({
  segments,
  size = 140,
  thickness = 18,
  center,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--edge))" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${Math.round(frac * 100)}%`}</title>
            </circle>
          );
          acc += frac;
          return el;
        })}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>}
    </div>
  );
}

// ─── Activity heatmap (GitHub-style) ─────────────────────────────────────────
export function Heatmap({
  values,
  weeks = 16,
}: {
  /** Map of ISO date → intensity value. */
  values: Record<string, number>;
  weeks?: number;
}) {
  const days: { date: string; v: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Align to the end of the current week (Saturday) so columns are full weeks.
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  const max = Math.max(1, ...Object.values(values));

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: iso, v: values[iso] ?? 0 });
  }

  const level = (v: number) => {
    if (v <= 0) return 0;
    const r = v / max;
    if (r < 0.25) return 1;
    if (r < 0.5) return 2;
    if (r < 0.75) return 3;
    return 4;
  };
  const colors = ["bg-surface", "bg-brand-500/25", "bg-brand-500/45", "bg-brand-500/70", "bg-brand-500"];

  // Group into columns of 7 (weeks).
  const columns: { date: string; v: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((d) => (
            <div
              key={d.date}
              className={cn("h-3 w-3 rounded-[3px] border border-edge/40", colors[level(d.v)])}
              title={`${d.date}: ${d.v}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
