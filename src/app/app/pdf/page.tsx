"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Sparkles, Layers, ListChecks, StickyNote, Network,
  Loader2, Check, X, FileUp, BookOpen, MessageSquare, Volume2, Highlighter,
} from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, useToast } from "@/components/ui";
import { MindMap } from "@/components/mindmap";
import { ListenButton } from "@/components/listen-button";
import {
  generateFlashcards, generateQuizQuestions, generateSummary, generateMindMap, type MindMapNode,
} from "@/lib/ai/client";
import { cardFromSelection } from "@/lib/ai/tutor-engine";
import { speak } from "@/lib/speech";
import { uid, cn } from "@/lib/utils";

interface Extracted {
  name: string;
  pages: number;
  chars: number;
  text: string;
}

export default function PdfPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState<Extracted | null>(null);
  const [mindmap, setMindmap] = useState<MindMapNode | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setDoc(null);
    setMindmap(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast({ emoji: "⚠️", title: "Extraction failed", description: data.error });
      } else {
        setDoc({ name: file.name, pages: data.pages, chars: data.chars, text: data.text });
        toast({ emoji: "📄", title: "PDF processed", description: `${data.pages} pages · ${data.chars.toLocaleString()} characters extracted.` });
      }
    } catch {
      toast({ emoji: "⚠️", title: "Upload failed" });
    }
    setBusy(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <PageHeader
        title="PDF Learning"
        description="Upload a textbook, lecture slides or research paper. The AI extracts the text and turns it into study material."
        icon={<FileText className="text-rose-500" />}
      />

      {!doc ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed py-20 text-center transition",
            dragging ? "border-brand-500 bg-brand-500/10" : "border-edge-strong hover:border-brand-400 hover:bg-brand-500/5",
          )}
        >
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {busy ? (
            <>
              <Loader2 size={48} className="animate-spin text-brand-500" />
              <p className="mt-4 font-semibold">Extracting text…</p>
              <p className="text-sm text-ink-muted">Parsing your PDF securely on the server.</p>
            </>
          ) : (
            <>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-brand-500 text-white shadow-glow">
                <FileUp size={30} />
              </div>
              <p className="mt-4 text-lg font-semibold">Drop a PDF here, or click to browse</p>
              <p className="mt-1 text-sm text-ink-muted">Books · slides · lecture notes · research papers · up to 25 MB</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-ink-faint">
                {["Flashcards", "Quizzes", "Summaries", "Mind maps"].map((t) => <Badge key={t} tone="rose">{t}</Badge>)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Extracted text + actions */}
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-500/12 text-rose-500"><FileText size={20} /></div>
                  <div>
                    <div className="truncate font-semibold">{doc.name}</div>
                    <div className="text-xs text-ink-faint">{doc.pages} pages · {doc.chars.toLocaleString()} characters</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ListenButton text={doc.text.slice(0, 5000)} label="Listen" />
                  <button onClick={() => { setDoc(null); setMindmap(null); }} className="btn-ghost btn-sm"><X size={16} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
                <Highlighter size={13} className="text-amber-500" /> Select any text below to make a flashcard, ask the tutor, save a highlight, or hear it read aloud.
              </div>
              <HighlightableText doc={doc} />
            </Card>

            {mindmap && (
              <Card>
                <h3 className="mb-2 flex items-center gap-2 font-semibold"><Network size={16} className="text-brand-500" /> Concept map</h3>
                <MindMap root={mindmap} height={420} />
              </Card>
            )}
          </div>

          {/* Generation panel */}
          <div className="space-y-3">
            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-brand-500" /> Generate</h3>
              <div className="space-y-2.5">
                <FlashcardAction text={doc.text} docName={doc.name} />
                <QuizAction text={doc.text} docName={doc.name} onDone={(id) => router.push(`/app/quizzes/${id}`)} />
                <SummaryAction text={doc.text} docName={doc.name} onDone={(id) => router.push(`/app/notes?id=${id}`)} />
                <button
                  onClick={async () => {
                    const map = await generateMindMap(doc.text, doc.name.replace(/\.pdf$/i, ""), 7);
                    setMindmap(map);
                    toast({ emoji: "🕸️", title: "Mind map created" });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition hover:border-brand-400 hover:bg-brand-500/5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/12 text-brand-500"><Network size={17} /></div>
                  <div><div className="text-sm font-medium">Mind map</div><div className="text-xs text-ink-faint">Visual concept map</div></div>
                </button>
              </div>
            </Card>
            <Card className="bg-brand-500/5">
              <div className="flex items-start gap-2 text-xs text-ink-muted">
                <BookOpen size={14} className="mt-0.5 shrink-0 text-brand-500" />
                <span>Generated cards land in a new deck, quizzes in Quizzes, and summaries as a new note — all searchable and reviewable.</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/** Extracted text with a floating highlight-to-action toolbar. */
function HighlightableText({ doc }: { doc: Extracted }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!text || text.length < 3 || !sel || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      // Only react to selections inside our text pane.
      const range = sel.getRangeAt(0);
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const host = containerRef.current.getBoundingClientRect();
      setSelection({
        text: text.slice(0, 500),
        x: Math.max(8, rect.left - host.left + rect.width / 2),
        y: Math.max(8, rect.top - host.top - 10),
      });
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  const clear = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const makeFlashcard = () => {
    if (!selection) return;
    const card = cardFromSelection(doc.text, selection.text);
    if (!card) return;
    // Reuse the PDF's deck if one exists, otherwise create it.
    const deckName = doc.name.replace(/\.pdf$/i, "");
    let deck = state.decks.find((d) => d.name === deckName);
    if (!deck) {
      deck = actions.newDeck({ name: deckName, emoji: "📄", description: "Generated from PDF" });
      dispatch({ type: "ADD_DECK", deck });
    }
    dispatch({ type: "ADD_CARDS", cards: [actions.newCard(deck.id, { front: card.front, back: card.back, kind: card.kind })] });
    toast({ emoji: "🃏", title: "Flashcard created", description: `Added to “${deck.name}” and scheduled.` });
    clear();
  };

  const explain = () => {
    if (!selection) return;
    router.push(`/app/tutor?q=${encodeURIComponent(`Explain this from ${doc.name}: "${selection.text.slice(0, 300)}"`)}`);
  };

  const saveHighlight = () => {
    if (!selection) return;
    const title = `Highlights — ${doc.name.replace(/\.pdf$/i, "")}`;
    const existing = state.notes.find((n) => n.title === title);
    if (existing) {
      dispatch({ type: "UPDATE_NOTE", id: existing.id, patch: { content: existing.content + `\n> ${selection.text}\n` } });
    } else {
      dispatch({ type: "ADD_NOTE", note: actions.newNote({ title, content: `# ${title}\n\n> ${selection.text}\n`, tags: ["highlights", "pdf"] }) });
    }
    toast({ emoji: "🖍️", title: "Highlight saved", description: `Added to “${title}”.` });
    clear();
  };

  return (
    <div ref={containerRef} className="relative">
      {selection && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: selection.x, top: selection.y }}
        >
          <div className="glass flex items-center gap-0.5 rounded-xl p-1 shadow-lift">
            <button onClick={makeFlashcard} className="btn-ghost btn-sm whitespace-nowrap" title="Create a flashcard from this selection"><Layers size={14} /> Flashcard</button>
            <button onClick={explain} className="btn-ghost btn-sm whitespace-nowrap" title="Ask the AI tutor to explain"><MessageSquare size={14} /> Explain</button>
            <button onClick={saveHighlight} className="btn-ghost btn-sm whitespace-nowrap" title="Save to your highlights note"><StickyNote size={14} /> Note</button>
            <button onClick={() => { speak(selection.text); }} className="btn-ghost btn-sm" title="Read aloud"><Volume2 size={14} /></button>
            <button onClick={clear} className="btn-ghost btn-sm" title="Dismiss"><X size={13} /></button>
          </div>
        </div>
      )}
      <div className="mt-2 max-h-72 select-text overflow-y-auto rounded-xl border border-edge bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        {doc.text.slice(0, 6000)}{doc.text.length > 6000 ? "…" : ""}
      </div>
    </div>
  );
}

function FlashcardAction({ text, docName }: { text: string; docName: string }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const cards = await generateFlashcards(text, 12);
      if (cards.length === 0) { toast({ emoji: "🤔", title: "No cards could be generated" }); setBusy(false); return; }
      const deck = actions.newDeck({ name: docName.replace(/\.pdf$/i, ""), emoji: "📄", description: "Generated from PDF" });
      dispatch({ type: "ADD_DECK", deck });
      dispatch({ type: "ADD_CARDS", cards: cards.map((c) => actions.newCard(deck.id, { front: c.front, back: c.back, kind: c.kind, options: c.options, answerIndex: c.answerIndex })) });
      toast({ emoji: "🎉", title: `${cards.length} flashcards created`, description: "Added to a new deck & scheduled." });
      setDone(true);
    } catch { toast({ emoji: "⚠️", title: "Generation failed" }); }
    setBusy(false);
  };

  return (
    <button onClick={run} disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition hover:border-brand-400 hover:bg-brand-500/5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500/12 text-teal-500">{busy ? <Loader2 size={17} className="animate-spin" /> : done ? <Check size={17} /> : <Layers size={17} />}</div>
      <div><div className="text-sm font-medium">Flashcards</div><div className="text-xs text-ink-faint">Spaced-repetition deck</div></div>
    </button>
  );
}

