import { NextRequest, NextResponse } from "next/server";
import { EMAIL_RE, publicUser } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { hashToken, verifyIdentifier } from "@/server/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`verify:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  let body: { email?: string; token?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const email = (body.email ?? "").trim().toLowerCase();
  const token = body.token ?? "";

  if (!EMAIL_RE.test(email) || !token) {
    return NextResponse.json({ error: "This verification link is invalid." }, { status: 422 });
  }

  const store = getStore();
  const valid = await store.useToken(verifyIdentifier(email), hashToken(token));
  const user = valid ? await store.getUserByEmail(email) : null;
  if (!valid || !user) {
    return NextResponse.json({ error: "This verification link is invalid or has expired. Request a new one from the hub." }, { status: 400 });
  }

  await store.markEmailVerified(user.id);
  const fresh = await store.getUserByEmail(email);
  return NextResponse.json({ ok: true, user: publicUser(fresh ?? user) });
}
