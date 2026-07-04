"use client";

// Thin, feature-detected wrappers around the Web Speech APIs.
// Both degrade silently: callers hide their UI when unsupported.

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Read text aloud; stops any previous utterance first. */
export function speak(text: string, opts?: { rate?: number; onEnd?: () => void }): void {
  if (!ttsSupported()) {
    opts?.onEnd?.();
    return;
  }
  const clean = text
    .replace(/\{\{c\d+::(.*?)\}\}/g, "$1")
    .replace(/[#*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) {
    opts?.onEnd?.();
    return;
  }
  // TTS must never break the UI: a failure just skips the audio and continues.
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = opts?.rate ?? 1;
    if (opts?.onEnd) utterance.onend = opts.onEnd;
    utterance.onerror = () => opts?.onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    opts?.onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export interface SequenceController {
  stop(): void;
  skip(): void;
}

/**
 * Speak a list of segments in order (podcast mode). Calls `onSegment` before
 * each one so the UI can show progress, and `onDone` at the end. Returns a
 * controller with stop/skip. Degrades to a no-op when TTS is unavailable.
 */
export function speakSequence(
  segments: string[],
  opts: { rate?: number; gapMs?: number; onSegment?: (index: number) => void; onDone?: () => void } = {},
): SequenceController {
  if (!ttsSupported() || segments.length === 0) {
    opts.onDone?.();
    return { stop() {}, skip() {} };
  }
  let index = 0;
  let stopped = false;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;

  const playNext = () => {
    if (stopped) return;
    if (index >= segments.length) {
      opts.onDone?.();
      return;
    }
    const i = index++;
    opts.onSegment?.(i);
    speak(segments[i], {
      rate: opts.rate,
      onEnd: () => {
        if (stopped) return;
        gapTimer = setTimeout(playNext, opts.gapMs ?? 600);
      },
    });
  };

  playNext();

  return {
    stop() {
      stopped = true;
      if (gapTimer) clearTimeout(gapTimer);
      stopSpeaking();
    },
    skip() {
      if (gapTimer) clearTimeout(gapTimer);
      stopSpeaking(); // onEnd of the cancelled utterance won't fire reliably; advance manually
      if (!stopped) playNext();
    },
  };
}

// ─── Speech-to-text ──────────────────────────────────────────────────────────

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return recognitionCtor() !== null;
}

/**
 * Listen for one utterance and resolve with its transcript.
 * Rejects on error / no speech. Caller manages UI state around it.
 */
export function listenOnce(lang = "en-US"): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = recognitionCtor();
    if (!Ctor) return reject(new Error("unsupported"));
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let settled = false;
    rec.onresult = (e) => {
      settled = true;
      resolve(e.results[0]?.[0]?.transcript ?? "");
    };
    rec.onerror = (e) => {
      if (!settled) reject(e instanceof Error ? e : new Error("speech-error"));
    };
    rec.onend = () => {
      if (!settled) reject(new Error("no-speech"));
    };
    rec.start();
  });
}
