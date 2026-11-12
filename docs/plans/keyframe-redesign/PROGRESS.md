# Keyframe Redesign Progress

Last updated: 2026-11-13. Full plan: [README.md](./README.md).

## Start here

**Next up: Phase 11, Add title and Settings.** Phases 0 to 10 are done, and the Keyframe Journal (Read mode, Then vs Now), Me dashboard (activity heatmap, 20 achievements, analytics), and Yearly Recap story deck are live.

1. Check out the branch: `git checkout design/keyframe-redesign && git pull`
2. Start the app (two terminals):
   ```bash
   cd Backend && .venv/bin/python manage.py runserver
   cd Frontend && npm run dev
   ```
3. Open http://localhost:5173 for the app (Settings → **Find Art** at `/settings/find-art`), or http://localhost:5173/__style for the approved design.
4. Work through Phase 11 in [README.md](./README.md), then update this file in the same commit as the work.

## Status

| # | Phase | Status | Commit | You check |
|---|-------|--------|--------|-----------|
| 0 | Safety and baseline | ✅ Done | `49e4bee` | Notes can no longer be overwritten |
| 1 | Keyframe foundation | ✅ Done, look approved | `ba647be` | `/__style` |
| 2 | Smooth engine | ✅ Done | `8c3a901` | +1 feels instant |
| 3 | Shell and navigation | ✅ Done | `fa06d84` | You can find everything easily |
| 4 | Find Art | ✅ Done | `85fd848` | The app starts to look like yours |
| 5 | Activity and progression | ✅ Done | `0a59346` | Numbers look right against your data |
| 6 | Home and Quick Log | ✅ Done | `57e3fdc` | The main habit loop works |
| 7 | Anime library and title page | ✅ Done | `a29217d` | Core browsing |
| 8 | Characters and Books | ✅ Done | `a2fbf30` | Collection feel |
| 9 | Journal | ✅ Done | `c4269e3` | Rereading is enjoyable |
| 10 | Me and Recap | ✅ Done | `0132c1b` | Reason to return |
| 11 | Add title and Settings | 👉 **Next** | | Adding takes under 15 seconds |
| 12 | Final polish | Not started | | Final sign-off |

## Phase 10 checklist

- [x] Keyframe `MePage` (`Frontend/src/features/me/`) with Level & XP bar, streak card with auto-forgiven rest-day guidance, GitHub-style activity calendar from `activityList`, all 20 achievements (unlocked + in-progress), analytics (episodes, hours, top genres, top studios, 1–10 rating spread, seasonal breakdown), Hall of Fame, and Top Characters
- [x] Interactive swipeable `RecapPage` (`/me/recap/:year`) with 6 story slides, Arrow-key & touch-swipe controls, full-color vs calm sketch edition threshold, and downloadable Recap & Quote cards

## Phase 9 checklist

- [x] Keyframe `JournalPage` (`Frontend/src/features/journal/`) with monthly chronological timeline, artwork links alongside every entry on `NotePaper`, URL-synced kind filters & full-text search
- [x] Single-note `<dialog>` `Read mode` with `ArrowLeft`/`ArrowRight` navigation and `Make card` (`downloadQuoteCard`)
- [x] Dedicated `Then vs Now` timeline for the `Rewatch` filter comparing original vs rewatch notes & rating deltas

## Phase 8 checklist

- [x] Keyframe `CharactersPage` (`Frontend/src/features/characters/`) with collectible `KfCharacterCard` wall (visible `why`, tier filter badges `Sketch`/`Inked`/`Full color`/`Foil`, URL-synced series & tier filters)
- [x] Dedicated `/characters/:characterId` `CharacterDetailPage` with blurred hero, `--title-accent`, upgrade progress tracker toward Foil, `why` on `NotePaper`, portrait gallery (upload/Media Library picker/set cover/remove/lightbox), and series link
- [x] Keyframe `BooksLibraryPage` and `BookDetailPage` (`Frontend/src/features/books/`) matching Anime library and Title page patterns with page progress bars, `+10p`/`+1p` steppers triggering Quick Log & Finale, `NotePaper`, and Manage Edit/Delete menu

## Phase 7 checklist

