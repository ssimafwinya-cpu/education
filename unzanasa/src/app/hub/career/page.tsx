"use client";

// Career Mode: one locked path through a course. Teach → drill → Move Test →
// unlock the next topic; passed topics come back as memory checks. All rules
// live in lib/career.ts — this page is the game shell.

import { useMemo, useState } from "react";
import { Lock, Check, AlertTriangle, Brain, Trophy, Target, ArrowRight, RotateCcw, Swords, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Progress, useToast } from "@/components/ui";
import {
  emptyCourseProgress, emptyTopicProgress, topicProgress, topicStatus, topicDepth,
  isCorrect, gradeMoveTest, scheduleAfterPass, applyMemoryCheck, dueMemoryChecks,
  memoryCheckQuestions, readinessScore, completionPercent, nextAction, rankFor,
  XP_DRILL_CORRECT, XP_MOVE_TEST_PASS, XP_MEMORY_CHECK,
  type CareerCourse, type CareerTopic, type CareerQuestion, type CourseProgress, type MoveTestVerdict,
} from "@/lib/career";
import { CAREER_COURSES } from "@/lib/career-content";
import { cn } from "@/lib/utils";

type View =
  | { kind: "tree" }
  | { kind: "topic"; topicId: string }
  | { kind: "memory"; topicId: string };

export default function CareerPage() {
  const { state, dispatch } = useStore();
  const course = CAREER_COURSES[0];
  const progress = state.career?.[course.id] ?? emptyCourseProgress();
  const [view, setView] = useState<View>({ kind: "tree" });
  const now = Date.now();

  const save = (p: CourseProgress) => dispatch({ type: "UPDATE_CAREER", courseId: course.id, progress: p });

  const rank = rankFor(progress.xp);
  const readiness = readinessScore(course, progress, now);
  const completion = completionPercent(course, progress);
  const action = nextAction(course, progress, now);
  const due = dueMemoryChecks(course, progress, now);

  return (
    <div>
      <PageHeader
        title="Career Mode"
        description={`${course.emoji} ${course.code} · ${course.title} — pass each gate to unlock the next topic.`}
        icon={<Swords className="text-brand-500" />}
        actions={<Badge tone="gold">{rank.emoji} {rank.title}</Badge>}
      />

      {/* Header stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Exam readiness</div>
          <div className={cn("text-3xl font-bold", readiness >= 70 ? "text-brand-600 dark:text-brand-300" : readiness >= 40 ? "text-amber-500" : "text-crimson-600")}>{readiness}%</div>
          <p className="mt-1 text-xs text-ink-muted">Passed <em>and retained</em> exam weight — the number to check before a test.</p>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Course unlocked</div>
          <div className="text-3xl font-bold">{completion}%</div>
          <div className="mt-2"><Progress value={completion} tone="brand" /></div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Rank · {progress.xp} XP</div>
          <div className="text-2xl font-bold">{rank.emoji} {rank.title}</div>
          {rank.next !== null && <div className="mt-2 flex items-center gap-2"><Progress value={rank.progress} tone="amber" /><span className="text-[10px] text-ink-faint">next at {rank.next}</span></div>}
        </Card>
      </div>

      {view.kind === "tree" && (
        <>
          {/* The one right thing to do now */}
          {action.kind !== "done" && (
            <Card className="mb-6 border-brand-500/40">
              <div className="flex flex-wrap items-center gap-3">
                <Target size={18} className="shrink-0 text-brand-500" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {action.kind === "memory-check" && <>Memory check due: {action.topic.emoji} {action.topic.title}{due.length > 1 ? ` (+${due.length - 1} more waiting)` : ""}</>}
                    {action.kind === "continue" && <>Continue where you left off: {action.topic.emoji} {action.topic.title}</>}
                    {action.kind === "start" && <>Next gate: {action.topic.emoji} {action.topic.title}</>}
                  </div>
                  <p className="text-sm text-ink-muted">{action.kind === "memory-check" ? "Three quick questions to keep it from fading." : action.topic.whyLine}</p>
                </div>
                <button
                  onClick={() => setView(action.kind === "memory-check" ? { kind: "memory", topicId: action.topic.id } : { kind: "topic", topicId: action.topic.id })}
                  className="btn-primary btn-sm"
                >
                  {action.kind === "memory-check" ? <><Brain size={14} /> Review</> : <><ArrowRight size={14} /> Go</>}
                </button>
              </div>
            </Card>
          )}
          {action.kind === "done" && (
            <Card className="mb-6 border-gold/50 text-center">
              <Trophy size={28} className="mx-auto text-gold-600" />
              <p className="mt-2 font-semibold">Every gate passed and every topic retained. You are exam-ready.</p>
            </Card>
          )}

          <TopicTree course={course} progress={progress} now={now} onOpen={(t, memory) => setView(memory ? { kind: "memory", topicId: t.id } : { kind: "topic", topicId: t.id })} />

          <p className="mt-8 text-center text-xs text-ink-faint">
            Starter course built from the hub&apos;s CHE 1000 notes with exam-style questions. Real lecture notes,
            course outlines and past papers feed new career courses through the same structure.
          </p>
        </>
      )}

      {view.kind === "topic" && (
        <TopicPlayer
          course={course}
          topic={course.topics.find((t) => t.id === view.topicId)!}
          progress={progress}
          onSave={save}
          onExit={() => setView({ kind: "tree" })}
        />
      )}

      {view.kind === "memory" && (
        <MemoryCheck
          topic={course.topics.find((t) => t.id === view.topicId)!}
          progress={progress}
          onSave={save}
          onExit={() => setView({ kind: "tree" })}
        />
      )}
    </div>
  );
}

