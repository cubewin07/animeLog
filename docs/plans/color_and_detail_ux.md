# Color Expansion & Anime Detail UX Plan

| Field | Value |
|-------|--------|
| **Document** | Palette expansion + franchise/book detail UI/UX |
| **Date** | 2026-08-25 |
| **Status** | Draft — ready to implement |
| **Scope** | `Frontend/` only. Tokens in `index.css`, then detail views, then the rest of the SPA. No backend/API changes. |
| **Product** | Personal anime/book journal of memories and lessons — not a catalog |
| **Supersedes** | The “sparse tungsten” and “danger = spine” rules in `docs/plans/ui_ux_redesign.md` and `Frontend/design.md`. Desk + paper identity stays. |

---

## Overview

The Still & Spine restyle fixed hierarchy and type. Layout on the anime detail page is now above average: sticky poster column, release switcher, score, lesson, episodes, rewatches, characters.

Color did not keep up. The running UI is **walnut + cream text + one gold**. Status, rating, icons, eyebrows, selected pills, timeline nodes, and progress all share `--tungsten`. Completed and dropped share `--spine-text`. Delete uses the same leather red as “finished.” Genre and studio chips are the same muted brown pill. The signature cream **takeaway slip is not used on the detail page at all** — lessons sit on a 5% gold wash over the desk, so the reading column is the same material as the sidebar.

This plan does two things:

1. **Give the whole journal a small set of named hues with jobs**, so watching, reading, planned, held, dropped, completed, high scores, and delete are distinguishable at a glance.
2. **Fix the detail page as the first surface that uses them**, and restore paper as the lesson material.

This is not a return to Midnight Archive indigo, not a MAL genre rainbow, and not a second accent “for pop.” Every new color encodes a fact the user already has in the data.

---

## Diagnosis (verified in source)

### The palette is five families, and four of them are brown

From `Frontend/src/index.css` `:root` and `Frontend/design.md`:

| Family | Tokens | Hue |
|--------|--------|-----|
| Desk | `--desk` … `--desk-surface-highest`, `--still-well` | Warm charcoal / walnut |
| Paper | `--page`, `--page-muted`, `--ink` | Tea-stained cream (almost unused on detail) |
| Lamp | `--tungsten` | Gold — the only highlight |
| Leather | `--spine`, `--spine-text`, `--danger` | Red-brown — completed **and** delete **and** dropped |
| Graphite | `--graphite`, `--text-desk-muted` | Warm gray |

`--status-dropped` aliases `--spine-text`. `--status-plan` aliases `--graphite`. `--status-hold` (`#A88868`) is a dusty tan that disappears on walnut. `--color-accent-cyan` and `--color-accent-emerald` are aliases back to tungsten / spine-text — leftover Midnight names with no real cyan or emerald.

### Tungsten is not sparse; it is the only loud color

On `FranchiseDetailView.tsx` + detail CSS, tungsten is used for:

- Eyebrow (`ARCHIVE // TV ANIME`)
- Selected release pill (fill, border, text)
- Watching pill (same as selected)
- Score number
- Lesson pull-quote left bar and 5% wash
- Episode number
- Rewatch “Watch #N”, node ring, icon, rating
- Focus rings and primary buttons (global)

If everything important is gold, nothing is highlighted.

### The detail page abandoned the signature material

`TakeawaySlip` (cream `--page`, ink text, 18px Source Serif) is imported only by `DashboardView` and `BookRow`.

`FranchiseDetailView` and `BookDetailView` render lessons as `.editorial-pull-quote`:

- Background: `rgba(201, 149, 74, 0.05)` on the desk
- Text: italic Fraunces in `--text-desk` (cream on brown)
- Whole `notes` wrapped in quotation marks
- Left rule: tungsten

Episode memories, rewatch notes, and character `why` are `.desk-card` / `.timeline-card` — same walnut as the stats box. The product rule “lessons live on paper” is true on the dashboard and false on the page built for reading.

