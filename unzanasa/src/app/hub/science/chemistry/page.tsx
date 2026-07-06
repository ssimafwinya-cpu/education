"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Scale, Calculator, Droplets, TableProperties, Hexagon, Atom, Zap, Beaker, Wind, FlaskRound, PenTool } from "lucide-react";
import { ToolHeader, Tool, Field, ResultRow, ResultBox } from "@/components/science/tool-kit";
import { Segmented, Badge } from "@/components/ui";
import { PeriodicTable } from "@/components/science/periodic-table";
import { MoleculeViewer } from "@/components/science/molecule-viewer";
import { MoleculeSketcher } from "@/components/science/molecule-sketcher";
import { molarMass, parseFormula, balanceEquation, acidBase, molesFromMass, massFromMoles, molarity } from "@/lib/science/chemistry";
import { fromSmiles, MOLECULE_PRESETS, SmilesError } from "@/lib/science/smiles";
import { detectFunctionalGroups } from "@/lib/science/functional-groups";
import { describeMolecule, lipinski } from "@/lib/science/descriptors";
import { iupacName } from "@/lib/science/iupac";
import { oxidationStates, combineIons, CATIONS, ANIONS, electronConfiguration, ionSymbol, elementByNumber } from "@/lib/science/inorganic";
import { limitingReagent, percentYield, empiricalFormula, idealGas, weakAcidPH, pKa, type ReactantAmount } from "@/lib/science/reactions";
import { titrationCurve, suggestIndicator, type TitrationKind } from "@/lib/science/titration";

