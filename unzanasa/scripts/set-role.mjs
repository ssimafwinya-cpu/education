#!/usr/bin/env node
// Grant a role to an existing account by email. Use it to bootstrap the first
// administrator after they have registered:
//
//   node scripts/set-role.mjs president@unzanasa.org ADMIN
//
// Works against PostgreSQL when DATABASE_URL is set, otherwise against the
// local JSON file store (.data/db.json). The account must already exist.

import { promises as fs } from "node:fs";
import path from "node:path";

const [, , emailArg, roleArg = "ADMIN"] = process.argv;
const email = (emailArg ?? "").trim().toLowerCase();
const role = roleArg.toUpperCase();

if (!email || !["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
  console.error("Usage: node scripts/set-role.mjs <email> [STUDENT|TEACHER|ADMIN]");
  process.exit(2);
}

async function viaPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) { console.error(`No account found for ${email}. Ask them to register first.`); process.exit(1); }
    await db.user.update({ where: { email }, data: { role } });
    console.log(`✓ ${email} is now ${role} (PostgreSQL).`);
  } finally {
    await db.$disconnect();
  }
}

async function viaFileStore() {
  const dir = process.env.COGNIFY_DATA_DIR || path.join(process.cwd(), ".data");
  const file = path.join(dir, "db.json");
  let db;
  try { db = JSON.parse(await fs.readFile(file, "utf8")); }
  catch { console.error(`No file store at ${file}. Has anyone registered yet?`); process.exit(1); }
  const user = (db.users ?? []).find((u) => u.email === email);
  if (!user) { console.error(`No account found for ${email}.`); process.exit(1); }
  user.role = role;
  await fs.writeFile(file, JSON.stringify(db), "utf8");
  console.log(`✓ ${email} is now ${role} (file store).`);
}

try {
  await (process.env.DATABASE_URL ? viaPrisma() : viaFileStore());
} catch (e) {
  console.error("Failed to set role:", e.message);
  process.exit(1);
}
