import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  AnimeStatus,
  Book,
  BookStatus,
  FavoriteCharacter,
  Rewatch,
} from '../../types';
import { reflectionHref } from '../../shell/paletteSearch';
import type { JournalReflection } from '../../state/useReflections';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export type ContinueItemKind = 'season' | 'movie' | 'book';

export interface ContinueItem {
  key: string;
  kind: ContinueItemKind;
  targetId: number;
  seriesId?: number;
  title: string;
  japaneseTitle?: string | null;
  context: string;
  status: AnimeStatus | BookStatus;
  rating: number | null;
  coverUrl: string | null;
  current: number;
  total: number | null;
  unit: 'ep' | 'min' | 'page';
  stepDelta: number;
  href: string;
  lastActivityAt: number;
  fallbackAt: number;
  isFallbackCompleted: boolean;
  canStep: boolean;
  nextEpisodeNumber?: number;
}

export interface SelectContinueResult {
  hero: ContinueItem | null;
  rest: ContinueItem[];
}

export type PastNoteMode = 'on-this-day' | 'then-vs-now' | 'daily-pick';

export interface PastNoteComparison {
  originalNote: string;
  originalRating: number | null;
  originalDateStr: string | null;
  rewatchNote: string;
  rewatchRating: number | null;
  rewatchDateStr: string | null;
  ratingDelta: number | null;
}

export interface PastNoteSelection {
  id: string;
  mode: PastNoteMode;
  badge: string;
  title: string;
  context: string;
  note: string;
  rating: number | null;
  dateStr: string | null;
  href: string;
  targetKind?: 'season' | 'movie' | 'book' | 'character';
  targetId?: number;
  episodeNumber?: number;
  reflectionKind?: JournalReflection['kind'];
  comparison?: PastNoteComparison;
}

export interface SelectPastNoteResult {
  note: PastNoteSelection | null;
  totalChoices: number;
}

export interface FinishStoryItem {
  key: string;
  targetKind: 'season' | 'movie' | 'book' | 'character';
  targetId: number;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  rating: number | null;
  xpReward: 15 | 10;
  href: string;
  defaultKind: 'lesson' | 'why';
  sortTime: number;
}

export interface NextUpItem {
  key: string;
  kind: 'season' | 'movie' | 'book';
  targetId: number;
  title: string;
  meta: string;
  coverUrl: string | null;
  status: AnimeStatus | BookStatus;
  rating: number | null;
  href: string;
  sortTime: number;
}

type WithOptionalUpdatedAt = { updated_at?: string | null };

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const dateOnly = DATE_ONLY_RE.exec(trimmed);
  if (dateOnly) {
    return Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractCalendarParts(
  input: Date | string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const dateOnly = DATE_ONLY_RE.exec(trimmed);
    if (dateOnly) {
      return {
        year: Number(dateOnly[1]),
        month: Number(dateOnly[2]),
        day: Number(dateOnly[3]),
      };
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    };
  }
  if (Number.isNaN(input.getTime())) return null;
  return {
    year: input.getFullYear(),
    month: input.getMonth() + 1,
    day: input.getDate(),
  };
}

function seasonContext(season: AnimeSeason): string {
  const base = `Season ${season.season_number}`;
  const cleanTitle = season.title?.trim();
  if (!cleanTitle || cleanTitle.toLowerCase() === base.toLowerCase()) {
    return base;
  }
  return `${base} · ${cleanTitle}`;
}

function movieContext(series: AnimeSeries, movie: AnimeMovie): string {
  const cleanTitle = movie.title?.trim();
  if (!cleanTitle || cleanTitle.toLowerCase() === series.title.trim().toLowerCase()) {
    return 'Movie';
  }
  return `Movie · ${cleanTitle}`;
}

function buildActivityMap(activityList: ActivityEvent[]): Map<string, number> {
  const latest = new Map<string, number>();
  for (const event of activityList) {
    const ts = parseTimestamp(event.created_at);
    if (ts <= 0) continue;
    const key = `${event.target_type}:${event.target_id}`;
    const prev = latest.get(key) ?? 0;
    if (ts > prev) latest.set(key, ts);
  }
  return latest;
}

