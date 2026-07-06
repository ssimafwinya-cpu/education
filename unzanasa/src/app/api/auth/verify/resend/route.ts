import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";
import { generateToken, verifyIdentifier, VERIFY_TTL_MS } from "@/server/tokens";
import { sendMail, verifyEmailMail, appUrl, mailTransport } from "@/server/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.emailVerified) return NextResponse.json({ ok: true, message: "Email already verified." });

  if (!rateLimit(`resend:${clientIp(req)}:${user.id}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests — try again later." }, { status: 429 });
  }

  const { raw, hash } = generateToken();
  await getStore().saveToken(verifyIdentifier(user.email), hash, Date.now() + VERIFY_TTL_MS);
  const link = `${appUrl()}/verify-email?token=${raw}&email=${encodeURIComponent(user.email)}`;
  await sendMail(verifyEmailMail(user.email, link));

  if (process.env.NODE_ENV !== "production" && mailTransport() === "outbox") {
    return NextResponse.json({ ok: true, devLink: link });
  }
  return NextResponse.json({ ok: true });
}
