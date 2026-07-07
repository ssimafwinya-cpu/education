// ─── Server storage layer ────────────────────────────────────────────────────
// One interface, two drivers:
//   · PrismaStore — PostgreSQL via Prisma, used when DATABASE_URL is set.
//   · FileStore   — zero-config JSON files under .data/, so accounts and cloud
//     sync work out of the box in dev/demo without a database.
// The app picks the driver once at boot. Both are exercised by the test suite.

import { promises as fs } from "node:fs";
import path from "node:path";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  passwordHash: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt: number;
  /** Epoch ms when the email was verified, or null/undefined. */
  emailVerified?: number | null;
}

export interface Snapshot {
  data: unknown;
  version: number;
  updatedAt: number;
}

export interface ServerStore {
  readonly driver: "prisma" | "file";
  createUser(u: Omit<StoredUser, "id" | "createdAt">): Promise<StoredUser>;
  getUserByEmail(email: string): Promise<StoredUser | null>;
  getUserById(id: string): Promise<StoredUser | null>;
  getSnapshot(userId: string): Promise<Snapshot | null>;
  /**
   * Write the user's snapshot. `expectVersion` implements optimistic
   * concurrency: pass the version you last read; the write fails with
   * "conflict" if someone else has written since. Pass null to force.
   */
  putSnapshot(userId: string, data: unknown, expectVersion: number | null): Promise<
    { ok: true; version: number } | { ok: false; error: "conflict"; version: number }
  >;
  /** Read the association-wide site content (admin-managed), or null. */
  getSiteContent(): Promise<{ data: unknown; version: number } | null>;
  /** Replace the site content, bumping its version. */
  putSiteContent(data: unknown): Promise<{ version: number }>;
  /** Store an auth token hash, replacing any previous token for the identifier. */
  saveToken(identifier: string, tokenHash: string, expiresAt: number): Promise<void>;
  /** Consume a token: valid + unexpired → deleted and true; otherwise false. */
  useToken(identifier: string, tokenHash: string): Promise<boolean>;
  setPassword(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
}

// ─── FileStore ───────────────────────────────────────────────────────────────

const DATA_DIR = process.env.COGNIFY_DATA_DIR || path.join(process.cwd(), ".data");

interface FileToken { identifier: string; tokenHash: string; expiresAt: number; }

interface FileDb {
  users: StoredUser[];
  snapshots: Record<string, Snapshot>;
  tokens?: FileToken[];
  siteContent?: { data: unknown; version: number; updatedAt: number };
}

async function readDb(): Promise<FileDb> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "db.json"), "utf8");
    return JSON.parse(raw) as FileDb;
  } catch {
    return { users: [], snapshots: {}, tokens: [] };
  }
}

async function writeDb(db: FileDb): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "db.json");
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db), "utf8");
  await fs.rename(tmp, file); // atomic on POSIX
}

// Serialise writes so concurrent requests can't interleave read-modify-write.
let fileLock: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = fileLock.then(fn, fn);
  fileLock = run.catch(() => {});
  return run;
}

export class FileStore implements ServerStore {
  readonly driver = "file" as const;

  createUser(u: Omit<StoredUser, "id" | "createdAt">): Promise<StoredUser> {
    return locked(async () => {
      const db = await readDb();
      if (db.users.some((x) => x.email === u.email)) throw new Error("email_taken");
      const user: StoredUser = {
        ...u,
        id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };
      db.users.push(user);
      await writeDb(db);
      return user;
    });
  }

  async getUserByEmail(email: string) {
    const db = await readDb();
    return db.users.find((u) => u.email === email) ?? null;
  }

  async getUserById(id: string) {
    const db = await readDb();
    return db.users.find((u) => u.id === id) ?? null;
  }

  async getSnapshot(userId: string) {
    const db = await readDb();
    return db.snapshots[userId] ?? null;
  }

  putSnapshot(userId: string, data: unknown, expectVersion: number | null) {
    return locked(async () => {
      const db = await readDb();
      const current = db.snapshots[userId];
      if (expectVersion !== null && current && current.version !== expectVersion) {
        return { ok: false as const, error: "conflict" as const, version: current.version };
      }
      const version = (current?.version ?? 0) + 1;
      db.snapshots[userId] = { data, version, updatedAt: Date.now() };
      await writeDb(db);
      return { ok: true as const, version };
    });
  }

  saveToken(identifier: string, tokenHash: string, expiresAt: number): Promise<void> {
    return locked(async () => {
      const db = await readDb();
      db.tokens = (db.tokens ?? []).filter((t) => t.identifier !== identifier && t.expiresAt > Date.now());
      db.tokens.push({ identifier, tokenHash, expiresAt });
      await writeDb(db);
    });
  }

  useToken(identifier: string, tokenHash: string): Promise<boolean> {
    return locked(async () => {
      const db = await readDb();
      const tokens = db.tokens ?? [];
      const idx = tokens.findIndex((t) => t.identifier === identifier && t.tokenHash === tokenHash);
      if (idx === -1) return false;
      const valid = tokens[idx].expiresAt > Date.now();
      tokens.splice(idx, 1); // single-use either way
      db.tokens = tokens;
      await writeDb(db);
      return valid;
    });
  }

