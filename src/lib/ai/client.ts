"use client";

// Client-side helpers for talking to the AI routes.

import type { ChatTurn } from "./providers";
import type { GeneratedCard, GeneratedQuestion } from "./tutor-engine";

export interface StreamOptions {
  messages: ChatTurn[];
  context?: { studentName?: string; subjects?: string[]; material?: string };
  onToken: (chunk: string, full: string) => void;
  signal?: AbortSignal;
}

/** Stream a tutor reply, invoking `onToken` for each chunk. Returns the full text. */
export async function streamTutor(opts: StreamOptions): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: opts.messages, context: opts.context }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`Tutor request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    opts.onToken(chunk, full);
  }
  return full;
}

export async function generateFlashcards(text: string, count = 8): Promise<GeneratedCard[]> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "flashcards", text, count }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Generation failed");
  return (await res.json()).cards as GeneratedCard[];
}

export async function generateQuizQuestions(text: string, count = 5): Promise<GeneratedQuestion[]> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "quiz", text, count }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Generation failed");
  return (await res.json()).questions as GeneratedQuestion[];
}

export async function generateSummary(text: string, count = 6): Promise<string[]> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "summary", text, count }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Generation failed");
  return (await res.json()).points as string[];
}
