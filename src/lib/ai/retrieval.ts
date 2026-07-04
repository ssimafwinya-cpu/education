// ─── Retrieval (RAG-lite) ────────────────────────────────────────────────────
// Query-aware grounding for the AI tutor. Instead of naively sending the
// first N notes as context, we chunk everything the student owns (notes,
// flashcards) and rank chunks against the question with BM25 — the classic
// lexical relevance function used by search engines. Dependency-free and fast
// enough to run per keystroke on thousands of chunks.
//
// In production this same interface is backed by vector embeddings
// (pgvector / Meilisearch hybrid); BM25 remains the zero-config fallback.

import type { AppState } from "../types";

export interface Chunk {
  /** Where the chunk came from, e.g. `note:Cell Biology — Key Concepts`. */
  source: string;
  text: string;
}

export interface ScoredChunk extends Chunk {
  score: number;
}

const STOP = new Set(
  "the a an and or but of to in on at for with as is are was were be been being this that these those it its by from into than then so such not no can will would should could may might must have has had do does did we you they he she i what which who whom how when where why".split(" "),
);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9'-]{1,}/g) ?? []).filter((t) => !STOP.has(t));
}

/** Split markdown-ish text into ~paragraph chunks of a bounded size. */
export function chunkText(text: string, maxChars = 500): string[] {
  const paragraphs = text
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\n{2,}|\n(?=#)/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 30);

  const chunks: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      chunks.push(p);
      continue;
    }
    // Split long paragraphs at sentence boundaries.
    let current = "";
    for (const sentence of p.split(/(?<=[.!?])\s+/)) {
      if (current.length + sentence.length > maxChars && current) {
        chunks.push(current.trim());
        current = "";
      }
      current += sentence + " ";
    }
    if (current.trim().length > 30) chunks.push(current.trim());
  }
  return chunks;
}

/** Build the searchable corpus from everything the student owns. */
export function buildCorpus(state: AppState, subjectId?: string | null): Chunk[] {
  const chunks: Chunk[] = [];

  const notes = state.notes.filter((n) => (subjectId ? n.subjectId === subjectId : true));
  for (const note of notes) {
    for (const text of chunkText(note.content)) {
      chunks.push({ source: `note:${note.title}`, text });
    }
  }

  const deckIds = new Set(
    state.decks.filter((d) => (subjectId ? d.subjectId === subjectId : true)).map((d) => d.id),
  );
  const decksById = new Map(state.decks.map((d) => [d.id, d.name]));
  for (const card of state.cards) {
    if (!deckIds.has(card.deckId)) continue;
    const text = `${card.front.replace(/\{\{c\d+::(.*?)\}\}/g, "$1")} — ${card.back}`.replace(/\s+/g, " ").trim();
    if (text.length > 15) {
      chunks.push({ source: `deck:${decksById.get(card.deckId) ?? "cards"}`, text });
    }
  }

  return chunks;
}

// ─── BM25 ────────────────────────────────────────────────────────────────────

const K1 = 1.5;
const B = 0.75;

/** Rank corpus chunks against a query. Returns the top `k` with score > 0. */
export function rankChunks(query: string, corpus: Chunk[], k = 8): ScoredChunk[] {
  const qTerms = [...new Set(tokenize(query))];
  if (qTerms.length === 0 || corpus.length === 0) return [];

  const docs = corpus.map((c) => tokenize(c.text));
  const N = docs.length;
  const avgLen = docs.reduce((n, d) => n + d.length, 0) / N || 1;

  // Document frequency per query term.
  const df = new Map<string, number>();
  for (const term of qTerms) {
    let count = 0;
    for (const doc of docs) if (doc.includes(term)) count++;
    df.set(term, count);
  }

  const scored: ScoredChunk[] = corpus.map((chunk, i) => {
    const doc = docs[i];
    const tf = new Map<string, number>();
    for (const t of doc) tf.set(t, (tf.get(t) ?? 0) + 1);

    let score = 0;
    for (const term of qTerms) {
      const f = tf.get(term) ?? 0;
      if (f === 0) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (doc.length / avgLen))));
    }
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Query-aware tutor context: the most relevant chunks for this question,
 * labelled with their sources so the tutor can cite them. Falls back to a
 * small general sample when nothing matches (e.g. greetings).
 */
export function retrieveContext(
  state: AppState,
  query: string,
  subjectId?: string | null,
  maxChars = 6000,
): string {
  const corpus = buildCorpus(state, subjectId);
  let picked: Chunk[] = rankChunks(query, corpus, 10);
  if (picked.length === 0) picked = corpus.slice(0, 6);

  const parts: string[] = [];
  let used = 0;
  for (const c of picked) {
    const entry = `[${c.source}] ${c.text}`;
    if (used + entry.length > maxChars) break;
    parts.push(entry);
    used += entry.length;
  }
  return parts.join("\n\n");
}
