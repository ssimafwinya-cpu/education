# API Reference

Two categories of endpoint:

1. **Implemented now** — the AI routes that power the running web app.
2. **Backend contract** — the full REST surface the Prisma-backed service
   exposes in production. These mirror the client store's action set, so the
   frontend swaps `localStorage` for `fetch` with no shape changes.

All request/response bodies are JSON unless noted. Authenticated routes expect a
session cookie (Auth.js) or `Authorization: Bearer <jwt>`.

---

## 1. Implemented endpoints

### `POST /api/ai/chat` — streaming tutor

Streams a tutor reply as `text/plain` chunks (token-by-token).

**Request**
```jsonc
{
  "messages": [
    { "role": "user", "content": "Explain mitosis like I'm 12" }
  ],
  "context": {
    "studentName": "Alex",
    "subjects": ["Biology", "Calculus"],
    "material": "…concatenated notes & cards the tutor may reference…"
  }
}
```

**Response** — a streamed body. Header `x-ai-provider` reports which engine
answered (`anthropic` | `openai` | `google` | `mistral` | `deepseek` |
`offline`). If a live provider fails mid-stream, the route degrades gracefully
to the offline engine.

```bash
curl -N -X POST http://localhost:3000/api/ai/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"quiz me on the cell"}]}'
```

### `POST /api/ai/generate` — structured content

Returns structured flashcards, quiz questions or a summary. Always works
(deterministic offline engine).

**Request**
```jsonc
{ "kind": "flashcards", "text": "…study material…", "count": 8 }
// kind: "flashcards" | "quiz" | "summary"
```

**Responses**
```jsonc
// flashcards
{ "cards": [ { "kind": "basic", "front": "…", "back": "…" }, … ] }
// quiz
{ "questions": [ { "kind": "mcq", "prompt": "…", "options": ["…"], "answerIndex": 1, "explanation": "…" }, … ] }
// summary
{ "points": [ "…", "…" ] }
```

Errors: `400` invalid JSON/kind, `422` not enough text (< 20 chars).

### `GET /api/health` — probe

```json
{ "status": "ok", "service": "cognify", "version": "1.0.0", "aiProvider": "offline", "timestamp": "…" }
```

### Auth — `POST /api/auth/register` · `login` · `logout` · `GET /api/auth/me`

Real credentials auth: bcrypt(12) password hashing, HS256 JWT in an httpOnly
`SameSite=Lax` cookie (30-day session), per-IP rate limiting (5 register/min,
10 login/min). Storage driver: PostgreSQL via Prisma when `DATABASE_URL` is
set, zero-config JSON file store otherwise.

```jsonc
// POST /api/auth/register  { email, password (≥8), name? }
// 201 → { "user": { "id", "email", "name", "avatar", "role" } }  + session cookie
// 409 email taken · 422 validation · 429 rate limited

// POST /api/auth/login     { email, password }
// 200 → { "user": … } + session cookie · 401 bad credentials (constant-shaped)

// GET /api/auth/me         → 200 { "user": … } | 200 { "user": null } (guest)
// POST /api/auth/logout    → clears the cookie
```

### `GET | PUT /api/sync` — cross-device state sync

Whole-`AppState` snapshot per user with **optimistic concurrency**. The client
pulls on login, then debounce-pushes changes; a `409` means another device
wrote first — the client pulls and adopts the server state.

```jsonc
// GET → { "data": AppState | null, "version": n, "updatedAt": ms }
// PUT { "data": AppState, "version": lastSeenVersion }   (version 0 = first write)
//   200 → { "version": n+1 }
//   409 → { "error": "Version conflict", "version": current }   // pull first
// 401 unauthenticated · 413 > 4 MB · 429 > 30 writes/min
```

---

## 2. Backend REST contract

Standard conventions: `GET` list/read, `POST` create, `PATCH` update, `DELETE`
remove. List endpoints support `?cursor=`, `?limit=`, `?q=` (search) and
`?subjectId=` filters. All scoped to the authenticated user.

