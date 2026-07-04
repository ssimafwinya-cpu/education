"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Sparkles, StickyNote, Download, RefreshCw, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, EmptyState, useToast } from "@/components/ui";
import { MindMap } from "@/components/mindmap";
import { generateMindMap, type MindMapNode } from "@/lib/ai/client";

export default function MindMapsPage() {
  const { state } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const [rootLabel, setRootLabel] = useState("");
  const [map, setMap] = useState<MindMapNode | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (source: string, root?: string) => {
    if (source.trim().length < 30) {
      toast({ emoji: "🤔", title: "Add more text to map" });
      return;
    }
    setLoading(true);
    try {
      const result = await generateMindMap(source, root, 7);
      setMap(result);
    } catch {
      toast({ emoji: "⚠️", title: "Couldn't generate mind map" });
    }
    setLoading(false);
  };

  const fromNote = (noteId: string) => {
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;
    setText(note.content);
    setRootLabel(note.title);
    generate(note.content, note.title);
  };

  const exportSvg = () => {
    const svg = document.querySelector("main svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmap-${(rootLabel || "cognify").toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ emoji: "🖼️", title: "Mind map exported" });
  };

  return (
    <div>
      <PageHeader
        title="Mind Maps"
        description="Turn any note or text into an interactive concept map. Click branches to expand or collapse."
        icon={<Network className="text-brand-500" />}
        actions={map && <button onClick={exportSvg} className="btn-secondary"><Download size={15} /> Export SVG</button>}
      />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Central topic (optional)</label>
            <input value={rootLabel} onChange={(e) => setRootLabel(e.target.value)} className="input" placeholder="e.g. The Cell" />
            <label className="mb-1.5 mt-4 block text-xs font-medium text-ink-muted">Source text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[160px] resize-y" placeholder="Paste notes or study material…" />
            <button onClick={() => generate(text, rootLabel)} disabled={loading} className="btn-primary mt-3 w-full">
              {loading ? <><RefreshCw size={15} className="animate-spin" /> Generating…</> : <><Wand2 size={15} /> Generate mind map</>}
            </button>
          </Card>

          {state.notes.length > 0 && (
            <Card>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><StickyNote size={15} className="text-violet-500" /> From a note</h3>
              <div className="space-y-1.5">
                {state.notes.slice(0, 6).map((n) => (
                  <button key={n.id} onClick={() => fromNote(n.id)} className="w-full truncate rounded-lg border border-edge px-3 py-2 text-left text-sm transition hover:border-brand-400 hover:bg-brand-500/5">
                    {n.title}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Canvas */}
        <Card className="min-h-[520px]">
          {loading ? (
            <div className="flex h-[480px] items-center justify-center">
              <div className="text-center">
                <Sparkles size={40} className="mx-auto animate-pulse-soft text-brand-500" />
                <p className="mt-3 text-sm text-ink-muted">Mapping concepts…</p>
              </div>
            </div>
          ) : map ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MindMap root={map} />
            </motion.div>
          ) : (
            <EmptyState
              icon="🕸️"
              title="No mind map yet"
              description="Paste some text or pick a note, then generate an interactive concept map."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
