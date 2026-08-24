# Desk Dashboard: Complete Redesign Plan

## Outcome

Redesign the Desk from an MVP list of repeated dark cards into a calm **return point**: it should answer “what can I continue?” in one glance and then surface the most recent memories worth revisiting.

The dashboard is not a statistics dashboard and not a catalog. It should feel like the active portion of the same night desk as the detail page, with a different composition: a working spread of current titles and a small stack of saved reflections.

No backend/API changes are needed. Existing series, seasons, films, books, lessons, stats, progress endpoints, covers, and navigation callbacks provide the required information.

## Design direction — `Afterimage desk`

**Audience:** a journal owner opening the app between a watch/read session.

**Page job:** resume an in-progress title or write the next takeaway.

**Signature:** an asymmetrical **continuation tray** at the top: one featured active title with an integrated progress action, beside a compact stack of the other active titles. It reads like media currently left on the desk, not a grid of analytics widgets.

The folio detail page and the desk are intentionally related but not identical:

- Both use walnut surfaces, semantic status colors, the existing type stack, real cover art, and paper for lessons.
- The desk uses a denser working layout and compact paper excerpts; the detail page owns the large textured folio sheet.
- Tungsten/green mark active media; paper is reserved for remembered lessons. There is no competing dashboard gradient or new brand color.

### Dashboard palette and contrast

Use the existing shared palette. Add only dashboard-local surface aliases if the implementation needs them:

| Token | Value | Job |
| --- | --- | --- |
| `--desk-tray` | `#211B16` | Continuation tray, distinct from generic cards |
| `--desk-tray-edge` | `rgba(230, 220, 206, .13)` | Tray divider/edge |
| `--desk-counter` | `#17130F` | Small stat counter inset / poster well |
| `--memory-paper` | `#E7DFCF` | Compact lesson excerpts; match the detail folio paper |

Use status hues only as narrow progress fills, poster edges, active count markers, and labels. No giant green/blue/gold cards. Increase contrast through surface separation, spacing, and hierarchy before adding color.

## Proposed layout

```
Desktop (>= 960px)

Desk
Your active shelf                                      [Log an entry]
[watching 2] [reading 1] [lessons 24]     <- quiet ledger, not a card parade

┌──────────────────────── continuation tray ────────────────────────┐
│ NOW                                                               │
│ ┌ featured active item ──────────────────┐ ┌ compact active stack │
│ │ poster │ medium/status · parent title   │ │ cover title  8 / 12 │
│ │        │ release title                  │ │ progress + / -       │
│ │        │ long count / thin progress     │ │ cover title  120/300 │
│ │        │ [Continue] [progress controls] │ │ ...                  │
│ └────────────────────────────────────────┘ └──────────────────────┘
└───────────────────────────────────────────────────────────────────┘

RECENTLY KEPT                                           [View journal]
┌ leading memory: paper excerpt ──────┐ ┌ two compact memories ────┐
│ title/context, one readable excerpt  │ │ paper-strip cards         │
└─────────────────────────────────────┘ └───────────────────────────┘

QUIETLY COMPLETE
completed / rewatches / characters as a single restrained footer ledger

Mobile
Desk + one compact ledger → featured active item → active horizontal list →
recent memories → quiet footer ledger
```

The asymmetry is purposeful: only the media that can be continued earns the large visual area. There is no arbitrary “featured” ranking based on a made-up quality score. The first active item in the existing deterministic list is featured; all active items remain equally reachable.

## Information and interaction design

### 1. Page introduction and ledger

- Replace the current generic headline and full-width sentence strip with a compact page introduction: `Desk` eyebrow, `Your active shelf` title, and one clearly labeled `Log an entry` action.
- Recast `JournalStrip` as a quiet ledger of three primary counts: watching, reading, lessons. Completed, rewatches, and characters move into a low-emphasis footer ledger or an overflow-friendly second row.
- Counts are navigation/summary only. Do not add charts, streaks, productivity copy, percentage rings, or invented “this week” data.

### 2. Continuation tray

- Build one `.continuation-tray` section rather than rendering all active titles as identical `.desk-card` rows.
- The featured item contains: cover, parent context, release/book title, semantic status word, current/total count, thin progress line when total exists, and the existing accessible progress stepper. Clicking cover/title opens its detail page.
- For a season, show series title + `Season N`; for a film, series title + `Film`; for a book, author (when present) + title. Do not call all three “episodes.”
- Place an existing note/reflection as a single short contextual line only when it fits. The main lesson stays in the memory section; do not duplicate an entire reflection in each active card.
- Remaining active titles are compact, full-width stack rows with cover thumbnail, label, progress, and stepper. Their status color is an edge/label, not a full background.
- If there is one active title, let it occupy the full tray and omit the empty secondary column. If there are many, show a bounded list (for example four) and a concrete `View all active titles` link only if a destination exists; otherwise show all rather than inventing a hidden state.