  setPassword(userId: string, passwordHash: string): Promise<void> {
    return locked(async () => {
      const db = await readDb();
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error("user_not_found");
      user.passwordHash = passwordHash;
      await writeDb(db);
    });
  }

  markEmailVerified(userId: string): Promise<void> {
    return locked(async () => {
      const db = await readDb();
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error("user_not_found");
      user.emailVerified = Date.now();
      await writeDb(db);
    });
  }

  async getSiteContent() {
    const db = await readDb();
    return db.siteContent ? { data: db.siteContent.data, version: db.siteContent.version } : null;
  }

  putSiteContent(data: unknown): Promise<{ version: number }> {
    return locked(async () => {
      const db = await readDb();
      const version = (db.siteContent?.version ?? 0) + 1;
      db.siteContent = { data, version, updatedAt: Date.now() };
      await writeDb(db);
      return { version };
    });
  }
}

// ─── PrismaStore ─────────────────────────────────────────────────────────────

type PrismaClientT = import("@prisma/client").PrismaClient;

let prismaSingleton: PrismaClientT | null = null;
async function prisma(): Promise<PrismaClientT> {
  if (!prismaSingleton) {
    const { PrismaClient } = await import("@prisma/client");
    prismaSingleton = new PrismaClient();
  }
  return prismaSingleton;
}

export class PrismaStore implements ServerStore {
  readonly driver = "prisma" as const;

  async createUser(u: Omit<StoredUser, "id" | "createdAt">): Promise<StoredUser> {
    const db = await prisma();
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) throw new Error("email_taken");
    const created = await db.user.create({
      data: { email: u.email, name: u.name, avatar: u.avatar, passwordHash: u.passwordHash, role: u.role },
    });
    return toStored(created);
  }

  async getUserByEmail(email: string) {
    const db = await prisma();
    const u = await db.user.findUnique({ where: { email } });
    return u ? toStored(u) : null;
  }

  async getUserById(id: string) {
    const db = await prisma();
    const u = await db.user.findUnique({ where: { id } });
    return u ? toStored(u) : null;
  }

  async getSnapshot(userId: string) {
    const db = await prisma();
    const s = await db.stateSnapshot.findUnique({ where: { userId } });
    return s ? { data: s.data, version: s.version, updatedAt: s.updatedAt.getTime() } : null;
  }

  async putSnapshot(userId: string, data: unknown, expectVersion: number | null) {
    const db = await prisma();
    const current = await db.stateSnapshot.findUnique({ where: { userId } });
    if (expectVersion !== null && current && current.version !== expectVersion) {
      return { ok: false as const, error: "conflict" as const, version: current.version };
    }
    const version = (current?.version ?? 0) + 1;
    await db.stateSnapshot.upsert({
      where: { userId },
      create: { userId, data: data as object, version },
      update: { data: data as object, version },
    });
    return { ok: true as const, version };
  }

  async saveToken(identifier: string, tokenHash: string, expiresAt: number): Promise<void> {
    const db = await prisma();
    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({
      data: { identifier, token: tokenHash, expires: new Date(expiresAt) },
    });
  }

  async useToken(identifier: string, tokenHash: string): Promise<boolean> {
    const db = await prisma();
    const found = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier, token: tokenHash } },
    });
    if (!found) return false;
    await db.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    }).catch(() => {}); // single-use either way
    return found.expires.getTime() > Date.now();
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    const db = await prisma();
    await db.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    const db = await prisma();
    await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  }

  async getSiteContent() {
    const db = await prisma();
    const row = await db.siteContent.findUnique({ where: { id: "global" } });
    return row ? { data: row.data, version: row.version } : null;
  }

  async putSiteContent(data: unknown): Promise<{ version: number }> {
    const db = await prisma();
    const current = await db.siteContent.findUnique({ where: { id: "global" } });
    const version = (current?.version ?? 0) + 1;
    await db.siteContent.upsert({
      where: { id: "global" },
      create: { id: "global", data: data as object, version },
      update: { data: data as object, version },
    });
    return { version };
  }
}

function toStored(u: {
  id: string; email: string; name: string | null; avatar: string;
  passwordHash: string | null; role: string; createdAt: Date;
  emailVerified?: Date | null;
}): StoredUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    avatar: u.avatar,
    passwordHash: u.passwordHash ?? "",
    role: (u.role as StoredUser["role"]) ?? "STUDENT",
    createdAt: u.createdAt.getTime(),
    emailVerified: u.emailVerified ? u.emailVerified.getTime() : null,
  };
}

// ─── Driver selection ────────────────────────────────────────────────────────

let storeSingleton: ServerStore | null = null;

export function getStore(): ServerStore {
  if (!storeSingleton) {
    storeSingleton = process.env.DATABASE_URL ? new PrismaStore() : new FileStore();
  }
  return storeSingleton;
}

/** Test hook: swap the store implementation. */
export function __setStore(store: ServerStore | null) {
  storeSingleton = store;
}
