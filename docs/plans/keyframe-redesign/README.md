# AnimeLog "Keyframe" Redesign Plan

| Field | Value |
|-------|-------|
| **Branch** | `design/keyframe-redesign` |
| **Approved** | 2026-11-07 |
| **Progress** | See [PROGRESS.md](./PROGRESS.md) for what's done and where to start |
| **Replaces** | The visual direction in `docs/plans/premium-journal-redesign/`. Its shell, Composer and Reflections structure are reused. |

## Context

The Lamplight redesign improved the structure, but the app still doesn't feel smooth or exciting for an anime fan. The causes are deeper than color:

| Problem | Evidence |
|---------|----------|
| **No anime art** | The database has **0 images**, so all 6 series, 4 books and 5 characters show generated placeholders. |
| **Every action feels slow** | Each +1 or save waits for the server, then refetches 5 endpoints (`refreshAll`, `JournalContext.tsx:299`). Nothing updates optimistically. |
| **Navigation forgets things** | Filters, selected season and open items aren't in the URL. Rows on Home open a list page, not the item. There are no page transitions. |
| **Words are hard to learn** | One idea has many names: Desk/Today, Returns/Rewatches/Seen Again/Return Pass, People/Characters, Lesson/Reflection/Memory/Takeaway, Franchise/Release/Edition. |
| **No reason to come back** | Ticking an episode gives no reward. Finishing a season has no moment. There is no progress, collection or history to enjoy. |
| **The styling can't stay consistent** | 6,453 lines of CSS, including a 3,575-line `index.css`, 400+ inline styles in the worst files, 89 `any` types and about 12 different mobile breakpoints. Tokens such as `--graphite`, `--ember` and `--cel` are used but never defined. |

**Goal:** opening the app feels like opening your own anime collection. Logging an episode takes one tap and feels great, and writing remains the most rewarding action.

**Your decisions:** Keyframe look, full fan RPG layer, one small backend activity table, and desktop and phone treated equally.

**Limit of this audit:** I reviewed the code and your database, but couldn't view the running app in a browser. Phase 0 captures real screenshots as the baseline, and they may add findings.

## Bugs to fix first (Phase 0)

| # | Bug | Where |
|---|-----|-------|
| 1 | **Your notes can be erased.** "Write Reflection" and "Add thought" open the Composer without the existing note, so saving **replaces the whole season, movie or book lesson**. "Add thought" on an episode or rewatch memory replaces the season lesson too. | `Composer.tsx:142`, `JournalContext.tsx:254`, `DashboardView.tsx:368` |
| 2 | Saving a memory for an episode that already has one fails, because it always creates a new note and the database allows one per episode. | `Composer.tsx:160` |
| 3 | Rewatches can appear under the wrong release, because IDs are compared without checking the type (season 1 vs movie 1). | `FranchiseDetailView.tsx:144` |
| 4 | Library filter counts don't match the results. On Hold and Dropped titles get labeled "Up next". | `AnimeView.tsx:53-99` |
| 5 | "Write what stayed" on a movie-only series sends the series ID as a season ID, which can target the wrong season. | `AnimeView.tsx:302` |
| 6 | "Add rewatch" always preselects the first series in the list. | `App.tsx:349` |
| 7 | Using −1 after a season auto-completes leaves it marked Completed, which would also break Undo. | `views.py:91` |

Bugs 1 and 2 are fixed with a test or scripted check before any visual work starts.

Phase 0 also found and fixed these, which weren't known when the plan was written: delete confirmations that never appeared, a character form crash from a missing icon import, Write actions on book pages and character cards that dropped your text, Add Book opening in an invalid mode, broken toast dismissal, and wrong cover and rating props on the book page.

## Design direction: Keyframe

> A night studio. Your anime's art glows on screen, and your thoughts sit on animator's key-frame paper.

This stays specific to anime rather than a generic dark dashboard with purple gradients.

### Color

| Role | Value | Rule |
|------|-------|------|
| Background / panel / raised | `#0D1017` / `#171B25` / `#212734` | Ink blue, so colorful art stands out |
| Text / secondary | `#F2F4F8` / `#A8B0C0` | Must meet 4.5:1 contrast |
| Brand action | `#FF5A36` vermilion, with dark text | One main action per screen |
| Reward gold | `#FFC857` | **Only** for XP, achievements and 9–10 ratings, so it always feels earned |
| Writing paper | `#F4F6F1`, pencil-blue rules `#8FB0D9`, peg holes | Only where your words are read or written |
| Per-title accent | Taken from the cover art | Fades in behind the title page, limited in brightness so text stays readable |

Status colors are always paired with an icon and label: Watching (accent), Completed (teal `#4FD1B5`), Plan (blue `#7EA8FF`), On Hold (amber `#E8B14C`), Dropped (gray `#7B8291`).

