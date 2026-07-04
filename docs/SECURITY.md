# Security

Cognify is designed to handle student data safely at scale. This document
covers the security model for the production deployment.

## Authentication

- **Auth.js (NextAuth)** with the Prisma adapter (`Account`, `Session`,
  `VerificationToken` models are in the schema).
- **Providers**: Email/password (credentials), Google, Apple, Microsoft, GitHub,
  and passwordless **magic links**.
- **Passwords** hashed with **bcrypt/argon2** (never stored in plaintext;
  `passwordHash` is nullable for OAuth-only accounts).
- **Two-factor auth (TOTP)** — `twoFactorEnabled` / `twoFactorSecret` on `User`;
  enforced at the credentials callback.
- **Sessions** — httpOnly, `Secure`, `SameSite=Lax` cookies; short-lived access
  + rotating refresh. "Remember this device" stores a hashed device token.
- **Student / institution verification** — email-domain matching against
  `Institution.domain`, plus manual verification flags.

## Authorization

- Role-based (`STUDENT` / `TEACHER` / `ADMIN`) checks in middleware and per
  route handler.
- **Row-level ownership**: every query is scoped by `userId`. Admin/teacher
  access to other users' data is explicit and audit-logged.
- Institution/classroom scoping for teacher dashboards.

## Transport & headers

Security headers are set in `next.config.mjs`:

- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` locking down camera/mic/geolocation
- Add a strict `Content-Security-Policy` at the edge/CDN in production.
- HTTPS everywhere (HSTS via the platform/CDN).

## Input validation & injection

- **Validation** — all API inputs validated (e.g. Zod) at the boundary; reject
  unknown fields.
- **SQL injection** — Prisma parameterises every query; no string-built SQL.
- **XSS** — user Markdown is rendered by a **custom React renderer**
  (`components/markdown.tsx`) that emits React nodes only. There is **no
  `dangerouslySetInnerHTML`** on user content anywhere in the app; the sole use
  is the pre-paint theme script, which contains no user data.
- **CSRF** — Auth.js CSRF tokens on state-changing auth routes; API mutations
  require the session cookie + `SameSite` protection.

## Rate limiting & abuse

- Sliding-window limiter (Redis) keyed by `userId + IP`.
- AI endpoints metered by plan (Free/Premium/Institution) to control cost and
  prevent abuse.
- Upload size/type limits; server-side MIME sniffing before storage.

## AI-specific safety

- API keys live **only** on the server (never shipped to the client). The router
  reads them from environment variables.
- The offline engine means the product never *has* to call an external LLM.
- User material sent to a provider is truncated and scoped; prompts are
  constructed server-side. Consider a PII-redaction pass before egress for
  regulated deployments.

## Data protection & privacy (GDPR)

- **Encryption at rest** (database/volume level) and in transit (TLS).
- **Right to access / export** — `GET /api/me/export` (and the in-app Settings →
  Export produces a full JSON backup today).
- **Right to erasure** — cascading deletes on `User` remove all owned rows;
  Settings → *Erase all data* clears local state immediately.
- **Audit log** (`AuditLog`) records auth events, admin actions and sensitive
  operations with IP + user-agent for forensics and compliance.
- **Data minimisation** — only what's needed for learning is stored.
- **Backups** — automated encrypted PostgreSQL snapshots with tested restores.

## Secrets & configuration

- All secrets via environment variables (`.env` is git-ignored;
  `.env.example` documents every key).
- Rotate `AUTH_SECRET` and provider keys on a schedule.
- Use a managed secret store (AWS Secrets Manager / Doppler / Vault) in prod.

## Monitoring

- **Sentry** for error tracking; alert on auth-failure spikes and 5xx rates.
- Structured request logs (no secrets/PII in logs).
- Health probe at `/api/health`.

## Responsible disclosure

Security issues → `security@cognify.app` (set up a real inbox + policy before
launch). Acknowledge within 48h; coordinated disclosure.
