import { describe, it, expect } from "vitest";
import { tokenize, chunkText, buildCorpus, rankChunks, retrieveContext } from "./ai/retrieval";
import { buildSeedState } from "./seed";

describe("tokenize", () => {
  it("lowercases, strips stopwords and punctuation", () => {
    const tokens = tokenize("The Mitochondrion is the Powerhouse of the cell!");
    expect(tokens).toContain("mitochondrion");
    expect(tokens).toContain("powerhouse");
    expect(tokens).toContain("cell");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("is");
  });
});

describe("chunkText", () => {
  it("splits paragraphs into chunks", () => {
    const text = "First paragraph about biology and cells in detail.\n\nSecond paragraph about chemistry and reactions in detail.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(2);
  });
  it("splits over-long paragraphs at sentence boundaries", () => {
    const long = Array.from({ length: 20 }, (_, i) => `This is sentence number ${i} with some padding words to make it longer.`).join(" ");
    const chunks = chunkText(long, 300);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((c) => c.length <= 400)).toBe(true);
  });
  it("drops fenced code and tiny fragments", () => {
    const chunks = chunkText("```\ncode here\n```\n\nok.");
    expect(chunks).toHaveLength(0);
  });
});

describe("buildCorpus", () => {
  const state = buildSeedState();
  it("includes note chunks and card chunks with labelled sources", () => {
    const corpus = buildCorpus(state);
    expect(corpus.length).toBeGreaterThan(10);
    expect(corpus.some((c) => c.source.startsWith("note:"))).toBe(true);
    expect(corpus.some((c) => c.source.startsWith("deck:"))).toBe(true);
  });
  it("filters by subject", () => {
    const bio = state.subjects.find((s) => s.name.includes("Biology"))!;
    const corpus = buildCorpus(state, bio.id);
    expect(corpus.length).toBeGreaterThan(0);
    // No content from other subjects should leak into the Biology corpus.
    expect(corpus.some((c) => c.text.includes("Ohm's law"))).toBe(false);
  });
  it("unmasks cloze deletions in card text", () => {
    const corpus = buildCorpus(state);
    expect(corpus.some((c) => c.text.includes("{{c1::"))).toBe(false);
  });
});

describe("rankChunks (BM25)", () => {
  const state = buildSeedState();
  const corpus = buildCorpus(state);

  it("ranks on-topic chunks above off-topic ones", () => {
    const top = rankChunks("what is the powerhouse of the cell mitochondria", corpus, 5);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].text.toLowerCase()).toMatch(/mitochondri|powerhouse/);
  });
  it("finds physics content for a mechanics question", () => {
    const top = rankChunks("newton second law force mass acceleration", corpus, 5);
    expect(top[0].text.toLowerCase()).toMatch(/newton|force|acceleration/);
  });
  it("returns empty for queries with no matching terms", () => {
    expect(rankChunks("zzyzx quixotic frobnicate", corpus, 5)).toHaveLength(0);
  });
  it("scores are descending", () => {
    const top = rankChunks("derivative of sin x calculus rules", corpus, 8);
    for (let i = 1; i < top.length; i++) expect(top[i - 1].score).toBeGreaterThanOrEqual(top[i].score);
  });
});

describe("retrieveContext", () => {
  const state = buildSeedState();

  it("returns labelled, relevant context under the size budget", () => {
    const ctx = retrieveContext(state, "explain the mitochondrion", null, 2000);
    expect(ctx.length).toBeLessThanOrEqual(2000);
    expect(ctx).toMatch(/\[(note|deck):/);
    expect(ctx.toLowerCase()).toContain("mitochondri");
  });
  it("falls back to a general sample for unmatched queries (greetings)", () => {
    const ctx = retrieveContext(state, "hello there!", null);
    expect(ctx.length).toBeGreaterThan(0);
  });
});