### Auth (`/api/auth/*` — Auth.js)
| Method | Path | Purpose |
| --- | --- | --- |
| `GET/POST` | `/api/auth/[...nextauth]` | OAuth (Google, Apple, Microsoft, GitHub), credentials, magic-link, session |
| `POST` | `/api/auth/2fa/enable` · `/verify` | TOTP two-factor |
| `POST` | `/api/auth/password/forgot` · `/reset` | Password reset |

### Subjects
```
GET    /api/subjects
POST   /api/subjects              { name, emoji, color, goal?, examDate? }
PATCH  /api/subjects/:id          { …partial }
DELETE /api/subjects/:id          (cascades decks, cards, notes, quizzes)
```

### Notes
```
GET    /api/notes                 ?subjectId= &q=
POST   /api/notes                 { title, content, subjectId?, tags? }
PATCH  /api/notes/:id             { title?, content?, pinned? }  (snapshots version)
DELETE /api/notes/:id
GET    /api/notes/:id/versions
```

### Decks & cards
```
GET    /api/decks                 ?subjectId=
POST   /api/decks                 { name, emoji, subjectId?, description? }
DELETE /api/decks/:id
GET    /api/cards                 ?deckId= &due=true
POST   /api/cards                 { deckId, kind, front, back, options?, answerIndex? }
POST   /api/cards/bulk            { deckId, cards: [...] }        # AI generation
PATCH  /api/cards/:id
DELETE /api/cards/:id
POST   /api/cards/:id/review      { rating: 1|2|3|4 }            # runs FSRS server-side
GET    /api/reviews/forecast      ?days=14
```

`POST /api/cards/:id/review` is the hot path. The server runs the same
`reviewCard()` FSRS function, writes a `ReviewLog`, updates the card, logs
`DailyActivity`, awards XP and returns the new schedule + any unlocked
achievements.

### Quizzes & attempts
```
GET    /api/quizzes               ?subjectId=
POST   /api/quizzes               { title, questions, subjectId?, timeLimitMinutes? }
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/attempts  { mode, answers }              # returns score + review
GET    /api/quizzes/:id/attempts
```

### Planner
```
GET    /api/planner               ?from= &to=
POST   /api/planner/generate      { days, minutesPerDay, subjectIds, includeWeekends }
POST   /api/planner               { date, title, kind, durationMin, subjectId? }
PATCH  /api/planner/:id           { done }
DELETE /api/planner/:id
```

### Tutor threads
```
GET    /api/threads
POST   /api/threads               { title, subjectId? }
DELETE /api/threads/:id
POST   /api/threads/:id/messages  { content }                    # streams reply (see /api/ai/chat)
```

### Gamification & analytics
```
GET    /api/me/gamification       { xp, level, coins, streak, achievements }
GET    /api/me/activity           ?days=30
GET    /api/me/analytics          { retention, accuracy, masteryBySubject, forecast, … }
```

### Uploads & AI extraction
```
POST   /api/uploads               (multipart)  → { key, url }
POST   /api/ai/pdf                 { key }      → extracts text → flashcards/quiz/summary
```

### Billing (Stripe)
```
POST   /api/billing/checkout      { plan }      → Stripe Checkout session
POST   /api/billing/portal                       → customer portal URL
POST   /api/webhooks/stripe                      → subscription lifecycle
```

### Admin (role: ADMIN)
```
GET    /api/admin/users           ?q= &plan=
PATCH  /api/admin/users/:id       { role, plan, verified }
GET    /api/admin/institutions
GET    /api/admin/audit           ?action= &userId=
GET    /api/admin/metrics
```

## Errors

```jsonc
{ "error": { "code": "VALIDATION", "message": "…", "fields": { "email": "invalid" } } }
```

`400` validation · `401` unauthenticated · `403` forbidden · `404` not found ·
`409` conflict · `422` unprocessable · `429` rate-limited · `500` server error.

## Rate limits

Sliding-window (Redis) per user + IP. AI endpoints are metered by plan (Free /
Premium / Institution). See [SECURITY.md](SECURITY.md).
