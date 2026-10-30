# Implementation plan

Rules for every phase:

- Frontend only. No changes to `Backend/` unless a phase stops and asks first.
- Status enum values stay identical to `AnimeStatus` / `BookStatus`. Only display labels change.
- Every list or form ships with loading, empty, and error states.
- Exit checklist for each phase: `npm run build` ✅ · `npm run lint` ✅ (no new errors) · Playwright screenshots at 1440×900 and 390×844 for the pages touched · keyboard walk-through · `prefers-reduced-motion` check.
- One commit (or a small series) per phase, message format `feat(ui): phase N — …`.

## Target structure

```
Frontend/src/
  styles/        tokens.css, base.css, utilities.css   (from index.css)
  ui/            primitives (Button, Cover, Sheet, …) each with colocated .css
  lib/           status.ts, format.ts (dates/counts), hash.ts, shortcuts.ts
  state/         JournalProvider.tsx, useJournal.ts, useReflections.ts
  shell/         AppShell, Sidebar, BottomBar, CommandPalette, ShortcutHelp
  composer/      Composer.tsx, TargetPicker.tsx, drafts.ts
  features/
    today/       TodayView + parts
    library/     LibraryLayout, AnimeLibrary, BookLibrary, LibraryCard, LibraryRow
    detail/      Folio, ReleaseSwitcher, LessonPaper, EpisodeGrid, ThenNow, …
    reflections/ ReflectionsView, ReflectionSheet
    people/      PeopleView, PersonSheet
    returns/     ReturnsView, ReturnSheet
    media/       (moved MediaView + MediaLibraryModal)
  api/           unchanged (client.ts)
```

Old `components/` and `views/` files get moved or deleted as each phase replaces them. No dead files are left behind at the end of a phase.

---

## Phase 0: Foundations

1. `styles/tokens.css`: add the Lamplight tokens from design-system.md, plus **aliases from the old token names** so pages that haven't been redesigned keep rendering.
2. Split `index.css` into `styles/base.css` (reset, body, focus, scrollbar, skip-link) and per-feature CSS that moves with each later phase. Leave the legacy rules in `styles/legacy.css` until their page is rebuilt.
3. `lib/status.ts`: `STATUS_META: Record<AnimeStatus|BookStatus, {label, tone}>`. Replace every raw enum render (fixes B1).
4. `lib/hash.ts` and `ui/Cover`: generated covers for poster, book, and portrait (design-system §4). Swap all existing placeholders (`current-title-placeholder`, `FranchiseCard`, `BookRow`, `CharacterCard`, `DetailIdentity`).
5. Primitives: `Button`, `IconButton`, `Chip`/`Segmented`, `StatusMark`, `Rating` (display only for now), `Progress`, `Paper`, `Sheet` (native `<dialog>`), `Menu`, `EmptyState`, `Skeleton`, `Kbd`. Restyle `Toast` and add an Undo action.
6. Fonts: keep the same families and trim weights in `index.html`.

**Accept**: no raw enums anywhere, no icon-placeholder covers, existing pages look at least as good as today (Anime grid height roughly halves thanks to 2:3 covers).

## Phase 1: Shell and navigation

1. `state/JournalProvider`: move data loading (`refreshAll`), lists, stats, and every mutation handler from `App.tsx` into the provider. Expose `useJournal()` → `{data, status, actions}` and `useJournalUI()` → `{openComposer, openEntryForm, openSheet, confirm, toast}`. Views read from context, so prop drilling goes away. Behavior stays the same.
2. `shell/AppShell`: `Sidebar` (≥1024px, collapsible rail saved to localStorage) and `BottomBar` + `TopBar` (<1024px). Delete the `Navigation.tsx` pill track (fixes G1 and G3).
3. `shell/CommandPalette` (`⌘K`, `/`): fuzzy search over titles, characters, and reflection text, plus actions. Write a small scorer in `lib/fuzzy.ts` instead of adding a dependency.
4. `lib/shortcuts.ts`: global key map (design-system §8) and `ShortcutHelp` sheet (`?`).
5. Route transitions: wrap navigation in `document.startViewTransition` when supported and motion is allowed.
6. Add the `/reflections` route (placeholder that renders the existing reading-room list until Phase 6).
7. `React.lazy` + `Suspense` for routes, with `Skeleton` fallbacks.

**Accept**: content starts within 80px of the top on mobile, every section is reachable in 1 tap/click, the palette can open any title in ≤ 3 keystrokes, `App.tsx` is under 150 lines.

## Phase 2: Composer

1. `composer/TargetPicker`: combobox (ARIA 1.2 pattern) listing current titles, recent ones, then everything. Includes a "Log a new title →" escape hatch.
2. `composer/Composer`: kind selector limited to the kinds valid for the target (pages.md table), episode number input, `Paper` textarea that grows with content, optional `Rating` input, `⌘↵` save.
3. Append mode with a dated separator when a note already exists. Toggle to edit the whole note.
4. `composer/drafts.ts`: localStorage drafts keyed `draft:{targetKind}:{id}:{kind}[:{ep}]`, debounced 500ms, cleared on save.
5. Wire the entry points: sidebar Write, bottom-bar Write, the `W` key, palette actions, and contextual buttons added in later phases.
6. The catalog `EntryModal` stays reachable through "Log new title" and `N`.

