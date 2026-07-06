import { NextRequest, NextResponse } from "next/server";
import { hashPassword, EMAIL_RE, MIN_PASSWORD } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { hashToken, resetIdentifier } from "@/server/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`reset:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  let body: { email?: string; token?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const email = (body.email ?? "").trim().toLowerCase();
  const token = body.token ?? "";
  const password = body.password ?? "";

  if (!EMAIL_RE.test(email) || !token) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 422 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, { status: 422 });
  }

  const store = getStore();
  const valid = await store.useToken(resetIdentifier(email), hashToken(token));
  const user = valid ? await store.getUserByEmail(email) : null;
  if (!valid || !user) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  await store.setPassword(user.id, await hashPassword(password));
  return NextResponse.json({ ok: true });
}
