# Keyframe Redesign Progress

Last updated: 2026-11-08. Full plan: [README.md](./README.md).

## Start here

**Next up: Phase 4, Find Art.** Phases 0, 1, 2 and 3 are done, and the Keyframe shell and navigation are live.

1. Check out the branch: `git checkout design/keyframe-redesign && git pull`
2. Start the app (two terminals):
   ```bash
   cd Backend && .venv/bin/python manage.py runserver
   cd Frontend && npm run dev
   ```
3. Open http://localhost:5173 for the app, or http://localhost:5173/__style for the approved design.
4. Work through Phase 4 in [README.md](./README.md), then update this file in the same commit as the work.

## Status

| # | Phase | Status | Commit | You check |
|---|-------|--------|--------|-----------|
| 0 | Safety and baseline | ✅ Done | `49e4bee` | Notes can no longer be overwritten |
| 1 | Keyframe foundation | ✅ Done, look approved | `ba647be` | `/__style` |
| 2 | Smooth engine | ✅ Done | `8c3a901` | +1 feels instant |
| 3 | Shell and navigation | ✅ Done | | You can find everything easily |
| 4 | Find Art | 👉 **Next** | | The app starts to look like yours |
| 5 | Activity and progression | Not started | | Numbers look right against your data |
| 6 | Home and Quick Log | Not started | | The main habit loop works |
| 7 | Anime library and title page | Not started | | Core browsing |
| 8 | Characters and Books | Not started | | Collection feel |
| 9 | Journal | Not started | | Rereading is enjoyable |
| 10 | Me and Recap | Not started | | Reason to return |
| 11 | Add title and Settings | Not started | | Adding takes under 15 seconds |
| 12 | Final polish | Not started | | Final sign-off |

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

- **Real cover art.** The art service (Jikan) was unreachable from the environment used for Phases 0 and 1, so layouts were checked with synthetic images and generated covers. `/__style` tries real art when the service is reachable.
- **Reading colors from real covers.** If an image host blocks it, the title uses a fixed color based on its name. Test this first in Phase 4.
- **Importing art** needs working Cloudinary credentials in `Backend/.env`.

## Decisions

| Decision | Choice |
|----------|--------|
| Visual direction | Keyframe: ink-blue night studio, per-title accent, key-frame paper for your writing |
| Game layer | Full fan RPG, with XP, streak and celebrations each switchable in Settings |
| Backend | One small `ActivityEvent` table (Phase 5) |
| Devices | Desktop and phone treated equally |
