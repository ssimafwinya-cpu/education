"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Play, Square, Shuffle, StepForward, Terminal, Timer, Search } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow } from "@/components/science/tool-kit";
import {
  SORTERS, type SorterKey, type SortTrace, randomArray, binarySearchTrace,
} from "@/lib/science/algorithms";
import { cn } from "@/lib/utils";

export default function CsWorkspace() {
  return (
    <div>
      <ToolHeader title="Computer Science Workspace" subtitle="Run JavaScript in a sandbox, watch algorithms execute step by step, and learn complexity." icon={<Code2 size={22} />} tone="violet" />
      <div className="grid gap-5">
        <CodeRunner />
        <div className="grid gap-5 lg:grid-cols-2">
          <SortVisualizer />
          <div className="space-y-5">
            <BinarySearchViz />
            <BigO />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sandboxed JS runner (Web Worker + hard timeout) ─────────────────────────

const DEFAULT_CODE = `// JavaScript playground — console.log prints below.
function fib(n) {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}

for (let i = 1; i <= 10; i++) {
  console.log("fib(" + i + ") =", fib(i));
}`;

function CodeRunner() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<{ kind: "log" | "error" | "info"; text: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = (message?: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    if (message) setOutput((o) => [...o, { kind: "error", text: message }]);
  };

  useEffect(() => () => stop(), []);

  const run = () => {
    stop();
    setOutput([]);
    setMs(null);
    setRunning(true);
    const started = performance.now();

    // The worker source: capture console, run user code, post results back.
    const src = `
      const logs = [];
      const fmt = (v) => { try { return typeof v === "string" ? v : JSON.stringify(v); } catch { return String(v); } };
      console.log = (...a) => { logs.push(a.map(fmt).join(" ")); if (logs.length > 500) { postMessage({ kind: "error", text: "Output truncated (500 lines)" , logs}); close(); } };
      console.error = console.log; console.warn = console.log;
      try {
        const result = eval(${JSON.stringify(code)});
        postMessage({ kind: "done", logs, result: result === undefined ? undefined : fmt(result) });
      } catch (e) {
        postMessage({ kind: "error", text: String(e), logs });
      }
    `;
    const blob = new Blob([src], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { kind, logs, result, text } = e.data as { kind: string; logs: string[]; result?: string; text?: string };
      const out: { kind: "log" | "error" | "info"; text: string }[] = (logs ?? []).map((l: string) => ({ kind: "log" as const, text: l }));
      if (kind === "error" && text) out.push({ kind: "error", text });
      if (kind === "done" && result !== undefined) out.push({ kind: "info", text: `→ ${result}` });
      setOutput(out);
      setMs(Math.round((performance.now() - started) * 10) / 10);
      stop();
    };
    worker.onerror = (e) => stop(`Worker error: ${e.message}`);

    // Hard kill infinite loops after 3s.
    timerRef.current = setTimeout(() => stop("⏱ Execution timed out after 3s (infinite loop?)"), 3000);
  };

  return (
    <Tool title="JavaScript playground (sandboxed)" icon={<Terminal size={17} className="text-violet-500" />}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="input min-h-[240px] w-full resize-y !bg-slate-950 font-mono text-[13px] leading-relaxed !text-slate-100"
            aria-label="Code editor"
          />
          <div className="mt-2 flex items-center gap-2">
            {running ? (
              <button onClick={() => stop("Stopped.")} className="btn-secondary btn-sm"><Square size={13} className="fill-current" /> Stop</button>
            ) : (
              <button onClick={run} className="btn-primary btn-sm"><Play size={13} /> Run</button>
            )}
            {ms !== null && <span className="flex items-center gap-1 text-xs text-ink-faint"><Timer size={12} /> {ms} ms</span>}
            <span className="ml-auto text-[11px] text-ink-faint">Runs in a Web Worker — no page/network access, 3s limit.</span>
          </div>
        </div>
        <div className="min-h-[240px] rounded-xl border border-edge bg-slate-950 p-3 font-mono text-[13px] leading-relaxed">
          {output.length === 0 ? (
            <span className="text-slate-500">{running ? "Running…" : "Output appears here."}</span>
          ) : (
            output.map((line, i) => (
              <div key={i} className={cn(line.kind === "error" ? "text-rose-400" : line.kind === "info" ? "text-teal-300" : "text-slate-200")}>{line.text}</div>
            ))
          )}
        </div>
      </div>
    </Tool>
  );
}

// ─── Sorting visualizer ──────────────────────────────────────────────────────

function SortVisualizer() {
  const [algo, setAlgo] = useState<SorterKey>("bubble");
  const [data, setData] = useState<number[]>(() => randomArray(12));
  const [trace, setTrace] = useState<SortTrace | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (key: SorterKey = algo, arr: number[] = data) => {
    const t = SORTERS[key](arr);
    setTrace(t);
    setStep(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing || !trace) return;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= trace.steps.length) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 220);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, trace]);

  const current = trace?.steps[Math.min(step, (trace?.steps.length ?? 1) - 1)];
  const bars = current?.array ?? data;
  const max = Math.max(...bars, 1);

  return (
    <Tool title="Sorting visualizer" icon={<Shuffle size={17} className="text-violet-500" />}>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(SORTERS) as SorterKey[]).map((k) => (
          <button key={k} onClick={() => { setAlgo(k); setTrace(null); setPlaying(false); }} className={cn("chip border capitalize", algo === k ? "border-violet-400 bg-violet-500/10 text-violet-600 dark:text-violet-300" : "border-edge text-ink-muted")}>{k}</button>
        ))}
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => { const a = randomArray(12); setData(a); setTrace(null); setPlaying(false); }} className="btn-secondary btn-sm"><Shuffle size={13} /> New data</button>
          {playing ? (
            <button onClick={() => setPlaying(false)} className="btn-secondary btn-sm"><Square size={13} className="fill-current" /></button>
          ) : trace && step < trace.steps.length - 1 ? (
            <button onClick={() => setPlaying(true)} className="btn-primary btn-sm"><Play size={13} /></button>
          ) : (
            <button onClick={() => start()} className="btn-primary btn-sm"><Play size={13} /> Sort</button>
          )}
          {trace && <button onClick={() => setStep((s) => Math.min(s + 1, trace.steps.length - 1))} className="btn-secondary btn-sm" title="Step"><StepForward size={13} /></button>}
        </div>
      </div>

      {/* Bars */}
      <div className="mt-4 flex h-40 items-end gap-1">
        {bars.map((v, i) => {
          const isCompare = current?.comparing?.includes(i);
          const isSwap = current?.swapped?.includes(i);
          const isSorted = current?.sorted.includes(i);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn("w-full rounded-t-md transition-all duration-150",
                  isSwap ? "bg-crimson-600" : isCompare ? "bg-gold-500" : isSorted ? "bg-brand-500" : "bg-violet-400/60")}
                style={{ height: `${(v / max) * 100}%` }}
              />
              <span className="text-[9px] tabular-nums text-ink-faint">{v}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ink-muted">{current?.note ?? "Press Sort to animate."}</span>
        {trace && <span className="tabular-nums text-ink-faint">step {Math.min(step + 1, trace.steps.length)}/{trace.steps.length} · {trace.comparisons} comparisons · {trace.swaps} swaps</span>}
      </div>
      {trace && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          <ResultRow label="Best" value={trace.complexity.best} tone="violet" />
          <ResultRow label="Average" value={trace.complexity.average} tone="violet" />
          <ResultRow label="Worst" value={trace.complexity.worst} tone="violet" />
          <ResultRow label="Space" value={trace.complexity.space} tone="violet" />
        </div>
      )}
    </Tool>
  );
}