**Accept**: from any page you can write a lesson, episode memory, return, or character why in ≤ 4 interactions. Drafts survive a reload. Data saves through the existing endpoints and appears without a full refresh (optimistic update + refetch).

## Phase 3: Today

Replace `DashboardView` with `features/today/` (pages.md §Today).

- `ContinueRow` with large `Progress` steppers, optimistic +1 with Undo, and a "Note ep N" button that opens the composer.
- `Resurfaced` card (seeded daily pick, "another" button). Fixes D2: paper text uses `--paper-ink`.
- `WaitingForWords` list (completed titles with no notes, characters with no why).
- `RecentReflections`, `PeopleStrip`, `RecentReturns` (series title is the headline, fixes R2).
- Remove the hero paragraph. Greeting + date goes on one line (fixes D1).

**Accept**: at 1440×900 the Continue row and the Resurfaced card are both above the fold. At 390px the Continue row is the first content.

## Phase 4: Library

- `LibraryLayout` toolbar: `Segmented` status filter with counts (zero counts go into "More"), local filter input, sort menu, shelf/list toggle saved per library.
- `LibraryCard` (shelf) and `LibraryRow` (list) for anime and books: cover, title, `StatusMark`, rating, one-line reflection or a "Write what stayed" nudge. Actions show on hover/focus; on touch they live in the ⋯ menu (fixes A1–A5, B2, B3).
- Delete `FranchiseCard.tsx`, `BookRow.tsx`, and the old view files after migrating.

**Accept**: 6 franchises fit in one screen at 1440px. Every card shows the reflection or the nudge. No edit/delete buttons are visible at rest.

## Phase 5: Detail pages

- `features/detail/Folio`: two columns with a sticky identity column on desktop and a compact band on mobile.
- `ReleaseSwitcher` synced to the `?release=` query param.
- `LessonPaper`: inline editing via PATCH `notes`, with a keyboard save/cancel. It expands automatically when the note is ≤ 600 chars.
- `EpisodeGrid`: cells 1…`total_episodes`, filled when an `EpisodeNote` exists. Clicking opens the memory sheet or the composer (Episode N). Replaces `EpisodeMemoryModal`/`EpisodeNoteModal` entry UIs (their save logic is reused).
- `ThenNow` returns block and a `PeopleStrip` showing why snippets.
- Collapsible `Details` section (dates, studios, romaji/japanese, genres).
- Book detail reuses `Folio` with page progress.
- Remove the duplicated titles and the ambiguous "Edit Release" label (fixes F1–F5, B4).

**Accept**: at 390px the lesson starts above 500px. Editing a lesson needs no modal. Episode memories can be added straight from the grid.

## Phase 6: Reflections, People, Returns

- `useReflections()` extracted from the Desk aggregation, with kind, date, rating, and target link. Used by Today, Reflections, and the palette.
- `ReflectionsView`: filters, full-text search with highlighting, sort, group by title, masonry paper cards, `ReflectionSheet`. Delete `ReadingRoomModal.tsx`.
- `PeopleView`: portrait wall with why visible, series filter, `PersonSheet` (restyled `CharacterDetailModal`, inline why editing, stills strip) (fixes C1–C3).
- `ReturnsView`: Then → Now cards, a Timeline | By title toggle, rating delta, `ReturnSheet` (fixes R1–R3).

## Phase 7: Forms and utilities

- `EntryModal`, `RewatchModal`, `CharacterModal` → stepped `Sheet`s (pages.md §Catalog forms). Remove the inline styles from them.
- After a new title is created, offer to open the composer on it.
- Media restyle (folder column, hover actions, drag-only drop zone). Export/Import sheet opens from the sidebar utility group.
- Inline-style sweep: aim for zero `style={{}}` except dynamic values (progress widths, CSS variables).

## Phase 8: Polish and QA

- Motion pass (design-system §6), checking for jank with the DevTools performance panel.
- A11y audit of every page and sheet (contrast, focus order, labels, landmarks). Fix all findings.
- Responsive QA at 360, 390, 768, 1024, 1280, and 1440 widths. Empty-database run (temporarily point the API at a fresh SQLite through the documented `manage.py` flow, never by editing the real DB). Error run (stop Django → error states render).
- Bundle check: route chunks, no single chunk over 250 kB gzip.
- Optional **Day theme** (design-system §1) if decision #1 = yes.
- Update `Frontend/AGENTS.md` "Visual direction" to point at Lamplight, and drop the superseded plan docs or mark them archived.

## Verification tooling

- Screenshot script (Playwright using system Chrome) runs every route at both sizes and writes to an artifacts folder. It is used before and after each phase for side-by-side comparison.
- Interaction script for the composer, progress +1/Undo, inline lesson edit, palette navigation, and the episode grid.

## Risks

| Risk | Mitigation |
|------|------------|
| Big-bang refactor breaks flows | Phase 1 provider refactor is behavior-identical. Each phase keeps the old components until replaced. |
| Appending to `notes` alters existing text | Append mode is explicit and visible, with an "edit whole note" toggle. The composer shows the existing note before saving. |
| View Transitions support | Progressive enhancement, falls back to instant navigation. |
| CSS regression during the split | Legacy stylesheet kept until each page is rebuilt. Screenshots diffed every phase. |

