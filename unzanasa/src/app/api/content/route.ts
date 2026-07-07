import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { mergeSiteContent, type SiteContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: the association-wide content, merged over defaults so a partial or
// empty store still returns a complete object.
export async function GET() {
  const stored = await getStore().getSiteContent();
  const content = mergeSiteContent((stored?.data ?? null) as Partial<SiteContent> | null);
  return NextResponse.json({ content, version: stored?.version ?? 0 });
}

// Admin only: replace the site content. Members and guests cannot write.
export async function PUT(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!rateLimit(`content:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many updates — slow down." }, { status: 429 });
  }

  let body: { content?: Partial<SiteContent> };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.content || typeof body.content !== "object") {
    return NextResponse.json({ error: "Missing content." }, { status: 422 });
  }

  const content = mergeSiteContent(body.content);
  const { version } = await getStore().putSiteContent(content);
  return NextResponse.json({ ok: true, version });
}
