# Cognify Roadmap

Where the product is today, and the path to a full production SaaS.

## ✅ Shipped (v1.0 — current branch)

- Complete interactive web app: dashboard, courses, notes, flashcards, FSRS
  review, quizzes, exams, AI tutor, planner, analytics, achievements, settings
- PDF learning (real server-side extraction), mind maps, onboarding, social,
  admin console, PWA offline (service worker + offline page)
- FSRS-4.5 scheduler, gamification engine, AI provider router + offline engine
- Prisma schema, API contract, Docker/compose, GitHub Actions CI, 62 unit tests

The app is client-persisted (localStorage) with the full backend designed but
not yet live. Everything below builds on that foundation.

---

## Phase 1 — Real backend (the unlock for everything else)

**Goal: multi-device accounts with server-side truth.** ~2–3 weeks solo pace.

| # | Work | Notes |
|---|------|-------|
| 1.1 | Provision Postgres, run `prisma migrate`, generate client | compose stack already defines it |
| 1.2 | Implement REST routes from `docs/API.md` (subjects, notes, decks, cards, review, quizzes, planner, threads) | reuse the exact reducer action shapes; FSRS runs server-side in `POST /cards/:id/review` |
| 1.3 | Auth.js: credentials + Google/GitHub OAuth, session middleware on `/app/*` | adapter models already in schema |
| 1.4 | Client sync layer: store dispatch → optimistic update → API call → reconcile | keep localStorage as offline cache, not truth |
| 1.5 | First-login import: offer to upload existing local data | the Settings export format is already the wire format |
| 1.6 | Redis rate limiting on AI + auth routes | sliding window per user+IP |
| 1.7 | Integration tests against a test database | extend vitest with a `docker compose` test target |

**Exit criteria:** log in on two devices, review a card on one, see the new due
date on the other.

## Phase 2 — Accounts, billing, lifecycle

**Goal: charge money safely.** ~1–2 weeks.

- Stripe Checkout + customer portal + webhook handler (`Subscription` model is ready)
- Plan gating: AI call metering by plan (Free = offline engine + N live calls/day)
- Transactional email (magic links, password reset, review reminders) — Resend or SMTP
- TOTP two-factor; "remember this device"
- GDPR endpoints: `GET /me/export`, account deletion cascade (schema already cascades)

## Phase 3 — AI depth

**Goal: from heuristic engine to genuinely smart, grounded tutoring.** ~2–3 weeks.

- **Structured LLM generation**: when a provider key exists, use tool-calling /
  JSON mode for flashcards, quizzes and mind maps; offline engine stays as the
  zero-config fallback and the schema validator for LLM output
- **RAG over user material**: chunk + embed notes/PDFs (pgvector or Meilisearch
  hybrid), retrieve into tutor context, cite sources in replies
- **Conversation memory**: rolling thread summarisation so long chats stay cheap
- **OCR queue** for scanned PDFs (Tesseract worker via BullMQ) — closes the one
  PDF gap we error on today
- **Voice**: Web Speech API for voice questions; TTS read-aloud on flashcards
- **Per-user FSRS optimisation**: nightly job re-fits weights from `ReviewLog`

## Phase 4 — Social & collaboration, for real

**Goal: the network-effect features.** ~3–4 weeks.

- WebSocket layer (or Pusher/Ably) for group chat and presence
- Shared deck library: publish, browse, fork community decks
- Classrooms: teacher creates class via join code, assigns decks/quizzes,
  sees per-student mastery dashboards (`Classroom` model is ready)
- Collaborative notes (Yjs CRDT on the existing markdown editor)
- Peer review / discussion threads on shared content

## Phase 5 — Mobile & polish

- Background-sync PWA (queue mutations offline, replay on reconnect) — or an
  Expo/React Native app reusing `src/lib` wholesale (it's framework-free)
- Web push notifications for review reminders and streak saves
- Lighthouse CI budget in GitHub Actions (target ≥95)
- axe-core accessibility audit pass; keyboard traps + screen-reader labels
- i18n scaffold (next-intl) — the UI copy is already centralised enough

## Phase 6 — Scale & operations

- Wire Sentry + PostHog (env keys already scaffolded)
- Staging environment + seeded demo tenant
- PgBouncer / connection pooling; read replica for analytics queries
- Load testing (k6) on the review hot path
- Automated encrypted DB backups with restore drills
- Admin console wired to real `/api/admin/*` data

---

## Quick wins (any time, < half a day each)

- Deck import/export in Anki `.txt`/CSV format
- Cloze cards with multiple deletions (`c1`/`c2` — parser already tolerates it)
- Confetti on streak milestones; streak-freeze item in the coin shop
- Keyboard shortcut cheatsheet modal (`?` key)
- `robots.txt` + `sitemap.xml` + OG image for the landing page
- Duplicate-card detection when generating from overlapping material

## Suggested order

**1 → 2 → 3**, then 4 and 5 in parallel, 6 continuously. Phase 1 is the
dependency for everything: billing needs accounts, real social needs identity,
mobile sync needs a server. If you want revenue fastest, 1 + 2 is the minimum
path; if you want product wow, do 3 immediately after 1.