function compareContinueItems(a: ContinueItem, b: ContinueItem): number {
  if (b.lastActivityAt !== a.lastActivityAt) return b.lastActivityAt - a.lastActivityAt;
  if (b.fallbackAt !== a.fallbackAt) return b.fallbackAt - a.fallbackAt;
  const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;
  return b.targetId - a.targetId;
}

function clampedStep(current: number, total: number | null, defaultStep: number): number {
  if (total === null || total === undefined) return defaultStep;
  if (current >= total) return 0;
  return Math.max(1, Math.min(defaultStep, total - current));
}

function makeSeasonContinueItem(
  series: AnimeSeries,
  season: AnimeSeason,
  activityMap: Map<string, number>,
  isFallbackCompleted: boolean,
): ContinueItem {
  const current = Math.max(0, season.progress || 0);
  const total = season.total_episodes ?? null;
  const stepDelta = isFallbackCompleted ? 0 : clampedStep(current, total, 1);
  const lastActivityAt = Math.max(
    activityMap.get(`season:${season.id}`) ?? 0,
    activityMap.get(`episode:${season.id}`) ?? 0,
  );
  const updatedAt = (season as AnimeSeason & WithOptionalUpdatedAt).updated_at;
  const fallbackAt = Math.max(
    parseTimestamp(updatedAt),
    parseTimestamp(season.finish_date),
    parseTimestamp(season.start_date),
    parseTimestamp(season.created_at),
  );

  return {
    key: `season-${season.id}`,
    kind: 'season',
    targetId: season.id,
    seriesId: series.id,
    title: series.title,
    japaneseTitle: series.japanese_title,
    context: seasonContext(season),
    status: season.status,
    rating: season.rating,
    coverUrl: season.cover_image_url || season.image_url || series.cover_image_url || series.image_url || null,
    current,
    total,
    unit: 'ep',
    stepDelta,
    href: `/anime/${series.id}?release=season-${season.id}`,
    lastActivityAt,
    fallbackAt,
    isFallbackCompleted,
    canStep: !isFallbackCompleted && stepDelta > 0,
    nextEpisodeNumber: total !== null ? Math.min(total, current + 1) : current + 1,
  };
}

function makeMovieContinueItem(
  series: AnimeSeries,
  movie: AnimeMovie,
  activityMap: Map<string, number>,
  isFallbackCompleted: boolean,
): ContinueItem {
  const current = Math.max(0, movie.progress_minutes || 0);
  const total = movie.total_minutes ?? null;
  const stepDelta = isFallbackCompleted ? 0 : clampedStep(current, total, 10);
  const lastActivityAt = activityMap.get(`movie:${movie.id}`) ?? 0;
  const updatedAt = (movie as AnimeMovie & WithOptionalUpdatedAt).updated_at;
  const fallbackAt = Math.max(
    parseTimestamp(updatedAt),
    parseTimestamp(movie.finish_date),
    parseTimestamp(movie.start_date),
    parseTimestamp(movie.created_at),
  );

  return {
    key: `movie-${movie.id}`,
    kind: 'movie',
    targetId: movie.id,
    seriesId: series.id,
    title: series.title,
    japaneseTitle: series.japanese_title,
    context: movieContext(series, movie),
    status: movie.status,
    rating: movie.rating,
    coverUrl: movie.cover_image_url || movie.image_url || series.cover_image_url || series.image_url || null,
    current,
    total,
    unit: 'min',
    stepDelta,
    href: `/anime/${series.id}?release=movie-${movie.id}`,
    lastActivityAt,
    fallbackAt,
    isFallbackCompleted,
    canStep: !isFallbackCompleted && stepDelta > 0,
  };
}

function makeBookContinueItem(
  book: Book,
  activityMap: Map<string, number>,
  isFallbackCompleted: boolean,
): ContinueItem {
  const current = Math.max(0, book.progress || 0);
  const total = book.total_pages ?? null;
  const stepDelta = isFallbackCompleted ? 0 : clampedStep(current, total, 10);
  const lastActivityAt = activityMap.get(`book:${book.id}`) ?? 0;
  const updatedAt = (book as Book & WithOptionalUpdatedAt).updated_at;
  const fallbackAt = Math.max(
    parseTimestamp(updatedAt),
    parseTimestamp(book.finish_date),
    parseTimestamp(book.start_date),
    parseTimestamp(book.created_at),
  );

  return {
    key: `book-${book.id}`,
    kind: 'book',
    targetId: book.id,
    title: book.title,
    context: book.author ? `by ${book.author}` : 'Book',
    status: book.status,
    rating: book.rating,
    coverUrl: book.cover_image_url || book.image_url || null,
    current,
    total,
    unit: 'page',
    stepDelta,
    href: `/books/${book.id}`,
    lastActivityAt,
    fallbackAt,
    isFallbackCompleted,
    canStep: !isFallbackCompleted && stepDelta > 0,
  };
}

