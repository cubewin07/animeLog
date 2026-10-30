# Design system — Lamplight

Evolves the Still & Spine tokens (`Frontend/src/index.css :root`). Same warm DNA; fewer surfaces, fewer borders, less mono, one accent.

## 1. Color

### Night (default)

| Token | Value | Job |
|-------|-------|-----|
| `--bg` | `#14110E` | App background |
| `--bg-sunken` | `#0F0D0B` | Sidebar, cover wells |
| `--surface` | `#1D1915` | Cards, sheets (the only "card" color) |
| `--surface-hover` | `#25201B` | Hover/selected rows |
| `--line` | `rgba(236,226,210,.08)` | Hairlines (default border) |
| `--line-strong` | `rgba(236,226,210,.16)` | Inputs, focused containers |
| `--text` | `#EDE4D6` | Primary text |
| `--text-2` | `#B3A898` | Secondary |
| `--text-3` | `#7E7466` | Tertiary / placeholders (≥ 4.5:1 on `--bg` for ≥14px) |
| `--paper` | `#EFE6D4` | Reflection surfaces only |
| `--paper-ink` | `#2A2219` | Text on paper |
| `--paper-ink-2` | `#6A5C4B` | Meta on paper |
| `--lamp` | `#D9A55B` | Single accent: primary action, focus ring, active nav |
| `--lamp-soft` | `rgba(217,165,91,.14)` | Accent backgrounds |
| `--danger` | `#E0806F` | Destructive text/icons |

Status uses **a 8px dot + plain-language label**, never filled pills:

| Status | Dot | Label |
|--------|-----|-------|
| `WATCHING` / `READING` | `--lamp` / `#8FCBAA` | Watching / Reading |
| `COMPLETED` | `#C9A090` | Finished |
| `PLAN_TO_WATCH` / `PLAN_TO_READ` | `#9BB6D0` | Up next |
| `ON_HOLD` | `#C2C87A` | Paused |
| `DROPPED` | `#8E827F` | Set aside |

Enum values are unchanged; only display labels live in `src/lib/status.ts` (single source, typed against `AnimeStatus | BookStatus`).

Progress bars: neutral track, fill uses the status dot color at 80%. **Completed = full calm fill, never red.**

### Day (optional, Phase 8)

Same token names remapped: `--bg #F4EEE3`, `--surface #FBF7F0`, `--text #2A2219`, `--paper #FFFDF8`, `--lamp #B07A2E`. Toggle in sidebar; respects `prefers-color-scheme` on first visit; stored in `localStorage`.

## 2. Typography

| Role | Font | Size / line | Notes |
|------|------|-------------|-------|
| Display | Fraunces 600, opsz 96 | `clamp(28px, 3vw, 40px)` / 1.1 | Page titles only |
| Title | Fraunces 600 | 20–24px / 1.2 | Card & section titles |
| Reflection | Source Serif 4 400 | 18–20px / 1.65, max 68ch | All `notes`/`why`/`note` |
| Body / UI | Source Sans 3 | 15px / 1.5 | Buttons, labels |
| Meta | Source Sans 3 500 | 13px, +0.01em | Dates, context |
| Numeric | IBM Plex Mono 500, tabular | 13–20px | **Only** progress counts, ratings, dates in timelines |

Remove uppercase mono eyebrows except one per page section (max). Eyebrows become Source Sans 12px, 600, `letter-spacing: .08em`, `--text-3`.

## 3. Space, radius, elevation

- Spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (`--s-1`…`--s-8`).
- Content width: 1200px max; reading column 720px.
- Radius: `--r-sm 6px` (chips, inputs) · `--r-md 10px` (cards) · `--r-lg 16px` (sheets, covers) · pill.
- Elevation: cards are flat (`--surface` + hairline). Only sheets/popovers/palette get shadow `0 24px 64px rgba(0,0,0,.5)`.
- Paper gets a subtle grain (`background-image` SVG noise at 4%) and `box-shadow: 0 1px 0 rgba(0,0,0,.2), 0 12px 32px rgba(0,0,0,.25)`.

