"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Layers, Brain, Search } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, EmptyState, Modal } from "@/components/ui";
import { dueCountForDeck, newCountForDeck } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const DECK_EMOJIS = ["🗂️", "🔬", "📈", "🧫", "🏛️", "∫", "💊", "⚛️", "🌐", "📖", "🎯", "💡"];

export default function FlashcardsPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const decks = state.decks
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => dueCountForDeck(state, b.id) - dueCountForDeck(state, a.id) || b.createdAt - a.createdAt);

  const totalDue = state.cards.filter((c) => c.srs.due <= Date.now()).length;

  return (
    <div>
      <PageHeader
        title="Flashcards"
        description={`${state.cards.length} cards across ${state.decks.length} decks. ${totalDue} due for review.`}
        actions={
          <div className="flex gap-2">
            {totalDue > 0 && <Link href="/app/review" className="btn-primary"><Brain size={16} /> Review all ({totalDue})</Link>}
            <button onClick={() => setCreating(true)} className="btn-secondary"><Plus size={16} /> New deck</button>
          </div>
        }
      />

      <div className="mb-5 relative max-w-xs">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search decks…" className="input pl-9" />
      </div>

      {decks.length === 0 ? (
        <EmptyState icon="🗂️" title="No decks yet" description="Create a deck, then add cards manually or generate them from notes with AI." action={<button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> New deck</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d, i) => {
            const cards = state.cards.filter((c) => c.deckId === d.id);
            const due = dueCountForDeck(state, d.id);
            const fresh = newCountForDeck(state, d.id);
            const subj = state.subjects.find((s) => s.id === d.subjectId);
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/app/flashcards/${d.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-2xl">{d.emoji}</div>
                      <div className="flex gap-1.5">
                        {due > 0 && <Badge tone="rose">{due} due</Badge>}
                        {fresh > 0 && <Badge tone="sky">{fresh} new</Badge>}
                      </div>
                    </div>
                    <h3 className="mt-3 font-semibold">{d.name}</h3>
                    <p className="line-clamp-1 text-xs text-ink-faint">{d.description || "No description"}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                      <span className="flex items-center gap-1"><Layers size={13} /> {cards.length} cards</span>
                      {subj && <span>{subj.emoji} {subj.name}</span>}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateDeckModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(name, emoji, subjectId, desc) => {
          const deck = actions.newDeck({ name, emoji, subjectId, description: desc });
          dispatch({ type: "ADD_DECK", deck });
          setCreating(false);
          router.push(`/app/flashcards/${deck.id}`);
        }}
      />
    </div>
  );
}

function CreateDeckModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, emoji: string, subjectId: string | null, desc: string) => void }) {
  const { state } = useStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DECK_EMOJIS[0]);
  const [subjectId, setSubjectId] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="New deck">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Spanish verbs" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {DECK_EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className={cn("grid h-9 w-9 place-items-center rounded-lg text-lg transition", emoji === e ? "bg-brand-500/15 ring-2 ring-brand-500" : "hover:bg-surface")}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
            <option value="">No subject</option>
            {state.subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Description (optional)</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="input" placeholder="What's in this deck?" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={!name.trim()} onClick={() => onCreate(name.trim(), emoji, subjectId || null, desc.trim())} className="btn-primary">Create deck</button>
        </div>
      </div>
    </Modal>
  );
}
