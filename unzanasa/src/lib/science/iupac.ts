// ─── IUPAC systematic namer ──────────────────────────────────────────────────
// Names acyclic C/H/N/O/halogen molecules from the parsed SMILES graph:
// alkanes/alkenes/alkynes, alcohols, aldehydes, ketones, carboxylic acids and
// primary amines, with halo / alkyl / hydroxy / oxo / amino substituents.
// Follows the substitutive-nomenclature rules: parent = longest chain
// containing the principal characteristic group, numbered for lowest locants
// (suffix → unsaturation → prefixes → alphabetical), prefixes alphabetized.
//
// Anything outside this subset returns a clear refusal instead of a wrong
// name — the tool never guesses.

import { fromSmiles, type MoleculeInfo } from "./smiles";

const STEMS = ["", "meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec",
  "undec", "dodec", "tridec", "tetradec", "pentadec", "hexadec", "heptadec", "octadec", "nonadec", "icos"];
const MULT = ["", "", "di", "tri", "tetra", "penta", "hexa", "hepta", "octa"];
const MULT_COMPLEX = ["", "", "bis", "tris", "tetrakis"];
const HALO: Record<string, string> = { F: "fluoro", Cl: "chloro", Br: "bromo", I: "iodo" };

type FeatureType = "acid" | "aldehyde" | "ketone" | "alcohol" | "amine";
const PRIORITY: FeatureType[] = ["acid", "aldehyde", "ketone", "alcohol", "amine"];
const PREFIX_OF: Record<FeatureType, string> = {
  acid: "carboxy", aldehyde: "oxo", ketone: "oxo", alcohol: "hydroxy", amine: "amino",
};

interface Feature { type: FeatureType; carbon: number; hetero: number[]; }
interface PrefixEntry { name: string; key: string; complex: boolean; loc: number; }
interface Analysis {
  suffixLocs: number[]; ene: number[]; yne: number[]; prefixes: PrefixEntry[]; tuple: number[][];
}

export type IupacResult = { name: string } | { error: string };

const err = (error: string): { error: string } => ({ error });

export function iupacFromSmiles(smiles: string): IupacResult {
  try { return iupacName(fromSmiles(smiles)); }
  catch { return err("Could not parse the structure."); }
}

