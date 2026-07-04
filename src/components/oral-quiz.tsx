"use client";

// ─── Oral quiz mode ──────────────────────────────────────────────────────────
// The question is read aloud (TTS); the student answers by voice (STT) or
// types; the answer is graded instantly and feedback is spoken back. Both
// speech APIs are feature-detected — typing always works, so the mode is fully
// usable (and testable) without audio hardware.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, Mic, Check, X, ChevronRight, RotateCcw, Home, Headphones, Keyboard as KeyboardIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, ProgressRing } from "@/components/ui";
import { gradeOralAnswer, questionSpeech, type OralGrade } from "@/lib/oral";
import { speak, stopSpeaking, ttsSupported, sttSupported, listenOnce } from "@/lib/speech";
import { cn, pct, uid } from "@/lib/utils";
import type { Quiz } from "@/lib/types";

interface Props {
  quiz: Quiz;
  onExit: () => void;
}

interface Answered {
  questionId: string;
  grade: OralGrade;
  transcript: string;
}

export function OralQuizRunner({ quiz, onExit }: Props) {
  const { dispatch } = useStore();
  const questions = quiz.questions;
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [grade, setGrade] = useState<OralGrade | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [finished, setFinished] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [tts, setTts] = useState(false);
  const [stt, setStt] = useState(false);
  const [startedAt] = useState(Date.now());
  const spokenFor = useRef(-1);

  const q = questions[index];
  const score = pct(answers.filter((a) => a.grade.correct).length, questions.length);

  useEffect(() => {
    setTts(ttsSupported());
    setStt(sttSupported());
    return () => stopSpeaking();
  }, []);

  // Read each question aloud once when it appears.
  useEffect(() => {
    if (finished || !q || spokenFor.current === index) return;
    spokenFor.current = index;
    if (ttsSupported()) speak(questionSpeech(q, index));
  }, [index, q, finished]);

  const submit = useCallback(
    (transcript: string) => {
      if (!q || grade) return;
      const g = gradeOralAnswer(q, transcript);
      setGrade(g);
      setAnswers((prev) => [...prev, { questionId: q.id, grade: g, transcript }]);
      if (ttsSupported()) {
        stopSpeaking();
        speak(g.correct ? "Correct!" : `Not quite. The answer is: ${g.expected}.`);
      }
    },
    [q, grade],
  );

  const listen = async () => {
    if (listening || grade) return;
    stopSpeaking(); // don't transcribe our own TTS
    setListening(true);
    try {
      const transcript = await listenOnce();
      if (transcript) submit(transcript);
    } catch {
      /* no speech — student can retry or type */
    }
    setListening(false);
  };

  const next = () => {
    stopSpeaking();
    setGrade(null);
    setTyped("");
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex(index + 1);
  };

  // Record the attempt once.
  useEffect(() => {
    if (!finished || recorded) return;
    dispatch({
      type: "RECORD_ATTEMPT",
      attempt: {
        id: uid("att"), quizId: quiz.id, startedAt, finishedAt: Date.now(), mode: "oral",
        answers: answers.map((a) => ({ questionId: a.questionId, given: a.transcript, correct: a.grade.correct })),
        scorePercent: score,
      },
    });
    setRecorded(true);
  }, [finished, recorded, dispatch, quiz.id, startedAt, answers, score]);

  // ── Summary ──
  if (finished) {
    const correct = answers.filter((a) => a.grade.correct).length;
    return (
      <div className="mx-auto max-w-xl">
        <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="text-center">
            <Headphones size={32} className="mx-auto text-brand-500" />
            <h1 className="mt-3 text-2xl font-bold">Oral quiz complete</h1>
            <p className="text-ink-muted">{quiz.title}</p>
            <div className="mt-5 flex items-center justify-center">
              <ProgressRing value={score} size={120} stroke={10} color={score >= 80 ? "#14b8a6" : score >= 50 ? "#f59e0b" : "#f43f5e"}>
                <div><div className="text-2xl font-bold">{score}%</div><div className="text-[10px] uppercase text-ink-faint">{correct}/{questions.length}</div></div>
              </ProgressRing>
            </div>
          </Card>
        </motion.div>
        <div className="mt-5 space-y-2.5">
          {answers.map((a, i) => {
            const question = questions.find((x) => x.id === a.questionId);
            return (
              <Card key={i} className={cn("border-l-4 py-3", a.grade.correct ? "border-l-teal-500" : "border-l-rose-500")}>
                <div className="text-sm font-medium">{i + 1}. {question?.prompt}</div>
                <div className="mt-1 text-xs text-ink-muted">
                  You said: <span className={a.grade.correct ? "text-teal-500" : "text-rose-500"}>“{a.grade.interpreted}”</span>
                  {!a.grade.correct && <> · Correct: <span className="text-teal-500">{a.grade.expected}</span></>}
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={() => { setAnswers([]); setIndex(0); setFinished(false); setRecorded(false); setGrade(null); spokenFor.current = -1; }} className="btn-secondary flex-1"><RotateCcw size={16} /> Retry</button>
          <button onClick={onExit} className="btn-primary flex-1"><Home size={16} /> Done</button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="mb-5 flex items-center gap-3">
        <Badge tone="brand"><Headphones size={12} /> Oral mode</Badge>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500" animate={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-ink-muted">{index + 1}/{questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <Card className="p-6 text-center">
            <button
              onClick={() => speak(questionSpeech(q, index))}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow transition hover:scale-105"
              title="Read the question again"
              aria-label="Read question aloud"
            >
              <Volume2 size={26} />
            </button>
            <h2 className="mt-4 text-lg font-semibold leading-relaxed">{q.prompt}</h2>
            {q.kind === "mcq" && q.options && (
              <ol className="mx-auto mt-3 max-w-sm space-y-1 text-left text-sm">
                {q.options.map((o, i) => (
                  <li key={i} className={cn("rounded-lg border border-edge px-3 py-1.5", grade && i === q.answerIndex && "border-teal-500 bg-teal-500/10 font-semibold")}>
                    {String.fromCharCode(65 + i)}. {o}
                  </li>
                ))}
              </ol>
            )}
            {!tts && <p className="mt-2 text-xs text-ink-faint">Text-to-speech isn't available in this browser — read the question above.</p>}

            {/* Feedback */}
            <AnimatePresence>
              {grade && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <div className={cn("mt-4 rounded-xl border p-3.5 text-left text-sm", grade.correct ? "border-teal-500/40 bg-teal-500/5" : "border-rose-500/40 bg-rose-500/5")}>
                    <div className="flex items-center gap-2 font-semibold">
                      {grade.correct ? <><Check size={15} className="text-teal-500" /> Correct!</> : <><X size={15} className="text-rose-500" /> Not quite</>}
                    </div>
                    <div className="mt-1 text-ink-muted">You said: “{grade.interpreted}”{!grade.correct && <> — the answer is <strong>{grade.expected}</strong></>}</div>
                    <div className="mt-1 text-xs text-ink-faint">{q.explanation}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Answer controls */}
      <div className="mt-5">
        {grade ? (
          <button onClick={next} className="btn-primary w-full py-3">
            {index + 1 >= questions.length ? "Finish" : "Next question"} <ChevronRight size={16} />
          </button>
        ) : (
          <div className="space-y-3">
            {stt && (
              <button
                onClick={listen}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border-2 py-4 text-base font-semibold transition",
                  listening ? "border-rose-500 bg-rose-500/10 text-rose-500 animate-pulse-soft" : "border-brand-500/40 text-brand-500 hover:border-brand-500 hover:bg-brand-500/5",
                )}
              >
                <Mic size={20} /> {listening ? "Listening… speak your answer" : "Answer by voice"}
              </button>
            )}
            <form onSubmit={(e) => { e.preventDefault(); if (typed.trim()) submit(typed); }} className="flex gap-2">
              <div className="relative flex-1">
                <KeyboardIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input value={typed} onChange={(e) => setTyped(e.target.value)} className="input pl-9" placeholder={stt ? "…or type your answer" : "Type your answer"} />
              </div>
              <button type="submit" disabled={!typed.trim()} className="btn-primary">Submit</button>
            </form>
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <button onClick={() => { stopSpeaking(); onExit(); }} className="btn-ghost btn-sm">Exit oral quiz</button>
      </div>
    </div>
  );
}