### Type, shape and motion

- **Titles:** Archivo in a bold, condensed width, like an anime title card.
- **Interface:** Geist. **Your writing:** Literata. **Japanese titles:** Noto Sans JP, set vertically on title pages.
- **Scales:** one spacing scale, one type scale, and only two breakpoints (640px and 1024px).
- **Motion rules:**
  - Taps respond within 100ms.
  - Posters morph into the title page hero using the View Transitions API, falling back to a simple fade.
  - Rewards animate; routine navigation stays quick.
  - All of it respects `prefers-reduced-motion`.

### Plain fan vocabulary

| Use everywhere | Replaces |
|----------------|----------|
| Home | Desk, Today |
| Rewatch | Return, Return Pass, Seen Again |
| Characters | People, People Remembered |
| Note (with Episode, Season, Movie or Book in front) | Lesson, Reflection, Memory, Takeaway |
| Series, Season, Movie | Franchise, Release, Edition, Film |

The backend field names don't change.

## Navigation

```
Desktop rail / phone tabs
Home  |  Library  |  [ + ]  |  Journal  |  Me
         Anime · Books · Characters
```

| Destination | URL | Change |
|-------------|-----|--------|
| Home | `/` | Rebuilt |
| Library | `/anime`, `/books`, `/characters` | One section with three tabs; existing URLs stay |
| Title page | `/anime/:id?release=season-12&ep=14` | Season and episode become shareable and survive Back |
| Character | `/characters/:id` | New real page |
| Book | `/books/:id` | Same structure as a title page |
| Journal | `/journal?kind=rewatch` | Combines Reflections and Rewatches; `/reflections` and `/rewatches` redirect here |
| Me | `/me`, `/me/recap/:year` | New: level, achievements, stats, recap |
| Settings | `/settings` | Holds Media, Export, Import and game-layer toggles; `/media` redirects here |

Rules across the app:
- Every card is a real link, so keyboard, middle-click and Back all work.
- Filters and sorting live in the URL, and scroll position is restored on Back.
- The **+** button opens Quick Log.
- Shortcuts: `⌘K` or `/` search, `W` write, `N` new title, `+` next episode, `?` shortcut list.

## The habit loop

```
Watch an episode → open app → +1 (one tap) → one-line note (optional)
       ↑                                              ↓
 "next up" + an old note resurfaces ←  XP, lit episode, progress
```

### Progression (RPG layer)

All of it is calculated from your journal, so it can't drift out of sync, and editing or deleting updates it correctly.

| Action | XP |
|--------|----|
| Episode watched | 1 |
| Episode note | 5 |
| Character "why" | 10 |
| Season, movie or book note, or rewatch note | 15 |
| Finish a season or movie | 20 |

- **Levels:** Newcomer → Regular → Binger → Otaku → Critic → Sensei. Writing earns far more than watching, which protects the app's purpose as a journal.
- **Streak:** a day counts with any activity, and one rest day per week is automatically forgiven. It never shows red, "you lost it" messages or notifications.
- **Achievements (about 20):** examples are *First Cour* (finish 12+ episodes), *Long Runner* (100+ episodes), *Every Episode Counts* (a note on every episode of a season), *Changed My Mind* (a rewatch rating 2+ away from the original) and *Studio Loyalist* (3 titles from one studio).
- **Character cards:** Sketch (name) → Inked (portrait) → Full Color (portrait and why) → Foil (3+ images). You upgrade cards by caring about the character; there are no random drops.
- **Finale moment:** reaching the last episode opens a full-art screen with rating, "what stayed with you?", XP and a shareable card.
- **Your control:** XP, streak and celebrations can each be switched off in Settings.

## Every page

### Home
1. **Hero:** the most recently active title with blurred key art, large poster, "Ep 14 of 28", **+1 Episode** and **Note**.
2. **Continue row:** other titles in progress, each with one-tap +1, sorted by last activity.
3. **Today strip:** level bar, streak, this week's episodes, and the nearest achievement ("2 notes from Every Episode Counts").
4. **A note from your past:** on paper. Prefers "on this day", then "then vs now", then a daily pick.
5. **Finish the story:** completed titles or characters with no note yet (rewards shown).
6. **Next up:** your Plan to Watch shelf.

The first screen avoids generic greetings and always answers "what do I do next?"

### Anime library
- Poster wall with cover, title, status, progress bar and rating; a hover or focus reveal shows your latest note and +1.
- Filters: Watching, Completed, Plan, On Hold, Dropped, with correct counts, plus genre and studio.
- Sort: last activity, rating, title, season aired or finish date.
- Shelf views: Grid, List, **By Year** and **Hall of Fame** (10/10s).
- Titles with no note get a subtle pencil badge instead of a text button.

