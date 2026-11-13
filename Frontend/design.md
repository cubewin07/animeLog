# Keyframe: Visual & Design System

Personal anime & book journal designed around memories and lessons.

## Core Philosophy

1. **Memories & Lessons First**: Catalog fields (status, progress, rating) give each title a home so notes on series, seasons, movies, episodes, books, rewatches, and characters (`why`) take visual precedence.
2. **Ink-Blue Night Studio + Animation Key-Frame Paper**:
   - **Night Studio (`--kf-bg: #0d1017`, `--kf-panel: #171b25`, `--kf-raised: #212734`)**: Deep animation-studio dark surfaces for posters, hero backdrops, progression rails, and controls.
   - **Key-Frame Paper (`--kf-paper: #f4f6f1`, `--kf-paper-ink: #1e2430`, `--kf-paper-rule: rgba(143, 176, 217, 0.55)`)**: Cool white key-frame drawing paper reserved exclusively for reading and writing your notes (`NotePaper`). Never wrap a `NotePaper` slip inside redundant dark chrome.
   - **Per-Title Color Accent (`--title-accent`)**: Extracted automatically from each title's cover image (with a deterministic title fallback when CORS blocks pixel inspection) and applied inline via `--title-accent` on hero banners, accents, and badges.
   - **Vermilion Brand (`--kf-brand: #ff5a36`)**: Primary `+1` and commit actions.
   - **Reward Gold (`--kf-gold: #ffc857`)**: Reserved strictly for XP, achievements, and high 9–10 ratings (`ScoreTag`).
   - **Semantic Status & Danger**: Teal (`--kf-completed: #4fd1b5`) for completed, sky blue (`--kf-plan: #7ea8ff`) for plan to watch/read, amber (`--kf-hold: #e8b14c`) for on hold, slate (`--kf-dropped: #7b8291`) for dropped, and coral (`--kf-danger: #ff8a80`) solely for destructive actions and errors.

## Color & Typography Contract

Source of truth: [`Frontend/src/styles/keyframe.css`](./src/styles/keyframe.css) and [`Frontend/src/styles/tokens.css`](./src/styles/tokens.css).

| Token | Value | Usage |
|---|---|---|
| `--kf-bg` | `#0d1017` | Studio background |
| `--kf-panel` | `#171b25` | Cards, panels, drawers, sheets |
| `--kf-raised` | `#212734` | Elevated interactive states, toasts, popovers |
| `--kf-line` / `--kf-line-strong` | `rgba(242, 244, 248, 0.1 / 0.22)` | Hairline borders and focus outlines |
| `--kf-text` / `--kf-text-2` | `#f2f4f8` / `#a8b0c0` | High-contrast primary and secondary ink on dark |
| `--kf-on-fill` | `#0d1017` | Dark text over high-contrast light/colored fills |
| `--kf-paper` | `#f4f6f1` | Key-frame note paper surface |
| `--kf-paper-ink` / `--kf-paper-ink-2` | `#1e2430` / `#566074` | Primary and secondary ink on note paper |
| `--kf-brand` / `--kf-brand-hover` | `#ff5a36` / `#ff7656` | Primary action fill & hover |
| `--kf-gold` | `#ffc857` | XP, achievements, 9–10 ratings |
| `--kf-danger` | `#ff8a80` | Delete actions and error states |
| `--kf-completed` | `#4fd1b5` | Completed status and success indicators |
| `--kf-plan` | `#7ea8ff` | Plan to watch / read status |
| `--kf-hold` | `#e8b14c` | On hold status |
| `--kf-dropped` | `#7b8291` | Dropped status |
| `--title-accent` | dynamic (`#ffb7a6` default) | Per-title cover-extracted hero accent |

### Typography

- **Display (`--kf-font-display`)**: `Archivo` for condensed editorial titles and numbers.
- **UI (`--kf-font-ui`)**: `Geist` (`tabular-nums` enabled globally) for controls, counts, and navigation.
- **Notes (`--kf-font-note`)**: `Literata` serif exclusively inside `NotePaper` reading/writing surfaces.
- **Japanese Titles (`--kf-font-jp`)**: `Noto Sans JP` for original vertical/inline Japanese titles on title heroes.
- **Monospace (`--kf-font-mono`)**: System monospace stack for shortcut hints (`Kbd`), API/import summaries, and URL labels.

## Layout, Navigation & Core Loops

1. **Five Primary Destinations**: `Home` (`/`), `Library` (`/anime`, `/books`, `/characters` with URL-synced filters/sorts/views), `+` (`AddTitleModal` & `Composer`), `Journal` (`/journal`), and `Me` (`/me` + `/me/recap/:year`), plus `Settings` (`/settings` + `/settings/find-art`) and `⌘K` Command Palette (`?` opens shortcuts).
2. **Instant `+1` Loop**:
   - Optimistic updates predict backend progress transitions (`src/lib/journal/progress.ts`) and coalesce fast taps cleanly.
   - `QuickLogBar` opens non-blockingly after a `+1` for inline 1–10 scoring, 1-line append-safe notes, `Full note` composer handoff, and instant `Undo`.
   - Completing a season, movie, or book triggers the native `<dialog>` `FinaleCelebration` (when celebrations are enabled) with XP gains, `"What stayed with you?"` note input, and PNG quote-card download.
3. **Append-Safe Notes**: Both `QuickLogBar` and `Composer` default to appending onto existing `notes` rather than overwriting, requiring an explicit `Edit full note` toggle to rewrite existing entries.
4. **Equal Desktop & Mobile Support**:
   - Desktop (`>= 768px`) uses the left rail + right slide-out `Composer` panel.
   - Phone (`390×844`) uses the bottom tab bar, mobile sheets, sticky bottom `+1` action bar on title/book pages, and >= 44px touch targets.

## Plain Fan Vocabulary & Guardrails

- Use plain vocabulary across all copy: `Home`, `Library`, `Note`, `Series`, `Season`, `Movie`, `Characters`, `Rewatch`, `Episode`. Avoid catalog/archival metaphors (`Desk`, `Folio`, `Ledger`, `Slip`, `Tome`).
- All animations run through pure CSS keyframes/transitions (`--kf-fast`, `--kf-base`, `--kf-ease`, `--kf-spring`) and flatten under `@media (prefers-reduced-motion: reduce)`.
- Dialogs use shared keyboard focus management (`useDialog`) or native `<dialog>` with `overscroll-behavior: contain`, `Escape` closing, and high-contrast `:focus-visible` outlines.
- Progression elements (Level/XP bar, Streak, Achievements, Celebrations) can each be toggled independently in Settings (`animelog_game_prefs_v1`).
