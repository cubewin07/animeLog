# Return spine: visual design

Companion to `README.md` (why) and `implementation.md` (how). This file is the visual and information-architecture spec. During implementation, fold the tokens and the list-vs-modal rule into `Frontend/design.md`.

## Design direction — `Return spine`

**Audience:** one person who came back to a title and wants to find that pass.

**Page job:** scan *when / what / which pass / score*, then open one record.

**Signature:** a vertical **spine of returns**. Nodes are small and color-coded by *target type* (franchise, season, film, episode). Rows are one line of type. Paper is withheld until the modal opens — the slip appears as if pulled from the desk drawer.

This is a deliberate reversal of “lessons first on every list.” It is justified here because chronology is the unique job of this page. Dashboard and detail keep paper on the surface. Rewatches become a log.

### Why this is not a generic dark timeline

A default timeline is: left line, dots, cards, truncated quotes. This page refuses the card. The list is typeset like a viewing log (date, title, scope, score). Color lives only on the node, the selected type chip, and the rating number. The cream slip is the modal’s event, not list decoration.

### Relationship to Still & Spine

Keep walnut desk, Fraunces titles, Source Sans UI, Source Serif on paper, IBM Plex Mono for dates/scores, semantic status colors elsewhere, seal for delete.

Add a **narrow target-type palette** used only on this spine (and later on matching chips). Do not invent a second brand accent. Do not paint large panels.

## Color additions

Status colors already mean watching / reading / completed / plan / hold / dropped. They must not also mean “season vs film.” Rewatch target type is a different axis. Give it four small node colors.

| Token | Hex | Job |
|---|---|---|
| `--cel` | `#3A6F7C` | TV **season** node and selected Seasons chip. Cel-wash teal — anime-specific, not banker green. |
| `--cel-text` | `#8FCBD4` | Season labels on desk |
| `--cel-dim` | `rgba(58, 111, 124, 0.22)` | Selected season chip wash |
| `--return-rail` | `rgba(44, 74, 110, 0.45)` | Timeline stem (ballpoint at reduced opacity) |
| `--return-mark` | `#E2D3BB` | 6px paper pip when `notes` is non-blank |

Reuse existing tokens for the other three types:

| Target | Node / chip edge | Why |
|---|---|---|
| Franchise (`series`) | `--tungsten` / `--tungsten-dim` | Whole-franchise return; lamp gold |
| Season | `--cel` / `--cel-dim` | **New.** Broadcast pass |
| Film (`movie`) | `--night` / `--night-dim` | Already used for film icons |
| Episode | `--ember` / ember at ~20% | Single-episode return; already used for episode icons |

Rules:

1. These hues mark **nodes, type-chip edges, and a 2px row accent when selected**. Never a full-width card fill.
2. Rating color stays on the **number**, using existing rating bands (ember 9–10, tungsten 7–8, desk 5–6, ash 1–4). Do not recolor the node from the score.
3. The latest pass of a *same-target* sequence is a **filled** node; earlier passes are hollow rings. Fill encodes recency within that title, not a fifth hue.
4. `--seal` remains delete-only. `--spine` remains completed-status, not “rewatch.”
5. Document the tokens in `Frontend/design.md` under a new **Return spine** subsection so they are not treated as global status colors.

Type-chip selected state: 1px border + 2px bottom edge in the type color + dim wash. Unselected chips stay graphite text on desk-surface. `All` uses ballpoint, not tungsten, so it does not look like “now watching.”

## Information split

### On the spine (always visible)

One row per rewatch:

| Field | Treatment |
|---|---|
| Date | Mono, fixed-width. Prefer `finish_date`, else `start_date`. Format `14 Aug 2026`. Year is in the group header, so the row may drop the year on desktop (`14 Aug`) and keep it on mobile. Undated: `—` and the row lives under **Date not recorded**. |
| Node | 12px ring. Color = target type. Filled if latest dated pass of that target. |
| Title | Primary text. Prefer `release_title`; if series and release differ, show release as title and series as a quiet prefix only when the year group is mixed. Do not concatenate `Series — Release` on every row. |
| Scope | One short label: `Franchise` / `Season 1` / `Film` / `Ep 10`. Include episode title only in the modal. |
| Pass | `Pass 2` — numbered **within the same target**, oldest dated = Pass 1. Not a global Watch #N. |
| Rating | Mono number or `—`. Rating-band color. |
| Note pip | `--return-mark` dot if notes exist; nothing if they do not. No excerpt. |

Nothing else on the row: no paper, no notes, no edit, no delete, no “View Franchise,” no empty-state sentence.

### In the detail modal (on click / Enter)

