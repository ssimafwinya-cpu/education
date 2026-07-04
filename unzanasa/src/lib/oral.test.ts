import { describe, it, expect } from "vitest";
import { gradeOralAnswer, extractChoiceIndex, questionSpeech } from "./oral";
import type { QuizQuestion } from "./types";

const MCQ: QuizQuestion = {
  id: "q1", kind: "mcq",
  prompt: "Which organelle produces ATP?",
  options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"],
  answerIndex: 1,
  explanation: "Mitochondria produce ATP.",
};
const TF: QuizQuestion = {
  id: "q2", kind: "truefalse", prompt: "Osmosis requires ATP.",
  options: ["True", "False"], answerIndex: 1, explanation: "It is passive.",
};
const FILL: QuizQuestion = {
  id: "q3", kind: "fill", prompt: "The Berlin Wall fell in ______.",
  answerText: "1989", explanation: "9 Nov 1989.",
};

describe("extractChoiceIndex", () => {
  it("understands bare letters", () => {
    expect(extractChoiceIndex("b", 4)).toBe(1);
    expect(extractChoiceIndex("C", 4)).toBe(2);
  });
  it("understands 'option b' and filler-laden speech", () => {
    expect(extractChoiceIndex("um the answer is option b", 4)).toBe(1);
  });
  it("understands ordinals and numbers", () => {
    expect(extractChoiceIndex("the second one", 4)).toBe(1);
    expect(extractChoiceIndex("3", 4)).toBe(2);
  });
  it("rejects letters outside the option range", () => {
    expect(extractChoiceIndex("f", 4)).toBeNull();
  });
  it("returns null when no choice is expressed", () => {
    expect(extractChoiceIndex("the powerhouse of the cell", 4)).toBeNull();
  });
});

describe("gradeOralAnswer — MCQ", () => {
  it("grades a correct letter answer", () => {
    const g = gradeOralAnswer(MCQ, "b");
    expect(g.correct).toBe(true);
    expect(g.interpreted).toContain("Mitochondrion");
  });
  it("grades a wrong letter answer", () => {
    expect(gradeOralAnswer(MCQ, "a").correct).toBe(false);
  });
  it("grades spoken option text", () => {
    expect(gradeOralAnswer(MCQ, "the mitochondrion").correct).toBe(true);
    expect(gradeOralAnswer(MCQ, "I think it's the ribosome").correct).toBe(false);
  });
  it("reports the expected answer for feedback", () => {
    expect(gradeOralAnswer(MCQ, "nucleus").expected).toBe("Mitochondrion");
  });
});

describe("gradeOralAnswer — true/false", () => {
  it("accepts yes/no synonyms", () => {
    expect(gradeOralAnswer(TF, "no that's false").correct).toBe(true);
    expect(gradeOralAnswer(TF, "yes").correct).toBe(false);
  });
  it("contradictory answers are wrong", () => {
    expect(gradeOralAnswer(TF, "true false").correct).toBe(false);
  });
});

describe("gradeOralAnswer — fill/short", () => {
  it("matches the expected text fuzzily", () => {
    expect(gradeOralAnswer(FILL, "1989").correct).toBe(true);
    expect(gradeOralAnswer(FILL, "it was 1989 I believe").correct).toBe(true);
    expect(gradeOralAnswer(FILL, "1961").correct).toBe(false);
  });
  it("empty answers are wrong", () => {
    expect(gradeOralAnswer(FILL, "").correct).toBe(false);
  });
});

describe("questionSpeech", () => {
  it("includes numbered prompt and lettered options for MCQ", () => {
    const s = questionSpeech(MCQ, 0);
    expect(s).toContain("Question 1");
    expect(s).toContain("A: Nucleus");
    expect(s).toContain("B: Mitochondrion");
  });
  it("asks true-or-false for TF questions", () => {
    expect(questionSpeech(TF, 2)).toContain("True, or false?");
  });
});
