import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Whole-state snapshot sync (see StateSnapshot in prisma/schema.prisma).
// GET  → { data, version } | { data: null, version: 0 } when nothing stored.
// PUT  → { version } on success; 409 { version } when the expected version is
//        stale (another device wrote in between) — client then pulls first.

const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024; // 4 MB of JSON is plenty

export async function GET(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const snapshot = await getStore().getSnapshot(user.id);
  if (!snapshot) return NextResponse.json({ data: null, version: 0 });
  return NextResponse.json({ data: snapshot.data, version: snapshot.version, updatedAt: snapshot.updatedAt });
}

export async function PUT(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  if (!rateLimit(`sync:${clientIp(req)}:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Sync rate limit exceeded." }, { status: 429 });
  }

  const raw = await req.text();
  if (raw.length > MAX_SNAPSHOT_BYTES) {
    return NextResponse.json({ error: "Snapshot too large." }, { status: 413 });
  }

  let body: { data?: unknown; version?: number };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.data === undefined || typeof body.version !== "number") {
    return NextResponse.json({ error: "Expected { data, version }." }, { status: 422 });
  }

  const result = await getStore().putSnapshot(user.id, body.data, body.version === 0 ? null : body.version);
  if (!result.ok) {
    return NextResponse.json({ error: "Version conflict", version: result.version }, { status: 409 });
  }
  return NextResponse.json({ version: result.version });
}
