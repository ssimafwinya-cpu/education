#!/usr/bin/env node
// End-to-end test runner. Boots the production server against a throwaway
// data directory, waits for /api/health, then runs every e2e/*.test.mjs in
// sequence with BASE_URL / DATA_DIR in the environment. Exits non-zero if any
// test fails. Requires a production build (`npm run build`) first.
//
//   npm run build && npm run test:e2e

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const PORT = Number(process.env.E2E_PORT ?? 3399);
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "unzanasa-e2e-"));

const env = {
  ...process.env,
  PORT: String(PORT),
  COGNIFY_DATA_DIR: DATA_DIR,
  AUTH_SECRET: "e2e-only-secret-0123456789abcdef0123456789",
  NEXT_PUBLIC_APP_URL: BASE,
  NODE_ENV: "production",
};

console.log(`\ne2e: starting server on :${PORT} (data: ${DATA_DIR})`);
const server = spawn("npm", ["run", "start"], { env, stdio: ["ignore", "pipe", "pipe"], detached: true });
let serverLog = "";
server.stdout.on("data", (d) => { serverLog += d; });
server.stderr.on("data", (d) => { serverLog += d; });

const stop = async () => {
  try { process.kill(-server.pid, "SIGTERM"); } catch { /* already gone */ }
  await fs.rm(DATA_DIR, { recursive: true, force: true }).catch(() => {});
};

// Wait for readiness.
let up = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`${BASE}/api/health`);
    if (r.ok) { up = true; break; }
  } catch { /* not yet */ }
  await new Promise((r) => setTimeout(r, 1000));
}
if (!up) {
  console.error("e2e: server did not become healthy. Last output:\n" + serverLog.slice(-2000));
  await stop();
  process.exit(1);
}

// Run each test file in-process, sequentially.
const dir = path.dirname(new URL(import.meta.url).pathname);
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).sort();
let failures = 0;
for (const f of files) {
  console.log(`\n── ${f} ──`);
  process.env.BASE_URL = BASE;
  process.env.DATA_DIR = DATA_DIR;
  try {
    const mod = await import(path.join(dir, f) + `?t=${Date.now()}`);
    const result = await mod.run({ base: BASE, dataDir: DATA_DIR });
    if (!result.ok) failures++;
    console.log(`   ${result.pass}/${result.pass + result.fail} pass`);
  } catch (e) {
    failures++;
    console.error(`   CRASHED: ${e.message}`);
  }
}

await stop();
if (failures) {
  console.error(`\ne2e: ${failures} suite(s) failed.`);
  process.exit(1);
}
console.log("\ne2e: all suites passed.");
