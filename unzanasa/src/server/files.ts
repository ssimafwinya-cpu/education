// ─── Uploaded files (past papers) ────────────────────────────────────────────
// Minimal, safe PDF storage on local disk. Files are written under
// UPLOADS_DIR (default: .data/uploads) with server-generated ids — user input
// never touches the path. PDF-only, validated by magic bytes, capped in size.
//
// This suits a VPS/Docker deployment (mount the directory as a volume). On
// serverless hosts the filesystem is ephemeral — keep using external links
// there (see docs/DEPLOYMENT.md).

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

const UPLOADS_DIR =
  process.env.UPLOADS_DIR ||
  path.join(process.env.COGNIFY_DATA_DIR || path.join(process.cwd(), ".data"), "uploads");

/** Server-generated file id — the only thing that ever reaches the filesystem. */
export function newFileId(): string {
  return `f_${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

/** Strict id shape check so a crafted id can never traverse the path. */
export function isValidFileId(id: string): boolean {
  return /^f_[a-z0-9]{6,32}$/.test(id);
}

/** True when the buffer starts with the PDF magic bytes "%PDF-". */
export function looksLikePdf(buf: Uint8Array): boolean {
  return buf.length > 5 &&
    buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

export interface SavedFile { id: string; url: string; size: number; }

/** Validate and persist an uploaded PDF; returns its public URL. */
export async function savePdf(buf: Uint8Array): Promise<SavedFile | { error: string }> {
  if (buf.length === 0) return { error: "The file is empty." };
  if (buf.length > MAX_PDF_BYTES) return { error: `PDFs are capped at ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} MB.` };
  if (!looksLikePdf(buf)) return { error: "Only PDF files are accepted." };
  const id = newFileId();
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, `${id}.pdf`), buf);
  return { id, url: `/api/files/${id}`, size: buf.length };
}

/** Read a stored PDF by id, or null when absent/invalid. */
export async function readPdf(id: string): Promise<Uint8Array | null> {
  if (!isValidFileId(id)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, `${id}.pdf`));
  } catch {
    return null;
  }
}
