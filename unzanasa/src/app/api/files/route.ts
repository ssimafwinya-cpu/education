import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "@/server/auth";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { savePdf } from "@/server/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin only: upload a past-paper PDF. Multipart form with a "file" field.
export async function POST(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!rateLimit(`upload:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many uploads — slow down." }, { status: 429 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Expected a multipart form with a \"file\" field." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 422 });

  const saved = await savePdf(new Uint8Array(await file.arrayBuffer()));
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 422 });
  return NextResponse.json({ ok: true, url: saved.url, id: saved.id, size: saved.size }, { status: 201 });
}
