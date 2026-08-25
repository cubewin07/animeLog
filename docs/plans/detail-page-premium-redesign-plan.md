# Detail Page: Premium Folio Redesign Plan

> **Superseded (2026-08-25).** Do not implement this document for franchise or book detail. Keeping the two-column dump and restyling paper is the overwhelm the user reported. Source of truth: `docs/plans/detail-page-redesign/`.

## Outcome

Make anime franchise/release and book detail pages feel like a private **folio on a night desk**: one memorable reflection is the hero, while poster, progress, status, and metadata are easy to scan without competing for attention.

The current two-column structure is worth keeping. Its weak point is material hierarchy: nearly every dark box has similar weight, and the large gold slip reads as a flat colored component rather than paper. This redesign improves it without changing the API, routes, models, or the Still & Spine identity.

## Design direction — `Night folio`

**Audience:** one person returning to remember what a title taught them.

**Page job:** resume a title, then read or capture its takeaway.

**Signature:** a single, quiet *folio sheet* for the active release/book takeaway. It is off-white rag paper under a warm desk lamp—not gold cardstock, not a torn scrapbook note. Its paper character comes from restrained CSS grain, edge shading, and typographic rhythm; not clip-art, rotations, tape, or fake stains.

### Detail palette

These tokens are local additions/adjustments to the existing desk system, not a second application theme:

| Token | Value | Use |
| --- | --- | --- |
| `--folio-paper` | `#E7DFCF` | Primary takeaway sheet; less yellow than current `--page` |
| `--folio-paper-shadow` | `#D6CBB7` | Sheet edge / subtle shading |
| `--folio-ink` | `#28231C` | Long-form reading text |
| `--folio-annotation` | `#625544` | Labels and supporting paper text |
| `--folio-rule` | `rgba(44, 74, 110, .22)` | One quiet ballpoint rule, only on the hero sheet |
| `--desk-deep` | `#12100D` | Poster well and dark contrast band, when needed |

Keep semantic color ownership already established: tungsten = watching and primary action; banker = reading; spine = completed; night = planned; patina = on hold; ash = dropped; seal = destructive action; ember = exceptional rating. Semantic colors may mark an edge, label, progress indicator, or selected release—never fill a large panel.

Typography remains Fraunces for title, Source Serif 4 for reflection, Source Sans 3 for controls, and IBM Plex Mono for labels/counts. The premium change is restraint: 12px mono labels, 17–19px roman takeaway text, and fewer bold labels.

### Why this is specific rather than a generic dark dashboard

The deliberate risk is making the reflection sheet nearly neutral, rather than more gold, so it reads like a page saved from a viewing journal under lamp light. The surrounding walnut desk and status-colored edge retain Still & Spine; a purple/neon accent, glass card, or full cream reading column would make this look like a different app.

## Proposed information hierarchy

```
Desktop (>= 961px)

[ ← Anime journal ]

┌──────── sticky catalog rail ────────┐  ┌────── active release header ─────────┐
│ poster, 3px status edge             │  │ status · medium · score · progress   │
│                                     │  │ Title / author or franchise context   │
│ compact release list                │  │ tags and studio (tertiary)            │
│ facts: status, progress, date       │  └──────────────────────────────────────┘
│ [Edit release] [More metadata]      │
└─────────────────────────────────────┘  ┌───── THE TAKEAWAY / folio paper ─────┐
                                         │ release label                 [Edit]  │
                                         │ readable roman reflection             │
                                         │ one ballpoint rule; status edge       │
                                         └───────────────────────────────────────┘
                                         Episode memories       [Log memory]
                                         compact memory rows / empty invitation
                                         Rewatches              [Log rewatch]
                                         chronological cards
                                         Characters              [Add character]

Mobile
[back] → release context/title/status/progress → takeaway sheet → poster →
horizontally scrollable releases → facts/actions → supporting sections
```

The takeaway remains before the poster on mobile. Do not add desktop tabs; a title journal is a reading page. Add a compact anchor row on mobile only if the real supporting content exceeds two viewport heights.

## Detailed changes

### 1. Rebuild the active-release header

- Move status, format, score, and active progress into a compact header cluster beside/above the title rather than making the sidebar score box the only primary scan point.
- Use the rating-band class for the score. `/10`, dates, genres, and studio stay muted.
- Use one visible contextual edit action: `Edit release` opens release metadata, while the folio's `Edit takeaway` opens the same form focused on notes when that capability exists. Do not add an icon-only franchise edit.
- Keep deletion in the catalog rail, visually separated below ordinary edits and styled with seal only.
- Replace catalog-sounding copy such as “Archive” with concrete context: `Season 1 · TV`, `Film`, or `Book journal`.

### 2. Simplify the sticky catalog rail

- Keep the poster, release switcher, essential facts, and actions in the current rail; do not replace the proven two-column layout.
- Reduce three visually separate dark boxes to a poster followed by two quiet groups: **Releases** and **Details**. Use hairline rules and spacing before adding more container borders.
- Selected release = that release's semantic dim wash + edge. Non-selected releases = quiet text and a 3px semantic left edge. The status color must not become a second “selected” gold state.
- Show a progress stepper only for `WATCHING` releases and `READING` books. Other statuses show a simple mono count.
- Give the poster an inset 3px semantic edge and a very subtle bottom fade for legibility on pale cover art. Avoid hover zoom on this reading page.

