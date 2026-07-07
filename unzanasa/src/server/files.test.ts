import { describe, it, expect, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

// Point uploads at a temp dir BEFORE importing the module under test.
const TEST_DIR = path.join(os.tmpdir(), `unzanasa-files-${process.pid}`);
process.env.UPLOADS_DIR = TEST_DIR;

const { newFileId, isValidFileId, looksLikePdf, savePdf, readPdf, MAX_PDF_BYTES } = await import("./files");

const pdfBytes = (extra = "") => new TextEncoder().encode(`%PDF-1.4\n${extra}\n%%EOF`);

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("file ids", () => {
  it("generates unique, valid ids", () => {
    const a = newFileId(), b = newFileId();
    expect(a).not.toBe(b);
    expect(isValidFileId(a)).toBe(true);
  });
  it("rejects traversal and junk ids", () => {
    expect(isValidFileId("../etc/passwd")).toBe(false);
    expect(isValidFileId("f_../..")).toBe(false);
    expect(isValidFileId("f_ABC")).toBe(false); // uppercase not generated
    expect(isValidFileId("")).toBe(false);
  });
});

describe("looksLikePdf", () => {
  it("accepts %PDF- and rejects other content", () => {
    expect(looksLikePdf(pdfBytes())).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("<html>hi</html>"))).toBe(false);
    expect(looksLikePdf(new Uint8Array())).toBe(false);
  });
});

describe("savePdf / readPdf", () => {
  it("round-trips a PDF", async () => {
    const saved = await savePdf(pdfBytes("round-trip"));
    if ("error" in saved) throw new Error(saved.error);
    expect(saved.url).toBe(`/api/files/${saved.id}`);
    const back = await readPdf(saved.id);
    expect(back).not.toBeNull();
    expect(new TextDecoder().decode(back!)).toContain("round-trip");
  });
  it("rejects non-PDF and empty payloads", async () => {
    expect("error" in (await savePdf(new TextEncoder().encode("MZ...exe")))).toBe(true);
    expect("error" in (await savePdf(new Uint8Array()))).toBe(true);
  });
  it("rejects oversize payloads", async () => {
    const big = new Uint8Array(MAX_PDF_BYTES + 1);
    big.set(pdfBytes());
    expect("error" in (await savePdf(big))).toBe(true);
  });
  it("readPdf returns null for unknown or invalid ids", async () => {
    expect(await readPdf("f_doesnotexist000")).toBeNull();
    expect(await readPdf("../../etc/passwd")).toBeNull();
  });
});
