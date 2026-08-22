# Plan: Series, Seasons, Movies & Episode Notes Architecture

## Goal

Refactor the flat `Anime` journal entry into a franchise hierarchy that keeps
series-level memories separate from TV-season and film progress:

```
Genre ── (ManyToMany) ── AnimeSeries
                             ├── FavoriteCharacter
                             ├── AnimeSeason ── (ManyToMany) ── Studio
                             │      ├── EpisodeNote
                             │      └── Rewatch
                             └── AnimeMovie ── (ManyToMany) ── Studio
                                    └── Rewatch
```

TV seasons and films are intentionally separate models. Their progress units
are different (episodes versus minutes), and this avoids a misleading
`ReleaseType` field with nullable, overloaded fields. OVAs and specials are
out of scope for this migration; add a dedicated model later only after their
fields and rewatch relationship are decided.

## Scope and migration decision

This is a development-only, intentionally destructive schema change. Existing
`Anime`, `Rewatch`, `FavoriteCharacter`, and Anime-to-Genre/Studio association
data may be discarded and rebuilt with `seed_journal`. `Book`, `Genre`, and
`Studio` data must remain intact.

Do **not** delete `db.sqlite3` to force migrations. Instead, create and review
an explicit migration that drops the old anime subtree in dependency order and
creates the new models. The migration should contain the equivalent of:

1. Delete the old `Rewatch` and `FavoriteCharacter` tables.
2. Delete the old `Anime` model and its M2M relations.
3. Create `AnimeSeries`, `AnimeSeason`, `AnimeMovie`, `EpisodeNote`, then the
   new `Rewatch` and `FavoriteCharacter` tables/relations.

Before running it, inspect the generated migration to confirm it does not
alter `Book`, `Genre`, or `Studio` unexpectedly. No data migration is required
for the discarded anime data.

## Backend design

### Models

Keep `AnimeStatus` unchanged: `WATCHING`, `COMPLETED`, `ON_HOLD`, `DROPPED`,
and `PLAN_TO_WATCH`.

#### `AnimeSeries`

- `title`, `created_at`
- `genres = ManyToManyField(Genre, related_name="anime_series")`
- No direct `studios` relation. A franchise's studios are derived from its
  seasons and movies, because they can change between releases.
- `ordering = ["-created_at"]`

#### `AnimeSeason`

- `series = ForeignKey(AnimeSeries, related_name="seasons", on_delete=CASCADE)`
- `title`, `season_number`, `status`, `progress`, `total_episodes`, `rating`,
  `start_date`, `finish_date`, `notes`, `created_at`
- `studios = ManyToManyField(Studio, related_name="anime_seasons", blank=True)`
- `season_number` is a positive integer and unique within a series.
- `progress` is an episode count. If `total_episodes` is known, it must be
  positive and `progress <= total_episodes`.
- `rating` is null or 1–10. `notes` remains nullable/blank, matching the
  existing journal semantics.

#### `AnimeMovie`

- `series = ForeignKey(AnimeSeries, related_name="movies", on_delete=CASCADE)`
- `title`, `status`, `progress_minutes`, `total_minutes`, `rating`,
  `start_date`, `finish_date`, `notes`, `created_at`
- `studios = ManyToManyField(Studio, related_name="anime_movies", blank=True)`
- `progress_minutes` is a non-negative minute count. If `total_minutes` is
  known, it must be positive and progress cannot exceed it.
- `rating` is null or 1–10. A movie has an overall reflection (`notes`) but no
  `EpisodeNote` records.

#### `EpisodeNote`

- `season = ForeignKey(AnimeSeason, related_name="episode_notes", on_delete=CASCADE)`
- `episode_number`, optional `episode_title`, required `note`, optional
  `rating`, `created_at`
- `episode_number` is positive and cannot exceed the season's known total.
- One note is allowed per `(season, episode_number)`; editing replaces that
  episode's standout memory rather than creating duplicates.
- `rating` is null or 1–10.

#### `Rewatch`

- Preserve `start_date`, `finish_date`, nullable 1–10 `rating`, and `notes`.
- Add nullable `season` and `movie` foreign keys, with distinct
  `related_name="rewatches"` values on each model.
- Add a database `CheckConstraint` and serializer validation requiring exactly
  one target: a rewatch belongs to one season *or* one movie, never both or
  neither.
- Add a read-only `release_title` field in API output. Remove the obsolete
  `anime` and `anime_title` fields.

#### `FavoriteCharacter`