function QuizAction({ text, docName, onDone }: { text: string; docName: string; onDone: (id: string) => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const questions = await generateQuizQuestions(text, 6);
      if (questions.length === 0) { toast({ emoji: "🤔", title: "No questions could be generated" }); setBusy(false); return; }
      const quizId = uid("quiz");
      dispatch({ type: "ADD_QUIZ", quiz: {
        id: quizId, subjectId: null, title: docName.replace(/\.pdf$/i, ""), description: `${questions.length} questions from PDF`,
        questions: questions.map((q) => ({ id: uid("q"), ...q })), createdAt: Date.now(), source: "ai",
      } });
      toast({ emoji: "📝", title: "Quiz created" });
      onDone(quizId);
    } catch { toast({ emoji: "⚠️", title: "Generation failed" }); }
    setBusy(false);
  };

  return (
    <button onClick={run} disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition hover:border-brand-400 hover:bg-brand-500/5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/12 text-amber-500">{busy ? <Loader2 size={17} className="animate-spin" /> : <ListChecks size={17} />}</div>
      <div><div className="text-sm font-medium">Quiz</div><div className="text-xs text-ink-faint">Auto-marked practice</div></div>
    </button>
  );
}

function SummaryAction({ text, docName, onDone }: { text: string; docName: string; onDone: (id: string) => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const points = await generateSummary(text, 8);
      if (points.length === 0) { toast({ emoji: "🤔", title: "Couldn't summarise" }); setBusy(false); return; }
      const note = actions.newNote({
        title: `Summary — ${docName.replace(/\.pdf$/i, "")}`,
        content: `# Summary — ${docName.replace(/\.pdf$/i, "")}\n\n${points.map((p) => `- ${p}`).join("\n")}\n`,
        tags: ["pdf", "summary"],
      });
      dispatch({ type: "ADD_NOTE", note });
      toast({ emoji: "✨", title: "Summary note created" });
      onDone(note.id);
    } catch { toast({ emoji: "⚠️", title: "Generation failed" }); }
    setBusy(false);
  };

  return (
    <button onClick={run} disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition hover:border-brand-400 hover:bg-brand-500/5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/12 text-violet-500">{busy ? <Loader2 size={17} className="animate-spin" /> : <StickyNote size={17} />}</div>
      <div><div className="text-sm font-medium">Summary</div><div className="text-xs text-ink-faint">Key points as a note</div></div>
    </button>
  );
}
