# Deployment

Cognify runs anywhere Next.js runs. The web app needs no backend to function
(client-persisted); the sections below cover both the zero-config path and the
full production stack.

## Option A — Vercel (recommended for the web app)

1. Import the repo into Vercel.
2. (Optional) add environment variables from `.env.example` — at minimum one AI
   provider key if you want live tutoring, plus `AUTH_SECRET` and `DATABASE_URL`
   for the authenticated backend.
3. Deploy. The App Router, streaming AI routes and standalone build work out of
   the box.

Build settings are default (`npm run build`). The app targets **Lighthouse 95+**
via code splitting, lazy motion, AVIF/WebP images and no render-blocking fonts.

## Option B — Docker / self-hosted

The image uses Next.js **standalone** output for a small runtime.

```bash
# Build & run just the app
docker build -t cognify .
docker run -p 3000:3000 --env-file .env cognify

# Or the full stack (app + Postgres + Redis + Meilisearch)
docker compose up --build
```

`docker-compose.yml` provisions:

| Service | Image | Purpose |
| --- | --- | --- |
| `app` | built from `Dockerfile` | Next.js server |
| `db` | `postgres:16-alpine` | primary datastore |
| `redis` | `redis:7-alpine` | sessions, rate limiting, queues |
| `meilisearch` | `getmeili/meilisearch` | semantic/typo-tolerant search |

Health checks are wired for `app` and `db`.

## Environment variables

See [`.env.example`](../.env.example) for the full, commented list. Groups:

- **App** — `NEXT_PUBLIC_APP_URL`
- **Database** — `DATABASE_URL` (PostgreSQL)
- **Redis** — `REDIS_URL`
- **Auth** — `AUTH_SECRET` + per-provider OAuth client id/secret
- **AI** — any of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`,
  `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`; `AI_DEFAULT_PROVIDER`
- **Storage** — S3/R2 endpoint, bucket, keys
- **Search** — Meilisearch host/key
- **Payments** — Stripe keys + webhook secret
- **Email** — SMTP settings
- **Monitoring** — `SENTRY_DSN`, PostHog keys

None are required to run the demo; the app degrades gracefully.

## Database

```bash
npm run db:generate     # prisma generate
npm run db:migrate      # prisma migrate dev (local)
npx prisma migrate deploy  # production migrations (in CI/CD or entrypoint)
```

The schema ([`prisma/schema.prisma`](../prisma/schema.prisma)) includes the
composite index `Card @@index([userId, due])` for the hot "cards due" query.

## CI/CD

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push/PR:

1. `npm ci`
2. `prisma generate`
3. `typecheck` → `lint` → `test` → `build`
4. Docker image build (on success)

Extend with a deploy job (Vercel action, or `docker push` + `migrate deploy` +
rolling restart) for your target.

## Scaling notes

- **Stateless app tier** — scale `app` horizontally behind a load balancer;
  all shared state is in Postgres/Redis.
- **Database** — connection pooling (PgBouncer / Prisma Data Proxy); read
  replicas for analytics-heavy reads.
- **Caching** — Redis for sessions, rate-limit counters and AI response cache
  (keyed by prompt hash). CDN caches static assets.
- **AI cost control** — per-plan rate limits; prefer cheaper providers for
  bulk generation via `AI_DEFAULT_PROVIDER`; cache summaries/flashcards.
- **Background work** — a queue (BullMQ on Redis) for PDF OCR/extraction,
  email, and nightly FSRS weight optimisation.
- **Search** — Meilisearch scales to millions of documents; reindex via queue.

## Monitoring & observability

- **Sentry** — errors & performance (`SENTRY_DSN`).
- **PostHog** — product analytics / funnels (`NEXT_PUBLIC_POSTHOG_KEY`).
- **Health** — `/api/health` for load-balancer and container probes.
- Alert on 5xx rate, auth-failure spikes, AI latency and queue depth.