- [x] Keyframe `AnimeLibraryPage` (`Frontend/src/features/library/`) with status filter counts (`overallSeriesStatus`), Genre & Studio filters, Sort (`recent`, `rating`, `title`, `aired`, `note`), 4 shelf views (`Grid`, `List`, `By Year`, `Hall of Fame`), URL query sync, and `+1` / note controls outside links
- [x] Keyframe `TitlePage` (`Frontend/src/features/title/`) with full-width blurred hero (`--title-accent`, vertical Japanese title, season/movie switcher), `+1` / `Note` / `Rewatch` / `⋯` Manage menu (restoring Series & Season Delete), interactive `EpisodeMap` with arrow-key side inspector on `NotePaper`, `Then vs now` rewatches with rating delta, and sticky phone action bar

## Phase 6 checklist

- [x] Keyframe `HomePage` (`Frontend/src/features/home/`) with most-recent Hero (`--title-accent`, blurred key art, `+1 Episode` / `Note`), Continue row, Momentum Today strip (XP, streak, weekly episodes, nearest achievement), A note from your past on `NotePaper`, Finish the story cards, and Next up shelf
- [x] Post-`+1` non-blocking `QuickLogBar` with quick 1–10 score pills, 1-line note (append-safe), `Full note` handoff, and instant `Undo`
- [x] Native `<dialog>` `FinaleCelebration` modal when completing a season/movie/book with `celebrations` enabled, XP breakdown, `"What stayed with you?"` paper note, and `downloadQuoteCard` sharing
- [x] Keyframe `Composer` side drawer / mobile sheet preserving existing-note preview, `Add to note` default, explicit `Edit full note` toggle, autosaved drafts, and `⌘↵` save

## Phase 5 checklist

- [x] `ActivityEvent` model (`EPISODE_PROGRESS`, `MOVIE_PROGRESS`, `BOOK_PROGRESS`, `NOTE_WRITTEN`, `CHARACTER_ADDED`, `REWATCH_LOGGED`, `COMPLETED`) with `0008_activityevent` schema migration and `0009_backfill_activity` data migration (`backfilled=True`)
- [x] Activity hooks on REST views (`_update_release_progress`, seasons, movies, books, episode notes, rewatches, characters) and MCP tools, leaving bulk import untouched
- [x] `GET /api/activity/` endpoint supporting `?since=` and `?limit=`, wired via `activityApi.list` into `JournalContext` (`activityList` + `animelog_snapshot_v2` cache + optimistic progress updates)
- [x] Progression engine (`Frontend/src/lib/progression/`): XP weights (`1/5/10/15/20`), levels (`Newcomer` through `Sensei`), streak with 1-rest-day forgiveness per 7-day window (ignoring backfill and negative undo), and all 20 achievements (`progression.test.ts` verified)

## Phase 4 checklist

- [x] Cloudinary thumbnail URL helper (`Frontend/src/lib/images/cloudinary.ts`) with `thumb` (160px), `card` (420px), and `hero` (900px) presets
- [x] Per-image cover accent cache (`Frontend/src/lib/color/accentCache.ts`, `useCoverAccent.ts`) backed by `localStorage` (`animelog_cover_accent_v1`), falling back to `getClothTone` hash (`titleFallbackAccent`) when CORS blocks pixel access
- [x] Upgrade `Cover` and `CoverArt` with sized Cloudinary thumbnails, fade-in loading respecting `prefers-reduced-motion`, clean URL-change state reset, `fetchPriority`, and CORS retry
- [x] Wire sized covers and per-title accents into `PosterCard`, `FranchiseDetailView`, `BookDetailView`, `DashboardView`, `AnimeView`, `BookView`, and `CharacterCard`
- [x] Guided Find Art screen (`/settings/find-art`) for all series, seasons, movies, books, and characters with 1.1s rate-limited lookups, manual query search, local upload fallback, and explicit match confirmation
- [x] Surface Find Art in Settings (`/settings`) with live missing-art count and in the Command Palette (`⌘K`)

## Phase 3 checklist

