# Keyframe Redesign Progress

Last updated: 2026-11-07. Full plan: [README.md](./README.md).

## Start here

**Next up: Phase 2, Smooth engine.** Phases 0 and 1 are done, and the Keyframe look is approved.

1. Check out the branch: `git checkout design/keyframe-redesign && git pull`
2. Start the app (two terminals):
   ```bash
   cd Backend && .venv/bin/python manage.py runserver
   cd Frontend && npm run dev
   ```
3. Open http://localhost:5173 for the app, or http://localhost:5173/__style for the approved design.
4. Work through the [Phase 2 checklist](#phase-2-checklist), then update this file in the same commit as the work.

## Status

| # | Phase | Status | Commit | You check |
|---|-------|--------|--------|-----------|
| 0 | Safety and baseline | ✅ Done | `49e4bee` | Notes can no longer be overwritten |
| 1 | Keyframe foundation | ✅ Done, look approved | `ba647be` | `/__style` |
| 2 | Smooth engine | 👉 **Next** | | +1 feels instant |
| 3 | Shell and navigation | Not started | | You can find everything easily |
| 4 | Find Art | Not started | | The app starts to look like yours |
| 5 | Activity and progression | Not started | | Numbers look right against your data |
| 6 | Home and Quick Log | Not started | | The main habit loop works |
| 7 | Anime library and title page | Not started | | Core browsing |
| 8 | Characters and Books | Not started | | Collection feel |
| 9 | Journal | Not started | | Rereading is enjoyable |
| 10 | Me and Recap | Not started | | Reason to return |
| 11 | Add title and Settings | Not started | | Adding takes under 15 seconds |
| 12 | Final polish | Not started | | Final sign-off |

## Phase 2 checklist

- [ ] Progress changes update the screen immediately, combine rapid taps, and roll back with an explanation on failure
- [ ] Saves patch only the changed item from the server's response, replacing `refreshAll` where possible (`Frontend/src/state/JournalContext.tsx`)
- [ ] The last journal snapshot is cached locally and shown instantly on open
- [ ] `JournalContext` is split into data, actions and UI, with shared calculations in `Frontend/src/lib/selectors/`
- [ ] Router moved to `createBrowserRouter`, with `ScrollRestoration`, lazy-loaded pages and view transitions
- [ ] Modals consolidated toward one `Sheet` with focus trapping
- [ ] Target met: +1 responds in under 100ms on a throttled connection

## Before each commit

```bash
# From Frontend/
npm run typecheck && npm run lint && npm test && npm run build
# From Backend/, when backend code changed
.venv/bin/python manage.py test animeLog
```

Test flows that write data against a copy of the database, never the real `Backend/db.sqlite3`. Check each screen at 1440×900 and 390×844.

## Things to know

- **Design tokens are still scoped.** Keyframe styles apply only inside `.kf` (`Frontend/src/styles/keyframe.css`), so existing pages keep the old look until they are rebuilt. New primitives are in `Frontend/src/ui/keyframe/`.
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