export function iupacName(mol: MoleculeInfo): IupacResult {
  const n = mol.atoms.length;
  if (n === 0) return err("empty structure.");
  if (mol.atoms.some((a) => a.aromatic)) return err("aromatic rings are not yet supported.");
  if (mol.ringAtoms.some(Boolean)) return err("cyclic structures are not yet supported.");
  if (mol.atoms.some((a) => a.charge !== 0)) return err("charged species are not supported.");
  for (const a of mol.atoms) {
    if (a.element !== "C" && a.element !== "O" && a.element !== "N" && !(a.element in HALO)) {
      return err(`element ${a.element} is outside the supported C/H/N/O/halogen set.`);
    }
  }

  // Atom-level adjacency.
  const adj: { n: number; order: number }[][] = mol.atoms.map(() => []);
  for (const b of mol.bonds) { adj[b.a].push({ n: b.b, order: b.order }); adj[b.b].push({ n: b.a, order: b.order }); }

  // Single connected structure.
  {
    const seen = new Array(n).fill(false);
    const stack = [0]; seen[0] = true; let count = 1;
    while (stack.length) { const u = stack.pop()!; for (const { n: v } of adj[u]) if (!seen[v]) { seen[v] = true; count++; stack.push(v); } }
    if (count !== n) return err("only a single connected structure can be named.");
  }

  const carbons = mol.atoms.filter((a) => a.element === "C").map((a) => a.index);
  if (carbons.length === 0) return err("there is no carbon skeleton to name.");
  if (carbons.length >= STEMS.length) return err(`chains beyond ${STEMS.length - 1} carbons are not supported.`);

  // ── Classify heteroatoms into features ─────────────────────────────────────
  const carbonylByC = new Map<number, number[]>(); // carbon → carbonyl O atoms
  const hydroxylByC = new Map<number, number[]>(); // carbon → hydroxyl O atoms
  const push = (m: Map<number, number[]>, k: number, v: number) => m.set(k, [...(m.get(k) ?? []), v]);

  for (const a of mol.atoms) {
    if (a.element === "O") {
      const bs = adj[a.index];
      if (bs.length === 1 && bs[0].order === 2 && mol.atoms[bs[0].n].element === "C" && mol.hydrogens[a.index] === 0) {
        push(carbonylByC, bs[0].n, a.index);
      } else if (bs.length === 1 && bs[0].order === 1 && mol.atoms[bs[0].n].element === "C" && mol.hydrogens[a.index] === 1) {
        push(hydroxylByC, bs[0].n, a.index);
      } else {
        return err("an oxygen here (ether, ester, peroxide…) is not yet supported.");
      }
    }
  }

  const features: Feature[] = [];
  for (const a of mol.atoms) {
    if (a.element !== "N") continue;
    const bs = adj[a.index];
    if (bs.length === 1 && bs[0].order === 1 && mol.atoms[bs[0].n].element === "C" && mol.hydrogens[a.index] === 2) {
      features.push({ type: "amine", carbon: bs[0].n, hetero: [a.index] });
    } else {
      return err("only primary amines are supported for nitrogen (no amides, nitriles or nitro groups yet).");
    }
  }

  for (const c of carbons) {
    const co = carbonylByC.get(c) ?? [];
    const oh = hydroxylByC.get(c) ?? [];
    if (co.length > 1) return err("a carbon with two carbonyl oxygens is not supported.");
    if (co.length === 1 && oh.length === 1) features.push({ type: "acid", carbon: c, hetero: [co[0], oh[0]] });
    else if (co.length === 1 && oh.length === 0) {
      features.push({ type: mol.hydrogens[c] >= 1 ? "aldehyde" : "ketone", carbon: c, hetero: [co[0]] });
    } else if (co.length === 1) return err("this carbonyl/hydroxyl arrangement is not supported.");
    else for (const o of oh) features.push({ type: "alcohol", carbon: c, hetero: [o] });
  }

  // Amide guard: amine nitrogen bonded to a carbonyl carbon.
  for (const f of features) {
    if (f.type === "amine" && (carbonylByC.has(f.carbon) || features.some((g) => g.carbon === f.carbon && (g.type === "acid" || g.type === "aldehyde" || g.type === "ketone")))) {
      return err("amides are not yet supported.");
    }
  }

  const principal = PRIORITY.find((t) => features.some((f) => f.type === t)) ?? null;
  const consumedHetero = new Set<number>(features.flatMap((f) => f.hetero));

  // ── Carbon skeleton (a tree, since the molecule is acyclic) ────────────────
  const cAdj = new Map<number, number[]>(carbons.map((c) => [c, []]));
  const orderKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
  const ccOrder = new Map<string, number>();
  for (const b of mol.bonds) {
    if (mol.atoms[b.a].element === "C" && mol.atoms[b.b].element === "C") {
      cAdj.get(b.a)!.push(b.b); cAdj.get(b.b)!.push(b.a);
      ccOrder.set(orderKey(b.a, b.b), b.order);
    }
  }

  // Candidate chains = the unique tree path between every pair of carbons.
  const chains: number[][] = carbons.length === 1 ? [[carbons[0]]] : [];
  if (carbons.length > 1) {
    for (let i = 0; i < carbons.length; i++) {
      const parent = new Map<number, number>([[carbons[i], -1]]);
      const queue = [carbons[i]];
      while (queue.length) {
        const u = queue.shift()!;
        for (const v of cAdj.get(u)!) if (!parent.has(v)) { parent.set(v, u); queue.push(v); }
      }
      for (let j = i + 1; j < carbons.length; j++) {
        const path: number[] = [];
        for (let at = carbons[j]; at !== -1; at = parent.get(at)!) path.push(at);
        chains.push(path);
      }
    }
  }

  // ── Score chains: principal-group count, length, unsaturation, branches ────
  const principalCarbons = principal ? features.filter((f) => f.type === principal).map((f) => f.carbon) : [];
  type Scored = { chain: number[]; score: number[] };
  const scored: Scored[] = [];
  for (const chain of chains) {
    const inChain = new Set(chain);
    const pIn = principalCarbons.filter((c) => inChain.has(c)).length;
    if (principal && pIn === 0) continue;
    // Acids and aldehydes cannot be expressed as simple prefixes here.
    if ((principal === "acid" || principal === "aldehyde") && pIn < principalCarbons.length) continue;
    let mult = 0, dbl = 0, subCount = 0;
    for (let i = 0; i + 1 < chain.length; i++) {
      const o = ccOrder.get(orderKey(chain[i], chain[i + 1])) ?? 1;
      if (o >= 2) mult++;
      if (o === 2) dbl++;
    }
    for (const c of chain) for (const v of cAdj.get(c)!) if (!inChain.has(v)) subCount++;
    scored.push({ chain, score: [pIn, chain.length, mult, dbl, subCount] });
  }
  if (scored.length === 0) return err("no parent chain can hold the principal group in a supported way.");

  const cmpDesc = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return b[i] - a[i]; } return 0; };
  scored.sort((a, b) => cmpDesc(a.score, b.score));
  const best = scored.filter((s) => cmpDesc(s.score, scored[0].score) === 0);

  // ── Analyze a chain in one orientation: locants + substituents ─────────────
  const cmpLoc = (a: number[], b: number[]): number => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  };
  const cmpTuple = (a: number[][], b: number[][]): number => {
    for (let i = 0; i < a.length; i++) { const c = cmpLoc(a[i], b[i]); if (c !== 0) return c; }
    return 0;
  };

  const analyze = (chain: number[]): Analysis | { error: string } => {
    const pos = new Map(chain.map((a, i) => [a, i + 1]));
    const suffixLocs: number[] = [];
    const prefixes: PrefixEntry[] = [];

    for (const f of features) {
      const p = pos.get(f.carbon);
      if (p === undefined) return err("a functional group sits on a branch — not yet supported.");
      if (f.type === principal) suffixLocs.push(p);
      else prefixes.push({ name: PREFIX_OF[f.type], key: PREFIX_OF[f.type], complex: false, loc: p });
    }

    const ene: number[] = [], yne: number[] = [];
    for (let i = 0; i + 1 < chain.length; i++) {
      const o = ccOrder.get(orderKey(chain[i], chain[i + 1])) ?? 1;
      if (o === 2) ene.push(i + 1);
      if (o === 3) yne.push(i + 1);
    }

    for (let i = 0; i < chain.length; i++) {
      const c = chain[i];
      for (const { n: nb } of adj[c]) {
        if (pos.has(nb) || consumedHetero.has(nb)) continue;
        const el = mol.atoms[nb].element;
        if (el in HALO) { prefixes.push({ name: HALO[el], key: HALO[el], complex: false, loc: i + 1 }); continue; }
        if (el === "C") {
          const br = alkylName(nb, c);
          if ("error" in br) return br;
          prefixes.push({ ...br, loc: i + 1 });
          continue;
        }
        return err("an unsupported substituent was found.");
      }
    }

    const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
    const alphaLocs = [...prefixes].sort((a, b) => a.key.localeCompare(b.key) || a.loc - b.loc).map((p) => p.loc);
    const tuple: number[][] = [sorted(suffixLocs), sorted([...ene, ...yne]), sorted(ene), sorted(prefixes.map((p) => p.loc)), alphaLocs];
    return { suffixLocs: sorted(suffixLocs), ene, yne, prefixes, tuple };
  };

  // Alkyl branch namer: unbranched chains → methyl…; path-with-interior-root →
  // alkan-k-yl; tert-butyl special-cased; anything else refused.
  const alkylName = (root: number, chainParent: number): { name: string; key: string; complex: boolean } | { error: string } => {
    const subtree: number[] = [];
    const seen = new Set([chainParent]);
    const stack = [root];
    while (stack.length) {
      const u = stack.pop()!;
      if (seen.has(u)) continue;
      seen.add(u); subtree.push(u);
      for (const { n: v, order } of adj[u]) {
        if (v === chainParent && u === root) continue;
        if (mol.atoms[v].element !== "C") return err("a substituted branch (heteroatom on a side chain) is not yet supported.");
        if (order !== 1) return err("an unsaturated side chain is not yet supported.");
        if (!seen.has(v)) stack.push(v);
      }
    }
    const size = subtree.length;
    if (size >= STEMS.length) return err("a side chain this long is not supported.");
    const inSub = new Set(subtree);
    const deg = new Map(subtree.map((u) => [u, cAdj.get(u)!.filter((v) => inSub.has(v)).length]));

    if ([...deg.values()].every((d) => d <= 2)) {
      // The branch is a simple path.
      const rootDeg = deg.get(root)!;
      if (rootDeg <= 1 || size === 1) return { name: `${STEMS[size]}yl`, key: `${STEMS[size]}yl`, complex: false };
      // Attachment is interior: walk to both ends to find the shorter side.
      const distToEnd = (start: number, avoid: number): number => {
        let prev = avoid, cur = start, d = 1;
        for (;;) {
          const next = cAdj.get(cur)!.filter((v) => inSub.has(v) && v !== prev);
          if (next.length === 0) return d;
          prev = cur; cur = next[0]; d++;
        }
      };
      const nbrs = cAdj.get(root)!.filter((v) => inSub.has(v));
      const k = Math.min(distToEnd(nbrs[0], root), distToEnd(nbrs[1], root)) + 1;
      const nm = `${STEMS[size]}an-${k}-yl`;
      return { name: nm, key: nm, complex: true };
    }
    // tert-butyl: root bonded to three terminal carbons.
    if (size === 4 && deg.get(root) === 3 && subtree.filter((u) => u !== root).every((u) => deg.get(u) === 1)) {
      return { name: "tert-butyl", key: "butyl", complex: false };
    }
    return err("a branched side chain this complex is not yet supported.");
  };

  // ── Choose the chain + direction with the lowest locant tuple ──────────────
  let winner: { analysis: Analysis; length: number } | null = null;
  let lastError = "this structure is outside the supported subset.";
  for (const { chain } of best) {
    const fwd = analyze(chain);
    if ("error" in fwd) { lastError = fwd.error; continue; }
    const rev = analyze([...chain].reverse()) as Analysis; // same substituents, mirrored locants
    const pick = cmpTuple(fwd.tuple, rev.tuple) <= 0 ? fwd : rev;
    if (!winner || cmpTuple(pick.tuple, winner.analysis.tuple) < 0) winner = { analysis: pick, length: chain.length };
  }
  if (!winner) return err(lastError);

  return format(winner.analysis, winner.length, principal);
}

