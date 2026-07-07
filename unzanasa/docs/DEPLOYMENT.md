# Deploying the UNZANASA Academic Hub

This guide takes the app from the repo to a live, secure deployment. It works
with **zero external services** (guest mode + file store) and scales up to a
full setup with PostgreSQL, real email and a live AI tutor as you add keys.

- **Node**: 20+ (the Docker image uses Node 22)
- **Package manager**: npm
- **Verify before shipping**: `npm run preflight`

---

## 1. Environment variables

Copy `.env.example` and fill in what you need. The app degrades gracefully —
nothing here is required to _run_, but production needs a few things to be
secure and durable.

| Variable | When | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | **required in prod** | Signs session cookies (JWT). `openssl rand -base64 32`. |
| `DATABASE_URL` | recommended | PostgreSQL for accounts + cloud sync. Unset → JSON file store (`.data/`, not durable). |
| `NEXT_PUBLIC_APP_URL` | recommended | Base URL for links in verification / reset emails. Use `https://…`. |
| `RESEND_API_KEY` | recommended | Delivers reset/verify email. Unset → mail written to `.data/outbox/`. |
| `MAIL_FROM` | optional | Sender address for outbound mail. |
| `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`) | optional | Live AI tutor. None set → offline engine. |
| `AI_DEFAULT_PROVIDER` | optional | Preferred provider when several keys are present. |

Validate any environment before deploying:

```bash
NODE_ENV=production AUTH_SECRET=… DATABASE_URL=… npm run preflight
```

The preflight **fails the deploy** (exit 1) on production errors — a missing
`AUTH_SECRET`, or a non-`postgresql://` `DATABASE_URL` — and prints warnings for
reduced-functionality setups (no database, `http` app URL, no mail key).

---

## 2. Database (PostgreSQL)

Any managed Postgres works — [Neon](https://neon.tech),
[Supabase](https://supabase.com), Railway, or a self-hosted instance.

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/unzanasa?schema=public"
npm run db:generate        # generate the Prisma client
npx prisma migrate deploy  # apply migrations (use migrate deploy in prod)
# or, for a fresh database without migration history:
npm run db:push            # sync the schema (creates the SiteContent table too)
```

Without `DATABASE_URL`, the app uses a JSON file store under `.data/`. That is
perfect for a demo but should not back a real deployment (no concurrency
guarantees, single-node only).

---

## 3. Build & run

### Option A — Node host (VPS, Render, Railway, Fly)

```bash
npm ci
npm run build
NODE_ENV=production \
AUTH_SECRET=… DATABASE_URL=… NEXT_PUBLIC_APP_URL=https://hub.unzanasa.org \
npm run start          # serves on :3000 (override with PORT)
```

Put Nginx/Caddy in front for TLS, or let the platform terminate HTTPS. Cookies
are automatically marked `Secure` when `NODE_ENV=production`.

### Option B — Docker

```bash
docker build -t unzanasa-hub .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AUTH_SECRET=… \
  -e DATABASE_URL=… \
  -e NEXT_PUBLIC_APP_URL=https://hub.unzanasa.org \
  -e RESEND_API_KEY=… \
  unzanasa-hub
```

### Option C — Vercel

Import the repo, add the environment variables in the project settings, and
deploy. Use a managed Postgres (Neon/Supabase) for `DATABASE_URL`; the file
store does not persist on serverless.

---

## 4. First administrator

The admin console (`/hub/admin`) — user management, moderation and the
**Academic Hub catalogue editor** — is gated on the account's role. To create
the first admin:

1. Have the person **register** normally at `/login`.
2. Promote their account:
   ```bash
   npm run set-role -- president@unzanasa.org ADMIN
   ```
   This updates PostgreSQL when `DATABASE_URL` is set, otherwise the file store.
3. They log out and back in — their role is read from the server on sign-in, so
   the admin tabs appear.

Roles: `STUDENT` (default), `TEACHER`, `ADMIN`.

> In guest mode (no account) the role can be switched under Settings → Role for
> previewing; that is a local demo toggle only. Signed-in accounts always take
> their role from the server.

### Shared (admin-managed) content

The programme catalogue, events, announcements, past papers and the executive
committee are **association-wide**, served from `GET /api/content` and edited
by admins in the Admin console. A signed-in admin's edits are written to
`PUT /api/content` (admin-only) and stored in the `SiteContent` table (or the
file store) as a single shared record, so every member and guest sees the same
content. Guests/demo-admins can preview edits locally but cannot write globally.
Until an admin saves anything, the built-in defaults are served.

---

## 5. Email

Password reset and email verification use [Resend](https://resend.com):

1. Create a Resend account, verify your sending domain, and create an API key.
2. Set `RESEND_API_KEY` and `MAIL_FROM` (e.g. `UNZANASA Hub <no-reply@unzanasa.org>`).

Without a key, all mail is written to `.data/outbox/*.json` and, in
development, the reset/verify links are returned in the API response so the
flows are fully testable offline.

---

## 6. Health checks

`GET /api/health` returns liveness + readiness:

```json
{ "status": "ok", "service": "unzanasa-hub", "store": "prisma", "db": "ok", "aiProvider": "…" }
```

It returns **503** if the database is configured but unreachable — wire it into
your platform's health probe or an uptime monitor.

---

## 7. Security checklist

- [ ] `AUTH_SECRET` is a fresh 32-byte secret, not the placeholder.
- [ ] `DATABASE_URL` points at managed Postgres with backups enabled.
- [ ] `NEXT_PUBLIC_APP_URL` uses `https://` and matches the real domain.
- [ ] TLS terminates in front of the app (platform or reverse proxy).
- [ ] `npm run preflight` passes with `NODE_ENV=production`.
- [ ] The first admin is created via `set-role`, and the demo role toggle is
      understood to be preview-only for signed-in users.
- [ ] Rate limits are in place on auth endpoints (built in) — consider an edge
      rate limiter (Cloudflare) in front for extra protection.
