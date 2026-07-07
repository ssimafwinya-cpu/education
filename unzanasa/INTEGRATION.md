# UNZANASA Platform — Integration Notes

This directory (`unzanasa/`) is the **unified platform**: the UNZANASA student
association website and the AI Academic Hub merged into one Next.js app with a
single account, one theme, and consistent navigation. The original standalone
Academic Hub is preserved unchanged at the repository root.

## How the two systems were merged

| Concern | Before | After (this project) |
| --- | --- | --- |
| **Two sites** | UNZANASA (static HTML SPA) + Academic Hub (Next.js) | One Next.js app |
| **Public site** | `data-page` client SPA | `src/app/(public)/*` route group with the `PublicShell` (navy-green navbar, dropdowns, day/night toggle, footer) |
| **Academic Hub** | separate app at `/app` | native module at `/hub` (all internal links rewritten) |
| **Auth** | none / separate | one account across public site + hub (`lib/account.tsx`, `/api/auth/*`) — bcrypt + JWT cookies, plus **password reset and email verification** (single-use hashed tokens, 30 min/24 h expiry; Resend when `RESEND_API_KEY` is set, a `.data/outbox/` file transport with dev links otherwise; `/forgot-password`, `/reset-password`, `/verify-email`, resend banner in the hub) |
| **Theme** | UNZANASA palette | shared design tokens re-themed to the UNZANASA palette (forest green, teal, gold, crimson) — every Hub component adapts automatically |
| **Branding** | "Cognify" | "UNZANASA Academic Hub" throughout; UNZA + UNZANASA logos in `lib/brand-logos.ts` |

The Academics dropdown's "Academic Hub" link (present in the original site) now
routes straight into `/hub`, so the Hub feels like it was always part of the
platform.

## Natural Sciences specialization — Science Labs

A new `/hub/science` module provides discipline-specific tools. The
correctness-critical computation engines are pure and unit-tested
(`src/lib/science/`, 368 tests):

| Discipline | Route | Engine | Tools |
| --- | --- | --- | --- |
| **Chemistry** | `/hub/science/chemistry` | `chemistry.ts`, `smiles.ts`, `functional-groups.ts`, `molecule-layout.ts`, `descriptors.ts`, `iupac.ts`, `inorganic.ts`, `reactions.ts`, `titration.ts`, `periodic-table.ts` | **Organic:** a 2D molecule studio — a from-scratch **SMILES parser** → molecule graph → force-directed 2D depiction (skeletal SVG with single/double/triple/aromatic bonds), plus Hill formula, molar mass, degree of unsaturation, **functional-group recognition** (alcohol, aldehyde, ketone, acid, ester, ether, amine, amide, nitrile, halide, alkene/alkyne, phenol, aromatic ring — with precedence) and **molecular descriptors** (H-bond donors/acceptors, rotatable bonds — amide C–N excluded, ring count, heavy atoms) with a **Lipinski Rule of Five** drug-likeness check, all exact graph counts (no estimation). An **IUPAC namer** produces systematic names for acyclic C/H/N/O/halogen structures (alkanes/enes/ynes, alcohols, aldehydes, ketones, acids, primary amines; halo/alkyl/hydroxy/oxo/amino prefixes) with correct longest-chain selection, lowest-locant numbering and alphabetized prefixes — and refuses anything outside its subset with a clear reason rather than guessing a wrong name. A **click-to-draw molecule sketcher** (no SMILES needed: place atoms on a snapped grid, click two atoms to bond, cycle single/double/triple, element palette, erase/undo) feeds the same tested engines live — formula, molar mass, functional groups and IUPAC name update on every edit, with valence violations flagged honestly instead of silently mis-counting hydrogens. **Inorganic:** oxidation-state solver, ionic-compound builder/namer, electron configuration. **Reactions & Solutions:** a **titration simulator** (SVG pH-vs-volume curve for the four strong/weak monoprotic cases with equivalence point + indicator suggestion), **limiting-reagent & theoretical/percent-yield** analysis, **empirical/molecular formula** from percent composition, the **ideal-gas law** (solves for any variable), and **weak-acid pH** (exact quadratic). **General:** interactive 118-element periodic table, molar mass, **equation balancer** (nullspace over rationals), pH/acid–base, stoichiometry |
| **Physics** | `/hub/science/physics` | `physics.ts` | Projectile simulator (SVG trajectory), SUVAT kinematics solver, Ohm's law, unit converter, vector calculator, constants |
| **Mathematics** | `/hub/science/mathematics` | `mathematics.ts`, `expression.ts` | **Graphing calculator** (multi-function SVG plotter with asymptote gaps), **scientific calculator** (safe shunting-yard evaluator, `ans` chaining), quadratic solver, matrix calculator (det/inverse/multiply), statistics, numerical calculus |
| **Biology** | `/hub/science/biology` | `biology.ts` | DNA/RNA toolkit (complement, transcription, translation with the full codon table, GC content), Punnett squares, Hardy-Weinberg |
| **Lab Assistant** | `/hub/science/lab` | `lab-report.ts` | AI lab-report generator (**never fabricates data** — organises student observations, flags missing sections), solution-prep (C₁V₁=C₂V₂) |
| **Research Hub** | `/hub/science/research` | `citations.ts` | Citation generator in APA, Harvard, Vancouver, MLA & IEEE; DOI formatter |
| **Computer Science** | `/hub/science/cs` | `algorithms.ts` | Sandboxed **JavaScript playground** (Web Worker, console capture, 3s hard timeout), animated **sorting visualizer** (bubble/selection/insertion with comparison/swap counters), **binary-search visualizer**, Big-O reference |

