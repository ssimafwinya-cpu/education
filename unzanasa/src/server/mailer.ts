// ─── Outbound email ──────────────────────────────────────────────────────────
// Two transports, chosen by environment:
//   · Resend (https://resend.com) when RESEND_API_KEY is set — a plain HTTPS
//     POST, no SDK dependency. MAIL_FROM sets the sender.
//   · File outbox (default): messages are written as JSON under
//     .data/outbox/ and logged, so every flow is fully testable in dev
//     without any provider. Routes may surface links from outbox mail in
//     development responses; they never do in production.

import { promises as fs } from "node:fs";
import path from "node:path";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type MailResult =
  | { ok: true; transport: "resend" | "outbox" }
  | { ok: false; error: string };

const OUTBOX_DIR = path.join(
  process.env.COGNIFY_DATA_DIR || path.join(process.cwd(), ".data"),
  "outbox",
);

export function mailTransport(): "resend" | "outbox" {
  return process.env.RESEND_API_KEY ? "resend" : "outbox";
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  if (mailTransport() === "resend") {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "UNZANASA Hub <onboarding@resend.dev>",
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        }),
      });
      if (!res.ok) return { ok: false, error: `mail provider returned ${res.status}` };
      return { ok: true, transport: "resend" };
    } catch {
      return { ok: false, error: "mail provider unreachable" };
    }
  }

  try {
    await fs.mkdir(OUTBOX_DIR, { recursive: true });
    const file = path.join(OUTBOX_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    await fs.writeFile(file, JSON.stringify({ ...mail, sentAt: new Date().toISOString() }, null, 2), "utf8");
    console.log(`[mail:outbox] to=${mail.to} subject="${mail.subject}" file=${file}`);
    return { ok: true, transport: "outbox" };
  } catch {
    return { ok: false, error: "could not write outbox" };
  }
}

// ─── Message templates ───────────────────────────────────────────────────────

const wrap = (title: string, bodyHtml: string) => `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#0f766e;margin:0 0 4px">UNZANASA Academic Hub</h2>
  <h3 style="margin:0 0 16px">${title}</h3>
  ${bodyHtml}
  <p style="color:#64748b;font-size:12px;margin-top:24px">
    University of Zambia Natural Sciences Student Association.
    If you didn't request this, you can safely ignore this email.
  </p>
</div>`;

export function resetPasswordMail(to: string, link: string): Mail {
  return {
    to,
    subject: "Reset your UNZANASA Hub password",
    text: `Reset your password (link valid for 30 minutes):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: wrap("Reset your password", `
      <p>Click the button below to choose a new password. The link is valid for <strong>30 minutes</strong> and can be used once.</p>
      <p style="margin:20px 0"><a href="${link}" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>${link}</p>`),
  };
}

export function verifyEmailMail(to: string, link: string): Mail {
  return {
    to,
    subject: "Verify your email for UNZANASA Hub",
    text: `Welcome! Verify your email (link valid for 24 hours):\n\n${link}`,
    html: wrap("Verify your email", `
      <p>Welcome to the Academic Hub! Confirm this email address to secure your account and enable password recovery.</p>
      <p style="margin:20px 0"><a href="${link}" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verify email</a></p>
      <p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>${link}</p>`),
  };
}