- Replace `anime` with
  `series = ForeignKey(AnimeSeries, related_name="favorite_characters", on_delete=CASCADE)`.
- Keep `name` and `why`; expose read-only `series_title` instead of
  `anime_title`.

Implement cross-field rules in both model validation and DRF serializer
validation. Add database constraints wherever possible; do not rely on the
client to keep progress or target relationships valid.

### Admin

- Register `AnimeSeries` with `AnimeSeasonInline`, `AnimeMovieInline`, and
  `FavoriteCharacterInline`.
- Register `AnimeSeason` with `EpisodeNoteInline` and `RewatchInline`.
- Register `AnimeMovie` with `RewatchInline`.
- Give season/movie admins status, rating, studio, and series filters;
  configure `filter_horizontal` for their studio relationship.
- Keep standalone admin registrations for `EpisodeNote`, `Rewatch`, and
  `FavoriteCharacter` for direct search and editing.

### API contract

This is a single breaking API cutover. Remove `/api/anime/` when the frontend
switches; do not maintain a compatibility alias during this development phase.
Use DRF's normal trailing-slash URLs:

| Resource | Endpoints and ownership |
|---|---|
| Series | `/api/series/`, `/api/series/{id}/`; series owns title and genres |
| Seasons | `/api/seasons/`, `/api/seasons/{id}/`, `/api/seasons/{id}/progress/`; season owns studios and episode progress |
| Movies | `/api/movies/`, `/api/movies/{id}/`, `/api/movies/{id}/progress/`; movie owns studios and minute progress |
| Episode notes | `/api/episode-notes/`, `/api/episode-notes/{id}/`; notes belong only to seasons |
| Rewatches | `/api/rewatches/`, `/api/rewatches/{id}/`; accepts exactly one of `season` or `movie` |
| Characters | `/api/characters/`, `/api/characters/{id}/`; accepts `series` |
| Shared data | existing `/api/genres/`, `/api/studios/`, `/api/books/`, and `/api/stats/` |

Use nested relations for **read output** only. `GET /api/series/` and detail
responses include `genres`, `seasons`, `movies`, and `favorite_characters`.
Seasons include `studios`, `episode_notes`, and `rewatches`; movies include
`studios` and `rewatches`.

Write payload rules:

- Relation writes use ID arrays/IDs (`genre_ids`, `studio_ids`, `series`,
  `season`, `movie`) rather than response-shaped objects.
- `POST /api/series/` accepts an `initial_season` object and creates both in
  one transaction. This prevents an orphaned series when the initial-season
  creation fails.
- Later seasons and movies are created and edited through their own endpoints.
  Series PATCH does not silently create, update, or delete nested releases.
- `EpisodeNote` is created/edited through its own endpoint. A duplicate
  season/episode combination returns a validation error; the client must PATCH
  the existing note to edit it.
- `PATCH .../progress/` accepts `{ "delta": 1 }` or `{ "delta": -1 }`. It
  performs an atomic persisted-row update, validates bounds, and returns the
  updated release. The frontend must not fetch, calculate, then PATCH a raw
  progress value.

`SeriesViewSet` must prefetch the full nested graph required by the table:
genres, favorite characters, seasons with studios/episode notes/rewatches, and
movies with studios/rewatches. Rewatch and character list endpoints should use
`select_related` for their release/series target. Support documented filters:
`series`, `status`, `search`, and `genre` where applicable.

### Status and statistics rules

- Direct release PATCH and progress actions are the source of truth for status
  transitions. Moving progress above zero changes `PLAN_TO_WATCH` to
  `WATCHING`; reaching a known total changes `WATCHING` to `COMPLETED` and sets
  `finish_date` only when it is absent. Lowering progress does not silently
  erase a deliberate terminal status; editing status remains explicit.
- “Active watching” means the count of `AnimeSeason` plus `AnimeMovie` records
  with `WATCHING` status, not the count of franchises.
- “Total completed” means completed seasons plus completed movies plus
  completed books.
- “Total lessons” counts nonblank season notes, movie notes, episode notes,
  rewatch notes, and book notes. Character `why` remains a separate character
  memory and is not counted as a lesson.
- A series table row reports release completion (`completed releases / total
  releases`) and TV episode progress (`watched episodes / known TV episodes`).
  It must not add movie minutes to episode totals. Studios shown at series level
  are a derived, de-duplicated list from its releases.

### Seed data

