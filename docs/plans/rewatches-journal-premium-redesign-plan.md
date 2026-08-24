# Rewatches Journal: Premium Redesign Plan

## Outcome

Turn the Rewatches page from a uniform list of dark cards into a clear **record of returning**: each entry should make its target, pass, date, changed perspective, and available actions immediately legible.

This is not another catalog list. It is the one place in the journal where chronology has meaning. The page should feel like a well-kept viewing log: calm, chronological, and reflective, with the lesson—not the metadata—doing the visual work.

No backend/API changes or dependencies are needed. `Rewatch` already supplies target type, target/release/series titles, optional episode context, dates, rating, and notes. The existing modal already handles creating and editing entries.

## Design direction — `Return ledger`

**Audience:** a person revisiting a title and wanting to compare what changed.

**Page job:** find a previous pass, understand what it was, and log the next changed perspective.

**Signature:** a restrained chronological **ledger rail** beside paper reflection entries. The rail communicates sequence; the paper communicates meaning. It is more deliberate than repeated cards, without pretending that every rewatch is part of one global linear story.

### Relationship to the rest of Still & Spine

- Retain walnut desk, Source Serif reflection text, Fraunces headings, mono metadata, semantic status/rating colors, and the seal danger treatment.
- Use the shared neutral folio/memory paper proposed for detail/dashboard; **do not** bring back the current gold note or add a second bright rewatch accent.
- Use ballpoint blue for the ledger line and labels, graphite for ordinary pass markers, tungsten for a current/most-recent pass marker, and ember only for high ratings. These are narrow marks, never large color fills.
- The page's visual difference comes from chronology and grouping, not a new palette or dashboard widgets.

## Diagnosis of the current page

`RewatchesView.tsx` has a usable title, one create action, and global-header search filtering. `RewatchTimeline.tsx` then renders every result as the same `.desk-card`:

- the target type, title, date, rating, actions, and note all have nearly equal visual weight;
- a note is italic cream text in quotation marks on walnut, so the core reflection does not read as journal writing;
- the word “timeline” is misleading: there is no visible sequence, pass number, grouping by target, or date ordering;
- similar passes through the same franchise cannot be compared without scanning the whole page;
- search only matches `release_title` and note, not `series_title` or episode title;
- empty state explains the concept but gives no direct `Log rewatch` action;
- edit/delete are icon-only, visually adjacent, and the destructive action is too easy to confuse with ordinary editing.

## Content model and honest ordering

Do **not** invent a universal “Watch #N” from list position. A person can rewatch several unrelated titles in the same month.

Instead:

1. Group entries by their parent `series_id` when it exists; otherwise group by normalized `series_title`, then by the target title as a fallback.
2. Within a group, order dated entries oldest to newest using `start_date`, falling back to `finish_date`.
3. Entries without either date are retained in a final `Undated passes` subgroup rather than receiving a fake chronology.
4. Number passes **within the same target** (`series`, season, film, or episode), not across a franchise unless the target itself is the franchise. Thus two passes through Season 1 read `Pass 1`, `Pass 2`; a film pass remains `Pass 1` for that film.
5. A row's date label says `Started 12 May · Finished 14 May`, `Finished 14 May`, or `Date not recorded`. Do not render `Started → Finished` with literal placeholder words.

This grouping can be derived locally from current API fields. If `series_id`/`series_title` are absent on older records, show a truthful `Other rewatch` group rather than guessing a relationship.

## Proposed layout

```
Desktop (>= 960px)

REWATCHES                                       [Log a rewatch]
Every return leaves a different record.
[ All passes 12 ] [ Franchises 5 ] [ Notes 9 ]       <- quiet ledger, no KPI cards

[ Search result note if the global search is active ]
[ All ] [ Franchises ] [ Seasons ] [ Films ] [ Episodes ]  <- compact scope filters

┌──────────── grouped return ───────────────────────────────────────────────┐
│ FRIEREN: BEYOND JOURNEY'S END                              3 passes       │
│ ─ ballpoint ledger rail ────────────────────────────────────────────────  │
│   12 MAY 2025  ○  Season 1 · Pass 1              ★ 8       [Edit] [···]  │
│                 ┌──────────────────────────────────────────────────────┐  │
│                 │ RETURN NOTE                                           │  │
│                 │ Roman reflection on compact neutral paper.            │  │
│                 └──────────────────────────────────────────────────────┘  │
│   04 JAN 2026  ●  Episode 10 · Pass 1                [Edit] [···]        │
│                 Date / rating / target remain scan-friendly.              │
└───────────────────────────────────────────────────────────────────────────┘

┌──────────── STEINS;GATE ──────────────────────────────────────────────────┐
│ ...                                                                         │
└───────────────────────────────────────────────────────────────────────────┘

Mobile
heading + log action → compact count ledger → horizontal type filters →
group heading → date / marker / target / actions → reflection paper
```

