import { NextRequest } from "next/server";
import { pickProvider, streamChat, type ChatTurn } from "@/lib/ai/providers";
import { tutorReply } from "@/lib/ai/tutor-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the Academic Hub's AI study tutor — patient, encouraging and Socratic.
Your goals:
- Explain concepts clearly, adapting to the student's level.
- Use analogies and worked examples.
- Break complex ideas into steps.
- Offer to quiz the student or make flashcards when helpful.
- Keep answers focused and well-formatted with Markdown.
When you reference the student's own notes, ground your answer in them.`;

interface Body {
  messages: ChatTurn[];
  context?: { studentName?: string; subjects?: string[]; material?: string };
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = (body.messages ?? []).filter((m) => m && typeof m.content === "string").slice(-20);
  if (messages.length === 0) return new Response("No messages", { status: 400 });

  const provider = pickProvider();
  const encoder = new TextEncoder();

  // ── No provider configured → stream the offline tutor engine ──────────────
  if (!provider) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const reply = tutorReply(last?.content ?? "", body.context);
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate token streaming so the UX matches the live-provider path.
        const words = reply.split(/(\s+)/);
        for (const w of words) {
          controller.enqueue(encoder.encode(w));
          await new Promise((r) => setTimeout(r, 8));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-ai-provider": "offline",
        "cache-control": "no-cache",
      },
    });
  }

  // ── Provider configured → proxy the streaming completion ──────────────────
  let system = SYSTEM_PROMPT;
  if (body.context?.material) {
    system += `\n\n--- Student's study material (reference when relevant) ---\n${body.context.material.slice(0, 6000)}`;
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(provider, system, messages, req.signal)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        // Graceful degradation: if the live call fails mid-stream, fall back.
        const last = [...messages].reverse().find((m) => m.role === "user");
        const fallback =
          "\n\n_(The AI provider was unavailable, so here's an offline response.)_\n\n" +
          tutorReply(last?.content ?? "", body.context);
        controller.enqueue(encoder.encode(fallback));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-ai-provider": provider.name,
      "cache-control": "no-cache",
    },
  });
}
