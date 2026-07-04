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
}

// ─── FileStore ───────────────────────────────────────────────────────────────

const DATA_DIR = process.env.COGNIFY_DATA_DIR || path.join(process.cwd(), ".data");

interface FileDb {
  users: StoredUser[];
  snapshots: Record<string, Snapshot>;
}

async function readDb(): Promise<FileDb> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "db.json"), "utf8");
    return JSON.parse(raw) as FileDb;
  } catch {
    return { users: [], snapshots: {} };
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
}

function toStored(u: {
  id: string; email: string; name: string | null; avatar: string;
  passwordHash: string | null; role: string; createdAt: Date;
}): StoredUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    avatar: u.avatar,
    passwordHash: u.passwordHash ?? "",
    role: (u.role as StoredUser["role"]) ?? "STUDENT",
    createdAt: u.createdAt.getTime(),
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
