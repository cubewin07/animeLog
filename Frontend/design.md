# Still & Spine: Visual & Design System ("Desk Drawer")

A personal anime & book journal designed around memories and lessons.

## Core Philosophy

1. **Memories & Lessons First**: The product exists to capture lessons from watching and reading. Notes on seasons, films, books, rewatches, and character reflections (`why`) take visual precedence over catalog metadata.
2. **Desk & Paper Metaphor**:
   - **Desk (`--desk: #181410`)**: The warm charcoal walnut background of a wooden desk after the credits roll. Holds lists, navigation, steppers, and subtle metadata.
   - **Desk Surfaces (`--desk-raised: #231D17`, `--desk-surface: #2C261F`, `--desk-surface-high: #3A3229`)**: Walnut layered containers for cards, headers, and toolbars.
   - **Takeaway Slip (`--page: #E2D3BB`, `--page-muted: #D4C3A8`)**: The signature element. A tea-stained paper slip holding lessons in a readable serif face (`--font-serif`) and deep ink (`--ink: #2A2218`). Restored as the primary reading surface on detail views.
   - **Tungsten (`--tungsten: #C9954A`)**: Lamp light accent for active **WATCHING**, interactive focus rings, and primary actions.
   - **Banker (`--banker: #2F6B4F`, `--banker-text: #8FCBAA`)**: Green glass of a banker's lamp for active **READING**.
   - **Spine (`--spine: #7A3E38`, `--spine-text: #C9A090`)**: Leather book spine accent for **COMPLETED** items only.
   - **Night (`--night: #3E5F82`, `--night-text: #9BB6D0`)**: Cool CRT / paused still blue for **PLAN_TO_WATCH / PLAN_TO_READ**.
   - **Patina (`--patina: #6B7348`, `--patina-text: #C2C87A`)**: Oxidized brass for **ON_HOLD**.
   - **Ash (`--ash: #6E5E5C`, `--ash-text: #C4B4B0`)**: Lifeless gray for **DROPPED** (uncoupled from completed leather).
   - **Seal (`--seal: #B44538`, `--seal-text: #E8A099`)**: Carmine wax-seal for **DELETE & ERRORS** (uncoupled from completed).
   - **Ember (`--ember: #D4783A`, `--ember-text: #F0B27A`)**: Burning orange for high scores (**9–10**).
   - **Ballpoint (`--ballpoint: #2C4A6E`)**: Deep blue ink rule on paper slips.
   - **Graphite (`--graphite: #8A8174`)**: Tertiary metadata (genres, dates).

## Color Tokens Contract (Source of Truth: `Frontend/src/index.css`)

| Token | Hex / Value | Usage |
|---|---|---|
| `--desk` | `#181410` | App background (walnut desk) |
| `--desk-raised` | `#231D17` | Cards, popovers, modals |
| `--desk-surface` | `#2C261F` | Header bars, table headers, form inputs |
| `--desk-surface-high` | `#3A3229` | Active chips, elevated items |
| `--desk-surface-highest` | `#463C33` | Borders, subtle separators |
| `--still-well` | `#100E0B` | Poster / image backdrop wells |
| `--page` | `#E2D3BB` | Paper slip background (takeaway lessons) |
| `--page-muted` | `#D4C3A8` | Paper slip border / subtle paper shading |
| `--ink` | `#2A2218` | Lesson text on paper slips |
| `--ink-muted` | `#6B5E4E` | Secondary text on paper slips |
| `--tungsten` | `#C9954A` | Lamp gold — "Now Watching", primary buttons, focus |
| `--banker` | `#2F6B4F` | Banker green — "Now Reading", book progress |
| `--banker-text` | `#8FCBAA` | Reading label on desk |
| `--spine` | `#7A3E38` | Leather red — completed badge, completed progress |
| `--spine-text` | `#C9A090` | Completed text on desk, studio tags |
| `--night` | `#3E5F82` | Cool CRT blue — plan to watch / read |
| `--night-text` | `#9BB6D0` | Plan label on desk, film icons |
| `--patina` | `#6B7348` | Oxidized brass — on hold |
| `--patina-text` | `#C2C87A` | On hold label on desk |
| `--ash` | `#6E5E5C` | Ash gray — dropped |
| `--ash-text` | `#C4B4B0` | Dropped label on desk, low ratings (1-4) |
| `--seal` | `#B44538` | Wax seal carmine — delete button fill |
| `--seal-text` | `#E8A099` | Delete text, danger accents |
| `--ember` | `#D4783A` | Rating 9–10 score accent |
| `--ember-text` | `#F0B27A` | High rating text on desk |
| `--cel` | `#3A6F7C` | TV season rewatch node and selected Seasons chip |
| `--cel-text` | `#8FCBD4` | Season rewatch text on desk |
| `--cel-dim` | `rgba(58, 111, 124, 0.22)` | Season rewatch chip wash |
| `--return-rail` | `rgba(44, 74, 110, 0.45)` | Timeline stem line (ballpoint at reduced opacity) |
| `--return-mark` | `#E2D3BB` | Paper pip dot when rewatch notes exist |
| `--ballpoint` | `#2C4A6E` | Default left border rule on paper slips, All Passes chip |
| `--graphite` | `#8A8174` | Tertiary text, genre badges, metadata |
| `--text-desk` | `#E6DCCE` | Primary title and body text on desk |
| `--text-desk-muted` | `#A89F91` | Muted subtitle text on desk |
| `--danger` | `#E8A099` | Delete icons and error text |
| `--danger-fill` | `#B44538` | Delete button background |