### 3. Replace the gold note with one credible folio sheet

Apply a new `takeaway-slip--detail` modifier (or equivalent detail-specific class) to the main `TakeawaySlip`.

- Change its base from tea-gold to `--folio-paper`; use `--folio-ink` for text. This is the primary fix.
- Build texture only with CSS layers: a low-opacity radial warmth near one corner, a near-invisible repeating linear fiber, and a 1px cool ballpoint rule. Keep all texture below perceptibility at normal reading distance; text must never sit on a visible pattern.
- Use a slightly darker bottom/right edge and a soft, short shadow so it sits above the desk. Square-ish 6–8px corners are more paper-like than a glossy pill; no torn edge, tape graphic, page curl, handwriting font, or random rotation.
- Add a small folio header: `TAKEAWAY`, the selected season/film/book context, and an Edit control. The note itself is roman Source Serif at 18px/1.7, not italic, not in quotation marks.
- Empty state uses the same sheet with a direct `Write takeaway` action. It is an invitation, not a washed-out fake note.
- Keep compact episode/rewatch slips quieter: lighter padding, no fake grain, no extra shadow. The page gets one hero material moment, not five competing papers.

### 4. Give supporting memories a clear hierarchy

- Retain episode memories, rewatches, and characters below the takeaway; their existing data model and actions are sufficient.
- Episode memories: compact paper rows with an episode label, optional title/rating, and the first/full note according to existing content. Show a single empty paper invitation when none exist.
- Rewatches: default to the active release, retain the whole-franchise toggle, and preserve chronological pass numbers. Use the timeline only when there are multiple entries; a single rewatch is a simple compact reflection to avoid decorative scaffolding.
- Characters: retain the character surface/modal. Increase image size only if it does not force a separate card style; place `why` in a quiet reading surface and do not truncate it.
- Use one heading/action pair per section. Empty sections should explain the next action in plain language, not repeat a generic italic placeholder.

### 5. Restore contrast and interaction clarity

- Lift desk text contrast and use `--text-desk` for titles, `--text-desk-muted` only for secondary facts, and `--text-desk-dim` only for inactive/empty metadata. Do not use muted text for actionable controls.
- Keep tags compact. Genres remain graphite tertiary chips; studio gets its existing leather hairline distinction. Neither should compete with title/status.
- Retain the global tungsten focus ring and reduced-motion behavior. All visible controls must preserve 44px touch targets on mobile or have sufficient surrounding hit area.
- Keyboard: release pills, all edit actions, filters, and the anchor row (if added) remain reachable in visual order. No clickable `div` without keyboard behavior.

## Implementation plan

### Phase 1 — shared material and contrast

1. Add folio tokens and detail-slip modifier styles to `Frontend/src/index.css`; keep existing `--page` behavior unchanged elsewhere until the detail result is reviewed.
2. Update `TakeawaySlip.tsx` only enough to opt into the detail folio variant and expose a reliable status rule. Do not create a new generic design-system component.
3. Adjust detail-only heading, rail, release-pill, poster-edge, empty-state, and mobile order styles. Remove any superseded detail styles after confirming no other view consumes them.
4. Document the final token jobs in `Frontend/design.md`.

### Phase 2 — franchise detail

1. Refactor `FranchiseDetailView.tsx` around the header → folio → supporting memories hierarchy.
2. Consolidate rail actions and guard season/movie steppers by active status.
3. Keep selected-release rewatch filtering and make its empty state/action reflect the selected scope.
4. Apply semantic score, poster, release-pill, and progress colors through classes/tokens rather than more inline color values.

### Phase 3 — book parity and refinement

1. Apply the same header/folio hierarchy to `BookDetailView.tsx`, with banker green for active reading.
2. Confirm a book without notes, a completed book, and a planned book do not inherit watching-specific affordances.
3. Delete stale pull-quote/detail CSS and duplicate visual rules once no component uses them.

## Verification and acceptance

Run `npm run lint` and `npm run build` from `Frontend/`. Browser-check at 1280px and 390px with mock/API data for:

- watching season, reading book, completed title, planned title, on-hold title, dropped title;
- long takeaway, empty takeaway, no cover, unrated release;
- season with no episode memories, one rewatch, several rewatches, and characters;
- keyboard focus/Enter/Space for release switching and visible actions; reduced motion.

The work is complete when:

- the takeaway reads as neutral paper with dark ink, not a gold panel;
- the active takeaway is visibly the first thing to read on desktop and mobile;
- watching, reading, completed, planned, held, dropped, high rating, and destructive action remain visually distinct;
- the rail is scannable without looking like three stacked dashboard cards;
- no API/model change or new dependency was introduced.

## Explicitly out of scope

No poster color extraction, image upload changes, new note/highlight/tag models, full light theme, generic texture asset, or animation pass. Add poster-derived accents only if the semantic palette proves insufficient after this page is in use.
