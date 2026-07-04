// ─── Deck import / export ────────────────────────────────────────────────────
// Anki-compatible plain-text interchange:
//   · Export: TSV (front <tab> back <tab> tags) — Anki's "Notes in Plain Text".
//   · Import: TSV or CSV, with quoted-field support and header detection.
// Plus near-duplicate detection used everywhere cards are added in bulk.

import type { Flashcard } from "./types";

// ─── Export ──────────────────────────────────────────────────────────────────

function escapeField(s: string): string {
  // Anki keeps one line per note: encode literal tabs/newlines.
  return s.replace(/\t/g, "  ").replace(/\r?\n/g, "<br>");
}

export function exportDeckTsv(cards: Pick<Flashcard, "front" | "back" | "tags">[]): string {
  const header = "#separator:tab\n#html:false\n";
  const rows = cards.map((c) => `${escapeField(c.front)}\t${escapeField(c.back)}\t${(c.tags ?? []).join(" ")}`);
  return header + rows.join("\n") + "\n";
}

// ─── Import ──────────────────────────────────────────────────────────────────

export interface ImportedCard {
  front: string;
  back: string;
  tags: string[];
}

/** Split one CSV line honouring double-quoted fields ("" = escaped quote). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function unescapeField(s: string): string {
  return s.replace(/<br\s*\/?>/gi, "\n").trim();
}

/**
 * Parse a deck file. Detects the separator (tab wins if present), skips
 * `#directive` lines and a `front,back`-style header row, tolerates ragged
 * rows, and caps at `maxCards`.
 */
export function parseDeckFile(text: string, maxCards = 500): ImportedCard[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "");
  const dataLines = lines.filter((l) => !l.startsWith("#"));
  if (dataLines.length === 0) return [];

  const useTab = dataLines.some((l) => l.includes("\t"));
  const cards: ImportedCard[] = [];

  for (const line of dataLines) {
    const fields = useTab ? line.split("\t") : splitCsvLine(line);
    const front = unescapeField(fields[0] ?? "");
    const back = unescapeField(fields[1] ?? "");
    if (!front || !back) continue;
    // Skip a header row like "front,back" / "Question,Answer".
    if (cards.length === 0 && /^(front|question|term)$/i.test(front) && /^(back|answer|definition)$/i.test(back)) continue;
    const tags = (fields[2] ?? "").trim().split(/\s+/).filter(Boolean);
    cards.push({ front, back, tags });
    if (cards.length >= maxCards) break;
  }
  return cards;
}

// ─── Duplicate detection ─────────────────────────────────────────────────────

/** Canonical form of a card front for near-duplicate comparison. */
export function normalizeFront(front: string): string {
  return front
    .toLowerCase()
    .replace(/\{\{c\d+::(.*?)\}\}/g, "$1") // unmask cloze
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Filter `incoming` cards whose front already exists (after normalisation)
 * either in the deck or earlier in the same batch.
 */
export function dedupeAgainst<T extends { front: string }>(
  existingFronts: string[],
  incoming: T[],
): { kept: T[]; skipped: number } {
  const seen = new Set(existingFronts.map(normalizeFront));
  const kept: T[] = [];
  let skipped = 0;
  for (const card of incoming) {
    const key = normalizeFront(card.front);
    if (!key || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    kept.push(card);
  }
  return { kept, skipped };
}