### Title page
- Full-width hero: key art backdrop, per-title accent, vertical Japanese title, season tabs, +1, Note, Rewatch, and Edit inside a menu.
- Tabs: **Overview · Episodes · Characters · Rewatches · Details**, with the note on paper at the top of Overview.
- **Episode map (the signature feature):** a dope-sheet grid where watched episodes light up, noted episodes glow, and rating sets the color. Selecting one opens a side panel with its note, without leaving the page. Next and Previous work with arrow keys.
- **Then vs now:** rewatches compare side by side with the original note and rating, with a rating-change indicator.
- Phone: compact hero, with +1 fixed in a thumb-reach bar.

### Quick Log and Composer (replaces multiple note modals)
- **After +1:** an inline card appears: "Ep 15, how was it?", with quick rating, one line and **Undo**. Ignoring it is fine.
- **Composer:** side panel on desktop, full sheet on phone. Pick a target, write on paper, save with `⌘↵`.
- It always shows the existing note, with **Add to note** as the default and **Edit full note** as an explicit choice. Drafts autosave.

### Characters
- Collectible card wall with a visible card tier and series filter. The why appears on the card rather than behind a link.
- Character page: large portrait, why on paper, image gallery, series link, and the next step to upgrade the card.

### Books
- Same library and detail structure as anime, with cover wall, +pages, finale moment and notes. It reuses the same components with book-specific wording and a chapter or page progress bar in place of the episode map.

### Journal
- A timeline of all your writing, grouped by month, with artwork beside each note.
- Filters: All, Episode, Season, Movie, Book, Character, Rewatch. Includes full-text search.
- **Read mode:** one note at a time on paper, with arrow keys. **Make card** connects the existing `cardGenerator.ts`.
- The Rewatch filter becomes the then-vs-now timeline.

### Me
- Level and XP, streak, and a GitHub-style activity calendar.
- Achievements: earned, plus locked ones with progress.
- Stats: episodes, estimated hours, top genres, top studios, rating spread, and titles finished per season of the year.
- Your all-time favorites: Hall of Fame and top characters.

### Yearly recap (`/me/recap/:year`)
A swipeable, story-style recap: hours, top title, top genre, most-written-about character, your best note, and a downloadable card. The full-color version appears once a year has enough data.

### Add title
Search first, using the existing lookup, and choosing a result fills in art and details. Then choose status and progress and you're done. Everything else stays under "More details". This replaces the 858-line, four-mode `EntryModal` with smaller focused forms.

### Search (`⌘K`)
Finds titles, characters and note text, and runs actions such as "+1 Frieren", "write about Erwin" or "go to Achievements". Recent items show first.

### Settings
Media library (restyled, lower priority), Export and Import, game toggles, and **Find Art**.

### Shared states
- **Loading:** cached data shows instantly, then refreshes quietly. Skeletons appear only on the very first load.
- **Empty:** each page shows a useful next action, not just a message.
- **Error:** inline, with Retry. Failed optimistic updates roll back with an explanation.

## Technical approach

### Find Art (brings real art in first)
A guided screen for the 6 series, 10 seasons, 2 movies, 4 books and 5 characters that shows the best matches. You confirm each match, because automatic picks can be wrong. **It needs no new backend work:** it uses `lookupApi` and `imageApi.importUrl` (already allow-listed and deduplicated). Lookups run one at a time at about one per second to respect Jikan's limits. Imports need working Cloudinary credentials in your `.env`.

`Cover` gains sized Cloudinary thumbnails and fade-in loading, and its accent color is cached per image. If color extraction is blocked by CORS, it falls back to the existing `getClothTone` hash in `lib/hash.ts`. Phase 4 tests this first.

### Smoothness
- **Optimistic updates:** the screen changes immediately, then uses the server's response to patch only that item instead of calling `refreshAll`. Rapid taps are combined, and failures roll back.
- **Fast startup:** the last journal snapshot is cached locally and shown instantly on open.
- **Fewer re-renders:** split the 781-line `JournalContext` into data, actions and UI, with shared calculations moved to pure selectors (`lib/selectors`), including the logic now duplicated across views.
- **Router:** move to `createBrowserRouter`, with `ScrollRestoration`, lazy-loaded pages and view transitions.
- **One panel system:** consolidate modals into one `Sheet` with focus trapping, then remove GSAP once nothing uses it.

### Backend activity table (Django)
- **Model:** `ActivityEvent` with `kind` (`TextChoices`), target type and ID, a saved title (so history survives deleting a title), `delta`, and `created_at`.
- **Writing:** a single `record_activity()` service, called from `_update_release_progress`, the note, rewatch and character saves, and the MCP tools. Bulk imports don't count toward streaks.
- **Reading:** read-only `GET /api/activity/?since=` returning plain DRF JSON, following the repo's API rules.
- **Backfill:** a data migration creates events from existing start, finish and note dates, marked as backfilled.
- **Fix:** −1 from a completed season returns it to Watching, supporting Undo.
- **Tests:** added to `Backend/animeLog/tests.py`. This phase's Django lesson is data migrations.