/**
 * Collects active WATCHING/READING items sorted by latest activity timestamp,
 * falling back to the most recently updated COMPLETED title if nothing is in progress.
 */
export function selectContinueItems(input: {
  seriesList: AnimeSeries[];
  bookList: Book[];
  activityList: ActivityEvent[];
}): SelectContinueResult {
  const { seriesList, bookList, activityList } = input;
  const activityMap = buildActivityMap(activityList);

  const active: ContinueItem[] = [];
  const completed: ContinueItem[] = [];

  for (const series of seriesList) {
    for (const season of series.seasons ?? []) {
      if (season.status === 'WATCHING') {
        active.push(makeSeasonContinueItem(series, season, activityMap, false));
      } else if (season.status === 'COMPLETED') {
        completed.push(makeSeasonContinueItem(series, season, activityMap, true));
      }
    }
    for (const movie of series.movies ?? []) {
      if (movie.status === 'WATCHING') {
        active.push(makeMovieContinueItem(series, movie, activityMap, false));
      } else if (movie.status === 'COMPLETED') {
        completed.push(makeMovieContinueItem(series, movie, activityMap, true));
      }
    }
  }

  for (const book of bookList) {
    if (book.status === 'READING') {
      active.push(makeBookContinueItem(book, activityMap, false));
    } else if (book.status === 'COMPLETED') {
      completed.push(makeBookContinueItem(book, activityMap, true));
    }
  }

  active.sort(compareContinueItems);
  if (active.length > 0) {
    return { hero: active[0], rest: active.slice(1) };
  }

  completed.sort(compareContinueItems);
  if (completed.length > 0) {
    return { hero: completed[0], rest: [] };
  }

  return { hero: null, rest: [] };
}

function reflectionToPastNote(
  r: JournalReflection,
  mode: PastNoteMode,
  badge: string,
): PastNoteSelection {
  return {
    id: r.id,
    mode,
    badge,
    title: r.title,
    context: r.context,
    note: r.note,
    rating: r.rating ?? null,
    dateStr: r.dateStr ?? null,
    href: reflectionHref(r),
    targetKind: r.kind === 'rewatch' || r.targetKind === 'series' ? undefined : r.targetKind,
    targetId: r.kind === 'rewatch' || r.targetKind === 'series' ? undefined : r.targetId,
    episodeNumber: r.episodeNumber,
    reflectionKind: r.kind,
  };
}

