# Detail Page: Journal Sheet + Progressive Disclosure

| Field | Value |
|---|---|
| **Date** | 2026-08-25 |
| **Status** | Ready to implement |
| **Scope** | `Frontend/` only. No backend/API/model changes. |
| **Primary surfaces** | `/anime/:seriesId` (`FranchiseDetailView`), `/books/:bookId` (`BookDetailView`) |
| **Supersedes** | `docs/plans/detail-page-premium-redesign-plan.md` |
| **Learns from** | `docs/plans/rewatches-timeline-modal/` (scan first, full notes on demand) |

This folder is the source of truth for franchise and book detail. The earlier “premium folio” plan kept the two-column dump and restyled paper. That is the problem this redesign fixes. Do not implement that document for these pages.

## How to read this folder

| File | What it covers |
|---|---|
| `README.md` | Outcome, diagnosis, key decisions, alternatives |
| `design.md` | Visual system, wireframes, disclosure table, states |
| `implementation.md` | Files, phases, CSS to delete, verification, PR plan |

Update `Frontend/design.md` during implementation (journal-sheet IA + the updated mobile identity rule). Do not treat that file as a planning-only artifact.

## Outcome

Turn the detail pages from a catalog-plus-essay dump into a **single journal sheet**: a compact identity band (where am I?), one clamped lesson on paper (what did this title teach me?), and **scan-first indexes** for episode memories, returns, and characters. Full notes open on demand in reader modals. Catalog metadata lives behind **About this title**.

The page’s job is *orient, then read one lesson*. Collection indexes find a memory. Reader modals hold the writing. Those jobs must not share the same surface.

No Django/DRF work. `AnimeSeason.notes`, `episode_notes`, `Rewatch`, and `FavoriteCharacter.why` already carry the lessons. Create/edit stays in the existing form modals. This change is information architecture and layout, not a new data model.

## Why the current page fails

Verified in `Frontend/src/views/FranchiseDetailView.tsx` (~897 lines) and `Frontend/src/views/BookDetailView.tsx` (~250 lines). Both share `.detail-split-layout` (`Frontend/src/index.css` ~2641): `grid-template-columns: 360px 1fr`, sidebar `position: sticky; top: 84px`.

**Left rail (always painted):**

1. Poster still at `aspect-ratio: 3 / 4.2` with `poster-edge-{status}`.
2. **Every** season and movie as `.release-pill-btn` (title, watching dot, star rating) plus always-visible Add Season / Add Movie.
3. `.quick-stats-box`: SCORE (24px mono), Format, Studio, Status, Progress (stepper or count), `Logged` = `start_date` only.
4. Edit Release, icon-only Delete Franchise (`Trash2` 13px, not 44px), Edit Franchise Metadata.

**Right column (always painted):**

1. Eyebrow repeats status (`TV Series · Season N` inside `.status-indicator`).
2. Fraunces title.
3. **Every** genre tag and **every** studio tag (studio already in the stats box).
4. Section heading + `TakeawaySlip isDetail` with **full** `notes`, rating again, 19px Source Serif.
5. **Every** episode note as `TakeawaySlip compact` (full `ep.note`) plus a `Rewatch Ep N` ghost button under each slip.
6. Rewatches as `.evolving-timeline` with pass column + stem + **another** `TakeawaySlip` per pass. Pass numbers are franchise-global `Watch #N` (oldest = 1), which contradicts `passNumbers()` in `Frontend/src/views/rewatchSpine.ts`.
7. Memorable Characters as a `minmax(260px, 1fr)` grid of `CharacterCard` (168px avatar, edit, delete, “Reflection / No reflection”). Click already opens `CharacterDetailModal`.

`BookDetailView` is the same split without episodes/rewatches/characters. Author appears in the stats box **and** as italic “by …” under the title. Score box + takeaway rating duplicate. Format is the hard-coded string `Literature / Book`.

**Duplication map (one selected season):**

| Fact | Where it appears today |
|---|---|
| Status | Poster 3px edge, selected pill, stats row, eyebrow |
| Rating | Score box, selected pill, takeaway slip, each episode slip, each rewatch slip |
| Studio | Stats row **and** `.studio-tag` chips |
| Progress | Stats row (fine, but buried) |
| Dates | Stats `Logged` = start only; `finish_date` never shown; rewatch dates again on each slip |

**What is never shown:** `series.japanese_title`, `series.romaji_title`, anime `finish_date`.

**What exists but is unused on this page:** `RewatchDetailModal` is mounted only from `RewatchesView`. Franchise detail still inlines full rewatch paper. `EpisodeNoteModal` is a **form** (pills + textarea), not a reader.

The result is a database dump, not a journal page. A person opening a dense franchise sees every essay before they can pick one. There is no intended first read.

## Why the folio plan is the wrong answer