### Status cannot be scanned

| Status | Current color | Problem |
|--------|---------------|---------|
| Watching | tungsten | OK, but also used for score, eyebrows, timeline |
| Reading | tungsten (`.status-indicator.reading`) | Books and anime “now” are identical |
| Completed | spine-text | OK in isolation |
| Plan | graphite | Looks like metadata, not a state |
| On hold | `#A88868` | Mud on walnut |
| Dropped | spine-text | **Same as completed** |

Release pills only have `.active` and `.watching`. A completed season and a planned season look the same until you read the stats box.

### Other detail UX issues (layout is fine; information design is not)

1. **Progress stepper shows for every release**, not only `WATCHING`. The redesign said steppers belong on in-progress titles.
2. **Two edit paths** sit next to each other: “Edit Lesson” in the journal column and “Edit Release” in the sidebar, plus an icon-only pen for franchise metadata. Same control, three places.
3. **Empty states are clones** — italic muted serif in a desk-card for missing lesson, missing episodes, missing rewatches, missing characters.
4. **Character portraits are 48×48**; `why` is 14.5px muted desk text. The original plan asked for 120×120 on detail and a full why on paper.
5. **Rewatch list is franchise-wide** with no filter to the selected season/movie, so switching releases does not change the timeline.
6. **Long notes should not be a pull quote.** A 40-word lesson can be a quote. A 400-word lesson in italic with wrapping `“ ”` is harder to read than roman on paper.
7. **`.release-pill-btn` uses `transition: all`** — banned in the redesign a11y rules.
8. **Section headings are identical cream.** Takeaway, episodes, rewatches, and characters have the same visual weight, so the page does not have a “this is the lesson” moment.
9. **Genre and studio tags are the same chip.** Tertiary is correct; identical is not.
10. **Score is always tungsten**, so a 4/10 and a 10/10 are the same gold shout.
11. **Mobile:** sidebar stacks poster then switcher then stats *above* the lesson. On a phone the user scrolls past catalog chrome to reach the reason they opened the page.

---

## Goals & non-goals

### Goals

1. Expand the token set so **status, medium (anime vs book), rating band, and danger are different hues**.
2. Keep the desk dark and the lesson on paper. Color is for **edges, chips, numbers, and section marks** — not a new app skin.
3. Make the anime (and book) detail page the first place the new colors and materials show up.
4. Put `TakeawaySlip` back on detail; stop italic-quoting the full lesson.
5. One primary action per section; steppers only while watching/reading.
6. Apply the same tokens on dashboard, lists, badges, and progress so the project does not have a colorful detail page and a brown everywhere else.

### Non-goals

- Light theme, cream-app, or abandoning walnut desk.
- Per-genre rainbow (MAL). Optional muted genre *families* are phase 2.
- Extracting a dominant color from every poster in v1 (interesting, deferred).
- New models, quote/highlight tags, or API fields.
- Replacing Fraunces / Source Serif / Source Sans / Plex Mono.
- Glassmorphism, neon, or indigo/violet.

---

## Design name: Desk drawer

Still & Spine stays the identity. The missing piece is the **contents of the drawer**: a banker’s-lamp shade, a paused-still blue, oxidized brass, a wax seal, and paper that actually appears on the reading page.

**Signature on detail:** cream slip for the lesson, with a **status-colored left rule and a status-colored 3px edge on the poster**. Gold is no longer the only edge.

**One aesthetic risk:** a cool blue (`--night`) and a green (`--banker`) on a warm walnut desk. Justified by the subject — a paused anime still is cool; a banker’s lamp on a reading desk is green — and constrained to chips, rules, and “now reading,” not backgrounds.

---

## Color tokens (source of truth after this work: `Frontend/src/index.css`)

Keep every existing desk / paper / tungsten / spine token. Add the hues below. Each has a **fill** (dark enough for a 3px edge or a dim wash), a **text** (light enough for AA on `--desk` / `--desk-surface`), and a **dim** wash.

