# End-to-end tests

Black-box tests that exercise the real production server over HTTP — auth +
email flows, the global content API, and PDF uploads. No browser required;
everything runs with Node's built-in `fetch`.

```bash
npm run build      # the runner boots the built app
npm run test:e2e
```

The runner (`run.mjs`) starts `npm run start` on port 3399 against a throwaway
data directory (file store + mail outbox), waits for `/api/health`, then runs
every `*.test.mjs` in sequence and exits non-zero on any failure.

| Suite | Proves |
| --- | --- |
| `auth-mail` | register → verify (outbox link, single-use) → forgot → reset → old password dead, new one verified |
| `content` | defaults at version 0 · guest/student PUT rejected · admin edit becomes visible to everyone · defaults merged |
| `files` | guest 401 / student 403 · admin PDF upload · magic-byte rejection · public streaming GET · traversal 404 |

Each suite exports `run({ base, dataDir })` and returns `{ ok, pass, fail }` —
add new suites by dropping another `*.test.mjs` beside these.