Rewrite `seed_journal` to seed the new models idempotently, without a single
global `if not Model.objects.exists()` guard. It must create or reuse each
named fixture independently and link relations after creation.

Seed at least:

- *Frieren* with Season 1, a season reflection, and standout episode notes.
- *Attack on Titan* Seasons 1–4, with Wit Studio on earlier seasons and MAPPA
  on later seasons.
- *Demon Slayer* Seasons 1–2 plus *Mugen Train* as an `AnimeMovie`.
- *Steins;Gate* Season 1 plus its movie, at least one rewatch, and characters
  attached to the series.
- Existing book fixtures, unchanged.

The command must be safe to run twice and have a test that asserts the second
run does not create duplicates.

## Frontend design

### Types and client

- Replace the old `Anime` interface/API with `AnimeSeries`, `AnimeSeason`,
  `AnimeMovie`, and `EpisodeNote`.
- Update `Rewatch` to carry `season`, `movie`, and optional `release_title`;
  update `FavoriteCharacter` to carry `series` and optional `series_title`.
- Add `seriesApi`, `seasonApi`, `movieApi`, and `episodeNoteApi` using the
  endpoint and write-payload contracts above.
- Delete or refactor the obsolete mock/local-storage data and its old
  `animelog_anime_v1`, rewatch, and character shapes. It must not keep the old
  `Anime` type compiling accidentally.

### Series journal UI

- `SeriesTableView` has one top-level row per franchise, showing release
  completion, TV episode progress, derived studios, and series genres.
- Expanding a series lists TV seasons and movies as distinct row types.
  Season rows have the episode stepper, episode-note action, rewatch action,
  reflection drawer, and edit/delete controls. Movie rows have a minute
  progress control, rewatch action, overall reflection, and edit/delete
  controls; they do not show an episode-note action.
- `EntryModal` supports: (1) new series with an atomic initial TV season, (2)
  a later season for an existing series, and (3) a film for an existing series.
- Add `EpisodeNoteModal`; update rewatch targeting to select a season or movie
  and character targeting to select a series.
- Update dashboard in-progress cards and lesson spotlight to work from releases
  rather than the removed `Anime` type.

Update all affected callers, not just the table and entry modal: `App.tsx`,
`AnimeView.tsx`, `DashboardView.tsx`, `AnimeCard.tsx`, `QuickModals.tsx`,
`CharactersView.tsx`, `CharacterCard.tsx`, `RewatchesView.tsx`,
`RewatchTimeline.tsx`, `api/client.ts`, `api/mockData.ts`, and `api/storage.ts`.

## Implementation order

1. Implement models, constraints, admin, and the reviewed destructive
   migration. Apply it to the local development database.
2. Rewrite and verify `seed_journal` against the new schema.
3. Implement serializers, viewsets, query prefetching, URLs, and rewritten
   backend tests. Remove the old anime endpoint in this same backend change.
4. Update TypeScript types and API client, then migrate the application state,
   modals, views, and cards to the new contract.
5. Run the automated checks, start both applications, and complete the manual
   browser verification below.

## Verification plan

### Automated tests

- Run `python manage.py makemigrations --check` after the migration is
  committed, then `python manage.py migrate` against the local development DB.
- Run `python manage.py test`. Replace obsolete Anime tests with coverage for:
  - model constraints for ratings, positive numbers, progress bounds, unique
    season/episode keys, and exactly-one rewatch target;
  - series/release/note nested read shapes and query filters;
  - atomic initial-series creation, season/movie/episode-note CRUD, progress
    endpoint boundaries/status transitions, and cascade deletion;
  - the precise statistics definitions above;
  - idempotent seed data.
- Run `python manage.py seed_journal` twice and assert expected fixture counts
  and relationships.
- Run `npm run build` and `npm run lint` in `Frontend/`.

### Manual browser verification

- Confirm one row per franchise and correct per-release studios, including Wit
  versus MAPPA across *Attack on Titan*.
- Expand *Demon Slayer* and verify its film is rendered as a movie, not as a
  TV season or episode-progress row.
- Create a series with an initial season, add a later season and a movie, then
  reload to verify persistence.
- Add, edit, and reject a duplicate standout episode note; verify a note cannot
  exceed a known episode total.
- Use both positive and negative progress controls at zero and at the known
  total; verify status/date behavior and no overrun.
- Create rewatches for a season and a movie, plus a character for the series;
  verify the new labels in the rewatch and character views.
- Delete a series and verify its releases, notes, rewatches, and characters
  disappear while books, genres, and studios remain.
