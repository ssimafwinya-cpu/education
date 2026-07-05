"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Scale, Calculator, Droplets, TableProperties, Hexagon, Atom, Zap } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import { Segmented, Badge } from "@/components/ui";
import { PeriodicTable } from "@/components/science/periodic-table";
import { MoleculeViewer } from "@/components/science/molecule-viewer";
import { molarMass, parseFormula, balanceEquation, acidBase, molesFromMass, massFromMoles, molarity } from "@/lib/science/chemistry";
import { fromSmiles, MOLECULE_PRESETS, SmilesError } from "@/lib/science/smiles";
import { detectFunctionalGroups } from "@/lib/science/functional-groups";
import { oxidationStates, combineIons, CATIONS, ANIONS, electronConfiguration, ionSymbol, elementByNumber } from "@/lib/science/inorganic";

export default function ChemistryLab() {
  const [tab, setTab] = useState<"organic" | "inorganic" | "general">("organic");
  return (
    <div>
      <ToolHeader title="Chemistry AI Lab" subtitle="A 2D structure studio for organic chemistry, oxidation & bonding tools for inorganic, plus the exact calculators — nothing estimated." icon={<FlaskConical size={22} />} tone="accent" />

      <div className="mb-5">
        <Segmented value={tab} onChange={setTab} options={[
          { value: "organic", label: <span className="flex items-center gap-1"><Hexagon size={14} /> Organic</span> },
          { value: "inorganic", label: <span className="flex items-center gap-1"><Atom size={14} /> Inorganic</span> },
          { value: "general", label: <span className="flex items-center gap-1"><TableProperties size={14} /> General</span> },
        ]} />
      </div>

      {tab === "organic" && (
        <div className="grid gap-5">
          <MoleculeStudio />
          <div className="grid gap-5 lg:grid-cols-2">
            <MolarMass />
            <PhCalc />
          </div>
        </div>
      )}

      {tab === "inorganic" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <OxidationStates />
          <IonicNamer />
          <ElectronConfig />
          <Balancer />
        </div>
      )}

      {tab === "general" && (
        <div className="grid gap-5">
          <Tool title="Interactive periodic table" icon={<TableProperties size={17} className="text-accent-500" />}>
            <PeriodicTable />
          </Tool>
          <div className="grid gap-5 lg:grid-cols-2">
            <MolarMass />
            <Balancer />
            <PhCalc />
            <Stoichiometry />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Organic: 2D molecule studio ─────────────────────────────────────────────
function MoleculeStudio() {
  const [smiles, setSmiles] = useState("CC(=O)Oc1ccccc1C(=O)O"); // aspirin
  const result = useMemo(() => {
    try { return { ok: true as const, info: fromSmiles(smiles) }; }
    catch (e) { return { ok: false as const, error: e instanceof SmilesError ? e.message : "Could not parse structure" }; }
  }, [smiles]);
  const groups = result.ok ? detectFunctionalGroups(result.info) : [];

  return (
    <Tool title="2D molecule studio (SMILES)" icon={<Hexagon size={17} className="text-accent-500" />}>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div>
          <Field label="SMILES structure">
            <input value={smiles} onChange={(e) => setSmiles(e.target.value)} className="input font-mono" placeholder="e.g. CCO or c1ccccc1" />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1">
            {MOLECULE_PRESETS.map((p) => (
              <button key={p.name} onClick={() => setSmiles(p.smiles)} className="chip border border-edge text-ink-muted transition hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-300">{p.name}</button>
            ))}
          </div>
          {result.ok ? (
            <div className="mt-4 rounded-xl border border-edge bg-surface p-3">
              <MoleculeViewer mol={result.info} size={300} />
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-crimson-600/40 bg-crimson-600/5 p-3 text-sm text-crimson-600">{result.error}</p>
          )}
        </div>

        <div>
          {result.ok && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <ResultRow label="Formula" value={<span dangerouslySetInnerHTML={{ __html: subscript(result.info.formula) }} />} tone="accent" />
                <ResultRow label="Molar mass" value={`${result.info.mass} g/mol`} tone="accent" />
                <ResultRow label="Unsaturation" value={result.info.degreeOfUnsaturation ?? "—"} tone="accent" />
              </div>
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Functional groups detected</div>
                {groups.length === 0 ? (
                  <p className="text-sm text-ink-muted">No characteristic groups — likely a hydrocarbon skeleton.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g) => (
                      <Badge key={g.name} tone="accent">{g.name}{g.count > 1 ? ` ×${g.count}` : ""}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-edge p-3 text-xs text-ink-muted">
                <span className="font-semibold text-ink">Atoms:</span> {result.info.atoms.length} heavy · {result.info.hydrogens.reduce((s, h) => s + h, 0)} hydrogen ·
                <span className="font-semibold text-ink"> Rings:</span> {result.info.ringAtoms.filter(Boolean).length > 0 ? "yes" : "none"}
              </div>
            </>
          )}
        </div>
      </div>
    </Tool>
  );
}

function subscript(formula: string): string {
  return formula.replace(/(\d+)/g, "<sub>$1</sub>");
}

// ─── Inorganic: oxidation states ─────────────────────────────────────────────
function OxidationStates() {
  const [formula, setFormula] = useState("KMnO4");
  const [charge, setCharge] = useState(0);
  const result = oxidationStates(formula, charge);
  return (
    <Tool title="Oxidation-state solver" icon={<Zap size={17} className="text-accent-500" />}>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="Formula (or ion)"><input value={formula} onChange={(e) => setFormula(e.target.value)} className="input font-mono" /></Field>
        <Field label="Charge"><input type="number" value={charge} onChange={(e) => setCharge(+e.target.value)} className="input w-20 text-center" /></Field>
      </div>
      <div className="mt-3">
        {"error" in result ? (
          <p className="text-sm text-crimson-600">{result.error}</p>
        ) : result.ok ? (
          <ResultBox tone="accent">
            <div className="flex flex-wrap gap-2">
              {result.states.map((s) => (
                <div key={s.element} className="rounded-lg border border-edge bg-surface-raised px-3 py-1.5 text-center">
                  <div className="font-mono text-sm font-semibold">{s.element}{s.count > 1 ? <sub>{s.count}</sub> : ""}</div>
                  <div className={`font-mono text-lg font-bold ${s.oxidation > 0 ? "text-brand-600" : s.oxidation < 0 ? "text-crimson-600" : "text-ink-muted"}`}>{s.oxidation > 0 ? "+" : ""}{s.oxidation}</div>
                  <div className="text-[9px] text-ink-faint">{s.assumed ? "rule" : "solved"}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-faint">{result.note}</p>
          </ResultBox>
        ) : <p className="text-sm text-ink-muted">{result.note}</p>}
      </div>
    </Tool>
  );
}

// ─── Inorganic: ionic compound builder ───────────────────────────────────────
function IonicNamer() {
  const [catIdx, setCatIdx] = useState(9); // Fe(II)
  const [anIdx, setAnIdx] = useState(4); // OH
  const combo = combineIons(CATIONS[catIdx], ANIONS[anIdx]);
  return (
    <Tool title="Ionic compound builder" icon={<Atom size={17} className="text-accent-500" />}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Cation">
          <select value={catIdx} onChange={(e) => setCatIdx(+e.target.value)} className="input">
            {CATIONS.map((c, i) => <option key={i} value={i}>{ionSymbol(c)} · {c.name} ({c.charge > 0 ? "+" : ""}{c.charge})</option>)}
          </select>
        </Field>
        <Field label="Anion">
          <select value={anIdx} onChange={(e) => setAnIdx(+e.target.value)} className="input">
            {ANIONS.map((a, i) => <option key={i} value={i}>{ionSymbol(a)} · {a.name} ({a.charge})</option>)}
          </select>
        </Field>
      </div>
      <ResultBox tone="accent">
        <div className="text-2xl font-bold text-accent-600 dark:text-accent-300" dangerouslySetInnerHTML={{ __html: subscript(combo.formula) }} />
        <div className="mt-1 text-sm capitalize text-ink-muted">{combo.name}</div>
        <div className="mt-1 text-xs text-ink-faint">Ratio {combo.ratio[0]} : {combo.ratio[1]} · molar mass {molarMass(combo.formula.replace(/[()]/g, "")) ?? "—"} g/mol</div>
      </ResultBox>
    </Tool>
  );
}

// ─── Inorganic: electron configuration ───────────────────────────────────────
function ElectronConfig() {
  const [z, setZ] = useState(26); // iron
  const cfg = electronConfiguration(z);
  const element = elementByNumber(z);
  return (
    <Tool title="Electron configuration" icon={<Atom size={17} className="text-accent-500" />}>
      <Field label={`Atomic number (Z) = ${z}${element ? ` · ${element.name}` : ""}`}>
        <input type="range" min={1} max={118} value={z} onChange={(e) => setZ(+e.target.value)} className="w-full accent-accent-500" />
      </Field>
      {"error" in cfg ? <p className="text-sm text-crimson-600">{cfg.error}</p> : (
        <div className="mt-3 space-y-2">
          <ResultBox tone="accent">
            <div className="text-xs uppercase tracking-wide text-ink-faint">Full configuration</div>
            <div className="font-mono text-sm">{cfg.full}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-ink-faint">Condensed</div>
            <div className="font-mono text-sm font-semibold text-accent-600 dark:text-accent-300">{cfg.condensed}</div>
          </ResultBox>
          <div className="grid grid-cols-2 gap-2">
            <ResultRow label="Valence electrons" value={cfg.valenceElectrons} tone="accent" />
            <ResultRow label="Shells (K,L,M…)" value={cfg.shells.join(", ")} tone="accent" />
          </div>
        </div>
      )}
    </Tool>
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
