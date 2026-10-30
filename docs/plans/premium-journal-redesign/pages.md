# Page specs

Wireframes are schematic. "R:" lines are reflection text (Source Serif on paper or inline).

---

## Shell

```
Desktop ≥ 1024                                   Mobile < 1024
┌──────────┬──────────────────────────────┐      ┌───────────────────────┐
│ ◐ Anime  │                              │      │ Today        ⌕   ⋯   │  ← 56px top bar
│   Log    │   page content (max 1200)    │      ├───────────────────────┤
│          │                              │      │                       │
│ [✎ Write]│                              │      │   content             │
│ ⌕ Search ⌘K                             │      │                       │
│          │                              │      ├───────────────────────┤
│ Today    │                              │      │ ⌂  ▤  (✎)  ❝  ☰     │  ← bottom bar 64px
│ LIBRARY  │                              │      └───────────────────────┘
│ Anime  6 │                              │       Today Library Write Reflections More
│ Books  4 │                              │
│ JOURNAL  │                              │
│ Reflections 29                          │
│ People  5│                              │
│ Returns 4│                              │
│ ───────  │                              │
│ Media    │                              │
│ Export   │                              │
│ 24 lessons · 12 finished                │
└──────────┴──────────────────────────────┘
```

- Sidebar 248px, collapsible to 72px icon rail (state persisted). Counts are quiet `--text-3`.
- Mobile "Library" opens a small sheet: Anime / Books. "More": People, Returns, Media, Export, theme, shortcuts.
- Global search lives in the command palette (titles, characters, reflections full-text, actions). The per-page filter input moves into each page toolbar.

## Command palette

Sections: **Jump to** (series/seasons/films/books/characters, fuzzy), **Reflections** (matches in note text with highlighted snippet), **Actions** (Write reflection…, Log new anime, Log new book, +1 episode on *current*, Export journal, Toggle theme). Arrow keys, Enter, `⌘↵` = open in composer.

## Composer (Write)

Sheet (side on desktop, full-height bottom on mobile).

```
┌ Write ─────────────────────────────── ✕ ┐
│ About  [ Frieren · Season 1         ▾ ] │  ← combobox: current titles first,
│                                          │    then recent, then search all.
│ Kind   (Lesson) (Episode) (Return) (Why) │  ← only kinds valid for the target
│        Episode # [14] (if Episode)       │
│ ┌──────────────── paper ───────────────┐ │
│ │ What stayed with you?                │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│ Rating  ·········· (optional)            │
│ Draft saved 2s ago        [Cancel] [Save ⌘↵] │
└──────────────────────────────────────────┘
```

| Target | Kinds → API |
|--------|-------------|
| Season | Lesson → `seasonApi.update(id,{notes})` · Episode → `episodeNoteApi.create/update` · Return → `rewatchApi.create({target_type:'season'|'episode'})` |
| Film | Lesson → `movieApi.update` · Return → `rewatchApi.create('movie')` |
| Series | Return → `rewatchApi.create('series')` |
| Book | Lesson → `bookApi.update(id,{notes})` |
| Character | Why → `characterApi.update(id,{why})` |

- If target already has a lesson, the composer shows it and **appends** with a dated separator (`— 30 Oct 2026`) rather than overwriting; user can switch to "edit whole note".
- Drafts in `localStorage` keyed by target+kind; restored on reopen.
- Entry points pass context: from a detail page, target prefilled; from an episode cell, Episode + number prefilled; from a Today nudge, Lesson prefilled.
- "Can't find it? **Log a new title →**" opens the existing catalog `EntryModal` (restyled in Phase 7), then returns to the composer with the new target selected.

---

## Today (`/`)