### Core (unchanged)

| Token | Hex | Job |
|-------|-----|-----|
| `--desk` | `#181410` | App background |
| `--desk-raised` | `#231D17` | Cards |
| `--desk-surface` | `#2C261F` | Sidebar boxes, inputs |
| `--page` | `#E2D3BB` | Lesson paper |
| `--ink` | `#2A2218` | Text on paper |
| `--tungsten` | `#C9954A` | Lamp on: **WATCHING**, primary button, focus |
| `--spine` | `#7A3E38` | Leather: **COMPLETED** only |
| `--spine-text` | `#C9A090` | Completed text on desk |
| `--graphite` | `#8A8174` | Tertiary metadata |

### New hues

| Token | Hex | Job | Why this object |
|-------|-----|-----|-----------------|
| `--banker` | `#2F6B4F` | Fill for **READING** / book “now” | Green glass of a banker’s lamp on a reading desk |
| `--banker-text` | `#8FCBAA` | Reading label on desk | AA on walnut |
| `--banker-dim` | `rgba(47, 107, 79, 0.22)` | Reading wash | |
| `--night` | `#3E5F82` | Fill for **PLAN_TO_WATCH / PLAN_TO_READ** | Cool of a paused still / CRT afterglow — the title not yet started |
| `--night-text` | `#9BB6D0` | Plan label on desk | Distinct from gold and green |
| `--night-dim` | `rgba(62, 95, 130, 0.22)` | Plan wash | |
| `--patina` | `#6B7348` | Fill for **ON_HOLD** | Oxidized brass — paused, not dead |
| `--patina-text` | `#C2C87A` | Hold label on desk | |
| `--patina-dim` | `rgba(107, 115, 72, 0.22)` | Hold wash | |
| `--ash` | `#6E5E5C` | Fill for **DROPPED** | Cooler, lifeless — **not** leather |
| `--ash-text` | `#C4B4B0` | Dropped label on desk | |
| `--ash-dim` | `rgba(110, 94, 92, 0.22)` | Dropped wash | |
| `--seal` | `#B44538` | **Delete / error fill only** | Wax-seal carmine. Uncouple from completed |
| `--seal-text` | `#E8A099` | Danger text on desk | |
| `--seal-dim` | `rgba(180, 69, 56, 0.22)` | Danger wash | |
| `--ember` | `#D4783A` | Rating **9–10** | Hotter than tungsten; “this one burned” |
| `--ember-text` | `#F0B27A` | High score on desk | |
| `--ballpoint` | `#2C4A6E` | Left rule on paper when the lesson is not “now” | Ink on a slip, not lamp gold |

### Semantic aliases (replace the current ones)

```css
--status-watching: var(--tungsten);
--status-reading:  var(--banker-text);
--status-completed: var(--spine-text);
--status-plan:     var(--night-text);
--status-hold:     var(--patina-text);
--status-dropped:  var(--ash-text);

--danger:      var(--seal-text);
--danger-fill: var(--seal);
--danger-dim:  var(--seal-dim);
```

`--color-accent-cyan` → `--night-text`. `--color-accent-emerald` → `--banker-text`. Stop pointing leftover Midnight names at gold.

### Rating bands (numbers only, not backgrounds)

| Score | Color |
|-------|--------|
| 9–10 | `--ember-text` |
| 7–8 | `--tungsten` |
| 5–6 | `--text-desk` |
| 1–4 | `--ash-text` |
| empty | `--text-desk-dim` (“Unrated”) |

### What each hue is *not* for

- Do not paint the app background blue or green.
- Do not fill large cards with `--night-dim` / `--banker-dim` (washes stay on chips, pills, 3px edges, progress fills).
- Do not use `--seal` for completed, ratings, or “important.”
- Do not use `--tungsten` for reading, plan, eyebrows of every section, or every icon.
- Paper stays `--page`. Do not tint the slip green/blue; only the **left rule** follows status.