`docs/plans/detail-page-premium-redesign-plan.md` states: “The current two-column structure is worth keeping.” It then restyles the takeaway as `--folio-paper`, tightens the rail, and **retains episode memories, rewatches, and characters below the takeaway with their full content**. That is a material pass on a dump. Overwhelm is caused by rendering every `notes` / `why` field, not by the gold of the slip.

This is the same failure mode as `docs/plans/rewatches-journal-premium-redesign-plan.md`, which was superseded by `docs/plans/rewatches-timeline-modal/` for the Rewatches tab. Apply the same supersession here.

## What to learn from the return spine (and what not to copy)

From `docs/plans/rewatches-timeline-modal/`:

- The list’s job is *find*. The modal’s job is *read*. Those jobs must not share a surface.
- Paper pip, not excerpt. Any quote on the index reintroduces the dump.
- Reader modal ≠ editor modal (`RewatchDetailModal` vs `RewatchModal`; `CharacterDetailModal` vs `CharacterModal`).

Do **not** copy onto every detail section:

- Year headers and a vertical stem (a title usually has 1–5 returns; years are noise).
- Target-type node colors (`--cel` / franchise tungsten / film night / episode ember) as a second language on episode cues or character chips.
- The `/rewatches` page copy or type-filter chips.

Each detail section gets its own scan language. The shared *idea* is disclosure, not a cloned spine.

## Key decisions

1. **Page job is “orient, then read one lesson.”** First landing is the identity band (title, selected release, status, score, in-progress stepper). Secondary is one clamped lesson sheet. Collections are tertiary indexes. Full episode/rewatch/character text is on demand. The current page has no intended first read; everything is primary, so nothing is.

2. **Abandon the sticky two-column rail.** One reading column, max-width ~860px, modest still in the identity band. The 360px sticky catalog is the dump’s skeleton. Mobile already rejects it (`order: 2`). Desktop should not be a different product.

3. **This folder supersedes the folio plan.** Restyling gold → cream does not fix “all notes at once.”

4. **Learn disclosure from the return spine; do not clone its visual.** Pip + reader modal is the idea. Year stems, `--cel` nodes, and type chips stay on `/rewatches`. Episodes are a cue sheet; returns are dated marks; characters are portrait chips.

5. **Takeaway stays the only paper on the page, redesigned not hero-gold.** Clamp 8 lines, no rating on the slip, existing `--page` (no `--folio-*`). Empty is a short invitation. Other sections must not use `TakeawaySlip` as their empty state. In-place expand (not a modal) because this *is* the reading surface.

6. **Episode bodies never mount on first paint.** Max 5 cue rows; more rows on request; full note in new `EpisodeMemoryModal`. `EpisodeNoteModal` remains the editor. Per-row `Rewatch Ep N` moves into the reader footer.

7. **Reuse `RewatchDetailModal` and `CharacterDetailModal`; wire edit/delete from `App.tsx`.** Detail-page returns use `passNumbers()` (per-target), not franchise-global `Watch #N`. Hide View franchise when already on the series. Drop `CharacterCard` from this page.

8. **Catalog facts live in About; destructive and franchise actions live in More.** Status, score, and studio each appear once. Stepper only while WATCHING/READING. Delete is never a 13px icon beside Edit.

9. **Book parity is the same sheet minus anime collections.** Shared `DetailIdentity` / lesson / About. Banker green unchanged.

10. **No new color tokens, no API, no feature flag.** Roll out on a git branch; verify in the browser; revert the frontend PR to roll back.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep two-column + collapse sections (folio plan) | The rail still dumps poster + all pills + score + metadata. Collapsed sections with full paper inside still mount or still surprise-dump on open. This is `detail-page-premium-redesign-plan.md`. |
| Tabs (Lesson / Memories / Returns / Characters / About) | A title journal is a reading page, not an app shell. Tabs hide the lesson when you came for identity, and hide identity when you came for a memory. |
| Keep TakeawaySlip walls but clamp each to 2 lines | Still a wall of cards; click-to-expand on the page fights scanning. Same failure the rewatches tab already rejected. |
| Open `EpisodeNoteModal` as the episode reader | That component is a form (number input, rating, image upload, save). A form is not a reading surface. Same reason `RewatchModal` was not reused as the return reader. |

## Product defaults (do not re-open unless asked)

1. Single reading column. No sticky 360px catalog rail.
2. One paper sheet on the page. Indexes are desk rows/chips with a pip.
3. Episode memories: story order, max 5 cue rows on first paint, full note in a reader modal.
4. Rewatches on this page: this-release first, per-target pass numbers, reuse `RewatchDetailModal`.
5. Characters: portrait chips, reuse `CharacterDetailModal`. No `CharacterCard` here.
6. Book page: same identity + lesson + About. No fake episode/rewatch/character blocks.
7. No `--folio-*` tokens.