## Rating Bands

| Score | Token Class | Color |
|---|---|---|
| 9–10 | `.rating-band-high` | `--ember-text` (`#F0B27A`) |
| 7–8 | `.rating-band-mid` | `--tungsten` (`#C9954A`) |
| 5–6 | `.rating-band-normal` | `--text-desk` (`#E6DCCE`) |
| 1–4 | `.rating-band-low` | `--ash-text` (`#C4B4B0`) |
| Unrated | `.rating-band-empty` | `--text-desk-dim` (`#736B5E`) |

## Typography Scale

- **Display Titles**: `Fraunces` (`--font-display`), soft old-style serif (24–32px). Used for major franchise/book titles.
- **UI & Navigation**: `Source Sans 3` (`--font-body`), humanist sans-serif (14–15px).
- **Lessons & Reading**: `Source Serif 4` (`--font-serif`), roman reading typeface at 16–19px on paper slips.
- **Ratings & Counts**: `IBM Plex Mono` (`--font-mono`), legible monospace for 1–10 scores (20–24px) and progress counts.

## Detail Page: Journal Sheet & Progressive Disclosure

1. **Single Reading Column (`~860px`)**: The detail page abandons the 360px sticky catalog rail in favor of a single focused reading sheet on the desk.
2. **First Eye Landing (Identity Band)**: A modest still (120×168 desktop, 72×100 mobile) with a 3px semantic status edge sits beside the Fraunces title, release switcher chips, fact line (format, status, mono score with rating band, progress stepper only when active), and Edit/More controls.
3. **One Paper Sheet on the Page**: The takeaway lesson (`.takeaway-slip.lesson-sheet`) is the only `--page` rectangle on the page. Long lessons clamp to 8 lines with an in-place `Read full lesson` / `Show less` toggle. Empty lessons show a short invitation. No `--folio-*` tokens are used.
4. **Scan-First Indexes (Paper Withheld)**:
   - **Episode memories**: Story-order cue sheet (`.memory-cue-list`) with mono episode numbers, titles, scores, and a `--return-mark` pip. Max 5 rows on first paint; click row opens `EpisodeMemoryModal`.
   - **Returns**: Dated mark rows (`.return-marks-list`) for the active release with honest per-target pass numbers (`passNumbers()`), rating, pip, and a franchise overflow toggle. Click row opens `RewatchDetailModal`.
   - **Characters**: Portrait strip (`.character-strip`) of 56px circular still chips with pip. Click chip opens `CharacterDetailModal`.
5. **About This Title**: A native `<details>` drawer at the bottom holds quiet catalog facts (genres, studios, started/finished dates, Japanese/Romaji titles).
6. **Book Parity**: Books follow the exact same IA (identity band + clamped lesson sheet + About drawer) with banker green styling, without fake collection indexes.

## Design Rules

1. **Paper Slips Sit on Desk**: Cream paper slips (`--page`) are used for standout lessons, episode memories, rewatch insights, and character notes. Slips sit directly on the desk. Never wrap a slip inside a dark card.
2. **Semantic Status Colors**: Each state has its own hue: Watching is gold (`--tungsten`), Reading is green (`--banker`), Completed is leather (`--spine`), Plan is cool blue (`--night`), Hold is patina (`--patina`), Dropped is ash (`--ash`).
3. **No Coral Reds & Decoupled Danger**: Delete and destructive actions use `--seal` (`#B44538`), completely uncoupled from completed `--spine`.
4. **Rating is 1–10**: Score formatting uses rating bands so 10/10 and 4/10 are distinct.
5. **Progress Stepper Guard**: Progress steppers appear only on in-progress titles (`WATCHING` or `READING`). Completed releases show clean count typography.
6. **Mobile Identity vs Catalog Chrome**: On narrow screens, the modest 72×100 still beside the title is identity (where am I?), not catalog chrome. Catalog chrome (genres, studios, dates, Japanese/Romaji titles, delete) stays in the About drawer below the lesson sheet.

