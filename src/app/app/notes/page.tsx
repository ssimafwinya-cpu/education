"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, StickyNote, Pin, PinOff, Trash2, Eye, Pencil, Sparkles,
  Layers, History, Save, Check, X, Wand2,
} from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, EmptyState, Modal, Badge, useToast } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { generateFlashcards, generateSummary } from "@/lib/ai/client";
import { cn, formatRelative } from "@/lib/utils";

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <NotesInner />
    </Suspense>
  );
}

function NotesInner() {
  const { state, dispatch } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [showHistory, setShowHistory] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const activeId = params.get("id");
  const notes = useMemo(
    () =>
      [...state.notes]
        .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [state.notes, query],
  );
  const active = state.notes.find((n) => n.id === activeId) ?? null;

  const select = (id: string) => router.push(`/app/notes?id=${id}`, { scroll: false });

  const createNote = () => {
    const note = actions.newNote({ title: "Untitled note", content: "# Untitled note\n\nStart writing here…\n" });
    dispatch({ type: "ADD_NOTE", note });
    select(note.id);
    setMode("edit");
  };

  // Debounced auto-save with version snapshot on significant change.
  const update = (patch: { title?: string; content?: string }) => {
    if (!active) return;
    dispatch({ type: "UPDATE_NOTE", id: active.id, patch });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 600);
  };

  const snapshot = () => {
    if (!active) return;
    dispatch({ type: "UPDATE_NOTE", id: active.id, patch: {}, snapshot: true });
    toast({ emoji: "🕓", title: "Snapshot saved", description: "You can restore it from history." });
  };

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Write in Markdown with live preview, version history and AI assistance."
        actions={<button onClick={createNote} className="btn-primary"><Plus size={16} /> New note</button>}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" className="input pl-9" />
          </div>
          {notes.length === 0 ? (
            <EmptyState icon="📝" title="No notes" description="Create your first note." action={<button onClick={createNote} className="btn-primary btn-sm"><Plus size={14} /> New note</button>} />
          ) : (
            <div className="space-y-1.5 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
              {notes.map((n) => {
                const subj = state.subjects.find((s) => s.id === n.subjectId);
                return (
                  <button key={n.id} onClick={() => select(n.id)} className={cn("w-full rounded-xl border p-3 text-left transition", active?.id === n.id ? "border-brand-400 bg-brand-500/5" : "border-edge hover:border-edge-strong")}>
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin size={12} className="text-amber-500" />}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.title || "Untitled"}</span>
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{n.content.replace(/[#*`>|\-]/g, "").slice(0, 60) || "Empty"}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                      {subj && <span>{subj.emoji} {subj.name}</span>}
                      <span>· {formatRelative(n.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        {active ? (
          <Card className="flex min-h-[70vh] flex-col p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-edge p-3">
              <input
                value={active.title}
                onChange={(e) => update({ title: e.target.value })}
                className="flex-1 bg-transparent text-lg font-semibold outline-none"
                placeholder="Note title"
              />
              <div className="flex items-center gap-1.5">
                <AnimatePresence>
                  {savedFlash && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-teal-500">
                      <Check size={13} /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
                <select
                  value={active.subjectId ?? ""}
                  onChange={(e) => dispatch({ type: "UPDATE_NOTE", id: active.id, patch: { subjectId: e.target.value || null } })}
                  className="rounded-lg border border-edge bg-surface-raised px-2 py-1.5 text-xs"
                >
                  <option value="">No subject</option>
                  {state.subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                </select>
                <button onClick={() => setMode(mode === "edit" ? "preview" : "edit")} className="btn-ghost btn-sm" title={mode === "edit" ? "Preview" : "Edit"}>
                  {mode === "edit" ? <Eye size={15} /> : <Pencil size={15} />}
                </button>
                <button onClick={() => dispatch({ type: "UPDATE_NOTE", id: active.id, patch: { pinned: !active.pinned } })} className="btn-ghost btn-sm">
                  {active.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                </button>
                <button onClick={snapshot} className="btn-ghost btn-sm" title="Save snapshot"><Save size={15} /></button>
                {active.versions.length > 0 && (
                  <button onClick={() => setShowHistory(true)} className="btn-ghost btn-sm" title="History"><History size={15} /></button>
                )}
                <button onClick={() => { dispatch({ type: "DELETE_NOTE", id: active.id }); router.push("/app/notes"); }} className="btn-ghost btn-sm text-rose-500"><Trash2 size={15} /></button>
              </div>
            </div>

            {/* AI toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface/50 px-3 py-2">
              <span className="flex items-center gap-1 text-xs font-medium text-ink-faint"><Sparkles size={12} /> AI</span>
              <button onClick={() => setGenOpen(true)} className="btn-secondary btn-sm"><Layers size={13} /> Make flashcards</button>
              <SummarizeButton content={active.content} onSummary={(pts) => { dispatch({ type: "UPDATE_NOTE", id: active.id, patch: { content: active.content + "\n\n## AI Summary\n" + pts.map((p) => `- ${p}`).join("\n") }, snapshot: true }); toast({ emoji: "✨", title: "Summary added", description: "Appended to your note." }); }} />
            </div>

            <div className="flex-1 overflow-hidden">
              {mode === "edit" ? (
                <textarea
                  value={active.content}
                  onChange={(e) => update({ content: e.target.value })}
                  className="h-full min-h-[50vh] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed outline-none"
                  placeholder="# Start writing in Markdown…"
                  spellCheck
                />
              ) : (
                <div className="h-full overflow-y-auto p-5">
                  <Markdown content={active.content || "*Nothing to preview yet.*"} />
                </div>
              )}
            </div>
            <div className="border-t border-edge px-4 py-2 text-xs text-ink-faint">
              {active.content.trim().split(/\s+/).filter(Boolean).length} words · {active.content.length} chars · updated {formatRelative(active.updatedAt)}
            </div>
          </Card>
        ) : (
          <EmptyState icon="🖊️" title="Select a note" description="Choose a note from the list or create a new one to start writing." action={<button onClick={createNote} className="btn-primary"><Plus size={16} /> New note</button>} />
        )}
      </div>

      {/* History modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Version history" size="lg">
        {active && active.versions.length > 0 ? (
          <div className="space-y-3">
            {active.versions.map((v, i) => (
              <div key={i} className="rounded-xl border border-edge p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-muted">{formatRelative(v.savedAt)}</span>
                  <button onClick={() => { dispatch({ type: "UPDATE_NOTE", id: active.id, patch: { content: v.content }, snapshot: true }); setShowHistory(false); toast({ emoji: "↩️", title: "Version restored" }); }} className="btn-secondary btn-sm">Restore</button>
                </div>
                <div className="max-h-24 overflow-hidden text-xs text-ink-faint">{v.content.slice(0, 200)}…</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-ink-faint">No snapshots yet.</p>}
      </Modal>

      {/* Generate flashcards modal */}
      {active && <GenerateCardsModal open={genOpen} onClose={() => setGenOpen(false)} note={active} />}
    </div>
  );
}

function SummarizeButton({ content, onSummary }: { content: string; onSummary: (pts: string[]) => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  return (
    <button
      disabled={loading || content.trim().length < 40}
      onClick={async () => {
        setLoading(true);
        try {
          const pts = await generateSummary(content, 6);
          if (pts.length) onSummary(pts);
          else toast({ emoji: "🤔", title: "Not enough content to summarise" });
        } catch { toast({ emoji: "⚠️", title: "Summary failed" }); }
        setLoading(false);
      }}
      className="btn-secondary btn-sm"
    >
      <Wand2 size={13} /> {loading ? "Summarising…" : "Summarise"}
    </button>
  );
}

function GenerateCardsModal({ open, onClose, note }: { open: boolean; onClose: () => void; note: import("@/lib/types").Note }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<import("@/lib/ai/tutor-engine").GeneratedCard[]>([]);
  const [deckId, setDeckId] = useState<string>("");
  const subjectDecks = state.decks.filter((d) => d.subjectId === note.subjectId);

  useEffect(() => {
    if (open) {
      setCards([]);
      setDeckId(subjectDecks[0]?.id ?? "");
      setLoading(true);
      generateFlashcards(note.content, 8)
        .then(setCards)
        .catch(() => toast({ emoji: "⚠️", title: "Generation failed" }))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    let targetDeck = deckId;
    if (!targetDeck) {
      const deck = actions.newDeck({ name: note.title, subjectId: note.subjectId, emoji: "✨" });
      dispatch({ type: "ADD_DECK", deck });
      targetDeck = deck.id;
    }
    const newCards = cards.map((c) => actions.newCard(targetDeck, { front: c.front, back: c.back, kind: c.kind, options: c.options, answerIndex: c.answerIndex }));
    dispatch({ type: "ADD_CARDS", cards: newCards });
    toast({ emoji: "🎉", title: `${newCards.length} flashcards created`, description: "Added to your deck & scheduled for review." });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Sparkles size={18} className="text-brand-500" /> AI flashcards</span>} size="lg">
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : cards.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">Couldn't generate cards — add more content to this note first.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">Generated <strong>{cards.length}</strong> cards from “{note.title}”. Review, then save to a deck.</p>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {cards.map((c, i) => (
              <div key={i} className="rounded-xl border border-edge p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge tone="brand" className="capitalize">{c.kind}</Badge>
                  <button onClick={() => setCards(cards.filter((_, j) => j !== i))} className="btn-ghost btn-sm text-rose-500"><X size={13} /></button>
                </div>
                <div className="text-sm font-medium">{c.front}</div>
                <div className="mt-1 text-xs text-ink-muted">{c.back}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-3">
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="input max-w-[200px]">
              <option value="">➕ New deck</option>
              {subjectDecks.map((d) => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
            </select>
            <button onClick={save} disabled={cards.length === 0} className="btn-primary"><Check size={15} /> Save {cards.length} cards</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
