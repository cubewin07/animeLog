import type {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
  RewatchTargetType,
} from '../../types';
import type { JournalReflection, ReflectionKind } from '../../state/useReflections';
import { formatDate } from '../../lib/format';
import { getCharacterCoverUrl } from '../characters/characterUtils';

function targetType(r: Rewatch): RewatchTargetType {
  if (r.target_type) return r.target_type;
  if (r.movie) return 'movie';
  return 'season';
}

function targetKey(r: Rewatch): string {
  const type = targetType(r);
  if (type === 'series') {
    const id = r.series_id ?? r.target_id;
    return `series:${id}`;
  }
  if (type === 'season') {
    const id = r.season_id ?? (r.target_type === 'season' ? r.target_id : r.season ?? r.target_id);
    return `season:${id}`;
  }
  if (type === 'movie') {
    const id = r.movie_id ?? (r.target_type === 'movie' ? r.target_id : r.movie ?? r.target_id);
    return `movie:${id}`;
  }
  if (type === 'episode') {
    const sId = r.season_id ?? r.target_id;
    const epNum = r.episode_number ?? '';
    return `episode:${sId}:${epNum}`;
  }
  return `target:${r.target_id}`;
}

function sortKey(r: Rewatch): string | null {
  return r.finish_date || r.start_date || null;
}

function compareRewatchesNewestFirst(a: Rewatch, b: Rewatch): number {
  const dateA = sortKey(a);
  const dateB = sortKey(b);

  if (dateA && dateB) {
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return b.id - a.id;
  }
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  return b.id - a.id;
}

function passNumbers(allRewatches: Rewatch[]): Map<number, number> {
  const map = new Map<number, number>();
  const groups = new Map<string, Rewatch[]>();

  for (const r of allRewatches) {
    const key = targetKey(r);
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }

  groups.forEach((items) => {
    const sorted = [...items].sort((a, b) => {
      const dateA = sortKey(a);
      const dateB = sortKey(b);

      if (dateA && dateB) {
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return a.id - b.id;
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      return a.id - b.id;
    });

    sorted.forEach((r, idx) => {
      map.set(r.id, idx + 1);
    });
  });

  return map;
}

export type NormalizedReflectionKind =
  | 'episode'
  | 'season'
  | 'movie'
  | 'book'
  | 'character'
  | 'rewatch';

export type JournalKindFilter = 'ALL' | NormalizedReflectionKind;

export const JOURNAL_KIND_DEFS: readonly { id: JournalKindFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'episode', label: 'Episode' },
  { id: 'season', label: 'Season' },
  { id: 'movie', label: 'Movie' },
  { id: 'book', label: 'Book' },
  { id: 'character', label: 'Character' },
  { id: 'rewatch', label: 'Rewatch' },
] as const;

export interface JournalComposerTarget {
  targetKind: 'season' | 'movie' | 'book' | 'character';
  id: number;
  title: string;
  context?: string;
  defaultKind: 'lesson' | 'episode' | 'return' | 'why';
  episodeNumber?: number;
}

export interface JournalEntry extends JournalReflection {
  normalizedKind: NormalizedReflectionKind;
  kindLabel: string;
  coverUrl: string | null;
  coverVariant: 'poster' | 'portrait';
  href: string;
  monthKey: string;
  monthLabel: string;
  dateLabel: string;
  composerTarget: JournalComposerTarget | null;
}

export interface JournalMonthGroup {
  monthKey: string;
  monthLabel: string;
  entries: JournalEntry[];
}

export interface ThenVsNowItem {
  id: number;
  rewatch: Rewatch;
  targetType: RewatchTargetType;
  passNumber: number;
  title: string;
  context: string;
  coverUrl: string | null;
  href: string;
  originalNote: string | null;
  originalRating: number | null;
  rewatchNote: string | null;
  rewatchRating: number | null;
  ratingDelta: number | null;
  dateStr: string | null;
  dateLabel: string;
  monthKey: string;
  monthLabel: string;
}

export interface EnrichJournalSources {
  seriesList: readonly AnimeSeries[];
  bookList: readonly Book[];
  characterList: readonly FavoriteCharacter[];
}

const VALID_NORMALIZED_KINDS = new Set<NormalizedReflectionKind>([
  'episode',
  'season',
  'movie',
  'book',
  'character',
  'rewatch',
]);

const KIND_LABELS: Record<NormalizedReflectionKind, string> = {
  episode: 'Episode Note',
  season: 'Season Note',
  movie: 'Movie Note',
  book: 'Book Note',
  character: 'Character Note',
  rewatch: 'Rewatch Note',
};

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ISO_YEAR_MONTH_RE = /^(\d{4})-(\d{2})/;

function nonEmptyUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Normalizes a journal filter param (`'film'` -> `'movie'`, invalid/empty -> `'ALL'`).
 */
export function normalizeJournalKind(raw: string | null | undefined): JournalKindFilter {
  if (!raw) return 'ALL';
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned || cleaned === 'all') return 'ALL';
  if (cleaned === 'film' || cleaned === 'movie') return 'movie';
  if (VALID_NORMALIZED_KINDS.has(cleaned as NormalizedReflectionKind)) {
    return cleaned as NormalizedReflectionKind;
  }
  return 'ALL';
}

function normalizeReflectionKind(kind: ReflectionKind | string): NormalizedReflectionKind {
  const normalized = normalizeJournalKind(kind);
  return normalized === 'ALL' ? 'season' : normalized;
}

/**
 * Extracts a timezone-safe `{ monthKey, monthLabel }` pair (`"2026-04"` / `"April 2026"`),
 * falling back to `"undated"` / `"Undated"` when no valid date is available.
 */
export function parseJournalMonth(
  dateStr?: string | null,
  timestamp?: number,
): { monthKey: string; monthLabel: string } {
  const trimmed = dateStr?.trim();
  if (trimmed) {
    const isoMatch = ISO_YEAR_MONTH_RE.exec(trimmed);
    if (isoMatch) {
      const year = isoMatch[1];
      const monthNum = Number(isoMatch[2]);
      if (monthNum >= 1 && monthNum <= 12) {
        return {
          monthKey: `${year}-${isoMatch[2]}`,
          monthLabel: `${FULL_MONTHS[monthNum - 1]} ${year}`,
        };
      }
    }
    const parsedMs = Date.parse(trimmed);
    if (!Number.isNaN(parsedMs)) {
      const d = new Date(parsedMs);
      const year = d.getUTCFullYear();
      const monthIdx = d.getUTCMonth();
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        monthKey: `${year}-${mm}`,
        monthLabel: `${FULL_MONTHS[monthIdx]} ${year}`,
      };
    }
  }

  if (timestamp && Number.isFinite(timestamp) && timestamp > 0) {
    const d = new Date(timestamp);
    if (!Number.isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const monthIdx = d.getUTCMonth();
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        monthKey: `${year}-${mm}`,
        monthLabel: `${FULL_MONTHS[monthIdx]} ${year}`,
      };
    }
  }

  return { monthKey: 'undated', monthLabel: 'Undated' };
}

function parseEntrySortMs(entry: Pick<JournalEntry, 'timestamp' | 'dateStr'>): number {
  if (entry.timestamp && Number.isFinite(entry.timestamp) && entry.timestamp > 0) {
    return entry.timestamp;
  }
  const trimmed = entry.dateStr?.trim();
  if (!trimmed) return 0;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }
  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Enriches raw reflections with artwork URLs, canonical destinations, formatted month buckets,
 * and Composer pre-targeting metadata.
 */