### Contrast (must verify when implementing)

On `--desk` / `--desk-surface`, text tokens must meet WCAG AA for normal text where they label status (11–13px mono is large enough if contrast ≥ 4.5:1; if a text token fails, lighten it, do not darken the desk). `--ink` on `--page` already passes. `--seal` as a **button fill** uses `--page` or white text, not `--seal-text` on `--seal`.

---

## Whole-project color map

Use the same tokens everywhere so lists, dashboard, and detail agree.

| Surface | Today | After |
|---------|--------|--------|
| Status word / badge | watching=gold; others brown/gray; dropped=completed | Each status has its own text + dim chip |
| Progress fill | tungsten, or spine if completed | Watching=tungsten, reading=banker, completed=spine |
| Primary button | tungsten | Unchanged (lamp = action) |
| Focus ring | tungsten | Unchanged |
| Takeaway slip left rule | tungsten, or spine if completed | Status color (watching gold, reading green, completed leather, else ballpoint) |
| Dashboard “now” | watching and reading both gold | Watching gold, reading banker |
| Filter chips on anime/book lists | active = gold wash | Active chip uses that filter’s status color |
| Genre tag | brown chip | Stay tertiary; **studio** gets a hairline `--spine-text` border so the two differ |
| Nav active link | likely gold | Unchanged (one chrome accent is enough) |
| Delete | spine | seal |
| Toasts / errors | spine-ish | seal-text |
| Movie vs TV in switcher | same gold icons | TV icon tungsten-muted; Film icon `--night-text` (cool still) |

Phase 2 (optional, after detail + badges feel right): map genre *families* to quiet chip tints — action/ember, slice-of-life/patina, sci-fi/night, romance/spine-text, comedy/tungsten-dim. Default remains graphite. Do not color every MAL genre name uniquely.

Phase 3 (optional): still-extracted accent as a **poster edge and 8% title wash**, falling back to status color when there is no cover. Do not block v1 on canvas extraction.

---

## Detail page UX (anime first, then books)

### Information hierarchy on the page

```
Primary    cream takeaway slip (full notes, roman, no wrapping quotes)
Secondary  poster with status edge · score (banded) · status word · progress if watching
Tertiary   studio, genres, dates, format
Supporting episode slips · rewatch slips · character why slips
```

Catalog chrome stays in the left column. Journal material stays in the right column **on paper**.

### Desktop wireframe

```
[ ← Anime journal ]

┌─────────────┐    ARCHIVE · TV · S1          ← eyebrow in status color, not always gold
│  poster     │    Frieren: Beyond Journey's End
│  3px status │    [Drama] [Fantasy]   MAPPA   ← studio chip ≠ genre chip
│  edge       │
└─────────────┘    ┌─────────────────────────────────────────────┐
Releases           │ TAKEAWAY                          [Edit]    │
 ┌──────────────┐  │ roman 18–19px on --page                     │
 │ S1  ★8  ●    │  │ left rule = status color                    │
 │ S2  plan     │  └─────────────────────────────────────────────┘
 │ Film night   │
 └──────────────┘  Episode memories              [Log episode]
Score  ★ 8 /10     ┌-ep 4 slip-┐ ┌-ep 7 slip-┐
Format  Season 1   └───────────┘ └───────────┘
Studio  MAPPA
Status  WATCHING   Rewatches (this release ▾ / whole franchise)
Progress 12/24 ±   Watch #1 ──○── paper note
                   Watch #2 ──○── paper note
[Edit release]
[Edit franchise]   Characters                    [Add]
[Delete = seal]    [80px] Name
                   why on a small slip
```

### Mobile wireframe (change order)

```
[ ← Anime ]
Title 22px
Status · score · 12/24 ±
┌─────────────────────┐
│ TAKEAWAY (paper)    │   ← lesson before poster
└─────────────────────┘
[ poster full width ]
Releases as horizontal pills
Episodes / Rewatches / Characters
```

