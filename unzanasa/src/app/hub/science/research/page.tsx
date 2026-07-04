"use client";

import { useState } from "react";
import { BookOpen, Copy, Check, Quote, Link2 } from "lucide-react";
import { ToolHeader, Tool, Field } from "@/components/science/tool-kit";
import { useToast } from "@/components/ui";
import { formatCitation, CITATION_STYLES, type Reference, type CitationStyle } from "@/lib/science/citations";

export default function ResearchHub() {
  return (
    <div>
      <ToolHeader title="Research Hub" subtitle="Generate citations in five styles, format DOIs and organise references." icon={<BookOpen size={22} />} tone="accent" />
      <div className="grid gap-5 lg:grid-cols-2">
        <CitationGenerator />
        <DoiFormatter />
      </div>
    </div>
  );
}

function CitationGenerator() {
  const toast = useToast();
  const [ref, setRef] = useState<Reference>({
    authors: ["Mulenga, Chanda", "Phiri, Natasha"],
    year: "2025", title: "Spaced repetition in undergraduate science education",
    source: "Journal of Zambian Science", volume: "12", issue: "3", pages: "45-58", doi: "10.1000/jzs.2025.123",
  });
  const [style, setStyle] = useState<CitationStyle>("APA");
  const [copied, setCopied] = useState(false);
  const citation = formatCitation(ref, style);
  const set = (patch: Partial<Reference>) => setRef({ ...ref, ...patch });

  return (
    <Tool title="Citation generator" icon={<Quote size={17} className="text-accent-500" />} className="lg:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Authors (comma-separated, 'Surname, Initials')">
          <input value={ref.authors.join("; ")} onChange={(e) => set({ authors: e.target.value.split(";").map((s) => s.trim()).filter(Boolean) })} className="input" />
        </Field>
        <Field label="Year"><input value={ref.year} onChange={(e) => set({ year: e.target.value })} className="input" /></Field>
        <Field label="Title"><input value={ref.title} onChange={(e) => set({ title: e.target.value })} className="input" /></Field>
        <Field label="Source (journal / publisher)"><input value={ref.source ?? ""} onChange={(e) => set({ source: e.target.value })} className="input" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Volume"><input value={ref.volume ?? ""} onChange={(e) => set({ volume: e.target.value })} className="input" /></Field>
          <Field label="Issue"><input value={ref.issue ?? ""} onChange={(e) => set({ issue: e.target.value })} className="input" /></Field>
          <Field label="Pages"><input value={ref.pages ?? ""} onChange={(e) => set({ pages: e.target.value })} className="input" /></Field>
        </div>
        <Field label="DOI"><input value={ref.doi ?? ""} onChange={(e) => set({ doi: e.target.value })} className="input" /></Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CITATION_STYLES.map((s) => (
          <button key={s} onClick={() => setStyle(s)} className={`chip border ${style === s ? "border-accent-400 bg-accent-500/10 text-accent-600 dark:text-accent-300" : "border-edge text-ink-muted"}`}>{s}</button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-accent-500/30 bg-accent-500/5 p-4">
        <p className="text-sm leading-relaxed">{citation}</p>
        <button
          onClick={() => { navigator.clipboard?.writeText(citation); setCopied(true); toast({ emoji: "📋", title: `${style} citation copied` }); setTimeout(() => setCopied(false), 1500); }}
          className="btn-secondary btn-sm mt-3"
        >
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy {style}</>}
        </button>
      </div>
    </Tool>
  );
}

function DoiFormatter() {
  const [doi, setDoi] = useState("10.1038/s41586-021-03819-2");
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
  const url = `https://doi.org/${clean}`;
  return (
    <Tool title="DOI formatter & lookup" icon={<Link2 size={17} className="text-accent-500" />}>
      <Field label="DOI or DOI URL"><input value={doi} onChange={(e) => setDoi(e.target.value)} className="input font-mono" /></Field>
      <div className="mt-3 rounded-xl border border-edge p-3 text-sm">
        <div className="text-xs uppercase tracking-wide text-ink-faint">Resolvable link</div>
        <a href={url} target="_blank" rel="noreferrer" className="break-all font-mono text-accent-600 hover:underline">{url}</a>
      </div>
      <p className="mt-2 text-xs text-ink-faint">Opens the publisher's record. Full metadata auto-fill via Crossref is enabled when the platform is configured with network access.</p>
    </Tool>
  );
}
