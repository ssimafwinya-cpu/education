"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, MessageSquare, Sparkles, Trash2, Brain, Lightbulb,
  ListChecks, CalendarDays, BookOpen, Square, Mic,
} from "lucide-react";
import { sttSupported, listenOnce } from "@/lib/speech";
import { useStore } from "@/lib/store";
import { Markdown } from "@/components/markdown";
import { EmptyState, ConfirmButton } from "@/components/ui";
import { streamTutor } from "@/lib/ai/client";
import { retrieveContext } from "@/lib/ai/retrieval";
import { cn, uid, formatRelative } from "@/lib/utils";
import type { TutorThread } from "@/lib/types";

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[80vh]" />}>
      <TutorInner />
    </Suspense>
  );
}

const SUGGESTIONS = [
  { icon: Brain, text: "Explain this like I'm 12", prompt: "Explain a difficult concept from my notes like I'm 12 years old." },
  { icon: ListChecks, text: "Quiz me", prompt: "Quiz me with 3 questions on my current subject." },
  { icon: Lightbulb, text: "Give me a mnemonic", prompt: "Give me a memory trick or mnemonic to remember a key concept." },
  { icon: CalendarDays, text: "Plan my week", prompt: "Help me build a study plan for this week." },
];

function TutorInner() {
  const { state, dispatch } = useStore();
  const params = useSearchParams();
  const subjectParam = params.get("subject");

  const [activeId, setActiveId] = useState<string | null>(state.threads[0]?.id ?? null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showList, setShowList] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  useEffect(() => setMicAvailable(sttSupported()), []);

  // Deep-link a question: /app/tutor?q=… (used by highlight → "Explain").
  const askedParam = useRef(false);
  useEffect(() => {
    const q = params.get("q");
    if (q && !askedParam.current) {
      askedParam.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const voiceInput = async () => {
    if (listening) return;
    setListening(true);
    try {
      const transcript = await listenOnce();
      if (transcript) setInput((prev) => (prev ? prev + " " : "") + transcript);
    } catch {
      /* no speech / denied — nothing to do */
    }
    setListening(false);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = state.threads.find((t) => t.id === activeId) ?? state.threads[0] ?? null;
  const subject = subjectParam ? state.subjects.find((s) => s.id === subjectParam) : null;

  // Auto-scroll to bottom as messages stream.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages]);

  const newThread = () => {
    const thread: TutorThread = {
      id: uid("thread"),
      title: subject ? `${subject.name} chat` : "New conversation",
      subjectId: subject?.id ?? null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: "ADD_THREAD", thread });
    setActiveId(thread.id);
    setShowList(false);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;

    let threadId = active?.id;
    if (!threadId) {
      const thread: TutorThread = { id: uid("thread"), title: content.slice(0, 40), subjectId: subject?.id ?? null, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      dispatch({ type: "ADD_THREAD", thread });
      threadId = thread.id;
      setActiveId(threadId);
    }

    dispatch({ type: "APPEND_MESSAGE", threadId, message: { id: uid("m"), role: "user", content, at: Date.now() } });

    // Placeholder assistant message we stream into.
    dispatch({ type: "APPEND_MESSAGE", threadId, message: { id: uid("m"), role: "assistant", content: "", at: Date.now() } });
    setInput("");
    setStreaming(true);

    const priorMessages = (state.threads.find((t) => t.id === threadId)?.messages ?? [])
      .filter((m) => m.content)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Query-aware grounding: rank the student's notes & cards against the
    // question (BM25) and send only the most relevant chunks.
    const material = retrieveContext(state, content, subject?.id ?? active?.subjectId ?? null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamTutor({
        messages: [...priorMessages, { role: "user", content }],
        context: { studentName: state.profile.name, subjects: state.subjects.map((s) => s.name), material },
        signal: controller.signal,
        onToken: (_chunk, full) => dispatch({ type: "UPDATE_LAST_ASSISTANT", threadId: threadId!, content: full }),
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        dispatch({ type: "UPDATE_LAST_ASSISTANT", threadId: threadId!, content: "⚠️ Sorry, I couldn't reach the AI service. Please try again." });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Thread sidebar (desktop) */}
      <div className="hidden w-64 shrink-0 flex-col md:flex">
        <button onClick={newThread} className="btn-primary mb-3"><Plus size={16} /> New chat</button>
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {state.threads.map((t) => (
            <button key={t.id} onClick={() => setActiveId(t.id)} className={cn("group flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition", active?.id === t.id ? "border-brand-400 bg-brand-500/5" : "border-transparent hover:bg-surface")}>
              <MessageSquare size={15} className="shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.title}</div>
                <div className="text-[11px] text-ink-faint">{formatRelative(t.updatedAt)}</div>
              </div>
              <ConfirmButton onConfirm={() => { dispatch({ type: "DELETE_THREAD", id: t.id }); if (active?.id === t.id) setActiveId(null); }} className="btn-ghost btn-sm text-rose-500 opacity-0 group-hover:opacity-100" confirmLabel="?"><Trash2 size={13} /></ConfirmButton>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col card p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white"><Sparkles size={17} /></div>
            <div>
              <div className="text-sm font-semibold">AI Tutor</div>
              <div className="text-[11px] text-ink-faint">{subject ? `Focused on ${subject.emoji} ${subject.name}` : "Grounded in your notes & decks"}</div>
            </div>
          </div>
          <button onClick={newThread} className="btn-ghost btn-sm md:hidden"><Plus size={16} /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {!active || active.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow"><Sparkles size={30} /></div>
              <h2 className="mt-4 text-lg font-semibold">How can I help you learn?</h2>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">Ask me to explain, quiz you, summarise your notes, or build a study plan.</p>
              <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.text} onClick={() => send(s.prompt)} className="flex items-center gap-2 rounded-xl border border-edge p-3 text-left text-sm transition hover:border-brand-400 hover:bg-brand-500/5">
                      <Icon size={16} className="text-brand-500" /> {s.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            active.messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm", m.role === "user" ? "bg-brand-500/15" : "bg-gradient-to-br from-brand-500 to-teal-500 text-white")}>
                  {m.role === "user" ? state.profile.avatar : <Sparkles size={15} />}
                </div>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", m.role === "user" ? "bg-brand-500 text-white" : "bg-surface")}>
                  {m.content ? (
                    m.role === "user" ? <div className="whitespace-pre-wrap text-sm">{m.content}</div> : <Markdown content={m.content} className="text-sm" />
                  ) : (
                    <div className="flex gap-1 py-1">
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-ink-faint" />
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-ink-faint" style={{ animationDelay: "0.2s" }} />
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-ink-faint" style={{ animationDelay: "0.4s" }} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-edge p-3">
          {subject && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
              <BookOpen size={12} /> Context: {subject.emoji} {subject.name}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything…  (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="input max-h-32 flex-1 resize-none"
              style={{ minHeight: 44 }}
            />
            {micAvailable && (
              <button
                type="button"
                onClick={voiceInput}
                className={cn("btn-secondary shrink-0", listening && "animate-pulse-soft text-rose-500")}
                title={listening ? "Listening…" : "Ask by voice"}
                aria-label="Voice input"
              >
                <Mic size={16} />
              </button>
            )}
            {streaming ? (
              <button type="button" onClick={stop} className="btn-secondary shrink-0" title="Stop"><Square size={16} className="fill-current" /></button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="btn-primary shrink-0"><Send size={16} /></button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
