// ─── Environment validation ──────────────────────────────────────────────────
// Pure checks over an environment map, used by the preflight script and unit
// tests. Errors block a production deploy; warnings flag reduced functionality
// (e.g. the file store instead of a database). Nothing here reads process.env
// directly, so it is fully testable.

export interface EnvIssue {
  key: string;
  message: string;
}

export interface EnvReport {
  ok: boolean;
  production: boolean;
  errors: EnvIssue[];
  warnings: EnvIssue[];
  info: string[];
}

type Env = Record<string, string | undefined>;

const has = (env: Env, key: string) => Boolean(env[key] && env[key]!.trim());

const AI_KEYS = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "DEEPSEEK_API_KEY", "MISTRAL_API_KEY"];

export function checkEnv(env: Env): EnvReport {
  const production = env.NODE_ENV === "production";
  const errors: EnvIssue[] = [];
  const warnings: EnvIssue[] = [];
  const info: string[] = [];

  // AUTH_SECRET — mandatory in production (unless explicitly overridden for a
  // throwaway environment). Sessions are signed with it.
  if (!has(env, "AUTH_SECRET")) {
    if (production && env.COGNIFY_ALLOW_DEV_SECRET !== "1") {
      errors.push({ key: "AUTH_SECRET", message: "must be set in production — generate one with `openssl rand -base64 32`." });
    } else if (!production) {
      info.push("AUTH_SECRET not set — using the insecure dev secret (fine for local only).");
    }
  } else if (env.AUTH_SECRET!.length < 16) {
    warnings.push({ key: "AUTH_SECRET", message: "is shorter than 16 characters — use at least 32 bytes of entropy." });
  }

  // Data store.
  if (has(env, "DATABASE_URL")) {
    if (production && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL!)) {
      errors.push({ key: "DATABASE_URL", message: "must be a postgresql:// connection string." });
    }
    info.push("DATABASE_URL set — accounts and cloud sync use PostgreSQL (Prisma).");
  } else {
    warnings.push({ key: "DATABASE_URL", message: "not set — falling back to the JSON file store (.data/), which is not durable for production." });
  }

  // Public URL — used to build absolute links in password-reset / verify emails.
  if (!has(env, "NEXT_PUBLIC_APP_URL")) {
    if (production) warnings.push({ key: "NEXT_PUBLIC_APP_URL", message: "not set — email links will default to http://localhost:3000." });
  } else if (production && !/^https:\/\//.test(env.NEXT_PUBLIC_APP_URL!)) {
    warnings.push({ key: "NEXT_PUBLIC_APP_URL", message: "should use https:// in production so cookies and email links are secure." });
  }

  // Transactional mail.
  if (!has(env, "RESEND_API_KEY")) {
    warnings.push({ key: "RESEND_API_KEY", message: "not set — password-reset and verification mail goes to the .data/outbox instead of being delivered." });
  } else if (!has(env, "MAIL_FROM")) {
    info.push("MAIL_FROM not set — using the default sender address.");
  }

  // AI tutor.
  if (!AI_KEYS.some((k) => has(env, k))) {
    info.push("No AI provider key set — the tutor runs on the built-in offline engine.");
  } else {
    info.push("AI provider configured — the tutor uses the live model.");
  }

  return { ok: errors.length === 0, production, errors, warnings, info };
}

/** Render a report as human-readable lines for the preflight console output. */
export function formatReport(r: EnvReport): string {
  const lines: string[] = [];
  lines.push(`Environment: ${r.production ? "production" : "development"}`);
  for (const e of r.errors) lines.push(`  ✗ ${e.key}: ${e.message}`);
  for (const w of r.warnings) lines.push(`  ⚠ ${w.key}: ${w.message}`);
  for (const i of r.info) lines.push(`  · ${i}`);
  lines.push(r.ok ? "Preflight OK." : `Preflight FAILED — ${r.errors.length} error(s).`);
  return lines.join("\n");
}
