// ─── Lab report builder ──────────────────────────────────────────────────────
// Assembles a professional lab-report skeleton from STUDENT-PROVIDED inputs.
// It never invents experimental data: any missing section is emitted as an
// explicit "[student input required]" placeholder so the student stays honest.

export interface LabReportInput {
  title: string;
  course?: string;
  studentName?: string;
  aim: string;
  objectives?: string;
  background?: string;
  materials: string; // newline-separated
  methods: string; // newline-separated steps
  observations: string; // student's raw results / table (TSV or prose)
  discussion?: string;
  sourcesOfError?: string;
  conclusion?: string;
  references?: string; // newline-separated
}

const PLACEHOLDER = "_[student input required]_";

function list(items: string, ordered = false): string {
  const lines = items.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return PLACEHOLDER;
  return lines.map((l, i) => `${ordered ? `${i + 1}.` : "-"} ${l}`).join("\n");
}

/** Render student observations: a TSV block becomes a markdown table. */
function renderObservations(obs: string): string {
  const text = obs.trim();
  if (!text) return PLACEHOLDER;
  const rows = text.split("\n").map((r) => r.split("\t"));
  const isTable = rows.length > 1 && rows.every((r) => r.length === rows[0].length) && rows[0].length > 1;
  if (!isTable) return text;
  const header = `| ${rows[0].join(" | ")} |`;
  const sep = `| ${rows[0].map(() => "---").join(" | ")} |`;
  const body = rows.slice(1).map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${header}\n${sep}\n${body}`;
}

export function buildLabReport(input: LabReportInput): string {
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const parts: string[] = [];

  parts.push(`# ${input.title || "Laboratory Report"}`);
  const meta = [input.course && `**Course:** ${input.course}`, input.studentName && `**Student:** ${input.studentName}`, `**Date:** ${today}`].filter(Boolean).join("  \n");
  if (meta) parts.push(meta);

  parts.push(`## Aim\n${input.aim || PLACEHOLDER}`);
  parts.push(`## Objectives\n${input.objectives ? list(input.objectives, true) : "- " + (input.aim ? `To investigate ${input.aim.replace(/^to\s+/i, "")}` : PLACEHOLDER)}`);
  parts.push(`## Background\n${input.background || PLACEHOLDER}`);
  parts.push(`## Materials & Apparatus\n${list(input.materials)}`);
  parts.push(`## Method\n${list(input.methods, true)}`);
  parts.push(`## Results & Observations\n> ⚠️ The data below is exactly as recorded by the student — not generated.\n\n${renderObservations(input.observations)}`);
  parts.push(`## Discussion\n${input.discussion || PLACEHOLDER}`);
  parts.push(`## Sources of Error & Limitations\n${input.sourcesOfError ? list(input.sourcesOfError) : PLACEHOLDER}`);
  parts.push(`## Conclusion\n${input.conclusion || PLACEHOLDER}`);
  parts.push(`## References\n${input.references ? list(input.references, true) : PLACEHOLDER}`);

  return parts.join("\n\n");
}

/** Count how many sections still need student input. */
export function missingSections(report: string): number {
  return (report.match(/\[student input required\]/g) ?? []).length;
}