// ─── Binary search visualizer ────────────────────────────────────────────────

function BinarySearchViz() {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const [target, setTarget] = useState(23);
  const { steps, foundIndex } = binarySearchTrace(arr, target);
  const [stepIdx, setStepIdx] = useState(0);
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  useEffect(() => setStepIdx(0), [target]);

  return (
    <Tool title="Binary search visualizer" icon={<Search size={17} className="text-violet-500" />}>
      <div className="flex items-center gap-2">
        <Field label="Target"><input type="number" value={target} onChange={(e) => setTarget(+e.target.value)} className="input w-24" /></Field>
        <button onClick={() => setStepIdx((s) => Math.min(s + 1, Math.max(0, steps.length - 1)))} className="btn-secondary btn-sm mt-5"><StepForward size={13} /> Step</button>
      </div>
      <div className="mt-3 flex gap-1">
        {arr.map((v, i) => {
          const inRange = current && i >= current.lo && i <= current.hi;
          const isMid = current && i === current.mid;
          const isFound = foundIndex === i && stepIdx >= steps.length - 1;
          return (
            <div key={i} className={cn("flex-1 rounded-lg border py-2 text-center font-mono text-sm transition",
              isFound ? "border-brand-500 bg-brand-500/15 font-bold" :
              isMid ? "border-gold-500 bg-gold/15 font-bold" :
              inRange ? "border-violet-400/50 bg-violet-500/10" : "border-edge opacity-40")}>{v}</div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {steps.length === 0 ? "—" : current?.note}
        {stepIdx >= steps.length - 1 && foundIndex === null && ` — ${target} is not in the array.`}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">O(log n): {steps.length || 0} step{steps.length === 1 ? "" : "s"} for {arr.length} elements.</p>
    </Tool>
  );
}

// ─── Big-O reference ─────────────────────────────────────────────────────────

function BigO() {
  const rows: [string, string, string][] = [
    ["O(1)", "Constant", "Array index, hash lookup"],
    ["O(log n)", "Logarithmic", "Binary search"],
    ["O(n)", "Linear", "Single loop, linear scan"],
    ["O(n log n)", "Linearithmic", "Merge sort, heap sort"],
    ["O(n²)", "Quadratic", "Nested loops, bubble sort"],
    ["O(2ⁿ)", "Exponential", "Naive Fibonacci, subsets"],
  ];
  return (
    <Tool title="Big-O quick reference" icon={<Code2 size={17} className="text-violet-500" />}>
      <div className="space-y-1.5">
        {rows.map(([o, name, ex]) => (
          <div key={o} className="flex items-center gap-3 rounded-lg border border-edge px-3 py-1.5 text-sm">
            <span className="w-20 font-mono font-semibold text-violet-600 dark:text-violet-300">{o}</span>
            <span className="w-24 text-ink-muted">{name}</span>
            <span className="flex-1 text-xs text-ink-faint">{ex}</span>
          </div>
        ))}
      </div>
    </Tool>
  );
}
