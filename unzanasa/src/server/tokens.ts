// ─── Auth tokens (password reset + email verification) ──────────────────────
// Single-use, expiring, out-of-band tokens. Only the SHA-256 hash is stored,
// so a database leak cannot be replayed into a takeover; the raw token lives
// solely in the email link.

import { createHash, randomBytes } from "node:crypto";

export const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface IssuedToken { raw: string; hash: string; }

/** 32 random bytes, base64url — the raw form goes in the email link only. */
export function generateToken(): IssuedToken {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Storage identifiers namespace the purpose so tokens can't cross flows. */
export const resetIdentifier = (email: string) => `reset:${email.toLowerCase()}`;
export const verifyIdentifier = (email: string) => `verify:${email.toLowerCase()}`;
