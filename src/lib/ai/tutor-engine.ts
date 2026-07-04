// ─── Offline tutor engine ────────────────────────────────────────────────────
// A deterministic, dependency-free study assistant used when no LLM API key is
// configured (and by the client for instant content generation). It is not a
// language model — it uses heuristics over the user's own study material — but
// it produces genuinely useful flashcards, quizzes, summaries and coaching so
// the product is fully functional offline.

export interface GeneratedCard {
  kind: "basic" | "cloze" | "mcq" | "truefalse";
  front: string;
  back: string;
  options?: string[];
  answerIndex?: number;
}

export interface GeneratedQuestion {
  kind: "mcq" | "truefalse" | "short" | "fill";
  prompt: string;
  options?: string[];
  answerIndex?: number;
  answerText?: string;
  explanation: string;
  topic?: string;
}

export interface MindMapNode {
  label: string;
  children: MindMapNode[];
}

const STOPWORDS = new Set(
  "the a an and or but of to in on at for with as is are was were be been being this that these those it its by from into than then so such not no can will would should could may might must have has had do does did we you they he she i".split(
    " ",
  ),
);

/** Split prose into clean, meaningful sentences. */
export function toSentences(text: string): string[] {
  return text
    .replace(/```[\s\S]*?```/g, " ") // drop fenced code
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 260 && /[a-zA-Z]/.test(s));
}