Do not make the user swipe past a 360px poster to reach the lesson.

### Section-by-section changes

**1. Poster**

- 3px border (or inset box-shadow) in the **active release’s status color**.
- Optional 24px bottom gradient from `--still-well` so the edge reads on light posters.
- Placeholder well stays `--still-well`, icon in status color.

**2. Release switcher**

- Each pill: 3px left edge in that release’s status color.
- Selected: dim wash of that status + stronger border. A selected *planned* season is night, not gold.
- Watching: small tungsten dot, not a second gold fill that fights selection.
- TV vs Film: `Tv` / `Film` icons use tungsten-muted vs `--night-text`.
- Keep Add Season / Add Movie as secondary.

**3. Score**

- Number uses the rating band table. `/10` stays muted.
- Unrated stays dim, not gold.

**4. Status + progress**

- Status word uses the new semantic color (already `.status-indicator.{status}` — update the CSS, not the markup).
- Show `ProgressStepper` only when status is `WATCHING` (season/movie) or `READING` (book). Completed rows show `24 eps` as mono text.

**5. Lesson — restore `TakeawaySlip`**

- Replace `.editorial-pull-quote` on both franchise and book detail.
- `isDetail`, full `notes`, **no wrapping quotation marks**, roman Source Serif.
- Left rule: status color (watching tungsten, reading banker, completed spine, otherwise `--ballpoint`).
- Empty: existing empty-slip CTA (“Write the lesson”), not a desk-card.
- Remove the duplicate “Edit Lesson” heading button; the slip already has Edit / Write.

**6. Episode memories**

- Each note is a compact `TakeawaySlip` (or a `.takeaway-slip` variant with smaller padding), label `Episode N`.
- Rating uses the band color.
- Empty: one empty slip with “Log episode memory,” not a centered italic desk-card.

**7. Rewatches**

- Default filter: **selected release**; control to show whole franchise.
- Pass number stays chronological (`passMap` already in the working tree).
- Node color steps: pass 1 graphite, later passes tungsten, latest pass ember — “the lesson got hotter.”
- Note body on paper (small slip), not `.timeline-card` walnut.
- Empty: empty slip + “Log a rewatch.”

**8. Characters**

- Portrait **80×80** (120×120 if only one character).
- `why` on a small slip, full text, never truncated.
- Card click → character surface if a route exists; otherwise keep in place but make `why` readable.
- Empty: empty slip + “Add character.”

**9. Actions**

| Place | Control |
|-------|---------|
| Slip | Write / Edit lesson (paper button) |
| Sidebar | **Edit release** (secondary, labelled) |
| Sidebar | **Edit franchise** (ghost, labelled — not icon-only pen) |
| Sidebar | Delete franchise (`btn-icon danger` → seal) |
| Episode heading | Log episode (secondary) |
| Rewatch heading | Log rewatch (secondary) |
| Character heading | Add character (secondary) |

One primary (`btn-primary` tungsten) on the page at a time: empty lesson CTA. Everything else secondary/ghost.

**10. Eyebrows and section titles**

- Page eyebrow: status color + format (`TV · Season 1`), drop the `ARCHIVE //` catalog voice.
- Section labels: 12px mono in **that section’s hue**, not all gold:
  - Takeaway → `--ink-muted` on paper / `--ballpoint` on desk
  - Episodes → `--tungsten` only if watching, else graphite
  - Rewatches → `--ember-text` if any exist, else graphite
  - Characters → `--spine-text`
- Copy: “Takeaway,” “Episode memories,” “Rewatches,” “Characters.” Drop “Evolving Perspectives & Rewatches” and “CORE LESSON // RECORDED.”

**11. Book detail**

Same split, same slip, same score bands. Reading uses banker everywhere watching would use tungsten (poster edge, status, progress fill, slip rule). Author stays secondary serif, not a gold eyebrow.

---

## Interaction notes