### 3. Empty and mixed states

- No active titles: replace the large generic dark empty card with a calm open tray: `Nothing is in progress` plus `Log a watch or read`.
- Existing planned titles should not appear as fake “continue” items. If useful after review, add one small `Start something planned` link to the relevant journal list; do not create a recommendation system.
- Lessons can exist without active media. The recent-memory area remains useful and should not look broken.
- Keep loading/error behavior in the parent app unchanged; ensure the redesigned content does not mask those states.

### 4. Recently kept memories

- Rename `Recent lessons` to `Recently kept` or `Recent takeaways`; choose one label and use it consistently.
- Reuse `TakeawaySlip`, but introduce a compact **memory strip** variant instead of six identical gold-looking cards. It uses neutral paper, a small context line, title, and a clamp of the note for scanning. Opening it navigates to the source.
- One latest lesson may span the left column as a lead memory; the next two to four live in a compact grid/stack. The date ordering already available from `created_at` is sufficient—do not fabricate recency from ratings or poster data.
- Do not use poster images as decorative backgrounds behind paper. At most, show a small cover thumbnail as source context.
- Preserve full keyboard semantics for clickable memory items: use buttons/links where possible, otherwise retain role, tabIndex, and Enter/Space behavior.

### 5. Quiet footer ledger

- End with a narrow, non-card-like line for completed releases, rewatches, and memorable characters. It acknowledges the archive without stealing the continuation task.
- Link a metric only when the existing callback can route somewhere useful (`rewatches`, `characters`, anime/books). Avoid nonfunctional dashboard decoration.

## Component and file plan

### Phase 1 — structure with existing data

1. Refactor `Frontend/src/views/DashboardView.tsx` into local render paths for active season, film, and book that share only the small visual structure actually common to them. Keep API calls and parent callbacks unchanged.
2. Derive `featuredActive` and `remainingActive` from the active data already collected. Preserve current deterministic order; do not add new sorting assumptions.
3. Keep `allLessons` and its timestamp sort, but select a lead memory and compact remaining memories rather than rendering a uniform six-card grid.
4. Preserve GSAP's single entrance sequence and `prefers-reduced-motion`; retarget it to the new meaningful sections rather than adding per-card animation.

### Phase 2 — styling and shared refinements

1. Add dashboard-only CSS classes in `Frontend/src/index.css`: continuation tray, featured active item, active stack row, ledger, and memory strip. Avoid a new styling framework or a dashboard component directory.
2. Simplify `Frontend/src/components/JournalStrip.tsx` into semantic markup/classes so it can reflow gracefully at narrow widths; do not turn it into six KPI cards.
3. Extend `TakeawaySlip.tsx` only if a small `compact`/`memory` modifier can serve the memory strip without branching into a new abstraction. Keep the detail folio treatment exclusive to detail.
4. Use existing poster, status, rating-band, progress, and button styles where they already fit. Delete dashboard-specific inline style clutter as a by-product, not as a separate rewrite.

### Phase 3 — responsive and empty-state polish

1. At <=960px, stack feature and active list with the featured item first. At <=640px, make active stack rows comfortably tappable and ensure stepper controls do not collide with title text.
2. Verify the `Log an entry` action is visible when the tray is empty and not duplicated excessively when it is populated.
3. Add the quiet footer ledger only after the primary continuation and memories areas are working; omit it on very sparse data instead of showing rows of zeroes.
4. Update `Frontend/design.md` with the dashboard composition and the rule: desk = active media; paper = remembered lesson.

## Acceptance and browser verification

Run `npm run lint` and `npm run build` from `Frontend/`. Verify desktop (1280px), tablet (768px), and mobile (390px) against these states:

1. one active watching season with known total;
2. watching season + film + reading book;
3. active book only (banker green stepper/progress, not tungsten);
4. no active media, with and without lessons;
5. no lessons, with active media;
6. long title, missing cover, missing total, missing rating, and note present/absent;
7. keyboard navigation for title links, progress steppers, log action, and memory cards; reduced-motion enabled.

The redesign is complete when:

- the first visible task is continuing an active title, not interpreting a dashboard;
- active anime and books are distinguishable without turning the screen into a rainbow;
- recent memories are readable and visibly secondary to continuation;
- the page has one intentional composition rather than a vertical list of same-weight cards;
- all interactions continue using the current callbacks/API and all mobile actions remain reachable.

## Explicitly out of scope

No analytics charts, streaks, recommendations, calendar, goals, new API endpoint, user preferences, saved dashboard layout, drag-and-drop, or new dependency. Add a true “last interacted”/resume ranking only if the backend later records that event; until then, deterministic current order is more honest.
