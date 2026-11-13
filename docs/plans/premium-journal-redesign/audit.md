# Audit — current UI (2026-10-30, `main` @ 2634085)

Captured with Playwright against the live Django data (6 franchises, 4 books, 5 characters, 4 rewatches, 29 lessons, 0 uploaded images) at 1440×900 and 390×844.

Severity: **H** = blocks understanding/usage, **M** = hurts clarity/polish, **L** = cosmetic.

## Global / shell

| # | Finding | Sev |
|---|---------|-----|
| G1 | **Mobile header collapses**: brand + horizontally scrolling tab strip (cut off at "Anim…"), then search + Write button floating in a ~360px empty block before any content. First meaningful content starts ~420px down. | H |
| G2 | **"Write Entry" opens "Log New Anime Franchise"** — a catalog form with title/romaji/japanese/season fields. The journal's primary verb leads to data entry, not writing. | H |
| G3 | Six equal nav tabs; **Media** (asset utility) sits beside journal sections. No grouping, no counts, no sense of "where am I in the journal". | M |
| G4 | Search filters only the current list view; no global jump-to-title. `/` shortcut exists but has no result surface. | M |
| G5 | Mono font used for most labels/status/meta → techy, dashboard-like tone, fights the paper/serif mood. | M |
| G6 | 3,700-line `index.css` + heavy inline `style={{}}` (top files: MediaLibraryModal 55, MediaView 49, ExportModal 42, EntryModal 42) → inconsistent spacing/radii between pages. | M |
| G7 | `App.tsx` is 999 lines holding all state, all modals and prop-drilling ~25 callbacks into views — makes global features (composer, palette) hard. | M |
| G8 | Every modal is a centered card with its own header style; no side sheets, no inline editing. | M |

## Today / Desk (`/`)

| # | Finding | Sev |
|---|---------|-----|
| D1 | Hero copy ("Your stories, still in motion.") occupies the top ~300px; the actual "continue" row starts below the fold on laptops ≤ 800px tall. | M |
| D2 | Featured lesson = *latest* note, not a meaningful one — currently a 360px paper card containing "too good". Title "Steins;Gate" is pale cream on paper (≈1.3:1 contrast). | H |
| D3 | Continue cards have tiny 48px placeholder icons, small steppers; no "write about this episode" action. | M |
| D4 | No nudge for completed titles **without** a lesson (AGENTS: such a row is "incomplete"). | M |
| D5 | Stats ledger (24 / 4 / 12) competes visually with content. | L |

## Anime library (`/anime`)

| # | Finding | Sev |
|---|---------|-----|
| A1 | No covers exist → each card is a ~500px dark gradient with a TV icon and a faded duplicate title. 6 titles need 2.5 screens. | H |
| A2 | Lessons not visible at all on cards; only rating + status + season count. | H |
| A3 | Japanese/romaji line in saturated cyan clashes with the palette. | L |
| A4 | Status filter chips with zero counts (On Hold 0, Dropped 0) take equal space. No sort, no view toggle. | M |
| A5 | Badges: rating box, status pill, "2x"/"Rewatched" badges — four different badge styles on one card. | M |

## Franchise detail (`/anime/:id`)

| # | Finding | Sev |
|---|---------|-----|
| F1 | Title repeated 3× (breadcrumb label, italic subtitle, H1). Header meta shows the *selected release* ("Season 1 · TV Series") under the *series* title — ambiguous what "Edit Release" edits. | H |
| F2 | Six stacked full-width sections (identity, release guide, lesson, episode memories, returns, characters, about) at near-equal weight; reading the lesson requires scrolling past the release table. | H |
| F3 | Lesson collapsed by default with "Read full lesson" even when it's one sentence. Editing goes through a modal. | M |
| F4 | Episode memories empty state is a plain text bar — no sense of the season's episode structure (24 eps, which are noted). | M |
| F5 | On mobile the identity card + release guide push the lesson ~1,100px down. | H |

## Books (`/books`, `/books/:id`)

| # | Finding | Sev |
|---|---------|-----|
| B1 | Raw enum rendered: **`PLAN_TO_READ`**. | H |
| B2 | Completed books show a full *red* progress bar — reads as error/danger. | M |
| B3 | Edit/delete icon buttons always visible on every row → noisy, risky. | M |
| B4 | Book detail is sparse (cover placeholder + lesson + collapsed "About"); no progress control, dates, or genres visible. | M |

## Characters (`/characters`)

| # | Finding | Sev |
|---|---------|-----|
| C1 | The `why` — the whole point — is hidden behind a "Reflection" link → modal. | H |
| C2 | 170px sparkle-icon circles as placeholders dominate each card. | H |
| C3 | Edit/delete always visible on every card. No filter by series. | M |

## Rewatches (`/rewatches`)

| # | Finding | Sev |
|---|---------|-----|
| R1 | Best page today (timeline by year, notes visible). But each card is isolated: no link back to the original lesson, so "what changed" can't actually be seen. | M |
| R2 | Release-level label ("Season 1") is primary in places where the series name is the useful handle (desk "Seen again" shows "Season 1" ×3). | M |
| R3 | 10/10 rating repeated on every card in the same position — low information. | L |

## Media (`/media`)

| # | Finding | Sev |
|---|---------|-----|
| M1 | Admin utility given top-level nav weight. Empty state is fine; layout is a generic file manager. | L |

## Modals sampled

| Modal | Finding |
|-------|---------|
| Write Entry / EntryModal | 4-tab catalog form, lesson textarea mid-form, status/rating below the fold; long scroll. |
| Character Reflection | Good paper treatment for `why`, but the big empty avatar and "Memories & Stills" empty box take 60% of the modal. |
| Return note | Clean. Should become a side sheet and show the original lesson for comparison. |