- Switching season/movie updates poster, score, status edge, slip, episode list, and (if filtered) rewatches. That is the point of the switcher; the timeline must not stay franchise-global by default.
- Do not add in-page tabs for Takeaway / Episodes / … on desktop; the page is one scroll. On mobile, a compact jump row (`Takeaway · Episodes · Rewatches · Characters`) is worth it if the page is long.
- Keep `prefers-reduced-motion`. No new GSAP on detail. Replace `transition: all` on `.release-pill-btn` with color/border/background only.
- Icon-only controls need `aria-label` (franchise delete already has one; franchise edit must gain a visible label).

---

## Files to touch

| File | Change |
|------|--------|
| `Frontend/src/index.css` | New tokens; status badge/indicator colors; danger = seal; rating utilities; poster status edge; release-pill status variants; slip rule modifiers; genre vs studio; kill `transition: all` on pills |
| `Frontend/design.md` | Document the expanded palette; retire “sparse tungsten” and “danger = spine” |
| `Frontend/src/components/TakeawaySlip.tsx` | Status-colored left rule; use on detail |
| `Frontend/src/views/FranchiseDetailView.tsx` | Slip, stepper guard, action cleanup, episode/rewatch/character slips, rewatch filter, mobile order via CSS |
| `Frontend/src/views/BookDetailView.tsx` | Same lesson + score + banker reading treatment |
| `Frontend/src/views/DashboardView.tsx` | Reading vs watching color; slips already present |
| `Frontend/src/views/AnimeView.tsx` / `BookView.tsx` | Filter chips pick up status colors |
| `Frontend/src/components/FranchiseCard.tsx` / `BookRow.tsx` | Status edge on list stills (thin) |
| `Frontend/src/components/ProgressStepper.tsx` | Optional `tone` watching \| reading so the + hover is gold vs green |
| Shared `.status-badge` / `.status-indicator` | CSS only — most views already use the class names |

No new styling system. No Tailwind. Prefer classes over more inline color in the detail view (it already has many inline `var(--tungsten)` / `var(--text-desk-muted)`).

---

## Alternatives considered

### A. Keep sparse tungsten; only restore the paper slip

- **Pros:** Smallest diff; original redesign intent.
- **Cons:** Watching/reading/plan/hold/dropped still collide. User’s complaint is color, not only material.
- **Reject as the only change.** Restoring paper is required but not sufficient.

### B. Rainbow / per-genre / poster-extracted everything

- **Pros:** Maximum difference between pages.
- **Cons:** Catalog chrome returns; extracted colors fail AA and look muddy; fights the desk metaphor.
- **Reject for v1.** Poster extract is phase 3, genre families phase 2.

### C. Semantic drawer hues + paper on detail (chosen)

- **Pros:** Status becomes scannable; anime vs book “now” splits; delete ≠ completed; detail gets a real highlight (paper + status edge) without a new skin.
- **Cons:** Two new cool hues on a warm desk must be used as edges, not fills. Implementers must not wash whole cards.

### D. Full cream reading column (page as the right column background)

- **Pros:** Strong journal read.
- **Cons:** Already rejected in the 2026-08-23 redesign (paper is a slip, not the app). A full cream column next to a walnut poster also splits the page into two products.
- **Reject.** Slip, not column skin.

---

## Risks

| Risk | Mitigation |
|------|------------|
| New hues turn into a second dashboard | Tokens are for chips, rules, numbers, 3px edges. Review any fill larger than a pill. |
| Banker green / night blue fail contrast | Ship text tokens light enough for AA; verify 13px mono on `--desk-surface`. |
| Paper on detail feels like a blog | One slip for the main lesson; episode/character slips are smaller; desk stays around them. |
| Filter-chip color on lists gets loud | Dim wash + 2px edge, not solid fills. Inactive chips stay graphite. |
| Scope creeps into a full restyle | PR 1 = tokens + CSS classes. PR 2 = franchise + book detail. PR 3 = dashboard/lists/badges leftovers. |

---

