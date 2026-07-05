"use client";

// Scientific calculator built on the expression engine: type or click keys,
// Enter evaluates, with a persistent history and `ans` chaining.

import { useRef, useState } from "react";
import { Delete, History } from "lucide-react";
import { evaluate } from "@/lib/science/expression";
import { cn } from "@/lib/utils";

const KEYS: (string | { label: string; insert: string })[][] = [
  [{ label: "sin", insert: "sin(" }, { label: "cos", insert: "cos(" }, { label: "tan", insert: "tan(" }, { label: "π", insert: "pi" }, { label: "e", insert: "e" }],
  [{ label: "ln", insert: "ln(" }, { label: "log", insert: "log(" }, { label: "√", insert: "sqrt(" }, { label: "x²", insert: "^2" }, { label: "^", insert: "^" }],
  ["7", "8", "9", { label: "(", insert: "(" }, { label: ")", insert: ")" }],
  ["4", "5", "6", { label: "×", insert: "*" }, { label: "÷", insert: "/" }],
  ["1", "2", "3", { label: "+", insert: "+" }, { label: "−", insert: "-" }],
  ["0", ".", { label: "ans", insert: "ans" }, { label: "abs", insert: "abs(" }, { label: "exp", insert: "exp(" }],
];

export function SciCalc() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [ans, setAns] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const result = expr.trim() ? evaluate(expr, { ans }) : null;
  const preview = typeof result === "number" && Number.isFinite(result) ? formatResult(result) : null;

  const insert = (text: string) => {
    setExpr((prev) => prev + text);
    inputRef.current?.focus();
  };

  const commit = () => {
    if (typeof result !== "number" || !Number.isFinite(result)) return;
    setHistory((h) => [{ expr, result: formatResult(result) }, ...h].slice(0, 8));
    setAns(result);
    setExpr("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div>
        <div className="rounded-xl border border-edge bg-surface p-3">
          <input
            ref={inputRef}
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-full bg-transparent text-right font-mono text-xl outline-none placeholder:text-ink-faint"
            placeholder="0"
            aria-label="Calculator expression"
          />
          <div className={cn("mt-1 min-h-[1.5rem] text-right font-mono text-sm", preview ? "text-brand-600 dark:text-brand-300" : "text-crimson-600")}>
            {expr.trim() === "" ? " " : preview ?? (result && typeof result === "object" ? result.error : "…")}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {KEYS.flat().map((k, i) => {
            const label = typeof k === "string" ? k : k.label;
            const ins = typeof k === "string" ? k : k.insert;
            return (
              <button key={i} onClick={() => insert(ins)} className="btn-secondary btn-sm !px-0 font-mono">{label}</button>
            );
          })}
          <button onClick={() => setExpr((p) => p.slice(0, -1))} className="btn-secondary btn-sm !px-0 col-span-2" aria-label="Backspace"><Delete size={14} /></button>
          <button onClick={() => setExpr("")} className="btn-secondary btn-sm !px-0">C</button>
          <button onClick={commit} className="btn-primary btn-sm !px-0 col-span-2">=</button>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint"><History size={12} /> History</div>
        {history.length === 0 ? (
          <p className="text-xs text-ink-faint">Results appear here. Use <code className="font-mono">ans</code> to chain.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <button key={i} onClick={() => setExpr(h.result)} className="block w-full rounded-lg border border-edge px-2.5 py-1.5 text-left transition hover:border-brand-400">
                <div className="truncate font-mono text-[11px] text-ink-faint">{h.expr}</div>
                <div className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-300">{h.result}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatResult(x: number): string {
  if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
  if (Math.abs(x) >= 1e12 || (Math.abs(x) < 1e-9 && x !== 0)) return x.toExponential(6);
  return String(Math.round(x * 1e10) / 1e10);
}
