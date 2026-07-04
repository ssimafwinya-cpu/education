"use client";

import { useState } from "react";
import { FlaskConical, Scale, Calculator, Droplets, TableProperties } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import { PeriodicTable } from "@/components/science/periodic-table";
import { molarMass, parseFormula, balanceEquation, acidBase, molesFromMass, massFromMoles, molarity } from "@/lib/science/chemistry";

export default function ChemistryLab() {
  return (
    <div>
      <ToolHeader title="Chemistry AI Lab" subtitle="Interactive periodic table, equation balancer, molar mass, pH and stoichiometry — computed exactly, not estimated." icon={<FlaskConical size={22} />} tone="accent" />

      <Tool title="Interactive periodic table" icon={<TableProperties size={17} className="text-accent-500" />} className="mb-5">
        <PeriodicTable />
      </Tool>

      <div className="grid gap-5 lg:grid-cols-2">
        <MolarMass />
        <Balancer />
        <PhCalc />
        <Stoichiometry />
      </div>
    </div>
  );
}

function MolarMass() {
  const [f, setF] = useState("C6H12O6");
  const parsed = parseFormula(f);
  return (
    <Tool title="Molar mass calculator" icon={<Scale size={17} className="text-accent-500" />}>
      <Field label="Chemical formula (e.g. Ca(OH)2, CuSO4·5H2O)">
        <input value={f} onChange={(e) => setF(e.target.value)} className="input font-mono" placeholder="H2O" />
      </Field>
      <div className="mt-3">
        {parsed.ok ? (
          <ResultBox tone="accent">
            <div className="text-2xl font-bold text-accent-600 dark:text-accent-300">{parsed.mass} g/mol</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(parsed.counts).map(([el, n]) => (
                <span key={el} className="chip bg-accent-500/10 text-accent-600 dark:text-accent-300">{el}{n > 1 ? `×${n}` : ""}</span>
              ))}
            </div>
          </ResultBox>
        ) : (
          <p className="text-sm text-crimson-600">{parsed.error}</p>
        )}
      </div>
    </Tool>
  );
}

function Balancer() {
  const [eq, setEq] = useState("H2 + O2 -> H2O");
  const result = balanceEquation(eq);
  return (
    <Tool title="Equation balancer" icon={<Calculator size={17} className="text-accent-500" />}>
      <Field label="Unbalanced equation (use -> between sides)">
        <input value={eq} onChange={(e) => setEq(e.target.value)} className="input font-mono" placeholder="CH4 + O2 -> CO2 + H2O" />
      </Field>
      <div className="mt-3">
        {result.ok ? (
          <ResultBox tone="accent">
            <div className="font-mono text-lg font-semibold text-accent-600 dark:text-accent-300">{result.balanced}</div>
            <div className="mt-1 text-xs text-ink-faint">Coefficients: {result.coefficients.join(", ")}</div>
          </ResultBox>
        ) : (
          <p className="text-sm text-crimson-600">{result.error}</p>
        )}
      </div>
    </Tool>
  );
}

function PhCalc() {
  const [ph, setPh] = useState(3);
  const r = acidBase(ph);
  const toneOf = r.classification === "acidic" ? "crimson" : r.classification === "basic" ? "brand" : "accent";
  return (
    <Tool title="Acid–base / pH calculator" icon={<Droplets size={17} className="text-accent-500" />}>
      <Field label={`pH = ${ph.toFixed(1)}`}>
        <input type="range" min={0} max={14} step={0.1} value={ph} onChange={(e) => setPh(+e.target.value)} className="w-full accent-accent-500" />
      </Field>
      <div className="mt-3 space-y-2">
        <ResultRow label="Classification" value={<span className="capitalize">{r.classification}</span>} tone={toneOf} />
        <ResultRow label="pOH" value={r.pOH.toFixed(2)} tone="accent" />
        <ResultRow label="[H⁺]" value={`${r.h.toExponential(2)} M`} tone="accent" />
        <ResultRow label="[OH⁻]" value={`${r.oh.toExponential(2)} M`} tone="accent" />
      </div>
    </Tool>
  );
}

function Stoichiometry() {
  const [formula, setFormula] = useState("NaCl");
  const [mass, setMass] = useState(58.44);
  const [litres, setLitres] = useState(1);
  const mm = molarMass(formula);
  const moles = molesFromMass(mass, formula);
  const conc = moles !== null ? molarity(moles, litres) : null;
  return (
    <Tool title="Stoichiometry & solutions" icon={<Calculator size={17} className="text-accent-500" />}>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Formula"><input value={formula} onChange={(e) => setFormula(e.target.value)} className="input font-mono" /></Field>
        <Field label="Mass (g)"><input type="number" value={mass} onChange={(e) => setMass(+e.target.value)} className="input" /></Field>
        <Field label="Volume (L)"><input type="number" value={litres} onChange={(e) => setLitres(+e.target.value)} className="input" /></Field>
      </div>
      <div className="mt-3 space-y-2">
        <ResultRow label="Molar mass" value={mm ? `${mm} g/mol` : "—"} tone="accent" />
        <ResultRow label="Moles" value={moles !== null ? moles.toFixed(4) + " mol" : "—"} tone="accent" />
        <ResultRow label="Molarity" value={conc !== null ? conc.toFixed(4) + " M" : "—"} tone="accent" />
      </div>
    </Tool>
  );
}
