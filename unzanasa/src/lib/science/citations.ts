// ─── Citation engine ─────────────────────────────────────────────────────────
// Formats a reference into APA, Harvard, Vancouver, MLA and IEEE styles.
// Pure and unit-tested. Handles missing fields gracefully.

export interface Reference {
  authors: string[]; // "Surname, Initials" or free-form
  year: string;
  title: string;
  source?: string; // journal / publisher / site
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  type?: "journal" | "book" | "web";
}

export type CitationStyle = "APA" | "Harvard" | "Vancouver" | "MLA" | "IEEE";

function surnameInitials(author: string): { surname: string; initials: string } {
  if (author.includes(",")) {
    const [surname, rest] = author.split(",").map((s) => s.trim());
    const initials = rest.split(/\s+/).map((p) => (p[0] ? p[0].toUpperCase() + "." : "")).join(" ");
    return { surname, initials };
  }
  const parts = author.trim().split(/\s+/);
  const surname = parts.pop() ?? author;
  const initials = parts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
  return { surname, initials };
}

function apaAuthors(authors: string[]): string {
  const formatted = authors.map((a) => {
    const { surname, initials } = surnameInitials(a);
    return `${surname}, ${initials}`.trim();
  });
  if (formatted.length === 0) return "";
  if (formatted.length === 1) return formatted[0];
  return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
}

function ieeeAuthors(authors: string[]): string {
  return authors.map((a) => {
    const { surname, initials } = surnameInitials(a);
    return `${initials} ${surname}`.trim();
  }).join(", ");
}

function mlaAuthors(authors: string[]): string {
  if (authors.length === 0) return "";
  const first = authors[0].includes(",") ? authors[0] : (() => {
    const { surname, initials } = surnameInitials(authors[0]);
    return `${surname}, ${initials}`;
  })();
  if (authors.length === 1) return first;
  return `${first}, et al`;
}

const vol = (r: Reference) => (r.volume ? `${r.volume}${r.issue ? `(${r.issue})` : ""}` : "");

export function formatCitation(r: Reference, style: CitationStyle): string {
  const doi = r.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/doi\.org\//, "")}` : "";
  const link = doi || r.url || "";

  switch (style) {
    case "APA": {
      const a = apaAuthors(r.authors);
      let s = `${a}${a ? " " : ""}(${r.year}). ${r.title}.`;
      if (r.source) s += ` ${r.source}`;
      if (vol(r)) s += `, ${vol(r)}`;
      if (r.pages) s += `, ${r.pages}`;
      s += ".";
      if (link) s += ` ${link}`;
      return s.trim();
    }
    case "Harvard": {
      const a = apaAuthors(r.authors);
      let s = `${a} ${r.year}, '${r.title}',`;
      if (r.source) s += ` ${r.source},`;
      if (vol(r)) s += ` vol. ${r.volume}${r.issue ? `, no. ${r.issue}` : ""},`;
      if (r.pages) s += ` pp. ${r.pages}.`;
      if (link) s += ` Available at: ${link}`;
      return s.replace(/,\s*$/, ".").trim();
    }
    case "Vancouver": {
      const a = r.authors.map((x) => { const { surname, initials } = surnameInitials(x); return `${surname} ${initials.replace(/\./g, "")}`; }).join(", ");
      let s = `${a}. ${r.title}. ${r.source ?? ""}. ${r.year}`;
      if (vol(r)) s += `;${r.volume}${r.issue ? `(${r.issue})` : ""}`;
      if (r.pages) s += `:${r.pages}`;
      s += ".";
      if (doi) s += ` doi:${r.doi}`;
      return s.replace(/\s+\./g, ".").trim();
    }
    case "MLA": {
      const a = mlaAuthors(r.authors);
      let s = `${a}. "${r.title}." ${r.source ?? ""}`;
      if (vol(r)) s += `, vol. ${r.volume}${r.issue ? `, no. ${r.issue}` : ""}`;
      s += `, ${r.year}`;
      if (r.pages) s += `, pp. ${r.pages}`;
      s += ".";
      if (link) s += ` ${link}.`;
      return s.replace(/\s+,/g, ",").trim();
    }
    case "IEEE": {
      const a = ieeeAuthors(r.authors);
      let s = `${a}, "${r.title}," ${r.source ?? ""}`;
      if (r.volume) s += `, vol. ${r.volume}`;
      if (r.issue) s += `, no. ${r.issue}`;
      if (r.pages) s += `, pp. ${r.pages}`;
      s += `, ${r.year}.`;
      if (doi) s += ` doi: ${r.doi}.`;
      return s.replace(/\s+,/g, ",").trim();
    }
  }
}

export const CITATION_STYLES: CitationStyle[] = ["APA", "Harvard", "Vancouver", "MLA", "IEEE"];
