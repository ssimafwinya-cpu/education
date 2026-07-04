"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Brain, Trash2, Pencil, Sparkles, X, Check, Layers, Clock,
  Download, Upload,
} from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { Card, Badge, EmptyState, Modal, useToast, ConfirmButton } from "@/components/ui";
import { generateFlashcards } from "@/lib/ai/client";
import { exportDeckTsv, parseDeckFile, dedupeAgainst } from "@/lib/deck-io";
import { currentRetention } from "@/lib/fsrs";
import { cn, formatRelative } from "@/lib/utils";
import type { CardKind, Flashcard } from "@/lib/types";

const KIND_LABEL: Record<CardKind, string> = { basic: "Basic", cloze: "Cloze", mcq: "Multiple choice", truefalse: "True / False" };
const STATE_TONE: Record<string, string> = { new: "sky", learning: "amber", review: "teal", relearning: "rose" };

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [adding, setAdding] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  const importRef = useRef<HTMLInputElement>(null);

  const deck = state.decks.find((d) => d.id === id);
  const cards = state.cards.filter((c) => c.deckId === id);

  const exportDeck = () => {
    if (!deck) return;
    const blob = new Blob([exportDeckTsv(cards)], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ emoji: "📦", title: "Deck exported", description: "Anki-compatible TSV downloaded." });
  };

  const importDeck = async (file: File) => {
    const parsed = parseDeckFile(await file.text());
    if (parsed.length === 0) {
      toast({ emoji: "🤔", title: "Nothing to import", description: "Expected TSV or CSV with front and back columns." });
      return;
    }
    const { kept, skipped } = dedupeAgainst(cards.map((c) => c.front), parsed);
    dispatch({ type: "ADD_CARDS", cards: kept.map((c) => actions.newCard(id, { front: c.front, back: c.back, tags: c.tags })) });
    toast({
      emoji: "📥",
      title: `Imported ${kept.length} cards`,
      description: skipped > 0 ? `${skipped} duplicates skipped.` : "All scheduled for review.",
    });
  };

  if (!deck) {
    return <EmptyState icon="🔍" title="Deck not found" action={<Link href="/app/flashcards" className="btn-primary">Back to decks</Link>} />;
  }
  const due = cards.filter((c) => c.srs.due <= Date.now()).length;
  const subj = state.subjects.find((s) => s.id === deck.subjectId);

  return (
    <div>
      <Link href="/app/flashcards" className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Decks</Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-3xl">{deck.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
            <p className="text-sm text-ink-muted">{deck.description || "No description"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="brand"><Layers size={12} /> {cards.length} cards</Badge>
              {due > 0 && <Badge tone="rose"><Clock size={12} /> {due} due</Badge>}
              {subj && <Link href={`/app/courses/${subj.id}`}><Badge tone="teal">{subj.emoji} {subj.name}</Badge></Link>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {due > 0 && <Link href={`/app/review?deck=${id}`} className="btn-primary"><Brain size={16} /> Review ({due})</Link>}
          <button onClick={() => setGenOpen(true)} className="btn-secondary"><Sparkles size={16} /> AI generate</button>
          <button onClick={() => setAdding(true)} className="btn-secondary"><Plus size={16} /> Add card</button>
          <button onClick={() => importRef.current?.click()} className="btn-ghost btn-sm" title="Import TSV/CSV (Anki-compatible)"><Upload size={15} /> Import</button>
          {cards.length > 0 && <button onClick={exportDeck} className="btn-ghost btn-sm" title="Export as Anki-compatible TSV"><Download size={15} /> Export</button>}
          <input ref={importRef} type="file" accept=".txt,.tsv,.csv,text/plain,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importDeck(f); e.target.value = ""; }} />
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon="🃏" title="No cards yet" description="Add cards manually, or let AI generate them from your notes or any text." action={<div className="flex gap-2"><button onClick={() => setGenOpen(true)} className="btn-primary"><Sparkles size={15} /> Generate with AI</button><button onClick={() => setAdding(true)} className="btn-secondary"><Plus size={15} /> Add manually</button></div>} />
      ) : (
        <div className="space-y-2.5">
          {cards.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
              <Card className="group flex items-start gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={STATE_TONE[c.srs.state]} className="capitalize">{c.srs.state}</Badge>
                    <span className="text-[11px] text-ink-faint">{KIND_LABEL[c.kind]}</span>
                    {c.srs.state !== "new" && <span className="text-[11px] text-ink-faint">· {Math.round(currentRetention(c.srs) * 100)}% recall · due {formatRelative(c.srs.due)}</span>}
                  </div>
                  <div className="text-sm font-medium">{c.front}</div>
                  <div className="mt-1 text-sm text-ink-muted">
                    {c.kind === "mcq" && c.options ? (
                      <ol className="ml-4 list-decimal">
                        {c.options.map((o, oi) => <li key={oi} className={oi === c.answerIndex ? "font-semibold text-teal-500" : ""}>{o}</li>)}
                      </ol>
                    ) : c.back}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setEditing(c)} className="btn-ghost btn-sm"><Pencil size={14} /></button>
                  <ConfirmButton onConfirm={() => dispatch({ type: "DELETE_CARD", id: c.id })} className="btn-ghost btn-sm text-rose-500" confirmLabel="?"><Trash2 size={14} /></ConfirmButton>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / edit card modal — keyed so state resets per target card */}
      <CardEditor
        key={editing?.id ?? (adding ? "new" : "closed")}
        open={adding || !!editing}
        card={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(data) => {
          if (editing) {
            dispatch({ type: "UPDATE_CARD", id: editing.id, patch: data });
            toast({ emoji: "✅", title: "Card updated" });
          } else {
            dispatch({ type: "ADD_CARDS", cards: [actions.newCard(id, data as any)] });
            dispatch({ type: "AWARD", xp: 5 });
            toast({ emoji: "🃏", title: "Card added" });
          }
          setAdding(false); setEditing(null);
        }}
      />

      <GenerateModal open={genOpen} onClose={() => setGenOpen(false)} deckId={id} />
    </div>
  );
}

