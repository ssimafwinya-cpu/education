// ─── Career Mode authoring ───────────────────────────────────────────────────
// Admins feed in their own courses (notes → teach sections, past papers →
// drills and move tests) from the Admin console; the result is distributed to
// every member through the global site content. Everything that enters the
// shared store passes through validateCareerCourse, which both checks the
// structure (so a broken course can never brick the Career page) and
// normalises it (trims strings, drops unknown fields — JSON import can't
// smuggle arbitrary data into SiteContent).

import type { CareerCourse, CareerQuestion, CareerTopic, TeachSection } from "./career";

export type ValidationResult =
  | { ok: true; course: CareerCourse; warnings: string[] }
  | { ok: false; errors: string[] };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

// ─── Question ────────────────────────────────────────────────────────────────

function validateQuestion(
  raw: unknown, where: string, errors: string[], warnings: string[], seenIds: Set<string>,
): CareerQuestion | null {
  const q = asRecord(raw);
  if (!q) { errors.push(`${where}: not an object`); return null; }
  const id = str(q.id);
  const prompt = str(q.prompt);
  const kind = q.kind === "mcq" || q.kind === "truefalse" || q.kind === "fill" ? q.kind : null;
  if (!id) errors.push(`${where}: missing question id`);
  else if (seenIds.has(id)) errors.push(`${where}: duplicate question id "${id}"`);
  else seenIds.add(id);
  if (!prompt) errors.push(`${where}: empty prompt`);
  if (!kind) { errors.push(`${where}: kind must be mcq, truefalse or fill`); return null; }

  const source = q.source === "past-paper" ? "past-paper" : "exam-style";
  const sourceRef = str(q.sourceRef) || undefined;
  if (source === "past-paper" && !sourceRef) {
    warnings.push(`${where}: marked past-paper but has no sourceRef (e.g. "2023 Final Q4")`);
  }
  const explanation = str(q.explanation);
  if (!explanation) warnings.push(`${where}: no explanation — students learn most from the why`);

  const out: CareerQuestion = { id, kind, prompt, explanation, source, ...(sourceRef ? { sourceRef } : {}) };

  if (kind === "fill") {
    const answers = Array.isArray(q.answerText) ? q.answerText.map(str).filter(Boolean) : [];
    if (answers.length === 0) errors.push(`${where}: fill question needs at least one accepted answer`);
    out.answerText = answers;
    return out;
  }
  const options = kind === "truefalse"
    ? ["True", "False"]
    : Array.isArray(q.options) ? q.options.map(str).filter(Boolean) : [];
  const answerIndex = typeof q.answerIndex === "number" && Number.isInteger(q.answerIndex) ? q.answerIndex : -1;
  if (kind === "mcq" && options.length < 2) errors.push(`${where}: mcq needs at least 2 options`);
  if (answerIndex < 0 || answerIndex >= options.length) {
    errors.push(`${where}: answerIndex must point at one of the options`);
  }
  out.options = options;
  out.answerIndex = answerIndex;
  return out;
}

// ─── Course ──────────────────────────────────────────────────────────────────