export function enrichJournalEntries(
  reflections: readonly JournalReflection[],
  { seriesList, bookList, characterList }: EnrichJournalSources,
): JournalEntry[] {
  const seriesById = new Map<number, AnimeSeries>();
  const seasonById = new Map<number, { season: AnimeSeason; series: AnimeSeries }>();
  const movieById = new Map<number, { movie: AnimeMovie; series: AnimeSeries }>();

  for (const series of seriesList) {
    seriesById.set(series.id, series);
    for (const season of series.seasons ?? []) {
      seasonById.set(season.id, { season, series });
    }
    for (const movie of series.movies ?? []) {
      movieById.set(movie.id, { movie, series });
    }
  }

  const bookById = new Map<number, Book>();
  for (const book of bookList) {
    bookById.set(book.id, book);
  }

  const characterById = new Map<number, FavoriteCharacter>();
  for (const char of characterList) {
    characterById.set(char.id, char);
  }

  return reflections.map((reflection) => {
    const normalizedKind = normalizeReflectionKind(reflection.kind);
    const kindLabel = KIND_LABELS[normalizedKind];

    let coverUrl: string | null = null;
    let coverVariant: 'poster' | 'portrait' = 'poster';
    let href = '/journal';
    let composerTarget: JournalComposerTarget | null = null;

    if (reflection.targetKind === 'character') {
      const char = characterById.get(reflection.targetId);
      coverUrl = char ? getCharacterCoverUrl(char) : null;
      coverVariant = 'portrait';
      href = `/characters/${reflection.targetId}`;
      composerTarget = {
        targetKind: 'character',
        id: reflection.targetId,
        title: reflection.title,
        context: reflection.context,
        defaultKind: 'why',
      };
    } else if (reflection.targetKind === 'book') {
      const book = bookById.get(reflection.targetId);
      coverUrl = nonEmptyUrl(book?.cover_image_url) || nonEmptyUrl(book?.image_url);
      href = `/books/${reflection.targetId}`;
      composerTarget = {
        targetKind: 'book',
        id: reflection.targetId,
        title: reflection.title,
        context: reflection.context,
        defaultKind: 'lesson',
      };
    } else if (reflection.targetKind === 'movie') {
      const movieEntry = movieById.get(reflection.targetId);
      const series =
        (reflection.seriesId != null ? seriesById.get(reflection.seriesId) : undefined) ??
        movieEntry?.series;
      coverUrl =
        nonEmptyUrl(movieEntry?.movie.cover_image_url) ||
        nonEmptyUrl(movieEntry?.movie.image_url) ||
        nonEmptyUrl(series?.cover_image_url) ||
        nonEmptyUrl(series?.image_url);

      const resolvedSeriesId = reflection.seriesId ?? series?.id;
      if (resolvedSeriesId != null) {
        href = movieEntry
          ? `/anime/${resolvedSeriesId}?release=movie-${reflection.targetId}`
          : `/anime/${resolvedSeriesId}`;
      }

      if (movieEntry) {
        composerTarget = {
          targetKind: 'movie',
          id: reflection.targetId,
          title: reflection.title,
          context: reflection.context,
          defaultKind: normalizedKind === 'rewatch' ? 'return' : 'lesson',
        };
      }
    } else {
      const seasonEntry = seasonById.get(reflection.targetId);
      const series =
        (reflection.seriesId != null ? seriesById.get(reflection.seriesId) : undefined) ??
        seasonEntry?.series;
      coverUrl =
        nonEmptyUrl(seasonEntry?.season.cover_image_url) ||
        nonEmptyUrl(seasonEntry?.season.image_url) ||
        nonEmptyUrl(series?.cover_image_url) ||
        nonEmptyUrl(series?.image_url);

      const resolvedSeriesId = reflection.seriesId ?? series?.id;
      if (resolvedSeriesId != null) {
        if (seasonEntry) {
          const epParam = reflection.episodeNumber ? `&ep=${reflection.episodeNumber}` : '';
          href = `/anime/${resolvedSeriesId}?release=season-${reflection.targetId}${epParam}`;
        } else {
          href = `/anime/${resolvedSeriesId}`;
        }
      }

      if (seasonEntry) {
        composerTarget = {
          targetKind: 'season',
          id: reflection.targetId,
          title: reflection.title,
          context: reflection.context,
          defaultKind:
            normalizedKind === 'episode'
              ? 'episode'
              : normalizedKind === 'rewatch'
                ? 'return'
                : 'lesson',
          ...(normalizedKind === 'episode'
            ? { episodeNumber: reflection.episodeNumber ?? 1 }
            : {}),
        };
      } else if (series?.seasons?.[0]) {
        composerTarget = {
          targetKind: 'season',
          id: series.seasons[0].id,
          title: reflection.title,
          context: reflection.context,
          defaultKind: normalizedKind === 'rewatch' ? 'return' : 'lesson',
        };
      }
    }

    const { monthKey, monthLabel } = parseJournalMonth(reflection.dateStr, reflection.timestamp);
    const dateLabel = reflection.dateStr
      ? formatDate(reflection.dateStr)
      : reflection.timestamp > 0
        ? formatDate(reflection.timestamp)
        : 'Undated';

    return {
      ...reflection,
      normalizedKind,
      kindLabel,
      coverUrl,
      coverVariant,
      href,
      monthKey,
      monthLabel,
      dateLabel,
      composerTarget,
    };
  });
}

/**
 * Filters enriched journal entries by kind and case-insensitive search across title, context, and note.
 */
export function filterJournalEntries(
  entries: readonly JournalEntry[],
  { kind = 'ALL', q = '' }: { kind?: string | null; q?: string | null } = {},
): JournalEntry[] {
  const targetKind = normalizeJournalKind(kind);
  const needle = (q ?? '').trim().toLowerCase();

  return entries.filter((entry) => {
    if (targetKind !== 'ALL' && entry.normalizedKind !== targetKind) {
      return false;
    }
    if (!needle) return true;
    return (
      entry.title.toLowerCase().includes(needle) ||
      entry.context.toLowerCase().includes(needle) ||
      entry.note.toLowerCase().includes(needle)
    );
  });
}

