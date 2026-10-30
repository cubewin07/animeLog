# Return spine: implementation

Companion to `README.md` (why) and `design.md` (what it looks like). Frontend only. No serializer, model, or URL changes.

## Files

| File | Change |
|---|---|
| `Frontend/src/views/RewatchesView.tsx` | Header copy, ledger, type chips, search feedback, selected-id state, year grouping via helper. |
| `Frontend/src/views/rewatchSpine.ts` | Sort, year groups, per-target pass numbers, latest-pass set, type counts. Pure functions. |
| `Frontend/src/components/RewatchTimeline.tsx` | Rewrite as compact spine. Rename export to `RewatchSpine` in the same file (or rename the file and update the import). No `TakeawaySlip` on the list. |
| `Frontend/src/components/RewatchDetailModal.tsx` | **New.** Read-only journal modal. |
| `Frontend/src/App.tsx` | Prefer a **view-owned** detail modal so `App.tsx` stays the owner of the edit form only. Keep using `onEdit` / `onDelete` / `onNavigateSeries`. |
| `Frontend/src/index.css` | `--cel*` and `--return-*` tokens; `.rewatch-spine` layout; type-chip color edges; selected row; mobile. |
| `Frontend/design.md` | Return-spine subsection: tokens, “paper is withheld on the list,” node fill rule. |

Do not change `QuickModals.tsx` `RewatchModal` except if a prop rename is required. Do not change serializers, models, or URLs.

Keep current type-filter logic, including the legacy fallback `r.movie ? 'movie' : 'season'` until those records are gone.

Derive chronology locally in `Frontend/src/views/rewatchSpine.ts`. Do not add a generic `utils.ts`.

## Phase 1 — data shape (no visual risk)

1. Add `rewatchSpine.ts`:
   - `targetType(r)`
   - `sortKey(r)`
   - `targetKey(r)`
   - `groupByYear(rewatches)`
   - `passNumbers(rewatches): Map<id, number>`
   - `latestIds(rewatches): Set<id>`
   - `displayTitle(r)` / `scopeLabel(r)` / `formatSpineDate(r)`
2. Wire `RewatchesView` to use the helper for filters/search so behavior can be checked before the visual rewrite.
3. Expand search matching to `series_title`, `release_title`, `episode_title`, notes, and type labels.

## Phase 2 — spine UI

1. Replace the per-item `TakeawaySlip` list with year headers + rows.
2. Type chips get target-color selected edges. Relabel `All Passes` → `All`.
3. Header copy, quiet ledger, empty / filter-empty / search-empty states.
4. Row is the only action. Remove edit/delete/franchise from the list.
5. Keep GSAP stagger on year groups or rows; `prefers-reduced-motion` unchanged.
6. Move spine layout into CSS classes. Avoid the current all-inline `RewatchTimeline` style.

## Phase 3 — detail modal

1. New `RewatchDetailModal` following `CharacterDetailModal` structure (overlay, header, body, footer actions).
2. Paper via existing `TakeawaySlip` (`isDetail` or default, not `compact` unless the note is short).
3. Edit closes detail and calls `onEdit(rewatch)`. Delete uses existing confirm and closes detail on success. View franchise navigates to `/anime/:id` and closes.
4. Keyboard, focus return to the row, overlay click, Escape, reduced motion.

## Phase 4 — tokens and docs

1. Add `--cel`, `--cel-text`, `--cel-dim`, `--return-rail`, `--return-mark` to `:root` in `Frontend/src/index.css`.
2. Scoped `.rewatch-spine*` CSS for rail, node, row, selected state, type chips, mobile.
3. Update `Frontend/design.md` with a **Return spine** subsection so the new hues are not treated as global status colors.

## Verification

From `Frontend/`: `npm run lint` and `npm run build`.

Browser, at 1280 / 768 / 390:

- Multiple dated passes of the same season (Pass 1 hollow, Pass 2 filled, numbers correct).
- Franchise, season, film, and episode in one list (four node colors).
- Two unrelated series in the same year (no fake shared Watch #).
- One undated row in `Date not recorded`.
- Note present (pip) vs absent (no pip); full note only in the modal.
- High / mid / low / empty rating colors on the number only.
- Every type filter; matching and non-matching global search.
- Empty journal; type-filter empty; search empty — three different copy strings.
- Click row → modal; overlay click and Escape close; focus returns to the row.
- Edit from modal opens `RewatchModal` with the same record; save updates the spine.
- Delete from modal confirms, removes the row, closes detail.
- View franchise navigates to `/anime/:id`.
- Keyboard: tab to a row, Enter opens, Tab cycles modal controls.
- Reduced motion: no entrance tween.
- `Log a rewatch` still creates via existing modal.

Done when:

- A glance at `/rewatches` shows a log, not a stack of essays.
- One click reveals the lesson on paper.
- Target type is readable from node color without reading a badge paragraph.
- Pass numbers are honest per target.
- No new API field, dependency, or analytics widget.

## Explicitly out of scope

- Backend, serializers, migrations, MCP tools.
- Franchise detail rewatch section (reuse later).
- URL-persisted selected pass.
- Group-by-franchise as a second view mode.
- Side-by-side first-vs-later note diff (the model has no original-pass link).
- Calendar, charts, streaks, watch-time.
- Changing `RewatchModal` into the reader.
- Clamping or excerpting notes on the list (the list shows none).