// ─── Topic tree ───────────────────────────────────────────────────────────────

function TopicTree({ course, progress, now, onOpen }: {
  course: CareerCourse; progress: CourseProgress; now: number;
  onOpen: (t: CareerTopic, memory: boolean) => void;
}) {
  const levels = useMemo(() => {
    const byDepth = new Map<number, CareerTopic[]>();
    for (const t of course.topics) {
      const d = topicDepth(course, t.id);
      byDepth.set(d, [...(byDepth.get(d) ?? []), t]);
    }
    return [...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([, ts]) => ts);
  }, [course]);

  return (
    <div className="space-y-4">
      {levels.map((row, i) => (
        <div key={i} className="grid gap-4 sm:grid-cols-2">
          {row.map((t) => {
            const status = topicStatus(course, progress, t.id);
            const tp = topicProgress(progress, t.id);
            const overdue = tp.passed && tp.srsDue !== null && tp.srsDue <= now;
            const locked = status === "locked";
            return (
              <button
                key={t.id}
                disabled={locked}
                onClick={() => onOpen(t, tp.passed && (overdue || tp.needsReview))}
                className={cn(
                  "card p-5 text-left transition",
                  locked ? "opacity-50" : "card-hover",
                  status === "passed" && !overdue && "border-brand-500/40",
                  status === "needs-review" && "border-crimson-600/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{locked ? "🔒" : t.emoji}</span>
                  <span className={cn("font-semibold", locked && "text-ink-faint")}>{t.title}</span>
                  <span className="ml-auto">
                    {status === "passed" && !overdue && <Badge tone="brand"><Check size={11} /> Passed</Badge>}
                    {status === "passed" && overdue && <Badge tone="amber"><Brain size={11} /> Review due</Badge>}
                    {status === "needs-review" && <Badge tone="crimson"><AlertTriangle size={11} /> Needs review</Badge>}
                    {status === "in-progress" && <Badge tone="gold">In progress</Badge>}
                    {status === "available" && <Badge tone="accent">Unlocked</Badge>}
                    {locked && <Lock size={14} className="text-ink-faint" />}
                  </span>
                </div>
                {!locked && <p className="mt-2 text-sm text-ink-muted">{t.whyLine}</p>}
                {locked && <p className="mt-2 text-xs text-ink-faint">Pass {t.prereqs.map((p) => course.topics.find((x) => x.id === p)?.title).join(" and ")} to unlock.</p>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Topic player: teach → drill → move test ─────────────────────────────────

function TopicPlayer({ course, topic, progress, onSave, onExit }: {
  course: CareerCourse; topic: CareerTopic; progress: CourseProgress;
  onSave: (p: CourseProgress) => void; onExit: () => void;
}) {
  const toast = useToast();
  const tp = topicProgress(progress, topic.id);
  const [phase, setPhase] = useState<"teach" | "drill" | "test" | "verdict">(
    tp.taught >= topic.teach.length ? (tp.drilled.length >= topic.drill.length ? "test" : "drill") : "teach",
  );
  const [verdict, setVerdict] = useState<MoveTestVerdict | null>(null);

  const write = (patch: Partial<typeof tp>, xp = 0) => {
    const next: CourseProgress = {
      ...progress,
      xp: progress.xp + xp,
      topics: { ...progress.topics, [topic.id]: { ...topicProgress(progress, topic.id), ...patch } },
    };
    onSave(next);
    return next;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">{topic.emoji} {topic.title}</h2>
        <button onClick={onExit} className="btn-secondary btn-sm">Back to the path</button>
      </div>

      {/* Phase indicator */}
      <div className="mb-5 flex items-center gap-2 text-xs font-medium">
        {(["teach", "drill", "test"] as const).map((ph, i) => (
          <span key={ph} className={cn("chip", phase === ph || (phase === "verdict" && ph === "test") ? "bg-brand-500/15 text-brand-600 dark:text-brand-300" : "border border-edge text-ink-faint")}>
            {i + 1}. {ph === "teach" ? "Learn" : ph === "drill" ? "Drill" : "Move Test"}
          </span>
        ))}
      </div>

      {phase === "teach" && (
        <TeachPhase topic={topic} startAt={tp.taught} onSection={(idx) => write({ taught: idx + 1 })}
          onDone={() => { setPhase("drill"); toast({ emoji: "📖", title: "Concepts covered — now drill the exam questions." }); }} />
      )}

      {phase === "drill" && (
        <DrillPhase topic={topic} progress={progress} topicId={topic.id}
          onAnswer={(qid, correct, confidence) => {
            const cur = topicProgress(progress, topic.id);
            write({
              drilled: cur.drilled.includes(qid) ? cur.drilled : [...cur.drilled, qid],
              confidence: { ...cur.confidence, [qid]: confidence },
            }, correct ? XP_DRILL_CORRECT : 0);
          }}
          onDone={() => { setPhase("test"); toast({ emoji: "⚔️", title: "The Examiner is ready when you are." }); }} />
      )}

      {phase === "test" && (
        <MoveTestPhase topic={topic} onFinish={(v, answers) => {
          setVerdict(v);
          setPhase("verdict");
          const cur = topicProgress(progress, topic.id);
          if (v.passed) {
            write({ passed: true, bestScore: Math.max(cur.bestScore, v.score), needsReview: false, ...scheduleAfterPass(Date.now()) }, XP_MOVE_TEST_PASS);
          } else {
            write({ failedAttempts: cur.failedAttempts + 1, bestScore: Math.max(cur.bestScore, v.score), taught: 0 });
          }
          void answers;
        }} />
      )}

      {phase === "verdict" && verdict && (
        <Card className={verdict.passed ? "border-brand-500/50" : "border-crimson-600/40"}>
          <div className="text-center">
            <div className="text-4xl">{verdict.passed ? "🏆" : "🧯"}</div>
            <h3 className="mt-2 text-xl font-bold">{verdict.passed ? "Gate passed!" : "Not this time."}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              The Examiner scored you {verdict.correct}/{verdict.total} ({Math.round(verdict.score * 100)}%).{" "}
              {verdict.passed
                ? `+${XP_MOVE_TEST_PASS} XP — the next topic is unlocked, and this one joins your memory checks.`
                : "The topic re-locks to the teaching phase — the Examiner's notes below show exactly what to revisit."}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {verdict.feedback.map((f, i) => (
              <div key={i} className={cn("rounded-lg border p-3 text-sm", f.correct ? "border-edge" : "border-crimson-600/40 bg-crimson-600/5")}>
                <div className="flex items-start gap-2">
                  {f.correct ? <Check size={15} className="mt-0.5 shrink-0 text-brand-500" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-crimson-600" />}
                  <div>
                    <div className={f.correct ? "text-ink-muted" : "font-medium"}>{f.question.prompt}</div>
                    {!f.correct && <p className="mt-1 text-xs text-ink-muted">{f.question.explanation}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {!verdict.passed && <button onClick={() => { setPhase("teach"); setVerdict(null); }} className="btn-primary btn-sm"><RotateCcw size={14} /> Re-learn & retry</button>}
            <button onClick={onExit} className={verdict.passed ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{verdict.passed ? "Back to the path →" : "Back to the path"}</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Phase 1: teach with comprehension checks ────────────────────────────────

function TeachPhase({ topic, startAt, onSection, onDone }: {
  topic: CareerTopic; startAt: number;
  onSection: (idx: number) => void; onDone: () => void;
}) {
  const [idx, setIdx] = useState(Math.min(startAt, topic.teach.length - 1));
  const section = topic.teach[idx];
  const [answered, setAnswered] = useState(false);

  return (
    <Card>
      <div className="mb-1 text-xs text-ink-faint">Concept {idx + 1} of {topic.teach.length} · taught strictly from the course notes</div>
      <h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpen size={17} className="text-brand-500" /> {section.heading}</h3>
      <p className="mt-3 leading-relaxed text-ink-muted">{section.body}</p>
      <div className="mt-5 rounded-xl border border-edge bg-surface p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Quick check before we move on</div>
        <QuestionCard key={section.check.id} q={section.check} onResult={() => setAnswered(true)} />
      </div>
      {answered && (
        <div className="mt-4 text-right">
          <button
            className="btn-primary btn-sm"
            onClick={() => {
              onSection(idx);
              if (idx + 1 >= topic.teach.length) onDone();
              else { setIdx(idx + 1); setAnswered(false); }
            }}
          >
            {idx + 1 >= topic.teach.length ? "Start the drill →" : "Next concept →"}
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Phase 2: drill with confidence tags ─────────────────────────────────────

function DrillPhase({ topic, progress, topicId, onAnswer, onDone }: {
  topic: CareerTopic; progress: CourseProgress; topicId: string;
  onAnswer: (qid: string, correct: boolean, confidence: "sure" | "guessed") => void;
  onDone: () => void;
}) {
  const tp = topicProgress(progress, topicId);
  const remaining = topic.drill.filter((q) => !tp.drilled.includes(q.id));
  const q = remaining[0];
  const [result, setResult] = useState<boolean | null>(null);

  if (!q) {
    return (
      <Card className="text-center">
        <div className="text-3xl">⚔️</div>
        <p className="mt-2 font-semibold">All {topic.drill.length} exam-style questions drilled.</p>
        <button onClick={onDone} className="btn-primary btn-sm mt-3">Face the Examiner →</button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
        <span>Drill · question {topic.drill.length - remaining.length + 1} of {topic.drill.length}</span>
        <Badge tone="accent">{q.source === "past-paper" ? q.sourceRef ?? "Past paper" : "Exam-style"}</Badge>
      </div>
      <QuestionCard key={q.id} q={q} onResult={(correct) => setResult(correct)} />
      {result !== null && (
        <div className="mt-4 rounded-lg border border-edge bg-surface p-3">
          <div className="mb-2 text-xs font-medium text-ink-muted">How did that one feel? (honest answer sharpens your Move Test)</div>
          <div className="flex gap-2">
            <button onClick={() => { onAnswer(q.id, result, "sure"); setResult(null); }} className="btn-secondary btn-sm">😎 Knew it</button>
            <button onClick={() => { onAnswer(q.id, result, "guessed"); setResult(null); }} className="btn-secondary btn-sm">🎲 Guessed</button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Phase 3: the Examiner's move test ───────────────────────────────────────

function MoveTestPhase({ topic, onFinish }: {
  topic: CareerTopic;
  onFinish: (v: MoveTestVerdict, answers: (number | string)[]) => void;
}) {
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const idx = answers.length;
  const q = topic.moveTest[idx];

  if (!q) {
    return null;
  }
  return (
    <Card className="border-gold/50">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-gold-600">🧑‍⚖️ The Examiner · Move Test</span>
        <span className="text-ink-faint">question {idx + 1} of {topic.moveTest.length} · closed book · no feedback until the end</span>
      </div>
      <QuestionCard
        key={q.id}
        q={q}
        silent
        onResult={(_, given) => {
          const next = [...answers, given];
          setAnswers(next);
          if (next.length >= topic.moveTest.length) onFinish(gradeMoveTest(topic.moveTest, next), next);
        }}
      />
    </Card>
  );
}

// ─── Memory check (spaced repetition on a passed topic) ──────────────────────

function MemoryCheck({ topic, progress, onSave, onExit }: {
  topic: CareerTopic; progress: CourseProgress;
  onSave: (p: CourseProgress) => void; onExit: () => void;
}) {
  const tp = topicProgress(progress, topic.id);
  const questions = useMemo(() => memoryCheckQuestions(topic, tp.srsLevel), [topic, tp.srsLevel]);
  const [results, setResults] = useState<boolean[]>([]);
  const q = questions[results.length];

  const finish = (all: boolean[]) => {
    const success = all.filter(Boolean).length >= Math.ceil(all.length * 2 / 3);
    const nextTp = applyMemoryCheck(tp, success, Date.now());
    onSave({
      ...progress,
      xp: progress.xp + (success ? XP_MEMORY_CHECK : 0),
      topics: { ...progress.topics, [topic.id]: nextTp },
    });
  };

  if (!q) {
    const success = results.filter(Boolean).length >= Math.ceil(results.length * 2 / 3);
    return (
      <Card className="text-center">
        <div className="text-3xl">{success ? "🧠" : "🩹"}</div>
        <p className="mt-2 font-semibold">{success ? `Memory holding — ${results.filter(Boolean).length}/${results.length}. Next check is further out.` : "This topic is fading — it's flagged for review on your path."}</p>
        <button onClick={onExit} className="btn-primary btn-sm mt-3">Back to the path</button>
      </Card>
    );
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Brain size={18} className="text-brand-500" /> Memory check · {topic.emoji} {topic.title}</h2>
        <button onClick={onExit} className="btn-secondary btn-sm">Later</button>
      </div>
      <Card>
        <div className="mb-2 text-xs text-ink-faint">question {results.length + 1} of {questions.length}</div>
        <QuestionCard key={q.id} q={q} onResult={(correct) => {
          const next = [...results, correct];
          setResults(next);
          if (next.length >= questions.length) finish(next);
        }} />
      </Card>
    </div>
  );
}

// ─── Shared question card ─────────────────────────────────────────────────────

function QuestionCard({ q, silent = false, onResult }: {
  q: CareerQuestion;
  /** Move-test mode: record the answer without revealing correctness. */
  silent?: boolean;
  onResult: (correct: boolean, given: number | string) => void;
}) {
  const [given, setGiven] = useState<number | string | null>(null);
  const [text, setText] = useState("");
  const revealed = given !== null && !silent;

  const submit = (answer: number | string) => {
    if (given !== null) return;
    setGiven(answer);
    onResult(isCorrect(q, answer), answer);
  };

  return (
    <div>
      <p className="font-medium">{q.prompt}</p>
      {q.kind === "fill" ? (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit(text); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} disabled={given !== null} className="input flex-1" placeholder="Type your answer…" />
          <button type="submit" disabled={given !== null || !text.trim()} className="btn-primary btn-sm">Answer</button>
        </form>
      ) : (
        <div className="mt-3 grid gap-2">
          {(q.options ?? []).map((opt, i) => (
            <button
              key={i}
              disabled={given !== null}
              onClick={() => submit(i)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                given === null && "border-edge hover:border-brand-500/60",
                revealed && i === q.answerIndex && "border-brand-500 bg-brand-500/10",
                revealed && given === i && i !== q.answerIndex && "border-crimson-600 bg-crimson-600/10",
                given !== null && !revealed && given === i && "border-gold bg-gold/10",
                given !== null && (silent ? given !== i : i !== q.answerIndex && given !== i) && "opacity-60",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {revealed && (
        <div className={cn("mt-3 rounded-lg p-3 text-sm", isCorrect(q, given!) ? "bg-brand-500/10 text-brand-700 dark:text-brand-300" : "bg-crimson-600/10 text-crimson-700 dark:text-crimson-300")}>
          <span className="font-semibold">{isCorrect(q, given!) ? "Correct. " : "Not quite. "}</span>
          <span className="text-ink-muted">{q.explanation}</span>
        </div>
      )}
    </div>
  );
}
