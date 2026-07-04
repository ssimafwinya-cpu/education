// ─── Biology engine ──────────────────────────────────────────────────────────
// Molecular biology (DNA/RNA/protein) and genetics. Pure and unit-tested.

// ─── Nucleic acids ───────────────────────────────────────────────────────────

const DNA_COMPLEMENT: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const DNA_TO_RNA: Record<string, string> = { A: "A", T: "U", G: "G", C: "C" };

export function isValidDNA(seq: string): boolean {
  return /^[ATGC]+$/i.test(seq.replace(/\s/g, ""));
}

export function cleanSeq(seq: string): string {
  return seq.replace(/\s/g, "").toUpperCase();
}

/** DNA → complementary strand (5'→3' of the complement, i.e. reversed). */
export function complementDNA(seq: string): string {
  return cleanSeq(seq).split("").map((b) => DNA_COMPLEMENT[b] ?? "N").join("");
}
export function reverseComplement(seq: string): string {
  return complementDNA(seq).split("").reverse().join("");
}

/** Transcribe a DNA coding strand to mRNA (T → U). */
export function transcribe(seq: string): string {
  return cleanSeq(seq).split("").map((b) => DNA_TO_RNA[b] ?? "N").join("");
}

export function gcContent(seq: string): number {
  const s = cleanSeq(seq);
  if (!s.length) return 0;
  const gc = s.split("").filter((b) => b === "G" || b === "C").length;
  return Math.round((gc / s.length) * 1000) / 10; // percent, 1 dp
}

// Standard genetic code (RNA codon → amino acid single letter; * = stop).
export const CODON_TABLE: Record<string, string> = {
  UUU: "F", UUC: "F", UUA: "L", UUG: "L", CUU: "L", CUC: "L", CUA: "L", CUG: "L",
  AUU: "I", AUC: "I", AUA: "I", AUG: "M", GUU: "V", GUC: "V", GUA: "V", GUG: "V",
  UCU: "S", UCC: "S", UCA: "S", UCG: "S", CCU: "P", CCC: "P", CCA: "P", CCG: "P",
  ACU: "T", ACC: "T", ACA: "T", ACG: "T", GCU: "A", GCC: "A", GCA: "A", GCG: "A",
  UAU: "Y", UAC: "Y", UAA: "*", UAG: "*", CAU: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAU: "N", AAC: "N", AAA: "K", AAG: "K", GAU: "D", GAC: "D", GAA: "E", GAG: "E",
  UGU: "C", UGC: "C", UGA: "*", UGG: "W", CGU: "R", CGC: "R", CGA: "R", CGG: "R",
  AGU: "S", AGC: "S", AGA: "R", AGG: "R", GGU: "G", GGC: "G", GGA: "G", GGG: "G",
};

export const AMINO_ACID_NAMES: Record<string, string> = {
  F: "Phe", L: "Leu", I: "Ile", M: "Met", V: "Val", S: "Ser", P: "Pro", T: "Thr",
  A: "Ala", Y: "Tyr", H: "His", Q: "Gln", N: "Asn", K: "Lys", D: "Asp", E: "Glu",
  C: "Cys", W: "Trp", R: "Arg", G: "Gly", "*": "Stop",
};

/** Translate an mRNA (or DNA — auto-transcribed) sequence to a peptide. */
export function translate(seq: string, fromDNA = false): { peptide: string; codons: string[] } {
  let rna = cleanSeq(seq);
  if (fromDNA) rna = transcribe(rna);
  rna = rna.replace(/T/g, "U");
  const codons: string[] = [];
  let peptide = "";
  for (let i = 0; i + 3 <= rna.length; i += 3) {
    const codon = rna.slice(i, i + 3);
    codons.push(codon);
    const aa = CODON_TABLE[codon];
    if (aa === undefined) { peptide += "X"; continue; }
    if (aa === "*") break;
    peptide += aa;
  }
  return { peptide, codons };
}

// ─── Genetics ────────────────────────────────────────────────────────────────

export interface PunnettResult {
  grid: string[][];
  parents: [string, string];
  genotypes: Record<string, number>;
  phenotypeNote: string;
}

/** Monohybrid Punnett square for two single-gene genotypes, e.g. "Aa" × "Aa". */
export function punnettSquare(p1: string, p2: string): PunnettResult | null {
  if (p1.length !== 2 || p2.length !== 2) return null;
  const a1 = [p1[0], p1[1]];
  const a2 = [p2[0], p2[1]];
  const grid: string[][] = [];
  const genotypes: Record<string, number> = {};
  for (const x of a1) {
    const row: string[] = [];
    for (const y of a2) {
      const geno = [x, y].sort((m, n) => (m.toLowerCase() === n.toLowerCase() ? (m < n ? -1 : 1) : m.toLowerCase().localeCompare(n.toLowerCase()))).join("");
      row.push(geno);
      genotypes[geno] = (genotypes[geno] ?? 0) + 1;
    }
    grid.push(row);
  }
  return { grid, parents: [p1, p2], genotypes, phenotypeNote: "Capital = dominant allele; lowercase = recessive." };
}

export interface HardyWeinberg { p: number; q: number; AA: number; Aa: number; aa: number; }

/** Given the recessive-phenotype frequency (q²), return HW distribution. */
export function hardyWeinbergFromQ2(q2: number): HardyWeinberg | null {
  if (q2 < 0 || q2 > 1) return null;
  const q = Math.sqrt(q2);
  const p = 1 - q;
  return { p: r3(p), q: r3(q), AA: r3(p * p), Aa: r3(2 * p * q), aa: r3(q * q) };
}

function r3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
