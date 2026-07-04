// ─── Oral quiz grading ───────────────────────────────────────────────────────
// Grades a spoken (or typed) answer against a quiz question. Speech transcripts
// are messy — "uh option b", "the answer is paris", "B." — so matching is
// deliberately forgiving: option letters, option text, and fuzzy phrase
// containment all count.

import type { QuizQuestion } from "./types";
import { answersMatch } from "./utils";

export interface OralGrade {
  correct: boolean;
  /** What we understood the answer to be (for display). */
  interpreted: string;
  /** The canonical correct answer (for feedback). */
  expected: string;
}

const FILLERS = /\b(uh+|um+|the answer is|answer|i think|it's|its|it is|option|choice|letter|number)\b/g;

function clean(s: string): string {
  return s.toLowerCase().replace(FILLERS, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

const LETTERS = ["a", "b", "c", "d", "e", "f"];
const ORDINALS: Record<string, number> = {
  first: 0, one: 0, "1": 0,
  second: 1, two: 1, "2": 1,
  third: 2, three: 2, "3": 2,
  fourth: 3, four: 3, "4": 3,
};

/** Extract a choice index from a transcript like "b", "option c", "the third one". */
export function extractChoiceIndex(transcript: string, optionCount: number): number | null {
  const t = clean(transcript);
  if (!t) return null;
  const words = t.split(" ");

  // Single letter mention: "b" / "bee" for b.
  for (const w of words) {
    const norm = w === "bee" ? "b" : w === "sea" || w === "see" ? "c" : w;
    const idx = LETTERS.indexOf(norm);
    if (idx >= 0 && idx < optionCount && norm.length === 1) return idx;
  }
  // Ordinals / numbers.
  for (const w of words) {
    if (w in ORDINALS && ORDINALS[w] < optionCount) return ORDINALS[w];
  }
  return null;
}

export function gradeOralAnswer(question: QuizQuestion, transcript: string): OralGrade {
  const raw = transcript.trim();

  if (question.kind === "truefalse") {
    const t = clean(raw);
    const saidTrue = /\b(true|yes|yeah|correct|right)\b/.test(t);
    const saidFalse = /\b(false|no|nope|wrong|incorrect)\b/.test(t);
    const expected = question.answerIndex === 0 ? "True" : "False";
    const correct = (question.answerIndex === 0 && saidTrue && !saidFalse) ||
      (question.answerIndex === 1 && saidFalse && !saidTrue);
    return { correct, interpreted: saidTrue ? "True" : saidFalse ? "False" : raw || "—", expected };
  }

  if (question.kind === "mcq" && question.options) {
    const expected = question.options[question.answerIndex ?? 0] ?? "";
    // 1) Option letter / ordinal.
    const idx = extractChoiceIndex(raw, question.options.length);
    if (idx !== null) {
      return { correct: idx === question.answerIndex, interpreted: `${LETTERS[idx].toUpperCase()}. ${question.options[idx]}`, expected };
    }
    // 2) Option text match — pick the option the transcript matches best.
    for (let i = 0; i < question.options.length; i++) {
      if (answersMatch(clean(raw), clean(question.options[i]))) {
        return { correct: i === question.answerIndex, interpreted: question.options[i], expected };
      }
    }
    return { correct: false, interpreted: raw || "—", expected };
  }

  // short / fill
  const expected = question.answerText ?? "";
  return { correct: answersMatch(clean(raw), clean(expected)), interpreted: raw || "—", expected };
}

/** The text TTS should read for a question (options included for MCQ). */
export function questionSpeech(question: QuizQuestion, index: number): string {
  const parts: string[] = [`Question ${index + 1}. ${question.prompt}`];
  if (question.kind === "mcq" && question.options) {
    parts.push(...question.options.map((o, i) => `${LETTERS[i].toUpperCase()}: ${o}.`));
    parts.push("Say the letter or the answer.");
  } else if (question.kind === "truefalse") {
    parts.push("True, or false?");
  }
  return parts.join(" ");
}