No quote, tag or highlight models are added, as `AGENTS.md` requires.

### Code structure
- `Frontend/src/styles/`: new tokens, cascade layers, and one style file per component. `index.css`, `dashboard.css`, `detail-redesign.css` and the legacy aliases are removed by the end.
- `Frontend/src/ui/`: extend the existing primitives (`Button`, `Cover`, `Sheet`, `Rating`, `Progress`, `Skeleton`, `EmptyState`), then add `PosterCard`, `Hero`, `EpisodeMap`, `CharacterCard`, `XpBar`, `AchievementBadge`.
- `Frontend/src/features/`: `home`, `library`, `title`, `characters`, `journal`, `me`, `settings`, `add-title`.
- `Frontend/src/lib/progression/`: pure XP, level, streak and achievement functions with **Vitest** tests.
- Reuse: `useReflections`, `lib/status.ts`, `composer/drafts.ts`, `SmartMetadataSearch`, `cardGenerator.ts`, and the shell's palette and shortcuts.
- Delete unused components. The first 13 went in Phase 0; anything else replaced by the rebuild goes in Phase 12.
- Add a `typecheck` script (`tsc --noEmit`) because `vite build` doesn't check types, and run it in CI.
- Update `AGENTS.md`, `Frontend/AGENTS.md` and `Frontend/design.md`, whose visual direction and vocabulary this redesign replaces.

## Phases

Work happens on `design/keyframe-redesign`. The app keeps working after every phase, and each phase gets its own commit. Current status is in [PROGRESS.md](./PROGRESS.md).

| # | Phase | Result | You check |
|---|-------|--------|-----------|
| 0 | **Safety and baseline** | Bugs 1–7 fixed; screenshots of every page at 1440px and 390px | Notes can no longer be overwritten |
| 1 | **Keyframe foundation** | Tokens, fonts, primitives, a dev-only `/__style` page using your real titles | **Approve the look before anything is rebuilt** |
| 2 | **Smooth engine** | Optimistic updates, cached startup, new router, split context, single Sheet | +1 feels instant |
| 3 | **Shell and navigation** | Rail, phone tabs, Library tabs, redirects, new vocabulary, search upgrades | You can find everything easily |
| 4 | **Find Art** | Cover pipeline, per-title color, your library filled with real art | The app starts to look like yours |
| 5 | **Activity and progression** | Backend table, backfill, XP, levels, streak, achievements | Numbers look right against your data |
| 6 | **Home and Quick Log** | New Home, +1 flow, Composer, rewards | **The main habit loop works** |
| 7 | **Anime library and title page** | Poster wall, hero, episode map, then vs now, finale | Core browsing |
| 8 | **Characters and Books** | Card wall, character pages, Books matched to anime | Collection feel |
| 9 | **Journal** | Timeline, read mode, cards, rewatches | Rereading is enjoyable |
| 10 | **Me and Recap** | Stats, calendar, achievements page, yearly recap | Reason to return |
| 11 | **Add title and Settings** | Search-first add, smaller forms, Media and Export moved | Adding takes under 15 seconds |
| 12 | **Final polish** | Remove legacy CSS and GSAP, accessibility and performance pass, update docs | Final sign-off |

If you'd like a win early, Phases 0, 2, 4 and 6 give the biggest improvement in feel.

## Verification

**Every phase**
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` (from `Frontend/`)
- `python manage.py test` when the backend changes
- Playwright run at 1440×900 and 390×844, covering create, edit, empty, error and loading states, with before and after screenshots

**End-to-end path**
1. Find art for a title.
2. Open it from the library, and confirm the poster transition plays and Back restores your filter and scroll.
3. Press +1 and add a one-line note.
4. Confirm the episode lights up, XP updates, and the activity calendar shows today.
5. Undo, and confirm everything reverts.
6. Add to an existing note, and **confirm the original text remains**.
7. Finish a season, and confirm the finale, status and finish date.
8. Reload, and confirm all of it persisted.

**Targets**

| Measure | Target |
|---------|--------|
| +1 visual response | Under 100ms, including on a throttled connection |
| Reopen to usable Home | Under 1 second from cache |
| Log an episode from Home | 1 tap |
| Text contrast, including per-title accents | At least 4.5:1 |
| Keyboard | Everything reachable, with visible focus and working Escape |
| Phone | Tap targets at least 44px, no sideways scrolling |
| Reduced motion | All non-essential animation off |
| Failed save | Rolls back, explains, and keeps your text |
| Legacy styling at the end | No undefined tokens, `lamplight-*` classes or hard-coded colors outside tokens |
