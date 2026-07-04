"use client";

// Reusable "Listen" button: reads any text aloud with play/stop toggling.
// Hidden entirely when the browser lacks speechSynthesis.

import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";
import { cn } from "@/lib/utils";

export function ListenButton({
  text,
  label = "Listen",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => setSupported(ttsSupported()), []);
  useEffect(() => () => stopSpeaking(), []);

  if (!supported) return null;

  return (
    <button
      onClick={() => {
        if (playing) {
          stopSpeaking();
          setPlaying(false);
        } else {
          setPlaying(true);
          speak(text, { onEnd: () => setPlaying(false) });
        }
      }}
      className={cn("btn-secondary btn-sm", playing && "text-brand-500", className)}
      title={playing ? "Stop" : `${label} (read aloud)`}
    >
      {playing ? <Square size={13} className="fill-current" /> : <Volume2 size={13} />} {playing ? "Stop" : label}
    </button>
  );
}
