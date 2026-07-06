#!/usr/bin/env node
// Validate the runtime environment before a deploy. Prints a report and exits
// non-zero on production errors so a broken config can't ship. Safe to run in
// any environment: in development it only prints informational notes.
//
//   node scripts/preflight.mjs
//
// The check logic lives in src/server/env.ts and is unit-tested; this script
// inlines the same rules so it runs with plain node (no build step).

const env = process.env;
const production = env.NODE_ENV === "production";
const has = (k) => Boolean(env[k] && String(env[k]).trim());
const errors = [], warnings = [], info = [];

if (!has("AUTH_SECRET")) {
  if (production && env.COGNIFY_ALLOW_DEV_SECRET !== "1")
    errors.push("AUTH_SECRET: must be set in production — `openssl rand -base64 32`.");
  else if (!production) info.push("AUTH_SECRET not set — using the insecure dev secret (local only).");
} else if (String(env.AUTH_SECRET).length < 16) {
  warnings.push("AUTH_SECRET: shorter than 16 characters — use at least 32 bytes of entropy.");
}

if (has("DATABASE_URL")) {
  if (production && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL))
    errors.push("DATABASE_URL: must be a postgresql:// connection string.");
  else info.push("DATABASE_URL set — using PostgreSQL (Prisma).");
} else {
  warnings.push("DATABASE_URL: not set — falling back to the JSON file store (.data/), not durable for production.");
}

if (!has("NEXT_PUBLIC_APP_URL")) {
  if (production) warnings.push("NEXT_PUBLIC_APP_URL: not set — email links default to http://localhost:3000.");
} else if (production && !/^https:\/\//.test(env.NEXT_PUBLIC_APP_URL)) {
  warnings.push("NEXT_PUBLIC_APP_URL: should use https:// in production.");
}

if (!has("RESEND_API_KEY"))
  warnings.push("RESEND_API_KEY: not set — reset/verify mail goes to the .data/outbox instead of being delivered.");

const aiKeys = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "DEEPSEEK_API_KEY", "MISTRAL_API_KEY"];
info.push(aiKeys.some(has) ? "AI provider configured — live tutor." : "No AI key — tutor uses the offline engine.");

console.log(`\nUNZANASA Hub preflight — ${production ? "production" : "development"}\n`);
for (const e of errors) console.log(`  \x1b[31m✗\x1b[0m ${e}`);
for (const w of warnings) console.log(`  \x1b[33m⚠\x1b[0m ${w}`);
for (const i of info) console.log(`  \x1b[2m·\x1b[0m ${i}`);
console.log("");

if (errors.length) {
  console.error(`Preflight FAILED — ${errors.length} error(s). Fix the above before deploying.\n`);
  process.exit(1);
}
console.log("Preflight OK.\n");
