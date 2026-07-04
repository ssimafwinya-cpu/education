"use client";

// Thin, feature-detected wrappers around the Web Speech APIs.
// Both degrade silently: callers hide their UI when unsupported.

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Read text aloud; stops any previous utterance first. */
export function speak(text: string, opts?: { rate?: number; onEnd?: () => void }): void {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/\{\{c\d+::(.*?)\}\}/g, "$1")
    .replace(/[#*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return;
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = opts?.rate ?? 1;
  if (opts?.onEnd) utterance.onend = opts.onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
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