| Block | Content |
|---|---|
| Header | `Return note` + close. Secondary `Edit` opens existing `RewatchModal`. |
| Identity | Fraunces title (`release_title` or series). Scope line: `Season · Pass 2`. |
| Meta row | Dates as `Started 12 May 2025 · Finished 14 May 2025` (omit missing parts; never print the words `Started → Finished` as placeholders). Rating with band color. Target-type chip in the type color. |
| Paper | `TakeawaySlip` with full `notes`. Empty: `No reflection recorded for this pass.` + `Add reflection` (opens edit). |
| Footer | `View franchise` if `series_id` exists (navigates to `/anime/:id` and closes). Seal `Delete` using the existing confirm flow. |

`RewatchModal` stays the create/edit form. Do not turn it into a hybrid reader.

## Layout

```
Desktop (>= 960px)

Rewatches                                           [Log a rewatch]
What changed when you came back.
12 passes · 5 titles · 9 reflections     <- quiet mono ledger, not KPI cards

[ All 12 ] [ Franchises 2 ] [ Seasons 7 ] [ Films 2 ] [ Episodes 1 ]

2026
  14 Aug   ●  Frieren          Season 1   Pass 2    9   ◌
  02 Mar   ○  Steins;Gate      Film       Pass 1    8

2025
  12 May   ○  Frieren          Season 1   Pass 1    8   ◌
  —        ○  Other title      Franchise  Pass 1    —

Date not recorded
  —        ○  …

Click row ──► modal (desk-raised, max 640px)
┌──────────────────────────────────────────────┐
│ Return note                    [Edit]  [×]   │
│ Frieren — Season 1                           │
│ Season · Pass 2                              │
│ Started 4 Jan · Finished 14 Aug 2026 · 9/10  │
│ ┌──────────────────────────────────────────┐ │
│ │ RETURN NOTE                              │ │
│ │ Full Source Serif reflection on paper.   │ │
│ └──────────────────────────────────────────┘ │
│ [View franchise]                    [Delete] │
└──────────────────────────────────────────────┘
```

```
Mobile (<= 640px)

Heading + Log a rewatch
Ledger line
Horizontally scrollable type chips

Year
  14 Aug 2026
  ● Frieren
    Season 1 · Pass 2 · 9
```

On mobile the stem column hides (same pattern as `.evolving-timeline` at 640px). The node becomes a left-edge 3px type-color bar. Date sits above the title. Hit target of the row is at least 44px tall.

## Header and filters

- Title: `Rewatches`. Subtitle: `What changed when you came back.`
- Keep the existing tungsten `Log a rewatch` button. It is the only solid primary action.
- Quiet ledger: `N passes · M titles · K reflections`. Titles = distinct group keys (`series_id` or normalized `series_title` or `release_title`). Reflections = non-blank notes. No hours, streaks, or invented stats.
- Keep type chips. Relabel `All Passes` → `All`. Counts stay.
- Global header search remains the only search. Extend matching to `series_title`, `release_title`, `episode_title`, notes, and type labels. When `searchQuery` is set, show `Showing N matches for “…”`.
- Empty journal: one sentence + `Log a rewatch`. Filtered-empty: `No film rewatches yet` (exact missing type) + log action. Search-empty: name the query; do not reuse the journal-empty copy.

## Chronology and pass numbers

Do not invent a universal Watch #N. Unrelated titles in the same month are not one story.

1. **Page order:** newest first, matching `Rewatch.Meta.ordering` (`-start_date`, `-id`). Sort key: `finish_date` or `start_date`; undated last, then `-id`.
2. **Year groups:** calendar year of that sort date. Descending. Undated group last, labeled `Date not recorded`.
3. **Pass number:** within the same target key, oldest dated = Pass 1.
   - `series` → `series:{target_id}`
   - `season` → `season:{target_id}`
   - `movie` → `movie:{target_id}`
   - `episode` → `episode:{target_id}:{episode_number}`
4. **Latest node fill:** the newest *dated* pass of that same target key. Undated passes are never “latest.”

## Interaction

### Opening the modal

- The whole spine row is one control (`button` or `role="button"` with `tabIndex={0}`).
- Click / Enter / Space opens `RewatchDetailModal` with that `Rewatch`.
- `aria-haspopup="dialog"` and `aria-expanded` on the active row.
- Selected row: 2px left bar in the type color + `--desk-surface` wash. Only one selected at a time.

### Modal chrome

- Reuse `.modal-overlay` / `.modal-container` (see `CharacterDetailModal`).
- Overlay click and Escape close. Focus moves into the dialog on open and returns to the row on close.
- GSAP entrance matches other modals; honor `prefers-reduced-motion`.
- Edit: close detail, call existing `onEdit(rewatch)` so `RewatchModal` opens with `editRewatch`. After save, list refresh already happens in `App.tsx`; do not keep a stale selected object if it was deleted.
- Delete: existing `onDelete` + `ConfirmDialog`. On confirm, close the detail modal.

### Routing

The app already has `/rewatches`. v1 keeps selected pass in **view state**, not the URL. A `?pass=:id` deep link is a later nicety, not required to fix the overwhelm.

### Franchise detail page

Out of scope. When that section is redesigned, reuse `RewatchDetailModal` and the same compact row language. Do not fork a second reader.