/**
 * Groups entries descending by month (`YYYY-MM`), placing `"Undated"` at the bottom.
 */
export function groupJournalByMonth(entries: readonly JournalEntry[]): JournalMonthGroup[] {
  const buckets = new Map<string, { monthLabel: string; entries: JournalEntry[] }>();

  for (const entry of entries) {
    const existing = buckets.get(entry.monthKey);
    if (existing) {
      existing.entries.push(entry);
    } else {
      buckets.set(entry.monthKey, {
        monthLabel: entry.monthLabel,
        entries: [entry],
      });
    }
  }

  const keys = Array.from(buckets.keys()).sort((a, b) => {
    if (a === 'undated') return 1;
    if (b === 'undated') return -1;
    return b.localeCompare(a);
  });

  return keys.map((monthKey) => {
    const bucket = buckets.get(monthKey)!;
    const sortedEntries = [...bucket.entries].sort(
      (a, b) => parseEntrySortMs(b) - parseEntrySortMs(a),
    );
    return {
      monthKey,
      monthLabel: bucket.monthLabel,
      entries: sortedEntries,
    };
  });
}

/**
 * Pairs each Rewatch with its original series/season/movie/episode data, cover art,
 * canonical href, chronological pass number, and numeric rating delta.
 */
export function buildThenVsNowItems(
  rewatchList: readonly Rewatch[],
  seriesList: readonly AnimeSeries[],
): ThenVsNowItem[] {
  const seriesById = new Map<number, AnimeSeries>();
  const seasonById = new Map<number, { season: AnimeSeason; series: AnimeSeries }>();
  const movieById = new Map<number, { movie: AnimeMovie; series: AnimeSeries }>();

  for (const series of seriesList) {
    seriesById.set(series.id, series);
    for (const season of series.seasons ?? []) {
      seasonById.set(season.id, { season, series });
    }
    for (const movie of series.movies ?? []) {
      movieById.set(movie.id, { movie, series });
    }
  }

  const mutableRewatches = [...rewatchList];
  const passMap = passNumbers(mutableRewatches);
  const sortedRewatches = mutableRewatches.sort(compareRewatchesNewestFirst);

  return sortedRewatches.map((rewatch) => {
    const tType = targetType(rewatch);
    let series: AnimeSeries | undefined;
    let season: AnimeSeason | undefined;
    let movie: AnimeMovie | undefined;
    let episodeNote: EpisodeNote | undefined;

    if (tType === 'season' || tType === 'episode') {
      const seasonId =
        rewatch.season_id ??
        (tType === 'season' ? rewatch.target_id : (rewatch.season ?? rewatch.target_id));
      const seasonMatch = seasonId != null ? seasonById.get(seasonId) : undefined;
      season = seasonMatch?.season;
      series =
        (rewatch.series_id != null ? seriesById.get(rewatch.series_id) : undefined) ??
        seasonMatch?.series;
      if (tType === 'episode' && season && rewatch.episode_number != null) {
        episodeNote = season.episode_notes?.find(
          (note) => note.episode_number === rewatch.episode_number,
        );
      }
    } else if (tType === 'movie') {
      const movieId =
        rewatch.movie_id ??
        (tType === 'movie' ? rewatch.target_id : (rewatch.movie ?? rewatch.target_id));
      const movieMatch = movieId != null ? movieById.get(movieId) : undefined;
      movie = movieMatch?.movie;
      series =
        (rewatch.series_id != null ? seriesById.get(rewatch.series_id) : undefined) ??
        movieMatch?.series;
    } else {
      const seriesId = rewatch.series_id ?? rewatch.target_id;
      series = seriesId != null ? seriesById.get(seriesId) : undefined;
    }

    const title =
      series?.title ||
      rewatch.series_title ||
      movie?.title ||
      season?.title ||
      rewatch.release_title ||
      'A remembered title';

    let context: string;
    if (tType === 'episode') {
      const seasonPart = season ? `Season ${season.season_number}` : '';
      const epPart = rewatch.episode_number != null ? `Ep ${rewatch.episode_number}` : 'Episode';
      const epTitle = episodeNote?.episode_title || rewatch.episode_title;
      const epTitlePart = epTitle ? ` (${epTitle})` : '';
      context = [seasonPart, `${epPart}${epTitlePart}`].filter(Boolean).join(' · ');
    } else if (tType === 'movie') {
      context = movie?.title || rewatch.release_title || 'Movie';
    } else if (tType === 'series') {
      context = 'Full series';
    } else if (season) {
      context =
        season.title && season.title !== series?.title
          ? `Season ${season.season_number} · ${season.title}`
          : `Season ${season.season_number}`;
    } else {
      context = rewatch.release_title || 'Season';
    }

    const coverUrl =
      nonEmptyUrl(movie?.cover_image_url) ||
      nonEmptyUrl(movie?.image_url) ||
      nonEmptyUrl(season?.cover_image_url) ||
      nonEmptyUrl(season?.image_url) ||
      nonEmptyUrl(series?.cover_image_url) ||
      nonEmptyUrl(series?.image_url);

    let href = '/journal?kind=rewatch';
    if (series) {
      if (tType === 'episode' && season) {
        const epQuery = rewatch.episode_number != null ? `&ep=${rewatch.episode_number}` : '';
        href = `/anime/${series.id}?release=season-${season.id}${epQuery}`;
      } else if (tType === 'season' && season) {
        href = `/anime/${series.id}?release=season-${season.id}`;
      } else if (tType === 'movie' && movie) {
        href = `/anime/${series.id}?release=movie-${movie.id}`;
      } else {
        href = `/anime/${series.id}`;
      }
    }

    let originalNote: string | null = null;
    let originalRating: number | null = null;
    if (tType === 'episode') {
      originalNote = episodeNote?.note ?? null;
      originalRating = episodeNote?.rating ?? null;
    } else if (tType === 'season') {
      originalNote = season?.notes ?? null;
      originalRating = season?.rating ?? null;
    } else if (tType === 'movie') {
      originalNote = movie?.notes ?? null;
      originalRating = movie?.rating ?? null;
    }

    const rewatchNote = rewatch.notes ?? null;
    const rewatchRating = rewatch.rating ?? null;
    const ratingDelta =
      rewatchRating != null && originalRating != null ? rewatchRating - originalRating : null;

    const dateStr = rewatch.finish_date || rewatch.start_date || null;
    const dateLabel = dateStr ? formatDate(dateStr) : 'Undated';
    const { monthKey, monthLabel } = parseJournalMonth(dateStr);

    return {
      id: rewatch.id,
      rewatch,
      targetType: tType,
      passNumber: passMap.get(rewatch.id) ?? 1,
      title,
      context,
      coverUrl,
      href,
      originalNote,
      originalRating,
      rewatchNote,
      rewatchRating,
      ratingDelta,
      dateStr,
      dateLabel,
      monthKey,
      monthLabel,
    };
  });
}