## Rollout (frontend PRs)

### PR 1 — Tokens and shared CSS

- Add `--banker`, `--night`, `--patina`, `--ash`, `--seal`, `--ember`, `--ballpoint` and text/dim pairs.
- Remap `--status-*` and `--danger*`.
- Update `.status-badge`, `.status-indicator`, `.progress-fill`, `.btn-danger`, `.btn-icon.danger`.
- Add `.rating-band-high|mid|low`, `.poster-edge-{status}`, `.release-pill-btn` status modifiers, `.takeaway-slip` rule modifiers, studio vs genre.
- Update `Frontend/design.md`.
- **Do not** restyle detail layout yet. Unmigrated pages should already look better (dropped ≠ completed, reading chip green).

### PR 2 — Franchise + book detail

- `TakeawaySlip` on both detail views; delete editorial pull-quote usage there (keep the CSS until nothing else uses it, then delete).
- Poster status edge, score bands, stepper only when in progress, labelled franchise edit, seal delete.
- Episode / rewatch / character as slips; rewatch filter; copy/eyebrow cleanup.
- Mobile: lesson before poster (`order` in CSS).
- Browser check: watching, completed, plan, hold, dropped, unrated, empty lesson, with episodes, with rewatches; 1280 and 390.

### PR 3 — Rest of the journal

- Dashboard reading vs watching.
- List filter chips and thin poster edges.
- ProgressStepper hover tone for reading.
- Grep remaining hardcoded `var(--tungsten)` that should be status-driven.

**Rollback:** revert PR 2 if detail layout regresses; PR 1 is token-only and should stay.

---

## Acceptance

- A watching anime, a reading book, a planned title, an on-hold title, a completed title, and a dropped title are **five different hues** without reading the word.
- Delete is visually distinct from completed.
- Franchise detail lesson is cream paper, roman, ≥ 16px, not italic-quoted on walnut.
- Score 10 and score 4 are not the same gold.
- Progress stepper is absent on completed releases.
- Tungsten still means “lamp on” (watching + primary + focus), not “any highlight.”
- No new `transition: all`. Focus ring unchanged. Reduced motion unchanged.
- Desktop 1280 and mobile 390: lesson is reachable without hunting; poster edge reads on light and dark stills.

---

## Open questions (implement the default unless product says otherwise)

1. **Rewatch default filter?** Recommended: selected release, with a “Whole franchise” toggle.
2. **Genre family tints?** Recommended: skip until PR 3; graphite chips are fine if status is finally colorful.
3. **Poster color extract?** Recommended: not in these PRs.
4. **Jump row on mobile?** Recommended: yes if the stacked page exceeds ~2 viewports; no extra chrome on desktop.

---

## Key decisions

1. Still & Spine **desk + paper** stays. We add a **drawer of semantic hues**, not a new theme.
2. Tungsten is **WATCHING + primary + focus** only. Reading gets banker green.
3. Dropped gets ash; delete gets seal; completed keeps spine. Those three must never share a token again.
4. Plan is night-blue; hold is patina. Graphite is metadata, not a status.
5. High scores (9–10) get ember; they are allowed to be louder than a 6.
6. Detail lessons return to `TakeawaySlip`. The editorial pull-quote is retired for full notes.
7. Color on detail is **edges and paper**, not card fills.
8. Same tokens everywhere — detail is the first consumer, not a one-off skin.

---

## References

- Product: `AGENTS.md`, `Frontend/AGENTS.md`
- Current tokens: `Frontend/src/index.css`, `Frontend/design.md`
- Prior redesign (hierarchy, routing, slip): `docs/plans/ui_ux_redesign.md`
- Detail views: `Frontend/src/views/FranchiseDetailView.tsx`, `Frontend/src/views/BookDetailView.tsx`
- Slip component: `Frontend/src/components/TakeawaySlip.tsx`
- `frontend-design` skill: subject-derived palette; avoid generic dark+purple and cream+terracotta skins