```
Good evening · Thursday 30 October                         [✎ Write]

CONTINUE
┌──────────────────────────┐ ┌─────────────┐ ┌─────────────┐
│[cover] Frieren · S1      │ │[cover] Klara│ │ + start     │
│        Ep 14 of 28  ▓▓▓░ │ │ p.195 / 303 │ │ something   │
│ [−] 14 [+1]  ✎ Note ep 14│ │ [−][+10] ✎  │ │             │
└──────────────────────────┘ └─────────────┘ └─────────────┘

RESURFACED                                    ↻ another
┌──────────────── paper ─────────────────────────────────┐
│ From Vinland Saga · Season 1 · written Aug 2026         │
│ R: "You have no enemies. No one in this world is your   │
│     enemy."                                             │
│ [Add a new thought]   [Open title]                      │
└─────────────────────────────────────────────────────────┘

WAITING FOR WORDS (3)              RECENT REFLECTIONS        See all →
• Ping Pong · finished, no lesson  ❝ Steins;Gate · Return · 27 Aug
  [Write]                            R: too good
• Mugen Train · finished…          ❝ Klara and the Sun · Book …
                                    ❝ Erwin Smith · Why …
PEOPLE YOU KEPT  [◉][◉][◉][◉] →     RECENT RETURNS  27 Aug Steins;Gate …
```

- **Resurfaced**: picks a lesson ≥ 30 days old, preferring longer notes and higher ratings, seeded by date (stable for the day); "another" shuffles. Replaces the "latest = featured" logic (D2).
- **Waiting for words**: completed seasons/films/books with empty `notes`, and characters with empty `why`.
- Continue cards: +1 is the big button; long-press repeats; "Note ep N" opens composer with Episode N.
- Empty states: no current titles → "Start something" card opening palette's Log action.

## Library — Anime (`/anime`) & Books (`/books`)

Shared `LibraryLayout`.

```
Anime                                                 [+ Log anime]
[All 6] [Watching 1] [Finished 4] [Up next 1] [More ▾]   ⌕ Filter…  Sort: Recent ▾  [▦|☰]

▦ Shelf (default)
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│cover│ │cover│ │cover│ │cover│ │cover│ │cover│   ← 2:3, 5–6 per row @1200
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
Vinland Saga      ● Finished · ★10
1 season          R: "You have no enemies…"   (1 line, serif italic)
                  — or —  ✎ Write what stayed (if none)

☰ List
[c] Vinland Saga   ● Finished   1 season   ★10   R: You have no enemies…   ⋯
```

- Sort: Recently updated, Rating, Title, Has reflection.
- Status for a franchise = most active release (existing logic), shown as `StatusMark`.
- Hover/focus on shelf card: cover lifts 4px, shows quick actions (+1 if watching, Write, ⋯ menu with Edit/Delete). Touch: actions in ⋯.
- Books use the book `Cover`, show `p. 195 / 303` for Reading, author under title.
- Search filter is page-local (toolbar), debounced.

## Franchise detail (`/anime/:id`)

```
← Anime                                                     ⋯ (edit series, delete)
┌───────────────┬──────────────────────────────────────────────────┐
│ [   cover   ] │ Vinland Saga                                      │
│               │ ヴィンランド・サガ · Action, Drama, Historical     │
│ sticky        │                                                   │
│ ● Finished    │ [Season 1 (Prologue)] [Season 2] [Film] [+ add]   │ ← release switcher
│ ★ 10          │                                                   │
│ 24 / 24 eps   │ ┌──────────── paper (inline editable) ───────────┐│
│ [−] [+1]      │ │ SEASON 1 LESSON                       ✎ Edit    ││
│ Aug 2026      │ │ R: You have no enemies. No one in this world... ││
│ MAPPA         │ └─────────────────────────────────────────────────┘│
│ [✎ Write]     │                                                   │
│ [↻ Log return]│ EPISODES  ○○○○●○○○○○○○●○○○○○○○○○○○  (24)          │ ← grid, ● = has memory
│               │  click cell → memory sheet / composer              │
│               │                                                   │
│               │ RETURNS — then → now                               │
│               │  First pass: "You have no enemies…"                │
│               │  27 Aug 2026 · Pass 2: "too good"                  │
│               │                                                   │
│               │ PEOPLE  [◉ Thors — "A true warrior needs no…"]    │
│               │ DETAILS (collapsible): dates, studios, romaji…    │
└───────────────┴──────────────────────────────────────────────────┘
```