export default function ChemistryLab() {
  const [tab, setTab] = useState<"organic" | "inorganic" | "reactions" | "general">("organic");
  return (
    <div>
      <ToolHeader title="Chemistry AI Lab" subtitle="A 2D structure studio for organic chemistry, oxidation & bonding tools for inorganic, plus the exact calculators — nothing estimated." icon={<FlaskConical size={22} />} tone="accent" />

      <div className="mb-5">
        <Segmented value={tab} onChange={setTab} options={[
          { value: "organic", label: <span className="flex items-center gap-1"><Hexagon size={14} /> Organic</span> },
          { value: "inorganic", label: <span className="flex items-center gap-1"><Atom size={14} /> Inorganic</span> },
          { value: "reactions", label: <span className="flex items-center gap-1"><Beaker size={14} /> Reactions</span> },
          { value: "general", label: <span className="flex items-center gap-1"><TableProperties size={14} /> General</span> },
        ]} />
      </div>

      {tab === "organic" && (
        <div className="grid gap-5">
          <MoleculeStudio />
          <Tool title="Molecule sketcher (click to draw)" icon={<PenTool size={17} className="text-accent-500" />}>
            <MoleculeSketcher />
          </Tool>
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

      {tab === "reactions" && (
        <div className="grid gap-5">
          <TitrationSim />
          <LimitingReagent />
          <div className="grid gap-5 lg:grid-cols-3">
            <EmpiricalFormula />
            <GasLaw />
            <WeakAcid />
          </div>
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
  const desc = result.ok ? describeMolecule(result.info) : null;
  const rule5 = desc ? lipinski(desc) : null;
  const iupac = result.ok ? iupacName(result.info) : null;

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
              {iupac && ("name" in iupac ? (
                <div className="mt-2 rounded-lg border border-accent-400/40 bg-accent-500/5 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">IUPAC name</div>
                  <div className="text-lg font-semibold text-accent-600 dark:text-accent-300">{iupac.name}</div>
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-ink-faint">Systematic name unavailable: {iupac.error}</p>
              ))}
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
              {desc && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Molecular descriptors</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    <Descriptor label="Heavy atoms" value={desc.heavyAtoms} />
                    <Descriptor label="H donors" value={desc.hBondDonors} />
                    <Descriptor label="H acceptors" value={desc.hBondAcceptors} />
                    <Descriptor label="Rotatable" value={desc.rotatableBonds} />
                    <Descriptor label="Rings" value={desc.ringCount} />
                    <Descriptor label="Aromatic C/N" value={desc.aromaticAtoms} />
                  </div>
                </div>
              )}
              {rule5 && (
                <div className="mt-4 rounded-lg border border-edge p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Lipinski rule of five</span>
                    <Badge tone={rule5.passes ? "brand" : "crimson"}>
                      {rule5.passes ? "Drug-like" : `${rule5.violations} violation${rule5.violations > 1 ? "s" : ""}`}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    {rule5.criteria.map((c) => (
                      <div key={c.label} className="flex items-center justify-between text-xs">
                        <span className={c.ok ? "text-ink-muted" : "text-crimson-600"}>{c.ok ? "✓" : "✗"} {c.label}</span>
                        <span className="font-mono text-ink">{Math.round(c.value * 100) / 100} <span className="text-ink-faint">({c.limit})</span></span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-ink-faint">logP is not estimated here, so it is excluded from this check.</p>
                </div>
              )}
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

function Descriptor({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-edge bg-surface-raised px-2 py-1.5 text-center">
      <div className="font-mono text-base font-bold text-accent-600 dark:text-accent-300">{value}</div>
      <div className="text-[9px] leading-tight text-ink-faint">{label}</div>
    </div>
  );
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

// ─── Reactions: titration simulator ──────────────────────────────────────────
function TitrationSim() {
  const [kind, setKind] = useState<TitrationKind>("weak-acid-strong-base");
  const [analyteConc, setAnalyteConc] = useState(0.1);
  const [analyteVol, setAnalyteVol] = useState(25);
  const [titrantConc, setTitrantConc] = useState(0.1);
  const [pK, setPK] = useState(4.74); // pKa/pKb

  const weak = kind === "weak-acid-strong-base" || kind === "weak-base-strong-acid";
  const curve = useMemo(() => titrationCurve({
    kind, analyteConc, analyteVol, titrantConc,
    Ka: kind === "weak-acid-strong-base" ? Math.pow(10, -pK) : undefined,
    Kb: kind === "weak-base-strong-acid" ? Math.pow(10, -pK) : undefined,
  }), [kind, analyteConc, analyteVol, titrantConc, pK]);

  const W = 560, H = 260, pad = 36;
  const sx = (v: number) => pad + (v / curve.maxVolume) * (W - pad * 2);
  const sy = (ph: number) => H - pad - (ph / 14) * (H - pad * 2);
  const path = curve.points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.volume).toFixed(1)},${sy(p.pH).toFixed(1)}`).join(" ");

  return (
    <Tool title="Titration curve simulator" icon={<FlaskRound size={17} className="text-accent-500" />}>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <Field label="Titration type">
            <select value={kind} onChange={(e) => setKind(e.target.value as TitrationKind)} className="input">
              <option value="strong-acid-strong-base">Strong acid + strong base</option>
              <option value="weak-acid-strong-base">Weak acid + strong base</option>
              <option value="strong-base-strong-acid">Strong base + strong acid</option>
              <option value="weak-base-strong-acid">Weak base + strong acid</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Analyte conc (M)"><input type="number" step="0.01" value={analyteConc} onChange={(e) => setAnalyteConc(+e.target.value)} className="input" /></Field>
            <Field label="Analyte vol (mL)"><input type="number" value={analyteVol} onChange={(e) => setAnalyteVol(+e.target.value)} className="input" /></Field>
            <Field label="Titrant conc (M)"><input type="number" step="0.01" value={titrantConc} onChange={(e) => setTitrantConc(+e.target.value)} className="input" /></Field>
            {weak && <Field label={kind.includes("acid") ? "pKa" : "pKb"}><input type="number" step="0.1" value={pK} onChange={(e) => setPK(+e.target.value)} className="input" /></Field>}
          </div>
          <div className="space-y-2">
            <ResultRow label="Equivalence volume" value={`${curve.equivalenceVolume} mL`} tone="accent" />
            <ResultRow label="Equivalence pH" value={curve.equivalencePH} tone="accent" />
            <ResultRow label="Initial pH" value={curve.initialPH} tone="accent" />
          </div>
          <div className="rounded-lg border border-edge p-2.5 text-xs text-ink-muted">
            <span className="font-semibold text-ink">Indicator:</span> {suggestIndicator(curve.equivalencePH)}
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-edge bg-surface">
          {[0, 7, 14].map((g) => (
            <g key={g}>
              <line x1={pad} y1={sy(g)} x2={W - pad} y2={sy(g)} stroke="rgb(var(--edge))" strokeDasharray={g === 7 ? "4 4" : ""} />
              <text x={pad - 6} y={sy(g) + 3} textAnchor="end" fontSize={9} fill="rgb(var(--ink-faint))">{g}</text>
            </g>
          ))}
          {/* equivalence marker */}
          <line x1={sx(curve.equivalenceVolume)} y1={pad} x2={sx(curve.equivalenceVolume)} y2={H - pad} stroke="#dc2626" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
          <path d={path} fill="none" stroke="#0d9488" strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={sx(curve.equivalenceVolume)} cy={sy(curve.equivalencePH)} r={4} fill="#dc2626" />
          <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="rgb(var(--ink-faint))">Titrant added (mL)</text>
          <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fill="rgb(var(--ink-faint))" transform={`rotate(-90 12 ${H / 2})`}>pH</text>
        </svg>
      </div>
    </Tool>
  );
}

// ─── Reactions: limiting reagent & yield ─────────────────────────────────────
function LimitingReagent() {
  const [equation, setEquation] = useState("N2 + H2 -> NH3");
  const [amounts, setAmounts] = useState<Record<string, { value: number; unit: "g" | "mol" }>>({
    N2: { value: 28, unit: "g" }, H2: { value: 10, unit: "g" },
  });
  const [actual, setActual] = useState<number | "">("");

  // reactants come from the left of the arrow
  const reactantFormulas = useMemo(() => {
    const left = equation.split(/->|=>|=|→/)[0] ?? "";
    return left.split("+").map((s) => s.trim()).filter(Boolean);
  }, [equation]);

  const result = useMemo(() => {
    const inputs: ReactantAmount[] = reactantFormulas.map((f) => ({ formula: f, value: amounts[f]?.value ?? 0, unit: amounts[f]?.unit ?? "g" }));
    return limitingReagent(equation, inputs);
  }, [equation, amounts, reactantFormulas]);

  const firstProduct = "error" in result ? null : result.products[0];
  const pct = firstProduct && actual !== "" ? percentYield(actual, firstProduct.grams) : null;

  return (
    <Tool title="Limiting reagent & yield" icon={<Beaker size={17} className="text-accent-500" />}>
      <Field label="Reaction (balanced automatically)">
        <input value={equation} onChange={(e) => setEquation(e.target.value)} className="input font-mono" placeholder="N2 + H2 -> NH3" />
      </Field>
      <div className="mt-3 flex flex-wrap gap-3">
        {reactantFormulas.map((f) => (
          <div key={f} className="flex items-end gap-1.5">
            <Field label={f}><input type="number" value={amounts[f]?.value ?? ""} onChange={(e) => setAmounts({ ...amounts, [f]: { value: +e.target.value, unit: amounts[f]?.unit ?? "g" } })} className="input w-24" /></Field>
            <select value={amounts[f]?.unit ?? "g"} onChange={(e) => setAmounts({ ...amounts, [f]: { value: amounts[f]?.value ?? 0, unit: e.target.value as "g" | "mol" } })} className="input mb-0 w-16">
              <option value="g">g</option><option value="mol">mol</option>
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3">
        {"error" in result ? (
          <p className="text-sm text-crimson-600">{result.error}</p>
        ) : (
          <ResultBox tone="accent">
            <div className="font-mono text-sm">{result.balanced}</div>
            <div className="mt-2 text-sm">Limiting reagent: <strong className="text-crimson-600">{result.limiting}</strong> · reaction extent {result.extent}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.products.map((p) => (
                <div key={p.formula} className="rounded-lg border border-edge bg-surface-raised px-3 py-1.5 text-center">
                  <div className="font-mono text-sm font-semibold" dangerouslySetInnerHTML={{ __html: subscript(p.formula) }} />
                  <div className="text-xs text-ink-muted">{p.moles} mol · {p.grams} g</div>
                </div>
              ))}
            </div>
            {firstProduct && (
              <div className="mt-3 flex items-center gap-2 border-t border-edge pt-2">
                <span className="text-xs text-ink-muted">Actual yield of {firstProduct.formula} (g):</span>
                <input type="number" value={actual} onChange={(e) => setActual(e.target.value === "" ? "" : +e.target.value)} className="input w-24" />
                {pct !== null && <Badge tone={pct >= 80 ? "brand" : "gold"}>{pct}% yield</Badge>}
              </div>
            )}
          </ResultBox>
        )}
      </div>
    </Tool>
  );
}

// ─── Reactions: empirical / molecular formula ────────────────────────────────
function EmpiricalFormula() {
  const [text, setText] = useState("C 40, H 6.7, O 53.3");
  const [molar, setMolar] = useState<number | "">(180);
  const composition = useMemo(() => {
    const out: Record<string, number> = {};
    for (const part of text.split(",")) {
      const m = part.trim().match(/^([A-Z][a-z]?)\s+([\d.]+)$/);
      if (m) out[m[1]] = parseFloat(m[2]);
    }
    return out;
  }, [text]);
  const result = empiricalFormula(composition, molar === "" ? undefined : molar);

  return (
    <Tool title="Empirical → molecular formula" icon={<FlaskConical size={17} className="text-accent-500" />}>
      <Field label="Composition (element percent, comma-separated)">
        <input value={text} onChange={(e) => setText(e.target.value)} className="input font-mono" placeholder="C 40, H 6.7, O 53.3" />
      </Field>
      <Field label="Molar mass (optional, g/mol)"><input type="number" value={molar} onChange={(e) => setMolar(e.target.value === "" ? "" : +e.target.value)} className="input" /></Field>
      <div className="mt-2">
        {"error" in result ? <p className="text-sm text-crimson-600">{result.error}</p> : (
          <ResultBox tone="accent">
            <div className="text-xs uppercase tracking-wide text-ink-faint">Empirical</div>
            <div className="text-xl font-bold text-accent-600 dark:text-accent-300" dangerouslySetInnerHTML={{ __html: subscript(result.empirical) }} />
            {result.molecular && (
              <>
                <div className="mt-1 text-xs uppercase tracking-wide text-ink-faint">Molecular (×{result.multiple})</div>
                <div className="text-lg font-bold text-accent-600 dark:text-accent-300" dangerouslySetInnerHTML={{ __html: subscript(result.molecular) }} />
              </>
            )}
          </ResultBox>
        )}
      </div>
    </Tool>
  );
}

// ─── Reactions: ideal gas law ────────────────────────────────────────────────
function GasLaw() {
  const [vals, setVals] = useState<Record<string, string>>({ P: "101.325", n: "1", T: "273.15", V: "" });
  const known: Record<string, number> = {};
  for (const k of ["P", "V", "n", "T"]) if (vals[k] !== "") known[k] = parseFloat(vals[k]);
  const result = idealGas(known);
  return (
    <Tool title="Ideal gas law (PV = nRT)" icon={<Wind size={17} className="text-accent-500" />}>
      <p className="mb-2 text-xs text-ink-faint">Leave ONE blank. P in kPa, V in L, T in K.</p>
      <div className="grid grid-cols-2 gap-2">
        {[["P", "P (kPa)"], ["V", "V (L)"], ["n", "n (mol)"], ["T", "T (K)"]].map(([k, label]) => (
          <Field key={k} label={label}><input value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className="input text-center" placeholder="—" /></Field>
        ))}
      </div>
      <div className="mt-2">
        {"error" in result ? <p className="text-xs text-ink-faint">{result.error}</p> : (
          <ResultBox tone="accent"><div className="text-lg font-bold text-accent-600 dark:text-accent-300">{result.solvedFor} = {result[result.solvedFor]}</div></ResultBox>
        )}
      </div>
    </Tool>
  );
}

// ─── Reactions: weak-acid pH ─────────────────────────────────────────────────
function WeakAcid() {
  const [ka, setKa] = useState(1.8e-5);
  const [conc, setConc] = useState(0.1);
  const result = weakAcidPH(ka, conc);
  return (
    <Tool title="Weak-acid pH" icon={<Droplets size={17} className="text-accent-500" />}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ka"><input type="number" step="0.000001" value={ka} onChange={(e) => setKa(+e.target.value)} className="input" /></Field>
        <Field label="Conc (M)"><input type="number" step="0.01" value={conc} onChange={(e) => setConc(+e.target.value)} className="input" /></Field>
      </div>
      <div className="mt-2">
        {"error" in result ? <p className="text-sm text-crimson-600">{result.error}</p> : (
          <ResultBox tone="accent">
            <div className="text-2xl font-bold text-accent-600 dark:text-accent-300">pH {result.pH}</div>
            <div className="text-xs text-ink-muted">pKa {pKa(ka)} · {result.percentIonised}% ionised</div>
          </ResultBox>
        )}
      </div>
    </Tool>
  );
}
