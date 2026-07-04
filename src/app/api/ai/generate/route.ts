import { NextRequest, NextResponse } from "next/server";
import { generateCards, generateQuiz, summarize } from "@/lib/ai/tutor-engine";

export const runtime = "nodejs";

interface Body {
  kind: "flashcards" | "quiz" | "summary";
  text: string;
  count?: number;
}

/**
 * Structured content generation (flashcards / quiz / summary).
 * Uses the deterministic tutor engine so it works with zero configuration.
 * When an LLM key is present the client can additionally stream richer
 * generations via /api/ai/chat; this endpoint guarantees a structured result.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 20) {
    return NextResponse.json({ error: "Not enough text to generate from." }, { status: 422 });
  }

  const count = Math.min(20, Math.max(1, body.count ?? 8));

  switch (body.kind) {
    case "flashcards":
      return NextResponse.json({ cards: generateCards(text, count) });
    case "quiz":
      return NextResponse.json({ questions: generateQuiz(text, count) });
    case "summary":
      return NextResponse.json({ points: summarize(text, count) });
    default:
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  }
}