- [x] Desktop rail and phone tabs: Home, Library, +, Journal, Me (restyle `Frontend/src/shell/`)
- [x] Library section with Anime, Books and Characters tabs, keeping their existing URLs
- [x] New vocabulary everywhere (table in the [plan](./README.md#plain-fan-vocabulary))
- [x] Filters and sorting in the URL, plus `?release=` and `?ep=` on title pages
- [x] Redirect `/reflections` and `/rewatches` to `/journal`, and `/media` to `/settings`
- [x] Add placeholder `/journal`, `/me` and `/settings` routes in `Frontend/src/app/router.tsx`
- [x] Every card becomes a real link, and rows on Home open the item rather than a list
- [x] Search finds note text and runs actions, and `?` shows the shortcut list
- [x] Move Keyframe tokens from `.kf` to `:root` once the shell uses them

## Phase 2 results

Tested in a browser against a copy of the database:

| Check | Result |
|-------|--------|
| +1 response with a 1.5-second server delay | 13ms (target under 100ms) |
| Reopen with a 3-second API delay | 796ms on the dev server (target under 1 second) |
| Three quick taps | One request for +3, and the saved total was correct |
| Failed save | Rolls back and explains |
| Server unreachable, with a saved copy | Shows the journal and a notice |
| Server unreachable, no saved copy | Shows an error with a working Try again |
| Back button | Restores scroll position |
| Dialogs | Tab stays inside, Escape closes, focus returns, typing isn't interrupted |

## Before each commit

```bash
# From Frontend/
npm run typecheck && npm run lint && npm test && npm run build
# From Backend/, when backend code changed
.venv/bin/python manage.py test animeLog
```

Test flows that write data against a copy of the database, never the real `Backend/db.sqlite3`. Check each screen at 1440×900 and 390×844.

## Things to know

- **Design tokens are on `:root`.** Keyframe tokens (`--kf-*`) in `Frontend/src/styles/keyframe.css` are now defined on `:root, .kf` and imported globally in `Frontend/src/index.css`. New primitives are in `Frontend/src/ui/keyframe/`.
- **Reading journal data:** use `useJournalData`, `useJournalActions` or `useJournalUI` from `Frontend/src/state/JournalContext.tsx`. Each one re-renders only for what it covers, and actions never change identity.
- **Progress changes** go through `handleSeasonProgressDelta` and its movie and book versions. `Frontend/src/lib/journal/progress.ts` predicts the server's result, so if the rules in `_update_release_progress` change, change both.
- **Routes** are in `Frontend/src/app/router.tsx`, and page wiring is in `Frontend/src/app/pages.tsx`.
- **Dialogs:** any new dialog should use `useDialog` (`Frontend/src/ui/Sheet/useDialog.ts`). Older modals have its keyboard behavior but keep their own look and GSAP animation until they are rebuilt in Phases 7 to 11. GSAP is removed in Phase 12.
- **Saved copy:** the last journal is stored in the browser as `animelog_snapshot_v1`. Change the version in `Frontend/src/state/journalCache.ts` if the data's shape changes.
- **The `/__style` page saves nothing** and is left out of production builds. Remove it in Phase 12.
- **Stepping back from a finished release reopens it.** −1 returns it to Watching, and clears the finish date only if it was set today. This replaced earlier behavior on purpose, to support Undo.
- **Series and seasons can't currently be deleted from the UI.** The buttons were lost in the last redesign. They return in the title page menu in Phase 7.

## Not yet tested

- **Live external art lookup & Cloudinary upload.** Jikan and Cloudinary were unreachable from this sandboxed environment, so the Find Art runner, offline auto-pause banner, rate-limit spacing, Confirm & Save flow, and CORS-enabled / CORS-blocked cover accent extraction were verified in Playwright against mocked network responses and a temporary copy of `db.sqlite3`. Run `/settings/find-art` locally with internet access to populate real artwork for your 27 entries.
- **Note on PR #5 body:** The GitHub PR description still reflects Phases 0–2 and should be refreshed when ready.

## Decisions

| Decision | Choice |
|----------|--------|
| Visual direction | Keyframe: ink-blue night studio, per-title accent, key-frame paper for your writing |
| Game layer | Full fan RPG, with XP, streak and celebrations each switchable in Settings |
| Backend | One small `ActivityEvent` table (Phase 5) |
| Devices | Desktop and phone treated equally |