// ─── Name assembly ────────────────────────────────────────────────────────────

function format(a: Analysis, L: number, principal: FeatureType | null): IupacResult {
  const { ene, yne, prefixes, suffixLocs } = a;

  // Prefix segment: group by name, alphabetize by key, multiply.
  const groups = new Map<string, { key: string; complex: boolean; locs: number[] }>();
  for (const p of prefixes) {
    const g = groups.get(p.name) ?? { key: p.key, complex: p.complex, locs: [] };
    g.locs.push(p.loc); groups.set(p.name, g);
  }
  const totalPrefix = prefixes.length;
  const omitPrefixLoc = L === 1 || (L <= 2 && totalPrefix === 1);
  const segs: string[] = [];
  for (const [name, g] of [...groups.entries()].sort((x, y) => x[1].key.localeCompare(y[1].key))) {
    const m = g.locs.length;
    const multi = m > 1 ? (g.complex ? MULT_COMPLEX[m] : MULT[m]) : "";
    if (m > 1 && !multi) return { error: "too many identical substituents to name." };
    const nm = g.complex ? `(${name})` : name;
    segs.push(omitPrefixLoc ? `${multi}${nm}` : `${g.locs.sort((x, y) => x - y).join(",")}-${multi}${nm}`);
  }
  const prefixSeg = segs.join("-");

  // Parent hydride with unsaturation. `base` deliberately has no final "e".
  let base = STEMS[L];
  const omitUnsatLoc = L <= 2;
  if (ene.length > 0) {
    base += (ene.length > 1 ? "a" : "") + (omitUnsatLoc ? "" : `-${[...ene].sort((x, y) => x - y).join(",")}-`) + (ene.length > 1 ? MULT[ene.length] : "") + "en";
  }
  if (yne.length > 0) {
    if (ene.length === 0 && yne.length > 1) base += "a";
    base += (omitUnsatLoc ? "" : `-${[...yne].sort((x, y) => x - y).join(",")}-`) + (yne.length > 1 ? MULT[yne.length] : "") + "yn";
  }
  if (ene.length === 0 && yne.length === 0) base += "an";

  // Principal-group suffix.
  const cnt = suffixLocs.length;
  const locs = suffixLocs.join(",");
  let parent: string;
  switch (principal) {
    case null: parent = `${base}e`; break;
    case "acid":
      if (cnt === 1) parent = `${base}oic acid`;
      else if (cnt === 2) parent = `${base}edioic acid`;
      else return { error: "more than two acid groups are not supported." };
      break;
    case "aldehyde":
      if (cnt === 1) parent = `${base}al`;
      else if (cnt === 2) parent = `${base}edial`;
      else return { error: "more than two aldehyde groups are not supported." };
      break;
    case "ketone": case "alcohol": case "amine": {
      const sfx = principal === "ketone" ? "one" : principal === "alcohol" ? "ol" : "amine";
      if (L <= 2 && cnt === 1) parent = `${base}${sfx}`;
      else if (cnt === 1) parent = `${base}-${locs}-${sfx}`;
      else if (MULT[cnt]) parent = `${base}e-${locs}-${MULT[cnt]}${sfx}`;
      else return { error: "too many identical suffix groups to name." };
      break;
    }
  }

  return { name: prefixSeg + parent };
}