Every tool computes real results (verified in-browser): glucose molar mass =
180.156 g/mol, `H2 + O2 → H2O` balances to `2,1,2`, kinematics gives v = 19.6
m/s, quadratic x²−3x+2 → roots 1,2, and so on.

## Routes

```
Public site (association):
  /  /about  /academics  /events  /sports  /welfare  /alumni  /contact  /portal
  /constitution            the full UNZANASA Constitution (structured from the
                           official PDF, which ships at
                           /documents/UNZANASA-Constitution.pdf); the About
                           page's Executive Committee & governance sections are
                           derived from Articles 3–18
  /events                  admin-managed events calendar + notice board
                           (lib/community.ts): the Admin console's "Events &
                           News" tab maintains events (title/date/location/
                           category/description) and announcements; the public
                           page and the hub dashboard read them live, and
                           members RSVP (stored per-account, synced).
  /about#executive         current Executive Committee (lib/committee.ts): the
                           Admin console's "Committee" tab records who holds
                           each Article 8 office; the About page shows the
                           holder (name + department) or the office's duty when
                           vacant. Members set their own computer number,
                           programme and year of study in hub Settings.
  /academics#courses       School of Natural Sciences academic structure
                           (lib/courses-catalogue.ts) modelled on how UNZA
                           actually works: a common first year (Biology
                           BIO 1400, Chemistry CHE 1000, Physics PHY 1010,
                           Mathematics MAT 1100) taken by every NS student and
                           by pass-through students bound for health / mines /
                           agriculture / vet / engineering, with health-stream
                           variants (CHE 1010, PHY 1015, medical maths); the 5
                           departments; and the 7 programmes, with Microbiology's
                           second-year courses detailed by contributing
                           department. The hub's starter content (lib/seed.ts)
                           seeds exactly the four common first-year courses.
                           The programmes list is admin-editable: the Admin
                           console's "Academic Hub" tab manages programmes and
                           their courses (SET_PROGRAMMES → state.catalogue),
                           and the public Academics page reads that store slice
                           live, so admins fill in each programme's courses
                           without a code change.

Academic Hub (native module, one account):
  /hub                     dashboard
  /hub/science             Science Labs hub
  /hub/science/{biology,chemistry,physics,mathematics,lab,research}
  /hub/past-papers         admin-curated past-paper bank (lib/past-papers.ts),
                           browsable by course/year/type; admins add & edit
                           papers inline (role-gated), students browse & open.
                           Admins can upload the actual PDF (POST /api/files,
                           admin-only, magic-byte validated, 15 MB cap; served
                           from GET /api/files/<id>) or paste an external link
  /hub/{courses,notes,pdf,mindmaps,flashcards,review,quizzes,exams,tutor,
        planner,analytics,achievements,social,admin,settings}

APIs: /api/auth/*  /api/sync  /api/content  /api/files  /api/ai/*  /api/health

Shared content: the programme catalogue, events, announcements, past papers and
the committee are association-wide. Admins edit them in the Admin console; a
signed-in admin's edits go to PUT /api/content (admin-only) and are stored once
(SiteContent), so every member and guest reads the same content from
GET /api/content. Personal data (notes, decks, RSVPs, profile) stays per-user
via /api/sync.
```

## Running it

Same as the base app — see the root `docs/SETUP.md`. From this directory:

```bash
npm install      # (or reuse the parent's node_modules)
npm run dev      # → http://localhost:3000
npm test         # 385 tests (incl. the science-engine suites)
npm run build    # production build
```

## Deploying it

See `docs/DEPLOYMENT.md` for the full guide. In short:

```bash
npm run preflight    # validate env (fails the deploy on prod errors)
npm run build && npm run start
npm run set-role -- president@unzanasa.org ADMIN   # bootstrap the first admin
```

The app runs with zero external services (guest mode + file store) and scales
up as you add `DATABASE_URL` (PostgreSQL), `RESEND_API_KEY` (email) and an AI
key. Signed-in accounts take their role (student/teacher/admin) from the
server, so `set-role` unlocks the admin console on next sign-in.
`GET /api/health` reports store + DB readiness for uptime probes.

Optional live AI (`.env` with a provider key) and Postgres-backed accounts
(`DATABASE_URL` + `AUTH_SECRET`) work exactly as documented for the base app.

## What was preserved

All Academic Hub functionality carries over unchanged: FSRS spaced repetition,
AI tutor (BM25-grounded), flashcards with Anki import/export, oral quizzes,
read-aloud/podcast, PDF highlight-to-flashcard, planner, analytics,
gamification, social, admin, cloud sync and offline PWA support.
