# Still & Spine: Visual & Design System

A personal anime & book journal designed around memories and lessons.

## Core Philosophy

1. **Memories & Lessons First**: The product exists to capture lessons from watching and reading. Notes on seasons, films, books, rewatches, and character reflections (`why`) take visual precedence over catalog metadata.
2. **Desk & Paper Metaphor**:
   - **Desk (`--desk: #161310`)**: The warm charcoal background of a wooden desk after the credits roll. Holds lists, navigation, steppers, and subtle metadata.
   - **Takeaway Slip (`--page: #EDE6D9`)**: The signature element. A warm paper slip holding handwritten lessons in a readable serif face (`--font-serif`).
   - **Tungsten (`--tungsten: #D4A05A`)**: Lamp light accent for active items ("Now Watching / Reading"), interactive focus rings, and primary actions.
   - **Spine (`--spine: #7A3E38`)**: Completed item accent, evoking leather book spines.
   - **Graphite (`--graphite: #8A8174`)**: Tertiary metadata (studios, genres, dates).

## Typography Scale

- **Display Titles**: `Fraunces` (`--font-display`), soft old-style serif (26–34px). Used for major franchise/book titles.
- **UI & Navigation**: `Source Sans 3` (`--font-body`), humanist sans-serif (15–16px).
- **Lessons & Reading**: `Source Serif 4` (`--font-serif`), roman reading typeface at minimum 16px (18px on desktop) on `--page`.
- **Ratings & Counts**: `IBM Plex Mono` (`--font-mono`), legible monospace for 1–10 scores (24px) and progress counts (20px).

## Rules

- No neon glows or generic purple gradients.
- Rating is 1–10 (or empty).
- Progress is an episode/page count, not a percentage as source of truth.
- Empty lesson entries display a clear **"Write the lesson"** action.
- All interactive controls provide accessible labels (`aria-label`) and visible `:focus-visible` tungsten outlines.