## 4. Generated covers (`<Cover>`)

No more icon placeholders. When `cover_image_url || image_url` is empty:

- Deterministic hue from `hash(title)` mapped into a curated set of 10 cloth tones (oxblood, moss, ink-blue, ochre, plum, slate, teal, rust, olive, charcoal).
- **Anime poster** (2:3): layered radial gradients in the tone + fine grain, title set in Fraunces bottom-left, kind glyph (TV/film) top-right at 30% opacity, thin inner border like a print.
- **Book** (2:3): cloth-tone cover with spine shading on the left edge, title centered in serif, author small caps below.
- **Portrait** (1:1, characters): monogram (first letter of name) in Fraunces on a tone circle with soft vignette.
- Real images: `object-fit: cover`, lazy, `decoding="async"`, fade-in on load, tone background while loading.
- `view-transition-name: cover-{kind}-{id}` for list→detail morph.

## 5. Primitives (Phase 0)

Located in `src/ui/<Name>/<Name>.tsx + <Name>.css`.

| Primitive | Variants / notes |
|-----------|------------------|
| `Button` | `primary` (lamp), `secondary` (line), `ghost`, `danger`; sizes `sm/md`; `icon` slot; loading state |
| `IconButton` | Requires `label` (aria-label + tooltip) |
| `Chip` / `Segmented` | Filter chips with counts; zero-count chips collapse into "More" |
| `StatusMark` | Dot + label from `status.ts` |
| `Rating` | Display (`8.5` tabular + small star) and input (10 tappable ticks, keyboard ←/→, clear) |
| `Progress` | Bar + stepper (−/+, long-press repeat, direct type-in) |
| `Cover` | See §4 |
| `Paper` | Reflection surface; `editable` mode turns into autosizing textarea in place |
| `Sheet` | Native `<dialog>`; `side` (desktop right, 520px) or `bottom` (mobile); focus trap, Esc, scroll lock |
| `Menu` / `Popover` | For overflow actions (edit/delete hidden here) |
| `EmptyState` | Icon, sentence, one action |
| `Skeleton` | Card/row/cover shapes |
| `Toast` | Existing component restyled; supports **Undo** action |
| `Kbd` | Shortcut hint |

## 6. Motion

- Durations: 120ms (hover/press), 200ms (enter), 320ms (sheet/route). Easing `cubic-bezier(.2,.7,.2,1)`.
- Route change: View Transitions API (`document.startViewTransition`) wrapping `navigate`; cover morph list→detail. Fallback: instant.
- Progress +1: number ticks (vertical slide), bar eases, optimistic update, toast with Undo.
- Save reflection: paper "settles" (2px lift → rest) + toast.
- Lists: stagger only on first mount, max 8 items, 30ms apart.
- `prefers-reduced-motion: reduce` → all transitions ≤ 1 frame, no view-transition morphs. GSAP kept only where CSS can't (number ticker), behind `prefersReducedMotion()`.

## 7. Accessibility baseline

- Text contrast ≥ 4.5:1 (body) / 3:1 (≥ 18px). Fix D2 (cream on paper).
- Every interactive element reachable by keyboard; visible 2px `--lamp` focus ring with 2px offset.
- Hit targets ≥ 40px (44px on touch).
- Icon-only buttons have labels; status never conveyed by color alone (dot + text).
- Sheets/palette: `role="dialog"`, labelled, focus returns to trigger.
- Skip link retained.

## 8. Keyboard map

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl K` / `/` | Command palette |
| `W` | Composer |
| `N` | Log new title (catalog form) |
| `G` then `T/A/B/R/P/E` | Today / Anime / Books / Reflections / People / rEturns |
| `⌘↵` | Save in composer / inline paper |
| `Esc` | Close sheet / cancel edit |
| `?` | Shortcut help sheet |

