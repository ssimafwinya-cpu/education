# Spaced Repetition (FSRS)

Cognify schedules flashcard reviews with **FSRS-4.5** (Free Spaced Repetition
Scheduler), the same modern algorithm used by Anki's FSRS mode. It is
implemented from scratch in [`src/lib/fsrs.ts`](../src/lib/fsrs.ts) as pure,
unit-tested functions — no external dependency.

## The memory model

Each card carries two latent memory variables:

| Variable | Meaning |
| --- | --- |
| **Stability `S`** | Number of days for recall probability to fall from 100% → 90%. Grows with successful reviews. |
| **Difficulty `D`** | 1 (easy) … 10 (hard). How slowly stability grows for this card. |

**Retrievability** — the probability you still remember a card `t` days after
the last review:

```
R(t, S) = (1 + FACTOR · t / S) ^ DECAY      with DECAY = -0.5, FACTOR = 19/81
```

`FACTOR` is chosen so that `R(S, S) = 0.9` — i.e. when `t` equals stability,
recall is exactly 90%.

## Ratings

After seeing the answer the student rates recall:

| Rating | Meaning | Effect |
| --- | --- | --- |
| 1 · **Again** | Forgot | Card lapses → relearning, stability drops |
| 2 · **Hard** | Recalled with effort | Small stability gain |
| 3 · **Good** | Recalled | Normal stability gain |
| 4 · **Easy** | Instant | Large stability gain, longer interval |

The 17-parameter weight vector (`FSRS_WEIGHTS`) — trained on millions of real
Anki reviews — drives the stability/difficulty updates:

- **Initial stability** after the first rating: `w[rating-1]`.
- **Initial difficulty**: `w[4] − (rating−3)·w[5]`, clamped to `[1,10]`.
- **On success** stability grows by a factor that depends on `D`, current `S`,
  current retrievability `R`, plus a hard penalty (`w[15]`) and easy bonus
  (`w[16]`).
- **On lapse** stability is recomputed downward via `w[11..14]` (a lapse never
  increases stability).
- **Difficulty** mean-reverts toward the baseline so it can't drift to the
  extremes over many reviews.

## Scheduling

- **New / learning / relearning** cards use short **step** intervals
  (`1m → 10m`, and `10m` for relearning) so they're reinforced within a session.
  `Again` resets to the first step; `Easy` graduates immediately.
- **Review** cards are scheduled at the interval where retrievability decays to
  the user's **desired retention** (default 90%, tunable 80–97% in Settings):

  ```
  interval = (S / FACTOR) · (requestedRetention ^ (1/DECAY) − 1)
  ```

  Higher desired retention → shorter intervals → more reviews but better recall.

## What the UI shows

- **Review page** previews the next interval under each rating button
  (`previewIntervals`), ordered Again ≤ Hard ≤ Good ≤ Easy.
- **Analytics** shows a 14-day **review forecast** (`reviewForecast`) and average
  retention (`currentRetention`) so you can see load ahead of time.
- **Card list** shows each card's state, current recall estimate and due date.

## Guarantees (tested)

The [test suite](../src/lib/fsrs.test.ts) verifies the properties that matter:

- `R(0,S)=1`, `R(S,S)≈0.9`, and monotonic decay with time.
- Intervals grow with stability and shrink with higher desired retention.
- Ratings order intervals Again ≤ Hard ≤ Good ≤ Easy.
- A lapse moves a review card to relearning, increments lapses and never raises
  stability.
- Learning steps are walked correctly; `Again` resets to step 0.
- A card answered "Good" repeatedly grows to a multi-week interval.

## Extending to FSRS-6 / optimisation

The weights are a single exported constant. In production you can:
- collect each user's `ReviewLog` history, and
- periodically re-optimise the weights per-user (or per-deck) with the standard
  FSRS optimiser, then store them on the deck/user and pass them into
  `reviewCard`. The scheduling functions already take weights implicitly via the
  module constant — swap it for a parameter to personalise.