/**
 * Filters Then vs Now items by search query across title, context, original note, and rewatch note.
 */
export function filterThenVsNowItems(
  items: readonly ThenVsNowItem[],
  q?: string | null,
): ThenVsNowItem[] {
  const needle = (q ?? '').trim().toLowerCase();
  if (!needle) return [...items];

  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.context.toLowerCase().includes(needle) ||
      (item.originalNote ?? '').toLowerCase().includes(needle) ||
      (item.rewatchNote ?? '').toLowerCase().includes(needle),
  );
}

/**
 * Formats a numeric rating delta for display (`+2`, `-1`, `Same`).
 */
export function formatRatingDelta(delta: number | null): {
  label: string;
  direction: 'up' | 'down' | 'same';
} | null {
  if (delta === null) return null;
  if (delta > 0) return { label: `+${delta}`, direction: 'up' };
  if (delta < 0) return { label: `${delta}`, direction: 'down' };
  return { label: 'Same', direction: 'same' };
}

/**
 * Counts entries per filter pill using the active search query so every pill count matches its view.
 */
export function countJournalKinds(
  entries: readonly JournalEntry[],
  thenVsNowItems: readonly ThenVsNowItem[],
  q?: string | null,
): Record<JournalKindFilter, number> {
  const queryEntries = filterJournalEntries(entries, { kind: 'ALL', q });
  const queryRewatches = filterThenVsNowItems(thenVsNowItems, q);

  const counts: Record<JournalKindFilter, number> = {
    ALL: queryEntries.length,
    episode: 0,
    season: 0,
    movie: 0,
    book: 0,
    character: 0,
    rewatch: queryRewatches.length,
  };

  for (const entry of queryEntries) {
    if (entry.normalizedKind !== 'rewatch') {
      counts[entry.normalizedKind] += 1;
    }
  }

  return counts;
}
