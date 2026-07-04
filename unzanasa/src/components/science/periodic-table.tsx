"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ELEMENTS, CATEGORY_COLORS, type Element } from "@/lib/science/periodic-table";
import { cn } from "@/lib/utils";

// f-block ranges rendered in the two bottom rows.
const LANTH = new Set(Array.from({ length: 15 }, (_, i) => 57 + i)); // 57–71
const ACTIN = new Set(Array.from({ length: 15 }, (_, i) => 89 + i)); // 89–103

function gridPos(e: Element): { col: number; row: number } | null {
  if (LANTH.has(e.z)) return { col: 3 + (e.z - 57), row: 9 };
  if (ACTIN.has(e.z)) return { col: 3 + (e.z - 89), row: 10 };
  return { col: e.group, row: e.period };
}

export function PeriodicTable() {
  const [selected, setSelected] = useState<Element | null>(null);
  const [filter, setFilter] = useState<string>("");

  const categories = [...new Set(ELEMENTS.map((e) => e.category))];

  return (
    <div>
      {/* Legend / filter */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("")} className={cn("chip border", filter === "" ? "border-brand-400 bg-brand-500/10" : "border-edge text-ink-muted")}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn("chip border capitalize", filter === c ? "border-brand-400" : "border-edge")} style={{ color: CATEGORY_COLORS[c], background: filter === c ? CATEGORY_COLORS[c] + "22" : undefined }}>
            <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: CATEGORY_COLORS[c] }} /> {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[760px] gap-[3px]" style={{ gridTemplateColumns: "repeat(18, minmax(0,1fr))" }}>
          {/* f-block label cells */}
          <div style={{ gridColumn: 3, gridRow: 6 }} className="grid place-items-center rounded-sm border border-dashed border-edge text-[8px] text-ink-faint">57–71</div>
          <div style={{ gridColumn: 3, gridRow: 7 }} className="grid place-items-center rounded-sm border border-dashed border-edge text-[8px] text-ink-faint">89–103</div>

          {ELEMENTS.map((e) => {
            const pos = gridPos(e);
            if (!pos) return null;
            const dimmed = filter && e.category !== filter;
            const color = CATEGORY_COLORS[e.category];
            return (
              <button
                key={e.z}
                onClick={() => setSelected(e)}
                style={{ gridColumn: pos.col, gridRow: pos.row, background: color + (dimmed ? "10" : "26"), borderColor: color + (dimmed ? "20" : "88") }}
                className={cn("aspect-square rounded-[4px] border p-0.5 text-left transition hover:scale-[1.12] hover:z-10 hover:shadow-lift", dimmed && "opacity-35")}
                title={e.name}
              >
                <div className="text-[7px] leading-none text-ink-faint">{e.z}</div>
                <div className="text-[11px] font-bold leading-none" style={{ color }}>{e.symbol}</div>
                <div className="mt-0.5 hidden truncate text-[6px] leading-none text-ink-muted sm:block">{e.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail popup */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} />
            <motion.div
              className="relative w-full max-w-sm glass rounded-2xl p-6 shadow-lift"
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            >
              <button onClick={() => setSelected(null)} className="btn-ghost btn-sm absolute right-3 top-3"><X size={16} /></button>
              <div className="flex items-start gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-xl" style={{ background: CATEGORY_COLORS[selected.category] + "22", border: `2px solid ${CATEGORY_COLORS[selected.category]}` }}>
                  <div className="text-center">
                    <div className="text-[10px] text-ink-faint">{selected.z}</div>
                    <div className="text-2xl font-extrabold" style={{ color: CATEGORY_COLORS[selected.category] }}>{selected.symbol}</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selected.name}</h3>
                  <div className="text-sm capitalize text-ink-muted">{selected.category}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Info label="Atomic number" value={selected.z} />
                <Info label="Atomic mass" value={selected.mass} />
                <Info label="Group" value={selected.group || "f-block"} />
                <Info label="Period" value={selected.period} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-edge px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}