/** Rank keywords by frequency, ignoring stopwords. */
export function keywords(text: string, limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/** Detect "X is/are/means Y" definition sentences. */
function definitions(sentences: string[]): { term: string; definition: string }[] {
  const out: { term: string; definition: string }[] = [];
  const re = /^(.{2,60}?)\s+(?:is|are|is defined as|refers to|means|describes)\s+(.{10,200})$/i;
  for (const s of sentences) {
    const m = s.match(re);
    if (m) {
      const term = m[1].replace(/^(a|an|the)\s+/i, "").trim();
      if (term.split(" ").length <= 6) out.push({ term, definition: m[2].trim() });
    }
  }
  return out;
}

/** Pick the most "important" sentences for a summary (keyword density). */
export function summarize(text: string, maxPoints = 6): string[] {
  const sentences = toSentences(text);
  if (sentences.length === 0) return [];
  const kw = new Set(keywords(text, 20));
  const scored = sentences.map((s) => {
    const words = s.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
    const score = words.filter((w) => kw.has(w)).length / Math.sqrt(words.length + 1);
    return { s, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .map((x) => x.s);
}

function distractors(correct: string, pool: string[], n = 3): string[] {
  const options = pool.filter((p) => p.toLowerCase() !== correct.toLowerCase());
  const picked: string[] = [];
  const used = new Set<string>();
  for (const o of options) {
    const key = o.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    picked.push(o);
    if (picked.length >= n) break;
  }
  while (picked.length < n) picked.push(["None of the above", "All of the above", "Cannot be determined"][picked.length % 3]);
  return picked;
}

/** Generate flashcards from arbitrary study text. */
export function generateCards(text: string, count = 8): GeneratedCard[] {
  const sentences = toSentences(text);
  const defs = definitions(sentences);
  const cards: GeneratedCard[] = [];
  const kwPool = keywords(text, 30);

  // 1) Definition → basic cards
  for (const d of defs) {
    if (cards.length >= count) break;
    cards.push({ kind: "basic", front: `What ${/s$/.test(d.term) ? "are" : "is"} ${d.term}?`, back: capitalize(d.definition) });
  }

  // 2) Cloze deletions over keyword-rich sentences
  for (const s of sentences) {
    if (cards.length >= count) break;
    const term = kwPool.find((k) => new RegExp(`\\b${escapeRe(k)}\\b`, "i").test(s) && k.length > 4);
    if (!term) continue;
    if (defs.some((d) => s.includes(d.definition))) continue; // avoid dup with defs
    const cloze = s.replace(new RegExp(`\\b(${escapeRe(term)})\\b`, "i"), "{{c1::$1}}");
    if (cloze.includes("{{c1::")) cards.push({ kind: "cloze", front: cloze, back: term });
  }

  // 3) Fill remainder with true/false from remaining sentences
  for (const s of sentences) {
    if (cards.length >= count) break;
    if (cards.some((c) => c.front.includes(s.slice(0, 20)))) continue;
    cards.push({ kind: "truefalse", front: s, back: "True — stated directly in your material." });
  }

  return cards.slice(0, count);
}

/** Generate quiz questions from study text. */
export function generateQuiz(text: string, count = 5): GeneratedQuestion[] {
  const sentences = toSentences(text);
  const defs = definitions(sentences);
  const kwPool = keywords(text, 30);
  const questions: GeneratedQuestion[] = [];

  // MCQ from definitions: "Which term means …?"
  const termPool = defs.map((d) => capitalize(d.term));
  for (const d of defs) {
    if (questions.length >= count) break;
    const correct = capitalize(d.term);
    const options = shuffleKeepingIndex([correct, ...distractors(correct, termPool.length > 3 ? termPool : kwPool.map(capitalize))]);
    questions.push({
      kind: "mcq",
      prompt: `Which term is defined as: "${truncate(d.definition, 120)}"?`,
      options: options.list,
      answerIndex: options.index,
      explanation: `${correct} — ${d.definition}`,
      topic: correct,
    });
  }

  // Fill-in-the-blank from keyword sentences
  for (const s of sentences) {
    if (questions.length >= count) break;
    const term = kwPool.find((k) => k.length > 4 && new RegExp(`\\b${escapeRe(k)}\\b`, "i").test(s));
    if (!term) continue;
    if (questions.some((q) => q.answerText?.toLowerCase() === term)) continue;
    questions.push({
      kind: "fill",
      prompt: s.replace(new RegExp(`\\b${escapeRe(term)}\\b`, "i"), "______"),
      answerText: term,
      explanation: `The missing term is "${term}".`,
      topic: term,
    });
  }

  // True/false to top up
  for (const s of sentences) {
    if (questions.length >= count) break;
    if (questions.some((q) => q.prompt.includes(s.slice(0, 20)))) continue;
    questions.push({
      kind: "truefalse",
      prompt: s,
      options: ["True", "False"],
      answerIndex: 0,
      explanation: "This statement appears in your material.",
      topic: "Recall",
    });
  }

  return questions.slice(0, count);
}

/**
 * Build a hierarchical mind map from study text.
 * root → branches (key concepts / defined terms) → leaves (related detail).
 * Deterministic and dependency-free.
 */
export function generateMindMap(text: string, rootLabel?: string, maxBranches = 6): MindMapNode {
  const sentences = toSentences(text);
  const defs = definitions(sentences);
  const kw = keywords(text, 24);
  const root = (rootLabel || kw[0] || "Topic").trim();

  const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const shortLeaf = (s: string) => {
    // Turn a sentence into a compact leaf phrase.
    const words = s.split(/\s+/).slice(0, 8).join(" ");
    return capFirst(words.replace(/[.,;:]$/, ""));
  };

  const branches: MindMapNode[] = [];
  const usedTerms = new Set<string>();
  // Words already covered by the root label don't deserve their own branch.
  for (const w of root.toLowerCase().split(/\s+/)) usedTerms.add(w);

  // 1) Prefer defined terms as branches — they're the load-bearing concepts.
  for (const d of defs) {
    if (branches.length >= maxBranches) break;
    const term = capFirst(d.term);
    const key = term.toLowerCase();
    if (usedTerms.has(key) || key === root.toLowerCase()) continue;
    usedTerms.add(key);
    // Leaf: the keyword-rich fragment of the definition.
    const leafWords = (d.definition.match(/[a-z][a-z-]{4,}/gi) ?? [])
      .filter((w) => !STOPWORDS.has(w.toLowerCase()))
      .slice(0, 3)
      .map(capFirst);
    branches.push({
      label: term,
      children: leafWords.length ? [{ label: leafWords.join(" · "), children: [] }] : [{ label: shortLeaf(d.definition), children: [] }],
    });
  }

  // 2) Top up with frequent keywords, attaching a supporting sentence as a leaf.
  for (const word of kw) {
    if (branches.length >= maxBranches) break;
    const key = word.toLowerCase();
    if (usedTerms.has(key) || key === root.toLowerCase() || word.length < 4) continue;
    const supporting = sentences.find((s) => new RegExp(`\\b${word}\\b`, "i").test(s));
    usedTerms.add(key);
    branches.push({
      label: capFirst(word),
      children: supporting ? [{ label: shortLeaf(supporting), children: [] }] : [],
    });
  }

  return { label: capFirst(root), children: branches };
}

// ─── Conversational tutor (heuristic) ────────────────────────────────────────

export interface TutorContext {
  studentName?: string;
  subjects?: string[];
  /** Concatenated note/deck text the tutor can reference. */
  material?: string;
}

/**
 * Produce a helpful tutor reply for a question. This is a heuristic engine:
 * it recognises intents (explain / quiz / summarise / plan / define) and
 * grounds answers in the student's own material when possible.
 */
export function tutorReply(question: string, ctx: TutorContext = {}): string {
  const q = question.toLowerCase().trim();
  const name = ctx.studentName ? ` ${ctx.studentName.split(" ")[0]}` : "";

  if (/^(hi|hey|hello|yo|good (morning|evening|afternoon))\b/.test(q)) {
    return `Hi${name}! 👋 I'm your study tutor. I can explain concepts, quiz you, summarise notes, make flashcards, or build a study plan. What are we working on today?`;
  }

  if (/\b(summar\w*|tl;?dr|key points|main points)\b/.test(q)) {
    if (ctx.material) {
      const points = summarize(ctx.material, 6);
      if (points.length) {
        return `Here are the key points from your material:\n\n${points.map((p) => `- ${p}`).join("\n")}\n\nWant me to turn these into flashcards?`;
      }
    }
    return "Open a note or paste some text and I'll pull out the key points for you. You can also hit **Summarise** on any note.";
  }

  if (/\b(quiz|test me|practice questions?|ask me)\b/.test(q)) {
    if (ctx.material) {
      const quiz = generateQuiz(ctx.material, 3);
      if (quiz.length) {
        const body = quiz
          .map((x, i) => {
            if (x.kind === "mcq" && x.options) {
              return `**Q${i + 1}.** ${x.prompt}\n${x.options.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join("\n")}`;
            }
            return `**Q${i + 1}.** ${x.prompt}`;
          })
          .join("\n\n");
        return `Let's test what you know 📝\n\n${body}\n\nReply with your answers and I'll mark them — or open the **Quizzes** tab for auto-marked practice.`;
      }
    }
    return "Head to the **Quizzes** tab and I'll generate an auto-marked quiz from any subject, note, or topic.";
  }

  if (/\b(plan|schedule|revision|study plan|timetable)\b/.test(q)) {
    return `Here's how I'd approach a study plan${name}:\n\n1. **List your exam dates** and how many hours per day you can study.\n2. **Prioritise weak topics first** — I track these in your Analytics.\n3. **Interleave subjects** rather than blocking one at a time — it improves retention.\n4. **Review flashcards daily** so spaced repetition can do its job.\n5. **Take breaks** — 25 min focus / 5 min rest works well.\n\nOpen the **Planner** and hit *Auto-generate* and I'll lay out your whole week.`;
  }

  if (/\b(define|definition|what (is|are)|meaning of)\b/.test(q)) {
    if (ctx.material) {
      const defs = definitions(toSentences(ctx.material));
      const target = q.replace(/.*\b(what (is|are)|define|definition of|meaning of)\b/, "").replace(/[?.]/g, "").trim();
      const hit = defs.find((d) => target && d.term.toLowerCase().includes(target.slice(0, 12)));
      if (hit) return `**${capitalize(hit.term)}** — ${hit.definition}\n\n(From your notes.)`;
    }
    return explainHeuristic(question, name);
  }

  if (/\b(explain|simplif|eli5|understand|teach me|how does|why does)\b/.test(q)) {
    return explainHeuristic(question, name);
  }

  if (/\b(flashcard|cards?)\b/.test(q)) {
    return "Open any note or deck and hit **Generate with AI** — I'll turn your material into flashcards (basic, cloze, MCQ) scheduled with spaced repetition automatically.";
  }

  if (/\b(mind ?map|concept map|diagram)\b/.test(q)) {
    return "Head to the **Mind Maps** tab — paste any text or pick a note and I'll build an interactive concept map you can expand, collapse and export.";
  }

  // General fallback: an encouraging, structured study coach reply.
  return explainHeuristic(question, name);
}

function explainHeuristic(question: string, name: string): string {
  const topic = question
    .replace(/^(please\s+)?(can you\s+)?(explain|simplify|teach me|tell me about|what is|what are|how does|why does|eli5)\s*/i, "")
    .replace(/like i'?m \d+/i, "")
    .replace(/[?.]+$/, "")
    .trim();
  const subject = topic || "this topic";
  return [
    `Great question${name}! Here's how I'd break down **${subject}**:`,
    ``,
    `1. **Start with the big picture** — what problem does ${subject} solve, and where does it fit?`,
    `2. **Define the core terms** so the vocabulary doesn't trip you up.`,
    `3. **Work a concrete example** — abstract ideas stick better once you've seen one in action.`,
    `4. **Connect it to something you already know** (an analogy makes it memorable).`,
    `5. **Test yourself** with a couple of recall questions before moving on.`,
    ``,
    `💡 *Tip:* the fastest way to master ${subject} is to generate flashcards from your notes and let spaced repetition lock it in.`,
    ``,
    `_Add an AI provider key in Settings to unlock full LLM-powered explanations. Until then I'm coaching you with study-science heuristics grounded in your own material._`,
  ].join("\n");
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function shuffleKeepingIndex(list: string[]): { list: string[]; index: number } {
  const correct = list[0];
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { list: shuffled, index: shuffled.indexOf(correct) };
}
