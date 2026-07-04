"use client";

// ─── Deck podcast ────────────────────────────────────────────────────────────
// Turns a flashcard deck into listenable audio: each card is read as
// "Question … (pause) … Answer …", auto-advancing through the deck — study
// hands-free while commuting. Built on speechSynthesis (no server audio).

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Podcast, Play, Square, SkipForward, X } from "lucide-react";
import { Modal, Progress } from "@/components/ui";
import { speakSequence, ttsSupported, type SequenceController } from "@/lib/speech";
import type { Flashcard } from "@/lib/types";

export function PodcastButton({ deckName, cards }: { deckName: string; cards: Flashcard[] }) {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setSupported(ttsSupported()), []);
  if (!supported || cards.length === 0) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary" title="Listen to this deck as a podcast">
        <Podcast size={16} /> Podcast
      </button>
      {open && <PodcastModal deckName={deckName} cards={cards} onClose={() => setOpen(false)} />}
    </>
  );
}

function PodcastModal({ deckName, cards, onClose }: { deckName: string; cards: Flashcard[]; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(-1);
  const controller = useRef<SequenceController | null>(null);

  // Two segments per card: question, then answer.
  const segments = useMemo(() => {
    const out: { text: string; cardIndex: number; side: "Q" | "A" }[] = [];
    cards.forEach((c, i) => {
      const front = c.front.replace(/\{\{c\d+::(.*?)\}\}/g, "blank");
      out.push({ text: `Card ${i + 1}. ${front}`, cardIndex: i, side: "Q" });
      out.push({ text: `Answer: ${c.back}`, cardIndex: i, side: "A" });
    });
    return out;
  }, [cards]);

  const stop = () => {
    controller.current?.stop();
    controller.current = null;
    setPlaying(false);
    setSegmentIndex(-1);
  };

  const start = () => {
    stop();
    setPlaying(true);
    controller.current = speakSequence(
      segments.map((s) => s.text),
      {
        gapMs: 900,
        onSegment: (i) => setSegmentIndex(i),
        onDone: () => { setPlaying(false); setSegmentIndex(-1); },
      },
    );
  };

  useEffect(() => () => controller.current?.stop(), []);

  const current = segmentIndex >= 0 ? segments[segmentIndex] : null;
  const cardNumber = current ? current.cardIndex + 1 : 0;
  const progressPct = current ? ((segmentIndex + 1) / segments.length) * 100 : 0;

  return (
    <Modal open onClose={() => { stop(); onClose(); }} title={<span className="flex items-center gap-2"><Podcast size={18} className="text-brand-500" /> Deck podcast</span>}>
      <div className="text-center">
        <motion.div
          animate={playing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={playing ? { repeat: Infinity, duration: 2 } : {}}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow"
        >
          <Podcast size={40} />
        </motion.div>
        <h3 className="mt-4 font-semibold">{deckName}</h3>
        <p className="text-sm text-ink-muted">{cards.length} cards · question → pause → answer</p>

        {current && (
          <div className="mt-4 rounded-xl bg-surface p-3 text-sm">
            <span className="chip bg-brand-500/12 text-brand-600 dark:text-brand-300 mr-2">
              Card {cardNumber}/{cards.length} · {current.side === "Q" ? "Question" : "Answer"}
            </span>
            <span className="text-ink-muted">{current.text.slice(0, 120)}{current.text.length > 120 ? "…" : ""}</span>
          </div>
        )}

        <Progress value={progressPct} className="mt-4" tone="brand" />

        <div className="mt-5 flex items-center justify-center gap-3">
          {playing ? (
            <>
              <button onClick={stop} className="btn-secondary"><Square size={16} className="fill-current" /> Stop</button>
              <button onClick={() => controller.current?.skip()} className="btn-secondary"><SkipForward size={16} /> Skip</button>
            </>
          ) : (
            <button onClick={start} className="btn-primary px-6 py-3"><Play size={18} /> Play podcast</button>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-faint">Uses your device's built-in voices — works offline.</p>
      </div>
    </Modal>
  );
}
