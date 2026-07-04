"use client";

import { useState } from "react";
import { Dna, Grid2x2, Sigma } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import {
  cleanSeq, isValidDNA, complementDNA, reverseComplement, transcribe, translate, gcContent,
  punnettSquare, hardyWeinbergFromQ2, AMINO_ACID_NAMES,
} from "@/lib/science/biology";

export default function BiologyLab() {
  return (
    <div>
      <ToolHeader title="Biology AI Lab" subtitle="Molecular biology and genetics tools — transcription, translation, Punnett squares and Hardy-Weinberg." icon={<Dna size={22} />} tone="brand" />
      <div className="grid gap-5 lg:grid-cols-2">
        <DnaToolkit />
        <Punnett />
        <HardyWeinberg />
      </div>
    </div>
  );
}

function DnaToolkit() {
  const [seq, setSeq] = useState("ATGGCUAGCAAAGGA".replace(/U/g, "T"));
  const clean = cleanSeq(seq);
  const valid = isValidDNA(clean);
  const { peptide, codons } = valid ? translate(clean, true) : { peptide: "", codons: [] };
  return (
    <Tool title="DNA / RNA toolkit" icon={<Dna size={17} className="text-brand-500" />} className="lg:col-span-2">
      <Field label="DNA coding strand (A, T, G, C)">
        <input value={seq} onChange={(e) => setSeq(e.target.value)} className="input font-mono tracking-wider" />
      </Field>
      {valid ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <ResultRow label="Length" value={`${clean.length} bp`} />
            <ResultRow label="GC content" value={`${gcContent(clean)}%`} />
            <ResultRow label="Complement" value={<span className="font-mono">{complementDNA(clean).slice(0, 24)}{clean.length > 24 ? "…" : ""}</span>} />
            <ResultRow label="Reverse complement" value={<span className="font-mono">{reverseComplement(clean).slice(0, 24)}{clean.length > 24 ? "…" : ""}</span>} />
            <ResultRow label="mRNA" value={<span className="font-mono">{transcribe(clean).slice(0, 24)}{clean.length > 24 ? "…" : ""}</span>} />
          </div>
          <ResultBox>
            <div className="text-xs uppercase tracking-wide text-ink-faint">Translated peptide</div>
            <div className="mt-1 font-mono text-lg font-bold text-brand-600 dark:text-brand-300">{peptide || "(no start)"}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {codons.slice(0, 12).map((c, i) => (
                <span key={i} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300" title={AMINO_ACID_NAMES[peptide[i]] ?? ""}>{c}</span>
              ))}
            </div>
          </ResultBox>
        </div>
      ) : (
        <p className="mt-2 text-sm text-crimson-600">Enter a valid DNA sequence using only A, T, G and C.</p>
      )}
    </Tool>
  );
}

function Punnett() {
  const [p1, setP1] = useState("Aa"), [p2, setP2] = useState("Aa");
  const r = punnettSquare(p1, p2);
  return (
    <Tool title="Punnett square (monohybrid)" icon={<Grid2x2 size={17} className="text-brand-500" />}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Parent 1 genotype"><input value={p1} onChange={(e) => setP1(e.target.value)} className="input text-center font-mono" maxLength={2} /></Field>
        <Field label="Parent 2 genotype"><input value={p2} onChange={(e) => setP2(e.target.value)} className="input text-center font-mono" maxLength={2} /></Field>
      </div>
      {r ? (
        <div className="mt-3">
          <div className="mx-auto grid w-max grid-cols-3 gap-1 text-center font-mono text-sm">
            <div />
            {p2.split("").map((a, i) => <div key={`top-${i}`} className="grid h-10 w-10 place-items-center font-bold text-brand-600">{a}</div>)}
            {r.grid.flatMap((row, i) => [
              <div key={`side-${i}`} className="grid h-10 w-10 place-items-center font-bold text-brand-600">{p1[i]}</div>,
              ...row.map((g, j) => <div key={`cell-${i}-${j}`} className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 font-semibold">{g}</div>),
            ])}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {Object.entries(r.genotypes).map(([g, n]) => <span key={g} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300">{g}: {n}/4</span>)}
          </div>
        </div>
      ) : <p className="mt-2 text-sm text-crimson-600">Enter two-letter genotypes (e.g. Aa).</p>}
    </Tool>
  );
}

function HardyWeinberg() {
  const [q2, setQ2] = useState(0.01);
  const hw = hardyWeinbergFromQ2(q2);
  return (
    <Tool title="Hardy-Weinberg equilibrium" icon={<Sigma size={17} className="text-brand-500" />}>
      <Field label={`Recessive phenotype frequency (q²) = ${q2}`}>
        <input type="range" min={0} max={1} step={0.01} value={q2} onChange={(e) => setQ2(+e.target.value)} className="w-full accent-brand-500" />
      </Field>
      {hw ? (
        <div className="mt-3 space-y-2">
          <ResultRow label="Allele freq p (dominant)" value={hw.p} />
          <ResultRow label="Allele freq q (recessive)" value={hw.q} />
          <ResultRow label="AA (homozygous dominant)" value={hw.AA} />
          <ResultRow label="Aa (heterozygous)" value={hw.Aa} />
          <ResultRow label="aa (homozygous recessive)" value={hw.aa} />
        </div>
      ) : null}
    </Tool>
  );
}