A group is the visual unit because related returns are comparable. One-entry groups stay compact; groups with multiple passes earn the ledger rail. Do not show an ornamental vertical line for a single entry.

## Detailed design and UX changes

### 1. Header, count ledger, and search feedback

- Change the header to `Rewatches` with the supporting line: `What changed when you came back.` This is clearer and less system-like than “First-class rewatch passes.”
- Keep the existing primary `Log a rewatch` action. It remains the only solid tungsten button in the page header.
- Replace a potential stat-card row with one quiet mono ledger: `12 passes · 5 titles revisited · 9 reflections`. “Titles revisited” counts distinct group keys; “reflections” counts nonblank notes. Never imply watched hours, streaks, or data the model lacks.
- When global search is nonempty, explicitly say `Showing 3 matches for “…”` and offer one small `Clear search` control if parent-level query clearing can be wired cleanly. If it cannot, omit the control rather than creating fake state.
- Extend current local filtering to include `series_title`, `release_title`, `episode_title`, and target-type labels. Trim and case-fold once.

### 2. Compact type filters, not a filter sidebar

- Add an accessible horizontal segmented filter: `All`, `Franchises`, `Seasons`, `Films`, `Episodes`, each with count.
- This uses existing `target_type`; no API query, URL state, or custom select is required in v1.
- The selected filter receives a thin ballpoint/tungsten edge and subtle dim wash; unselected filters are quiet desk text. Do not give every target type its own saturated background.
- On mobile it scrolls horizontally with visible focus state. Retain the global search rather than adding a second search field.

### 3. Grouped return ledger

- Create a small local grouping/ordering function in `RewatchesView.tsx` or a tiny colocated helper; do not add a generic `utils.ts` abstraction.
- Each group header includes franchise/title, pass count, and a subdued target-type summary such as `2 seasons · 1 episode` only when it clarifies multiple entries.
- Use a semantic target icon with visible text: `Franchise`, `Season 1`, `Film`, or `Episode 10`. Icons alone are insufficient.
- The ledger date column is mono and fixed-width on desktop. The circular marker aligns with each entry; first/ordinary markers are graphite, the latest dated entry in a multi-pass same-target sequence is tungsten. Never use ember merely because an entry is latest.
- Make the actual target title the primary text. Series title is contextual above it or in the group header, avoiding repeated `Series — Release` strings where group context already explains the series.
- If an episode title exists, show it after the episode number as secondary text, not as a third title line.
- Leave unrelated groups visually separated by generous desk space/rules rather than nesting every group in another heavy dark card.

### 4. Reflection paper and missing-note state

- Replace italic, quoted note text in `.desk-card` with a compact `TakeawaySlip`/memory-strip variation:
  - neutral `--memory-paper`/folio paper;
  - `RETURN NOTE` ballpoint label;
  - 16px Source Serif roman text at approximately 1.6 line height;
  - no quotation marks; no fake paper texture beyond the shared quiet slip treatment;
  - score uses existing rating-band color but stays in the metadata row, not on the note.
- A rewatch with no note is still valid. It gets a short quiet desk row: `No reflection recorded for this pass.` plus a visible `Add reflection` action that opens edit. Do not show an empty cream sheet just to fill space.
- Keep long notes fully readable in the default journal view. Do not clamp the thing the page exists to preserve. If volume later proves unwieldy, add an explicit per-note expand/collapse only after measuring real content.

### 5. Actions and deletion safety

