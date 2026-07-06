import { NextRequest, NextResponse } from "next/server";
import { EMAIL_RE } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { generateToken, resetIdentifier, RESET_TTL_MS } from "@/server/tokens";
import { sendMail, resetPasswordMail, appUrl, mailTransport } from "@/server/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Always answers 200 with the same body whether or not the account exists,
// so the endpoint cannot be used to enumerate emails.
export async function POST(req: NextRequest) {
  if (!rateLimit(`forgot:${clientIp(req)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many reset requests — try again later." }, { status: 429 });
  }

  let body: { email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  const generic = { ok: true, message: "If an account exists for that address, a reset link is on its way." };

  const store = getStore();
  const user = await store.getUserByEmail(email);
  if (!user) return NextResponse.json(generic);

  const { raw, hash } = generateToken();
  await store.saveToken(resetIdentifier(email), hash, Date.now() + RESET_TTL_MS);
  const link = `${appUrl()}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
  await sendMail(resetPasswordMail(email, link));

  // Dev convenience only: with the file outbox there is no real inbox, so
  // surface the link. Never in production.
  if (process.env.NODE_ENV !== "production" && mailTransport() === "outbox") {
    return NextResponse.json({ ...generic, devLink: link });
  }
  return NextResponse.json(generic);
}
