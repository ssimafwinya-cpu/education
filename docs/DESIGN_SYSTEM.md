# Design System

Cognify's UI aims to feel **premium, minimal and calm** — glassmorphism, soft
shadows, rounded corners, smooth motion, and a first-class dark mode.

## Theming

Colors are defined as raw `R G B` triplets on `:root` and `.dark`
(`src/app/globals.css`) so Tailwind's `<alpha-value>` modifier works
(`bg-surface/60`, `text-ink-muted`, …). Theme is applied by toggling the `.dark`
class on `<html>`; a tiny inline script in the root layout sets it **before
paint** to avoid a flash. `ThemeProvider` persists the choice and reacts to the
OS `prefers-color-scheme` when set to *system*.

### Semantic tokens

| Token | Role |
| --- | --- |
| `surface`, `surface-raised`, `surface-overlay` | backgrounds (page → card → popover) |
| `ink`, `ink-muted`, `ink-faint` | text hierarchy |
| `edge`, `edge-strong` | borders |
| `brand-*` (indigo) | primary brand ramp |
| `accent-*` (teal) | secondary accent |

Subject accents come from a fixed palette (`SUBJECT_COLORS` in `utils.ts`):
indigo, teal, rose, amber, sky, violet, emerald, orange.

## Type & spacing

- **Font**: system UI sans stack (no network fonts → faster LCP, no FOUT).
- **Radii**: `xl` 0.875rem, `2xl` 1.25rem, `3xl` 1.75rem — soft, friendly.
- **Shadows**: `soft` (resting), `lift` (hover/raised), `glow` (brand emphasis).

## Component classes (`@layer components`)

Reusable primitives keep markup terse and consistent:

- `.glass` — frosted translucent panel (`backdrop-blur` + subtle border).
- `.card`, `.card-hover` — base surface + hover lift.
- `.btn` and variants `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-sm`.
- `.input` — form fields with focus ring.
- `.chip`, `.badge` — pill labels.
- `.nav-link`, `.nav-link-active` — sidebar items.
- `.skeleton` — shimmering loading placeholder.
- `.prose-cognify` — Markdown typography (notes & tutor replies).

## React components (`src/components/`)

| Component | Purpose |
| --- | --- |
| `ui.tsx` | `Card`, `Modal`, `Progress`, `ProgressRing`, `Stat`, `Badge`, `EmptyState`, `Segmented`, `ToastHost`/`useToast`, `ConfirmButton` |
| `charts.tsx` | Dependency-free themed SVG `AreaChart`, `BarChart`, `Donut`, `Heatmap` |
| `markdown.tsx` | Safe Markdown → React renderer (headings, lists, tables, code, quotes, links, cloze) |
| `theme.tsx` | `ThemeProvider` + `useTheme` |
| `app-shell.tsx` | Sidebar, top bar, global search, ⌘K command palette, achievement toasts |
| `page-header.tsx` | Consistent page titles + actions |
| `quiz-runner.tsx` | Shared quiz/exam engine with instant marking |

## Motion

**Framer Motion**, used with restraint:

- Page/section entrances: short `fade-up` (12–20px, 250–400ms, ease-out).
- Modals/toasts: spring in/out.
- Progress bars/rings animate to value.
- Segmented control uses a shared-layout indicator (`layoutId`).

All motion respects `prefers-reduced-motion` (global CSS override) **and** the
in-app *Reduce motion* setting (`.reduce-motion` class).

## Accessibility

- Semantic HTML, `aria-*` on toggles/dialogs, `role="switch"` toggles.
- Visible focus rings (`focus-visible:ring`) on all interactive elements.
- Full **keyboard support**: ⌘/Ctrl-K palette, Space/Enter to flip cards, 1–4 to
  rate reviews, Enter to submit answers, Esc to close modals.
- Color choices target **WCAG AA** contrast in both themes; state is never
  conveyed by color alone (icons + text accompany color).
- Respects reduced-motion and color-scheme system preferences.

## Responsive & PWA

- Mobile-first; the sidebar collapses to an animated drawer < `lg`.
- Wide content (tables, charts) scrolls inside `overflow-x-auto` containers.
- `manifest.webmanifest` + maskable icon + theme-color make it installable.
