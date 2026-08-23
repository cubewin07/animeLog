# Still & Spine: Visual & Design System

A personal anime & book journal designed around memories and lessons.

## Core Philosophy

1. **Memories & Lessons First**: The product exists to capture lessons from watching and reading. Notes on seasons, films, books, rewatches, and character reflections (`why`) take visual precedence over catalog metadata.
2. **Desk & Paper Metaphor**:
   - **Desk (`--desk: #181410`)**: The warm charcoal walnut background of a wooden desk after the credits roll. Holds lists, navigation, steppers, and subtle metadata.
   - **Desk Surfaces (`--desk-raised: #231D17`, `--desk-surface: #2C261F`, `--desk-surface-high: #3A3229`)**: Walnut layered containers for cards, headers, and toolbars.
   - **Takeaway Slip (`--page: #E2D3BB`, `--page-muted: #D4C3A8`)**: The signature element. A tea-stained paper slip holding lessons in a readable serif face (`--font-serif`) and deep ink (`--ink: #2A2218`).
   - **Tungsten (`--tungsten: #C9954A`)**: Lamp light accent for active items ("Now Watching / Reading"), interactive focus rings, and primary actions. Kept sparse.
   - **Spine (`--spine: #7A3E38`, `--spine-text: #C9A090`)**: Completed item accent, evoking leather book spines.
   - **Graphite (`--graphite: #8A8174`)**: Tertiary metadata (studios, genres, dates).
   - **Danger (`--danger: #C9A090`, `--danger-fill: #7A3E38`)**: Delete actions and errors.

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
| `--ink` | `#2A2218` | Lesson handwritten text on paper slips |
| `--ink-muted` | `#6B5E4E` | Secondary text on paper slips |
| `--tungsten` | `#C9954A` | Lamp gold — "Now Watching/Reading", primary buttons, focus |
| `--spine` | `#7A3E38` | Leather red — completed badge, danger fill |
| `--spine-text` | `#C9A090` | Light spine red text on dark cards |
| `--graphite` | `#8A8174` | Tertiary text, studio badges, metadata |
| `--text-desk` | `#E6DCCE` | Primary title and body text on desk |
| `--text-desk-muted` | `#9C9284` | Muted subtitle text on desk |
| `--status-hold` | `#A88868` | On-hold status badge text |
| `--danger` | `#C9A090` | Delete icons and error text |

## Typography Scale

- **Display Titles**: `Fraunces` (`--font-display`), soft old-style serif (24–32px). Used for major franchise/book titles.
- **UI & Navigation**: `Source Sans 3` (`--font-body`), humanist sans-serif (14–15px).
- **Lessons & Reading**: `Source Serif 4` (`--font-serif`), roman reading typeface at 15–16px.
- **Ratings & Counts**: `IBM Plex Mono` (`--font-mono`), legible monospace for 1–10 scores (20–24px) and progress counts.

## Design Rules

1. **Paper Slips Sit on Desk**: Cream paper slips (`--page`) appear only on `TakeawaySlip` for standout lessons. Slips sit directly on the desk or as the main detail view surface. Never wrap a slip inside a dark card.
2. **Sparse Tungsten**: Lamp gold is reserved for in-progress statuses (`WATCHING` / `READING`), primary button fills, and keyboard focus rings.
3. **No Coral Reds**: All destructive and delete actions use `.btn-icon.danger` or `.btn-danger` with `--danger` / `--spine`.
4. **Rating is 1–10**: Rating is 1–10 (or null).
5. **Progress is a Count**: Progress is an episode/page count, not a percentage as source of truth.