function CardEditor({ open, card, onClose, onSave }: { open: boolean; card: Flashcard | null; onClose: () => void; onSave: (data: Partial<Flashcard> & { front: string; back: string; kind: CardKind }) => void }) {
  const [kind, setKind] = useState<CardKind>(card?.kind ?? "basic");
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [options, setOptions] = useState<string[]>(card?.options ?? ["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(card?.answerIndex ?? 0);

  const reset = () => { setKind("basic"); setFront(""); setBack(""); setOptions(["", "", "", ""]); setAnswerIndex(0); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title={card ? "Edit card" : "New card"} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["basic", "cloze", "mcq", "truefalse"] as CardKind[]).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("btn-sm rounded-lg border transition", kind === k ? "border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-300" : "border-edge text-ink-muted hover:border-edge-strong")}>{KIND_LABEL[k]}</button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">{kind === "cloze" ? "Text (wrap the answer in {{c1::…}})" : "Front / Question"}</label>
          <textarea value={front} onChange={(e) => setFront(e.target.value)} className="input min-h-[70px] resize-y" placeholder={kind === "cloze" ? "The {{c1::mitochondrion}} is the powerhouse of the cell." : "What is…?"} />
        </div>

        {kind === "mcq" ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Options (pick the correct one)</label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" checked={answerIndex === i} onChange={() => setAnswerIndex(i)} className="accent-brand-500" />
                  <input value={o} onChange={(e) => setOptions(options.map((x, j) => j === i ? e.target.value : x))} className="input" placeholder={`Option ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        ) : kind === "truefalse" ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Answer</label>
            <div className="flex gap-2">
              {["True", "False"].map((v, i) => (
                <button key={v} onClick={() => { setAnswerIndex(i); setBack(v); }} className={cn("btn-sm flex-1 rounded-lg border", (back === v) ? "border-brand-400 bg-brand-500/10" : "border-edge")}>{v}</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">{kind === "cloze" ? "Note / explanation (optional)" : "Back / Answer"}</label>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} className="input min-h-[70px] resize-y" placeholder="The answer…" />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => { onClose(); reset(); }} className="btn-secondary">Cancel</button>
          <button
            disabled={!front.trim()}
            onClick={() => {
              const data: any = { kind, front: front.trim(), back: back.trim() || (kind === "cloze" ? "" : "—") };
              if (kind === "mcq") { data.options = options.filter((o) => o.trim()); data.answerIndex = answerIndex; data.back = options[answerIndex] ?? ""; }
              if (kind === "truefalse") { data.options = ["True", "False"]; data.answerIndex = answerIndex; data.back = back || (answerIndex === 0 ? "True" : "False"); }
              onSave(data); reset();
            }}
            className="btn-primary"
          >
            <Check size={15} /> {card ? "Save" : "Add card"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GenerateModal({ open, onClose, deckId }: { open: boolean; onClose: () => void; deckId: string }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<import("@/lib/ai/tutor-engine").GeneratedCard[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateFlashcards(text, count);
      setCards(result);
      if (result.length === 0) toast({ emoji: "🤔", title: "Add more text to generate from" });
    } catch (e) { toast({ emoji: "⚠️", title: "Generation failed", description: String((e as Error).message) }); }
    setLoading(false);
  };

  const save = () => {
    const newCards = cards.map((c) => actions.newCard(deckId, { front: c.front, back: c.back, kind: c.kind, options: c.options, answerIndex: c.answerIndex }));
    dispatch({ type: "ADD_CARDS", cards: newCards });
    toast({ emoji: "🎉", title: `${newCards.length} cards added` });
    setText(""); setCards([]); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Sparkles size={18} className="text-brand-500" /> Generate flashcards with AI</span>} size="lg">
      {cards.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">Paste notes, a textbook passage, or any study material. The AI will extract definitions and key facts into flashcards.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[160px] resize-y" placeholder="Paste your study material here…" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-muted">Cards: <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, +e.target.value)))} className="input w-20" /></label>
            <button onClick={generate} disabled={loading || text.trim().length < 20} className="btn-primary">{loading ? "Generating…" : <><Sparkles size={15} /> Generate</>}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted"><strong>{cards.length}</strong> cards generated. Remove any you don't want, then save.</p>
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
          <div className="flex justify-end gap-2 border-t border-edge pt-3">
            <button onClick={() => setCards([])} className="btn-secondary">Back</button>
            <button onClick={save} className="btn-primary"><Check size={15} /> Save {cards.length} cards</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
