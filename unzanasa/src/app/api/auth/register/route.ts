import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword, createSessionToken, attachSessionCookie, publicUser,
  EMAIL_RE, MIN_PASSWORD,
} from "@/server/auth";
import { getStore } from "@/server/storage";
import { rateLimit, clientIp } from "@/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim() || email.split("@")[0];

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, { status: 422 });
  }

  const store = getStore();
  try {
    const user = await store.createUser({
      email,
      name,
      avatar: "🦊",
      passwordHash: await hashPassword(password),
      role: "STUDENT",
    });
    const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
    attachSessionCookie(res, await createSessionToken(user.id));
    return res;
  } catch (e) {
    if ((e as Error).message === "email_taken") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
