// ─── Auth: password hashing + JWT session cookies ───────────────────────────
// Credentials auth implemented with bcrypt + jose (HS256). Sessions are
// httpOnly SameSite=Lax cookies, so tokens are never exposed to client JS.
// OAuth providers (Google/Apple/Microsoft/GitHub) mount via Auth.js in
// production — see docs/SECURITY.md; this module covers email/password.

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getStore, type StoredUser } from "./storage";

const COOKIE = "cognify_session";
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production" && process.env.COGNIFY_ALLOW_DEV_SECRET !== "1") {
      throw new Error("AUTH_SECRET must be set in production");
    }
    return new TextEncoder().encode("cognify-dev-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/** Resolve the authenticated user from the request cookie, or null. */
export async function sessionUser(req: NextRequest): Promise<StoredUser | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return getStore().getUserById(userId);
}

/** Public projection of a user (never includes the password hash). */
export function publicUser(u: StoredUser) {
  return { id: u.id, email: u.email, name: u.name, avatar: u.avatar, role: u.role };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;
