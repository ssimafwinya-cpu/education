import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

// Point the FileStore at a temp dir BEFORE importing the module under test.
const TEST_DIR = path.join(os.tmpdir(), `cognify-test-${process.pid}`);
process.env.COGNIFY_DATA_DIR = TEST_DIR;

const { FileStore } = await import("./storage");
const { hashPassword, verifyPassword, createSessionToken, verifySessionToken, EMAIL_RE } = await import("./auth");
const { rateLimit, __resetRateLimits } = await import("./ratelimit");

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
  it("produces unique salts", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});

describe("session tokens", () => {
  it("round-trips a user id", async () => {
    const token = await createSessionToken("user_123");
    expect(await verifySessionToken(token)).toBe("user_123");
  });
  it("rejects tampered tokens", async () => {
    const token = await createSessionToken("user_123");
    expect(await verifySessionToken(token + "x")).toBeNull();
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
  });
});

describe("email validation", () => {
  it("accepts normal emails and rejects junk", () => {
    expect(EMAIL_RE.test("student@uni.edu")).toBe(true);
    expect(EMAIL_RE.test("a.b+c@sub.domain.io")).toBe(true);
    expect(EMAIL_RE.test("not-an-email")).toBe(false);
    expect(EMAIL_RE.test("missing@tld")).toBe(false);
    expect(EMAIL_RE.test("spaces in@mail.com")).toBe(false);
  });
});

describe("FileStore", () => {
  let store: InstanceType<typeof FileStore>;

  beforeEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    store = new FileStore();
  });

  it("creates and finds users by email and id", async () => {
    const u = await store.createUser({ email: "a@b.co", name: "A", avatar: "🦊", passwordHash: "h", role: "STUDENT" });
    expect(u.id).toBeTruthy();
    expect((await store.getUserByEmail("a@b.co"))?.id).toBe(u.id);
    expect((await store.getUserById(u.id))?.email).toBe("a@b.co");
    expect(await store.getUserByEmail("nobody@b.co")).toBeNull();
  });

  it("rejects duplicate emails", async () => {
    await store.createUser({ email: "dup@b.co", name: "A", avatar: "🦊", passwordHash: "h", role: "STUDENT" });
    await expect(
      store.createUser({ email: "dup@b.co", name: "B", avatar: "🦉", passwordHash: "h", role: "STUDENT" }),
    ).rejects.toThrow("email_taken");
  });

  it("snapshot versioning: first write is v1, subsequent bumps", async () => {
    const u = await store.createUser({ email: "s@b.co", name: "S", avatar: "🦊", passwordHash: "h", role: "STUDENT" });
    expect(await store.getSnapshot(u.id)).toBeNull();

    const w1 = await store.putSnapshot(u.id, { hello: 1 }, null);
    expect(w1).toEqual({ ok: true, version: 1 });

    const w2 = await store.putSnapshot(u.id, { hello: 2 }, 1);
    expect(w2).toEqual({ ok: true, version: 2 });

    const snap = await store.getSnapshot(u.id);
    expect(snap?.version).toBe(2);
    expect((snap?.data as any).hello).toBe(2);
  });

  it("detects write conflicts (optimistic concurrency)", async () => {
    const u = await store.createUser({ email: "c@b.co", name: "C", avatar: "🦊", passwordHash: "h", role: "STUDENT" });
    await store.putSnapshot(u.id, { device: "A" }, null); // v1
    await store.putSnapshot(u.id, { device: "B" }, 1);    // v2 (device B wrote)

    // Device A still thinks it's at v1 → conflict.
    const stale = await store.putSnapshot(u.id, { device: "A2" }, 1);
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.version).toBe(2);

    // Forced write (null) always succeeds.
    const forced = await store.putSnapshot(u.id, { device: "A3" }, null);
    expect(forced.ok).toBe(true);
  });

  it("serialises concurrent writes without losing data", async () => {
    const u = await store.createUser({ email: "p@b.co", name: "P", avatar: "🦊", passwordHash: "h", role: "STUDENT" });
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => store.putSnapshot(u.id, { i }, null)),
    );
    const snap = await store.getSnapshot(u.id);
    expect(snap?.version).toBe(5);
  });
});

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimits());

  it("allows up to the limit then blocks", () => {
    for (let i = 0; i < 5; i++) expect(rateLimit("k", 5, 1000, 1000)).toBe(true);
    expect(rateLimit("k", 5, 1000, 1001)).toBe(false);
  });

  it("frees slots once the window slides past", () => {
    for (let i = 0; i < 3; i++) rateLimit("w", 3, 1000, 1000 + i);
    expect(rateLimit("w", 3, 1000, 1500)).toBe(false);
    expect(rateLimit("w", 3, 1000, 2500)).toBe(true); // old hits expired
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000, 0)).toBe(true);
    expect(rateLimit("a", 1, 1000, 1)).toBe(false);
    expect(rateLimit("b", 1, 1000, 1)).toBe(true);
  });
});