- Replace the paired icon buttons with `Edit reflection` (secondary/quiet text button) and an overflow menu or clearly separated delete action. Use the existing confirmation flow for delete.
- If adding an overflow menu is more code than justified, use a labelled secondary `Edit` button and keep the existing icon-only seal delete in a separated action cluster with its accessible label. Clarity wins over a custom menu.
- The target itself is not editable in v1 unless the existing modal/API reliably supports it. `Edit reflection` must not suggest it can retarget a logged pass if it cannot.
- If practical within existing callback wiring, title/group click navigates to the relevant franchise detail. Do not add this interaction without a concrete `onNavigate` callback and correct target selection behavior; the edit and delete controls must never trigger navigation.

### 6. Empty, sparse, and error-adjacent states

- Empty state becomes an open ledger surface with `No returns recorded yet`, one sentence explaining that a later pass can reveal a different lesson, and a `Log a rewatch` button.
- A selected type filter with no records says exactly what is missing: `No film rewatches yet` and retains `Log a rewatch`.
- A search with no match identifies the query and directs the user to clear/change it; it does not reuse the global empty-copy.
- One logged rewatch should still feel intentional: show its target, date, note/action, and no decorative timeline rail or zero-valued counters.

## Implementation sequence

### Phase 1 — reliable data presentation

1. In `Frontend/src/views/RewatchesView.tsx`, expand search matching and derive target-type counts, grouped entries, date sort, per-target pass numbers, and undated handling from existing data.
2. Keep all calculations local and deterministic. Add a focused unit-free self-check only if the helper is nontrivial (for example an exported/assertable ordering function); otherwise test the grouping in the browser with known mock data.
3. Update view props only if navigation is deliberately implemented. Do not touch API client, models, routes, or the rewatch modal for visual work.

### Phase 2 — page composition

1. Refactor `RewatchTimeline.tsx` into a grouped ledger renderer, or rename it to match its new role if every caller is updated in one diff. Avoid retaining an incorrectly named component simply because it already exists.
2. Build the header ledger, type filters, group headings, date rail, metadata row, note surface, and distinct empty/search-empty states.
3. Reuse `TakeawaySlip` for recorded notes only if a small, explicit `variant="memory"`/class modifier keeps its API clear. Do not fork paper markup into another component for one page.
4. Use the existing edit/delete callbacks and modal; retain the current GSAP entrance behavior only for group sections, with `prefers-reduced-motion` unchanged.

### Phase 3 — CSS and responsive refinement

1. Add scoped `.rewatch-*` styles in `Frontend/src/index.css`: header ledger, type filters, return group, ledger row, date/marker, target metadata, action cluster, and one-entry/undated variants.
2. At <=640px, transform the date rail into an inline metadata label above each target; do not force a narrow three-column timeline. Keep buttons at usable touch sizes and prevent title/action collisions.
3. Ensure shared paper styles remain reserved: detail owns the large folio; rewatch entries use compact memory paper; empty rewatch records remain desk rows.
4. Document final wording and material ownership in `Frontend/design.md` after implementation.

## Verification and acceptance

Run `npm run lint` and `npm run build` from `Frontend/`. Check at 1280px, 768px, and 390px with:

- multiple dated passes through the same season;
- franchise, season, film, and episode targets in one series;
- two unrelated series; one single-entry group; one undated entry;
- note present and note absent; high, low, and no rating;
- every type filter; matching/nonmatching global search;
- empty journal and filtered-empty journal;
- keyboard focus/activation for filters, edit, delete, and log; delete confirmation; reduced motion.

The redesign is complete when:

- users can identify the target, its scope, date, pass sequence, and reflection without parsing a dense card;
- related returns can be compared in a truthful local chronology;
- reflections read as premium journal material, not italic text pasted onto a dashboard card;
- single, empty, and undated records are honest and useful;
- no new API field, dependency, generic abstraction, or invented analytics was added.

## Explicitly out of scope

No side-by-side diff of first vs later notes (there is no first-pass note relation), sentiment analysis, global cross-title pass number, calendar, chart, recommendation, automatic completion detection, new rewatch model fields, URL-persisted filters, or poster extraction. Add comparison tooling only after the data model can reliably link an original reflection to a later pass.