function buildThenVsNowNotes(
  seriesList: AnimeSeries[],
  rewatchList: Rewatch[],
): PastNoteSelection[] {
  const seasonsById = new Map<number, { series: AnimeSeries; season: AnimeSeason }>();
  const moviesById = new Map<number, { series: AnimeSeries; movie: AnimeMovie }>();
  const allRewatches = new Map<number, Rewatch>();

  for (const rw of rewatchList) {
    allRewatches.set(rw.id, rw);
  }
  for (const series of seriesList) {
    for (const season of series.seasons ?? []) {
      seasonsById.set(season.id, { series, season });
      for (const rw of season.rewatches ?? []) {
        if (!allRewatches.has(rw.id)) allRewatches.set(rw.id, rw);
      }
    }
    for (const movie of series.movies ?? []) {
      moviesById.set(movie.id, { series, movie });
      for (const rw of movie.rewatches ?? []) {
        if (!allRewatches.has(rw.id)) allRewatches.set(rw.id, rw);
      }
    }
  }

  const results: PastNoteSelection[] = [];

  for (const rw of allRewatches.values()) {
    const rewatchNote = rw.notes?.trim();
    if (!rewatchNote) continue;

    const isMovieRewatch =
      rw.target_type === 'movie' || rw.movie_id != null || rw.movie != null;
    const isSeasonRewatch =
      !isMovieRewatch &&
      (rw.target_type === 'season' ||
        rw.target_type === 'episode' ||
        rw.season_id != null ||
        rw.season != null);

    if (isMovieRewatch) {
      const movieId =
        rw.movie_id ?? rw.movie ?? (rw.target_type === 'movie' ? rw.target_id : null);
      if (movieId == null) continue;
      const entry = moviesById.get(movieId);
      const originalNote = entry?.movie.notes?.trim();
      if (!entry || !originalNote) continue;

      const originalRating = entry.movie.rating ?? null;
      const rewatchRating = rw.rating ?? null;
      const ratingDelta =
        rewatchRating !== null && originalRating !== null
          ? rewatchRating - originalRating
          : null;

      results.push({
        id: `rewatch-${rw.id}`,
        mode: 'then-vs-now',
        badge: 'Then vs now',
        title: entry.series.title,
        context: movieContext(entry.series, entry.movie),
        note: rewatchNote,
        rating: rewatchRating,
        dateStr: rw.finish_date || rw.start_date || null,
        href: `/anime/${entry.series.id}?release=movie-${entry.movie.id}`,
        comparison: {
          originalNote,
          originalRating,
          originalDateStr: entry.movie.finish_date || entry.movie.start_date || entry.movie.created_at || null,
          rewatchNote,
          rewatchRating,
          rewatchDateStr: rw.finish_date || rw.start_date || null,
          ratingDelta,
        },
      });
    } else if (isSeasonRewatch) {
      const seasonId =
        rw.season_id ??
        rw.season ??
        (rw.target_type === 'season' || rw.target_type === 'episode' ? rw.target_id : null);
      if (seasonId == null) continue;
      const entry = seasonsById.get(seasonId);
      if (!entry) continue;

      const epNote =
        rw.target_type === 'episode' && rw.episode_number != null
          ? entry.season.episode_notes?.find(
              (n) => n.episode_number === rw.episode_number && n.note?.trim(),
            )
          : undefined;

      const originalNote = epNote?.note?.trim() || entry.season.notes?.trim();
      if (!originalNote) continue;

      const originalRating = epNote ? (epNote.rating ?? entry.season.rating ?? null) : (entry.season.rating ?? null);
      const rewatchRating = rw.rating ?? null;
      const ratingDelta =
        rewatchRating !== null && originalRating !== null
          ? rewatchRating - originalRating
          : null;
      const epSuffix =
        rw.target_type === 'episode' && rw.episode_number != null
          ? ` · Ep ${rw.episode_number}`
          : '';

      results.push({
        id: `rewatch-${rw.id}`,
        mode: 'then-vs-now',
        badge: 'Then vs now',
        title: entry.series.title,
        context: `${seasonContext(entry.season)}${epSuffix}`,
        note: rewatchNote,
        rating: rewatchRating,
        dateStr: rw.finish_date || rw.start_date || null,
        href: `/anime/${entry.series.id}?release=season-${entry.season.id}${
          rw.target_type === 'episode' && rw.episode_number != null ? `&ep=${rw.episode_number}` : ''
        }`,
        comparison: {
          originalNote,
          originalRating,
          originalDateStr:
            epNote?.created_at ||
            entry.season.finish_date ||
            entry.season.start_date ||
            entry.season.created_at ||
            null,
          rewatchNote,
          rewatchRating,
          rewatchDateStr: rw.finish_date || rw.start_date || null,
          ratingDelta,
        },
      });
    }
  }

  return results.sort((a, b) => {
    const absDeltaB = b.comparison?.ratingDelta != null ? Math.abs(b.comparison.ratingDelta) : -1;
    const absDeltaA = a.comparison?.ratingDelta != null ? Math.abs(a.comparison.ratingDelta) : -1;
    if (absDeltaB !== absDeltaA) return absDeltaB - absDeltaA;
    return parseTimestamp(b.dateStr) - parseTimestamp(a.dateStr);
  });
}

/**
 * Picks a memory for "A note from your past":
 * 1. On this day (matching month/day from a previous year)
 * 2. Then vs now (rewatch note paired with original season/movie note)
 * 3. Daily pick (substantive note > 25 chars seeded by day + manual offset)
 */