export function validateCareerCourse(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const c = asRecord(raw);
  if (!c) return { ok: false, errors: ["Course must be an object"] };

  const code = str(c.code);
  const title = str(c.title);
  const id = str(c.id) || slug(code);
  if (!code) errors.push("Course code is required (e.g. BIO 1400)");
  if (!title) errors.push("Course title is required");
  if (!id) errors.push("Course id is required");

  const topicsRaw = Array.isArray(c.topics) ? c.topics : [];
  if (topicsRaw.length === 0) errors.push("A course needs at least one topic");

  const questionIds = new Set<string>();
  const topics: CareerTopic[] = [];
  const topicIds = new Set<string>();

  topicsRaw.forEach((rawTopic, ti) => {
    const t = asRecord(rawTopic);
    const label = `Topic ${ti + 1}`;
    if (!t) { errors.push(`${label}: not an object`); return; }
    const tTitle = str(t.title);
    const tId = str(t.id) || slug(tTitle);
    if (!tTitle) errors.push(`${label}: title is required`);
    if (!tId) errors.push(`${label}: id is required`);
    else if (topicIds.has(tId)) errors.push(`${label}: duplicate topic id "${tId}"`);
    else topicIds.add(tId);

    const examWeight = typeof t.examWeight === "number" && Number.isFinite(t.examWeight) && t.examWeight > 0
      ? t.examWeight : 0;
    if (examWeight === 0) errors.push(`${label} ("${tTitle || tId}"): examWeight must be a positive number`);

    const prereqs = Array.isArray(t.prereqs) ? t.prereqs.map(str).filter(Boolean) : [];

    const teach: TeachSection[] = [];
    (Array.isArray(t.teach) ? t.teach : []).forEach((rawSec, si) => {
      const s = asRecord(rawSec);
      const w = `${label}, teach section ${si + 1}`;
      if (!s) { errors.push(`${w}: not an object`); return; }
      const heading = str(s.heading);
      const body = str(s.body);
      if (!heading) errors.push(`${w}: heading is required`);
      if (!body) errors.push(`${w}: body is required — this is the teaching script`);
      const check = validateQuestion(s.check, `${w} check`, errors, warnings, questionIds);
      if (check) teach.push({ heading, body, check });
    });
    if (teach.length === 0) errors.push(`${label} ("${tTitle || tId}"): needs at least one teach section`);

    const drill = (Array.isArray(t.drill) ? t.drill : [])
      .map((q, qi) => validateQuestion(q, `${label} drill Q${qi + 1}`, errors, warnings, questionIds))
      .filter((q): q is CareerQuestion => q !== null);
    if (drill.length === 0) errors.push(`${label} ("${tTitle || tId}"): needs at least one drill question`);

    const moveTest = (Array.isArray(t.moveTest) ? t.moveTest : [])
      .map((q, qi) => validateQuestion(q, `${label} move-test Q${qi + 1}`, errors, warnings, questionIds))
      .filter((q): q is CareerQuestion => q !== null);
    if (moveTest.length === 0) {
      errors.push(`${label} ("${tTitle || tId}"): the Move Test needs at least one question — it is the gate`);
    }

    topics.push({
      id: tId, title: tTitle,
      emoji: str(t.emoji) || "📘",
      whyLine: str(t.whyLine),
      examWeight, prereqs, teach, drill, moveTest,
    });
  });

  // Prereqs must reference real topics and never form a cycle (a cycle would
  // permanently lock every topic on it).
  for (const t of topics) {
    for (const pr of t.prereqs) {
      if (pr === t.id) errors.push(`Topic "${t.title}": cannot be its own prerequisite`);
      else if (!topicIds.has(pr)) errors.push(`Topic "${t.title}": prerequisite "${pr}" does not exist`);
    }
  }
  if (errors.length === 0) {
    const state = new Map<string, "visiting" | "done">();
    const visit = (tid: string, trail: string[]): boolean => {
      if (state.get(tid) === "done") return true;
      if (state.get(tid) === "visiting") {
        errors.push(`Prerequisite cycle: ${[...trail, tid].join(" → ")} — these topics can never unlock`);
        return false;
      }
      state.set(tid, "visiting");
      const topic = topics.find((t) => t.id === tid);
      const ok = (topic?.prereqs ?? []).every((pr) => visit(pr, [...trail, tid]));
      state.set(tid, "done");
      return ok;
    };
    for (const t of topics) if (!visit(t.id, [])) break;
    if (topics.length > 0 && topics.every((t) => t.prereqs.length > 0)) {
      errors.push("At least one topic must have no prerequisites, or the course starts fully locked");
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    warnings,
    course: {
      id, code, title,
      emoji: str(c.emoji) || "🎓",
      intro: str(c.intro),
      topics,
    },
  };
}

// ─── Merge with the built-in courses ─────────────────────────────────────────

/** Custom courses override a built-in with the same id, otherwise append. */
export function mergeCareerCourses(builtIn: CareerCourse[], custom: CareerCourse[] | undefined): CareerCourse[] {
  if (!custom || custom.length === 0) return builtIn;
  const customIds = new Set(custom.map((c) => c.id));
  return [...builtIn.filter((c) => !customIds.has(c.id)), ...custom];
}

// ─── JSON import / export ────────────────────────────────────────────────────

export function parseCareerCourseJson(text: string): ValidationResult {
  try {
    return validateCareerCourse(JSON.parse(text));
  } catch (e) {
    return { ok: false, errors: [`Not valid JSON: ${e instanceof Error ? e.message : String(e)}`] };
  }
}

export function serializeCareerCourse(course: CareerCourse): string {
  return JSON.stringify(course, null, 2);
}

// ─── Blank templates for the editor ──────────────────────────────────────────

let uid = 0;
const freshId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(uid++).toString(36)}`;

export function blankQuestion(): CareerQuestion {
  return {
    id: freshId("q"), kind: "mcq", prompt: "", options: ["", ""], answerIndex: 0,
    explanation: "", source: "exam-style",
  };
}

export function blankTopic(): CareerTopic {
  return {
    id: freshId("t"), title: "", emoji: "📘", whyLine: "", examWeight: 1, prereqs: [],
    teach: [{ heading: "", body: "", check: blankQuestion() }],
    drill: [blankQuestion()],
    moveTest: [blankQuestion()],
  };
}

export function blankCourse(): CareerCourse {
  return { id: freshId("course"), code: "", title: "", emoji: "🎓", intro: "", topics: [blankTopic()] };
}
