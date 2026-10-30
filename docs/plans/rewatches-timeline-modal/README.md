# Rewatches: Return Spine + Detail Modal

| Field | Value |
|---|---|
| **Date** | 2026-08-25 |
| **Status** | Ready to implement |
| **Scope** | `Frontend/` only. No backend/API/model changes. |
| **Primary surfaces** | `/rewatches` (`RewatchesView` + `RewatchTimeline`) |
| **Supersedes** | `docs/plans/rewatches-journal-premium-redesign-plan.md` |

This folder is the source of truth for the Rewatches tab. The earlier “premium journal” plan kept full notes on the list. That is the problem this redesign fixes. Do not implement that document for this page.

## How to read this folder

| File | What it covers |
|---|---|
| `README.md` | Outcome, diagnosis, key decisions, alternatives |
| `design.md` | Visual system, color tokens, layout, what lives on the spine vs in the modal |
| `implementation.md` | Files, phases, verification, out of scope |

Update `Frontend/design.md` during implementation (tokens + the list-vs-modal rule). Do not treat that file as a planning-only artifact.

## Outcome

Turn the Rewatches page from a stack of full paper slips into a **scan-first return spine**: one chronological timeline of compact passes. Each row shows only what you need to recognize a pass. Clicking a row opens a **detail modal** where the lesson lives on paper.

The page’s job is *find a return*. The modal’s job is *read what changed*. Those jobs must not share the same surface.

No Django/DRF work. `Rewatch` already has target type, titles, episode context, dates, rating, and notes. Create/edit stays in the existing `RewatchModal`. The new modal is a reading surface, like `CharacterDetailModal`.

## Why the current page fails

Verified in `Frontend/src/views/RewatchesView.tsx` and `Frontend/src/components/RewatchTimeline.tsx`.

Every pass is rendered twice: a metadata bar **and** a full `TakeawaySlip`.

On the bar, at equal weight:

- target-type icon
- “Franchise Pass / Film Pass / TV Season Pass / Ep N Pass” badge
- “View Franchise” button
- start → finish date
- icon-only edit
- icon-only delete

On the slip, again:

- title (often `Series — Release`)
- the same date as “Logged: …”
- the same type badge as the label
- rating
- the entire `notes` body, or empty-state copy

The component is named timeline. There is no rail, no year, no pass number, no chronological grouping. Entries follow API order (`-start_date, -id`) as a flat card list. Related passes through the same season cannot be compared without reading every slip.

The result is a journal dump, not a log. A person with ten rewatches sees ten essays before they can pick one.

`FranchiseDetailView` has a real `.evolving-timeline` (pass column + stem + node), but it still mounts a `TakeawaySlip` in every row. That section is **out of scope** for this page redesign. The new detail modal should be reusable there later.

## Key decisions

1. **List is a spine, not a journal wall.** Overwhelm is caused by rendering every `notes` field. The list shows identity + date + pass + score; the modal shows the lesson.
2. **New reader modal, old editor modal.** `CharacterDetailModal` is the pattern. Mixing read and edit in `RewatchModal` would make both worse.
3. **Global newest-first chronology, not franchise groups.** The user asked for a timeline. Grouping by series (the superseded plan) is comparison-oriented and still dense. Year headers are enough structure.
4. **Pass numbers are per target.** A film and a season watched in the same week are not Pass 1 and Pass 2 of one story.
5. **Target-type color on the node only.** Status colors stay on watching/reading/etc. `--cel` is the one new hue, justified because season currently collides with franchise (both tungsten).
6. **Paper pip, not excerpt.** Any quote on the row reintroduces the dump. Presence is enough to know a reflection exists.
7. **No API work.** Serializer already returns `target_type`, `series_id`, titles, episode fields, dates, rating, notes.
8. **This folder supersedes `rewatches-journal-premium-redesign-plan.md`.** That document’s “do not clamp notes; keep them on the page” rule is the opposite of this brief.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep slips, collapse notes to 2 lines | Still a wall of cards; click-to-expand on the page fights the timeline. |
| Group by franchise with a ledger rail (previous plan) | Better for comparing one title; worse as a global “what did I rewatch?” scan. User asked for a timeline. |
| Horizontal year scroller | Breaks on mobile; fights vertical reading of a journal. |
| Open `RewatchModal` in read-only mode | That component is a dense form. A form is not a reading surface. |
| Put edit/delete on the row | Recreates the current action clutter; those actions belong next to the full record. |
| Color nodes by rating | Score is already a number. Node color is more useful for *what kind of return*. |

## Product defaults (do not re-open unless asked)

1. Newest-first, matching `Rewatch.Meta.ordering`.
2. Global chronology with year headers, not group-by-franchise.
3. Franchise-detail timeline left as-is in this change; reuse the modal later.
