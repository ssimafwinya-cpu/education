import { describe, it, expect } from "vitest";
import {
  generateCards, generateQuiz, summarize, keywords, toSentences, tutorReply, generateMindMap,
  cardFromSelection,
} from "./ai/tutor-engine";

const SAMPLE = `The mitochondrion is the powerhouse of the cell. It produces ATP through cellular respiration.
Ribosomes are the sites of protein synthesis. The nucleus contains the cell's genetic material, DNA.
Photosynthesis is the process by which plants convert light energy into chemical energy.
The cell membrane is a phospholipid bilayer that controls what enters and leaves the cell.`;

describe("toSentences", () => {
  it("splits prose into clean sentences", () => {
    const s = toSentences(SAMPLE);
    expect(s.length).toBeGreaterThanOrEqual(4);
    expect(s.every((x) => x.length > 30)).toBe(true);
  });
});

describe("keywords", () => {
  it("extracts frequent domain terms and ignores stopwords", () => {
    const kw = keywords(SAMPLE, 10);
    expect(kw).toContain("cell");
    expect(kw).not.toContain("the");
    expect(kw).not.toContain("is");
  });
});

describe("generateCards", () => {
  it("produces the requested number of cards from definition-rich text", () => {
    const cards = generateCards(SAMPLE, 5);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(5);
  });
  it("creates definition cards for 'X is Y' sentences", () => {
    const cards = generateCards(SAMPLE, 8);
    const hasDefinition = cards.some((c) => c.kind === "basic" && /what (is|are)/i.test(c.front));
    expect(hasDefinition).toBe(true);
  });
  it("cloze cards contain a masked answer token", () => {
    const cards = generateCards(SAMPLE, 8);
    const cloze = cards.find((c) => c.kind === "cloze");
    if (cloze) expect(cloze.front).toContain("{{c1::");
  });
  it("returns nothing useful for trivial input", () => {
    expect(generateCards("hi", 5).length).toBe(0);
  });
});

describe("generateQuiz", () => {
  it("generates questions with answers and explanations", () => {
    const qs = generateQuiz(SAMPLE, 4);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
      if (q.kind === "mcq") {
        expect(q.options && q.options.length).toBeGreaterThan(1);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.options!.length);
      }
    }
  });
  it("MCQ answer index points to a real option", () => {
    const qs = generateQuiz(SAMPLE, 6);
    for (const q of qs.filter((x) => x.kind === "mcq")) {
      expect(q.options![q.answerIndex!]).toBeTruthy();
    }
  });
});

describe("summarize", () => {
  it("returns at most the requested number of points", () => {
    const pts = summarize(SAMPLE, 3);
    expect(pts.length).toBeLessThanOrEqual(3);
    expect(pts.length).toBeGreaterThan(0);
  });
  it("returns empty for empty input", () => {
    expect(summarize("", 5)).toEqual([]);
  });
});

describe("generateMindMap", () => {
  it("returns a root with branches from study text", () => {
    const map = generateMindMap(SAMPLE, "Cell");
    expect(map.label).toBe("Cell");
    expect(map.children.length).toBeGreaterThan(0);
    expect(map.children.length).toBeLessThanOrEqual(6);
  });
  it("branches carry a label and a children array", () => {
    const map = generateMindMap(SAMPLE);
    for (const branch of map.children) {
      expect(typeof branch.label).toBe("string");
      expect(branch.label.length).toBeGreaterThan(0);
      expect(Array.isArray(branch.children)).toBe(true);
    }
  });
  it("does not duplicate the root as a branch", () => {
    const map = generateMindMap(SAMPLE, "cell");
    expect(map.children.some((b) => b.label.toLowerCase() === "cell")).toBe(false);
  });
  it("respects the maxBranches limit", () => {
    const map = generateMindMap(SAMPLE, "Biology", 3);
    expect(map.children.length).toBeLessThanOrEqual(3);
  });
});

describe("cardFromSelection", () => {
  it("short selection becomes a cloze over its containing sentence", () => {
    const card = cardFromSelection(SAMPLE, "powerhouse");
    expect(card?.kind).toBe("cloze");
    expect(card?.front).toContain("{{c1::powerhouse}}");
    expect(card?.back).toBe("powerhouse");
  });
  it("long definition selection becomes a Q/A basic card", () => {
    const card = cardFromSelection(SAMPLE, "The mitochondrion is the powerhouse of the cell and the site of ATP production");
    expect(card?.kind).toBe("basic");
    expect(card?.front.toLowerCase()).toContain("what is");
    expect(card?.front.toLowerCase()).toContain("mitochondrion");
  });
  it("long non-definition selection becomes an explain card", () => {
    const long = "Energy flows through the system in a continuous cascade of coupled reactions across membranes";
    const card = cardFromSelection(SAMPLE, long);
    expect(card?.kind).toBe("basic");
    expect(card?.back).toBe(long);
  });
  it("returns null for a too-short selection", () => {
    expect(cardFromSelection(SAMPLE, "a")).toBeNull();
  });
});

describe("tutorReply", () => {
  it("greets on a greeting", () => {
    expect(tutorReply("hi there").toLowerCase()).toContain("study tutor");
  });
  it("summarises when asked and material is present", () => {
    const reply = tutorReply("can you summarise this", { material: SAMPLE });
    expect(reply.toLowerCase()).toContain("key points");
  });
  it("offers a study plan when asked", () => {
    const reply = tutorReply("help me make a study plan");
    expect(reply.toLowerCase()).toMatch(/plan|exam|review/);
  });
  it("gives a structured explanation for 'explain' intents", () => {
    const reply = tutorReply("explain photosynthesis like I'm 12");
    expect(reply.toLowerCase()).toContain("photosynthesis");
  });
  it("always returns a non-empty string", () => {
    expect(tutorReply("").length).toBeGreaterThan(0);
    expect(tutorReply("random unmatched question xyz").length).toBeGreaterThan(0);
  });
});