export function selectPastNote(input: {
  reflections: JournalReflection[];
  seriesList: AnimeSeries[];
  rewatchList: Rewatch[];
  offset?: number;
  now?: Date | string;
}): SelectPastNoteResult {
  const { reflections, seriesList, rewatchList, offset = 0, now = new Date() } = input;
  const nowParts = extractCalendarParts(now);
  const safeOffset = Math.max(0, Math.floor(offset));

  // Priority 1: On this day
  const onThisDay: PastNoteSelection[] = [];
  if (nowParts) {
    for (const r of reflections) {
      if (!r.note?.trim()) continue;
      const parts = extractCalendarParts(
        r.dateStr || (r.timestamp > 0 ? new Date(r.timestamp) : null),
      );
      if (
        parts &&
        parts.month === nowParts.month &&
        parts.day === nowParts.day &&
        parts.year < nowParts.year
      ) {
        onThisDay.push(reflectionToPastNote(r, 'on-this-day', `On this day · ${parts.year}`));
      }
    }
  }

  // Priority 2: Then vs now
  const thenVsNow = buildThenVsNowNotes(seriesList, rewatchList);

  // Priority 3: Daily pick (substantive > 25 chars, falling back to any non-empty reflection)
  const nonEmpty = reflections.filter((r) => Boolean(r.note?.trim()));
  const substantive = nonEmpty.filter((r) => r.note.trim().length > 25);
  const dailySource = substantive.length > 0 ? substantive : nonEmpty;
  const dailyNotes = dailySource.map((r) =>
    reflectionToPastNote(r, 'daily-pick', 'From your journal'),
  );

  const daySeed = nowParts
    ? Math.floor(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day) / MS_PER_DAY)
    : 0;

  if (onThisDay.length > 0 || thenVsNow.length > 0) {
    const primary = onThisDay.length > 0 ? onThisDay : thenVsNow;
    const secondary = onThisDay.length > 0 ? thenVsNow : [];
    const seen = new Set<string>();
    const cycleList: PastNoteSelection[] = [];

    for (const item of [...primary, ...secondary, ...dailyNotes]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      cycleList.push(item);
    }

    return {
      note: cycleList[safeOffset % cycleList.length] ?? null,
      totalChoices: cycleList.length,
    };
  }

  if (dailyNotes.length === 0) {
    return { note: null, totalChoices: 0 };
  }

  const idx = (daySeed + safeOffset) % dailyNotes.length;
  return {
    note: dailyNotes[idx],
    totalChoices: dailyNotes.length,
  };
}

/**
 * Completed seasons, movies, books, and characters whose notes/why are empty,
 * annotated with their XP reward (15 for titles, 10 for characters).
 */
export function selectFinishStoryItems(
  input: {
    seriesList: AnimeSeries[];
    bookList: Book[];
    characterList: FavoriteCharacter[];
  },
  limit = 6,
): FinishStoryItem[] {
  const { seriesList, bookList, characterList } = input;
  const items: FinishStoryItem[] = [];

  for (const series of seriesList) {
    for (const season of series.seasons ?? []) {
      if (season.status === 'COMPLETED' && !season.notes?.trim()) {
        items.push({
          key: `season-${season.id}`,
          targetKind: 'season',
          targetId: season.id,
          title: series.title,
          subtitle: `${seasonContext(season)} · Completed`,
          coverUrl:
            season.cover_image_url ||
            season.image_url ||
            series.cover_image_url ||
            series.image_url ||
            null,
          rating: season.rating,
          xpReward: 15,
          href: `/anime/${series.id}?release=season-${season.id}`,
          defaultKind: 'lesson',
          sortTime: parseTimestamp(season.finish_date) || parseTimestamp(season.created_at),
        });
      }
    }

    for (const movie of series.movies ?? []) {
      if (movie.status === 'COMPLETED' && !movie.notes?.trim()) {
        items.push({
          key: `movie-${movie.id}`,
          targetKind: 'movie',
          targetId: movie.id,
          title: series.title,
          subtitle: `${movieContext(series, movie)} · Completed`,
          coverUrl:
            movie.cover_image_url ||
            movie.image_url ||
            series.cover_image_url ||
            series.image_url ||
            null,
          rating: movie.rating,
          xpReward: 15,
          href: `/anime/${series.id}?release=movie-${movie.id}`,
          defaultKind: 'lesson',
          sortTime: parseTimestamp(movie.finish_date) || parseTimestamp(movie.created_at),
        });
      }
    }
  }

  for (const book of bookList) {
    if (book.status === 'COMPLETED' && !book.notes?.trim()) {
      items.push({
        key: `book-${book.id}`,
        targetKind: 'book',
        targetId: book.id,
        title: book.title,
        subtitle: book.author ? `by ${book.author} · Completed` : 'Book · Completed',
        coverUrl: book.cover_image_url || book.image_url || null,
        rating: book.rating,
        xpReward: 15,
        href: `/books/${book.id}`,
        defaultKind: 'lesson',
        sortTime: parseTimestamp(book.finish_date) || parseTimestamp(book.created_at),
      });
    }
  }

  for (const char of characterList) {
    if (!char.why?.trim()) {
      items.push({
        key: `character-${char.id}`,
        targetKind: 'character',
        targetId: char.id,
        title: char.name,
        subtitle: char.series_title ? `Character · ${char.series_title}` : 'Character',
        coverUrl: char.cover_image_url || char.image_url || null,
        rating: null,
        xpReward: 10,
        href: `/characters/${char.id}`,
        defaultKind: 'why',
        sortTime: 0,
      });
    }
  }

  items.sort((a, b) => {
    if (b.xpReward !== a.xpReward) return b.xpReward - a.xpReward;
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    if (b.sortTime !== a.sortTime) return b.sortTime - a.sortTime;
    return b.targetId - a.targetId;
  });

  return items.slice(0, Math.max(0, limit));
}

