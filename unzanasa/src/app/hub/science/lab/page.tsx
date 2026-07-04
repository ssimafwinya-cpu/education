"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Microscope, FileText, Beaker, Copy, Check, StickyNote, ShieldAlert } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow } from "@/components/science/tool-kit";
import { useStore, actions } from "@/lib/store";
import { useToast } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { buildLabReport, missingSections, type LabReportInput } from "@/lib/science/lab-report";

export default function LabAssistant() {
  return (
    <div>
      <ToolHeader title="AI Lab Assistant" subtitle="Generate a professional lab-report structure from your own observations, and prep solutions safely." icon={<Microscope size={22} />} tone="brand" />
      <div className="grid gap-5 lg:grid-cols-2">
        <LabReport />
        <SolutionPrep />
      </div>
    </div>
  );
}

function LabReport() {
  const { dispatch } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState<LabReportInput>({
    title: "Determination of the Concentration of Acetic Acid in Vinegar",
    course: "CHE 1010 — Practical Chemistry",
    aim: "To determine the concentration of acetic acid in commercial vinegar by titration.",
    materials: "Burette (50 mL)\nPipette (25 mL)\n0.1 M NaOH\nPhenolphthalein indicator\nConical flask\nVinegar sample",
    methods: "Pipette 25 mL of vinegar into a conical flask\nAdd 2–3 drops of phenolphthalein\nTitrate with 0.1 M NaOH until a permanent pink colour\nRecord the titre volume\nRepeat for concordant results",
    observations: "Trial\tInitial (mL)\tFinal (mL)\tTitre (mL)\n1\t0.00\t23.40\t23.40\n2\t0.00\t23.20\t23.20\n3\t0.00\t23.30\t23.30",
    objectives: "",
    background: "",
    discussion: "",
    sourcesOfError: "",
    conclusion: "",
    references: "",
  });

  const report = useMemo(() => buildLabReport(input), [input]);
  const missing = missingSections(report);
  const set = (patch: Partial<LabReportInput>) => setInput({ ...input, ...patch });

  const saveNote = () => {
    dispatch({ type: "ADD_NOTE", note: actions.newNote({ title: `Lab Report — ${input.title}`, content: report, tags: ["lab-report", "science"] }) });
    toast({ emoji: "🧪", title: "Lab report saved as a note" });
    router.push("/hub/notes");
  };

  return (
    <Tool title="AI lab-report generator" icon={<FileText size={17} className="text-brand-500" />} className="lg:col-span-2">
      <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5 font-semibold text-gold-600"><ShieldAlert size={14} /> Academic-integrity safe</span>
        The generator never invents experimental data. Your recorded observations are used verbatim; empty sections are flagged for you to complete.
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Title"><input value={input.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field>
          <Field label="Course"><input value={input.course} onChange={(e) => set({ course: e.target.value })} className="input" /></Field>
          <Field label="Aim"><textarea value={input.aim} onChange={(e) => set({ aim: e.target.value })} className="input min-h-[60px]" /></Field>
          <Field label="Materials (one per line)"><textarea value={input.materials} onChange={(e) => set({ materials: e.target.value })} className="input min-h-[80px]" /></Field>
          <Field label="Method (one step per line)"><textarea value={input.methods} onChange={(e) => set({ methods: e.target.value })} className="input min-h-[80px]" /></Field>
          <Field label="Observations — YOUR data (tab-separated becomes a table)"><textarea value={input.observations} onChange={(e) => set({ observations: e.target.value })} className="input min-h-[90px] font-mono text-xs" /></Field>
          <Field label="Discussion (optional — your analysis)"><textarea value={input.discussion} onChange={(e) => set({ discussion: e.target.value })} className="input min-h-[60px]" /></Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <ResultRow label="Sections to complete" value={missing} tone={missing === 0 ? "brand" : "gold"} />
          </div>
          <div className="max-h-[30rem] overflow-y-auto rounded-xl border border-edge bg-surface p-4">
            <Markdown content={report} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(report); setCopied(true); toast({ emoji: "📋", title: "Report copied" }); setTimeout(() => setCopied(false), 1500); }} className="btn-secondary btn-sm">
              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy markdown</>}
            </button>
            <button onClick={saveNote} className="btn-primary btn-sm"><StickyNote size={13} /> Save as note</button>
          </div>
        </div>
      </div>
    </Tool>
  );
}

function SolutionPrep() {
  const [c1, setC1] = useState(1);
  const [v2, setV2] = useState(250);
  const [c2, setC2] = useState(0.1);
  // C1V1 = C2V2  →  V1 = C2·V2 / C1
  const v1 = c1 > 0 ? (c2 * v2) / c1 : 0;
  const solvent = v2 - v1;
  return (
    <Tool title="Solution preparation (dilution)" icon={<Beaker size={17} className="text-brand-500" />} className="lg:col-span-2">
      <p className="mb-3 text-sm text-ink-muted">Using C₁V₁ = C₂V₂, find how much stock solution to dilute.</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Stock conc. C₁ (M)"><input type="number" value={c1} onChange={(e) => setC1(+e.target.value)} className="input" /></Field>
        <Field label="Target conc. C₂ (M)"><input type="number" value={c2} onChange={(e) => setC2(+e.target.value)} className="input" /></Field>
        <Field label="Target volume V₂ (mL)"><input type="number" value={v2} onChange={(e) => setV2(+e.target.value)} className="input" /></Field>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ResultRow label="Stock to measure (V₁)" value={`${Math.round(v1 * 100) / 100} mL`} />
        <ResultRow label="Add solvent" value={`${Math.round(solvent * 100) / 100} mL`} />
      </div>
    </Tool>
  );
}