- Header shows the series once; the left identity column reflects the **selected release** with explicit label "Season 1 (Prologue)". Edit actions live in ⋯ menus labelled "Edit season" / "Edit series" (fixes F1).
- Release switcher syncs to `?release=season-10` so links are shareable/back-button friendly.
- Lesson always expanded if ≤ 600 chars; longer → fade + "Continue reading".
- Inline edit: click ✎ or double-click paper → textarea in place, `⌘↵` save, `Esc` cancel, PATCH `notes`.
- Episode grid only when `total_episodes` known; otherwise list of noted episodes + "Add episode memory".
- Mobile: identity collapses into a compact header band (cover 72px + status/rating/progress row); sections follow, lesson first.

## Book detail (`/books/:id`)

Same folio: left = book cover, author, `StatusMark`, rating, page stepper, dates, genres; right = lesson paper (inline editable), then "Reading notes" (future-proof empty), details. No new fields.

## Reflections (`/reflections`) — new

```
Reflections  29                                   ⌕ Search words…
[All] [Lessons] [Episodes] [Returns] [People] [Books]   Sort: Newest ▾  Group: Title ▾

┌ paper ───────────────────────┐ ┌ paper ─────────────────────┐
│ Vinland Saga · Season 1      │ │ Klara and the Sun · Book    │   ← masonry, 2 cols
│ R: You have no enemies…      │ │ R: Exploration of lonelin…  │     (1 col mobile)
│ Aug 2026 · ★10        Open → │ │ ★9                  Open →  │
└──────────────────────────────┘ └─────────────────────────────┘
```

- Built from the same `lessons` aggregation the Desk uses today (extracted into `useReflections()`).
- Click → reading sheet with full text, copy, "Add a thought", "Open title". Search highlights matches.
- Replaces `ReadingRoomModal`.

## People (`/characters`)

```
People  5                         [All series ▾]   [+ Add character]
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ [◉]  Erwin Smith     │ │ [◉]  Himmel the Hero│ │ ...                 │
│      Attack on Titan │ │      Frieren        │
│ R: "The ultimate     │ │ R: "He never took   │
│ leader who bore the… │ │ for granted…"       │
│ ▢▢▢ stills (if any)  │ │                     │
└─────────────────────┘ └─────────────────────┘
```

- `why` visible on the card (3–4 lines, clamp); missing → "Why do they matter? ✎".
- Click → side sheet (restyled `CharacterDetailModal`): portrait, full why (inline editable), stills strip, link to series.
- Edit/delete in ⋯.

## Returns (`/rewatches`)

- Keep year-grouped timeline; card headline = **series title**, sub = release ("Season 1 · Pass 2").
- Each card shows **Then → Now**: the original release lesson (paper-ink-2, smaller) above the return note (full). If no original lesson: just the return note.
- Toggle "Timeline | By title" (by title groups passes per release, ordered).
- Rating shown only when it differs from the previous pass (with ↑/↓), else omitted (R3).
- Click → side sheet (restyled `RewatchDetailModal`).

## Media (`/media`) & Export

- Media: same features; restyled with primitives — folder list becomes a slim left column, grid of thumbnails with hover actions, drag-drop zone appears on drag only (not a permanent banner).
- Export/Import: moves from Desk header button into sidebar utility → sheet (restyled `ExportModal`).

## Catalog forms (EntryModal, RewatchModal, CharacterModal)

- Become sheets with **steps**: 1) Find (MAL search first, big), 2) Basics (title, status, progress, rating), 3) Optional details (romaji/japanese, studios, genres, dates, cover). Lesson field removed from catalog forms by default — after saving, the composer opens on the new title ("Want to write what stayed?"). Existing edit flows keep a "Lesson" field in step 2 for parity.