/**
 * Collects PLAN_TO_WATCH seasons/movies and PLAN_TO_READ books for the Next Up shelf,
 * sorted by rating/priority and recency.
 */
export function selectNextUpItems(
  input: {
    seriesList: AnimeSeries[];
    bookList: Book[];
  },
  limit = 8,
): NextUpItem[] {
  const { seriesList, bookList } = input;
  const items: NextUpItem[] = [];

  for (const series of seriesList) {
    for (const season of series.seasons ?? []) {
      if (season.status === 'PLAN_TO_WATCH') {
        const epLabel = season.total_episodes ? ` · ${season.total_episodes} eps` : '';
        items.push({
          key: `season-${season.id}`,
          kind: 'season',
          targetId: season.id,
          title: series.title,
          meta: `Season ${season.season_number}${epLabel}`,
          coverUrl:
            season.cover_image_url ||
            season.image_url ||
            series.cover_image_url ||
            series.image_url ||
            null,
          status: season.status,
          rating: season.rating,
          href: `/anime/${series.id}?release=season-${season.id}`,
          sortTime: parseTimestamp(season.created_at),
        });
      }
    }

    for (const movie of series.movies ?? []) {
      if (movie.status === 'PLAN_TO_WATCH') {
        const minLabel = movie.total_minutes ? ` · ${movie.total_minutes} min` : '';
        items.push({
          key: `movie-${movie.id}`,
          kind: 'movie',
          targetId: movie.id,
          title: series.title,
          meta: `${movieContext(series, movie)}${minLabel}`,
          coverUrl:
            movie.cover_image_url ||
            movie.image_url ||
            series.cover_image_url ||
            series.image_url ||
            null,
          status: movie.status,
          rating: movie.rating,
          href: `/anime/${series.id}?release=movie-${movie.id}`,
          sortTime: parseTimestamp(movie.created_at),
        });
      }
    }
  }

  for (const book of bookList) {
    if (book.status === 'PLAN_TO_READ') {
      const pageLabel = book.total_pages ? `${book.total_pages} pages` : book.author || 'Book';
      items.push({
        key: `book-${book.id}`,
        kind: 'book',
        targetId: book.id,
        title: book.title,
        meta: pageLabel,
        coverUrl: book.cover_image_url || book.image_url || null,
        status: book.status,
        rating: book.rating,
        href: `/books/${book.id}`,
        sortTime: parseTimestamp(book.created_at),
      });
    }
  }

  items.sort((a, b) => {
    const ratingDiff = (b.rating ?? -1) - (a.rating ?? -1);
    if (ratingDiff !== 0) return ratingDiff;
    if (b.sortTime !== a.sortTime) return b.sortTime - a.sortTime;
    return b.targetId - a.targetId;
  });

  return items.slice(0, Math.max(0, limit));
}
