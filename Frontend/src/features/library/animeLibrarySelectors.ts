import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  AnimeStatus,
} from '../../types';
import { overallSeriesStatus } from '../../lib/selectors/seriesStatus';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/;

export type LibraryViewMode = 'grid' | 'list' | 'year' | 'fame';
export type LibrarySort = 'recent' | 'rating' | 'title' | 'aired' | 'note';
export type LibraryStatusFilter = 'ALL' | AnimeStatus;

export type PrimaryRelease =
  | { kind: 'season'; release: AnimeSeason }
  | { kind: 'movie'; release: AnimeMovie }
  | null;

export interface QuickStepTarget {
  kind: 'season' | 'movie';
  id: number;
  delta: number;
  current: number;
  total: number | null;
}

export interface LibraryItem {
  series: AnimeSeries;
  overallStatus: AnimeStatus;
  primaryRelease: PrimaryRelease;
  coverUrl: string | null;
  metaLabel: string;
  watchedEpisodes: number;
  totalEpisodes: number | null;
  avgRating: number | null;
  bestRating: number | null;
  latestNote: string | null;
  latestNoteContext: string | null;
  hasAnyNote: boolean;
  hasTenScore: boolean;
  year: number | null;
  lastActivityMs: number;
  studioIds: number[];
  genreIds: number[];
  studioNames: string[];
  genreNames: string[];
  searchableNotes: string[];
  canQuickStep: boolean;
  quickStepTarget: QuickStepTarget | null;
}

export interface LibraryFilters {
  status?: LibraryStatusFilter;
  genreId?: number | 'ALL' | null;
  studioId?: number | 'ALL' | null;
  q?: string;
  sort?: LibrarySort;
}

export interface LibraryYearGroup {
  yearLabel: string;
  items: LibraryItem[];
}

type WithOptionalDates = {
  updated_at?: string | null;
  release_year?: number | string | null;
  start_date?: string | null;
  finish_date?: string | null;
  aired?: string | null;
};

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

function parseYearFromValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value >= 1900 && value <= 2100 ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = YEAR_RE.exec(trimmed);
  if (!match) return null;
  const yr = Number(match[1]);
  return yr >= 1900 && yr <= 2100 ? yr : null;
}

function extractSeriesYear(series: AnimeSeries, primaryRelease: PrimaryRelease): number | null {
  const s = series as AnimeSeries & WithOptionalDates;
  const seasons = series.seasons ?? [];
  const movies = series.movies ?? [];

  // Ordered candidate sources: primary release first, then series, then other releases
  const releaseOrdered: WithOptionalDates[] = [];
  if (primaryRelease) releaseOrdered.push(primaryRelease.release as WithOptionalDates);
  releaseOrdered.push(s);
  for (const season of seasons) {
    if (primaryRelease?.kind === 'season' && primaryRelease.release.id === season.id) continue;
    releaseOrdered.push(season as WithOptionalDates);
  }
  for (const movie of movies) {
    if (primaryRelease?.kind === 'movie' && primaryRelease.release.id === movie.id) continue;
    releaseOrdered.push(movie as WithOptionalDates);
  }

  // Prefer finish_date -> release_year -> start_date -> aired (never created_at)
  for (const src of releaseOrdered) {
    const yr = parseYearFromValue(src.finish_date);
    if (yr !== null) return yr;
  }
  for (const src of releaseOrdered) {
    const yr = parseYearFromValue(src.release_year);
    if (yr !== null) return yr;
  }
  for (const src of releaseOrdered) {
    const yr = parseYearFromValue(src.start_date);
    if (yr !== null) return yr;
  }
  for (const src of releaseOrdered) {
    const yr = parseYearFromValue(src.aired);
    if (yr !== null) return yr;
  }

  return null;
}

function releaseRecencyMs(release: {
  finish_date: string | null;
  start_date: string | null;
  created_at: string;
}): number {
  const r = release as typeof release & WithOptionalDates;
  return Math.max(
    parseTimestamp(r.updated_at),
    parseTimestamp(release.finish_date),
    parseTimestamp(release.start_date),
    parseTimestamp(release.created_at),
  );
}

function selectPrimaryRelease(series: AnimeSeries): PrimaryRelease {
  const seasons = series.seasons ?? [];
  const movies = series.movies ?? [];

  const watchingSeason = seasons.find((s) => s.status === 'WATCHING');
  if (watchingSeason) return { kind: 'season', release: watchingSeason };

  const watchingMovie = movies.find((m) => m.status === 'WATCHING');
  if (watchingMovie) return { kind: 'movie', release: watchingMovie };

  type Candidate =
    | { kind: 'season'; release: AnimeSeason; rating: number; recency: number; order: number }
    | { kind: 'movie'; release: AnimeMovie; rating: number; recency: number; order: number };

  const candidates: Candidate[] = [
    ...seasons.map((s) => ({
      kind: 'season' as const,
      release: s,
      rating: s.rating ?? -1,
      recency: releaseRecencyMs(s),
      order: s.season_number ?? s.id,
    })),
    ...movies.map((m) => ({
      kind: 'movie' as const,
      release: m,
      rating: m.rating ?? -1,
      recency: releaseRecencyMs(m),
      order: m.id,
    })),
  ];

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.recency !== a.recency) return b.recency - a.recency;
    return b.order - a.order;
  });

  const best = candidates[0];
  return best.kind === 'season'
    ? { kind: 'season', release: best.release }
    : { kind: 'movie', release: best.release };
}

function formatMetaLabel(series: AnimeSeries, primaryRelease: PrimaryRelease): string {
  const seasons = series.seasons ?? [];
  const movies = series.movies ?? [];
  const seasonCount = seasons.length;
  const movieCount = movies.length;

  if (primaryRelease?.kind === 'season' && primaryRelease.release.status === 'WATCHING') {
    const s = primaryRelease.release;
    const ep = s.total_episodes ? `${s.progress}/${s.total_episodes} eps` : `${s.progress} eps`;
    return `S${s.season_number} · ${ep}`;
  }
  if (primaryRelease?.kind === 'movie' && primaryRelease.release.status === 'WATCHING') {
    const m = primaryRelease.release;
    return m.total_minutes
      ? `Movie · ${m.progress_minutes}/${m.total_minutes}m`
      : `Movie · ${m.progress_minutes}m`;
  }
  if (seasonCount === 0 && movieCount === 0) return 'No releases yet';
  if (seasonCount > 0 && movieCount === 0) {
    return `${seasonCount} ${seasonCount === 1 ? 'season' : 'seasons'}`;
  }
  if (seasonCount === 0 && movieCount > 0) {
    return `${movieCount} ${movieCount === 1 ? 'movie' : 'movies'}`;
  }
  return `${seasonCount} ${seasonCount === 1 ? 'season' : 'seasons'} · ${movieCount} ${movieCount === 1 ? 'movie' : 'movies'}`;
}

function clampedMovieStep(current: number, total: number | null): number {
  if (total === null || total === undefined) return 10;
  if (current >= total) return 0;
  return Math.max(1, Math.min(10, total - current));
}

function resolveQuickStep(series: AnimeSeries): QuickStepTarget | null {
  for (const season of series.seasons ?? []) {
    if (season.status !== 'WATCHING') continue;
    const current = Math.max(0, season.progress || 0);
    const total = season.total_episodes ?? null;
    if (total === null || current < total) {
      return { kind: 'season', id: season.id, delta: 1, current, total };
    }
  }
  for (const movie of series.movies ?? []) {
    if (movie.status !== 'WATCHING') continue;
    const current = Math.max(0, movie.progress_minutes || 0);
    const total = movie.total_minutes ?? null;
    const delta = clampedMovieStep(current, total);
    if (delta > 0) {
      return { kind: 'movie', id: movie.id, delta, current, total };
    }
  }
  return null;
}

function buildActivityIndex(activityList: ActivityEvent[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const event of activityList) {
    const ts = parseTimestamp(event.created_at);
    if (ts <= 0) continue;
    const key = `${event.target_type}:${event.target_id}`;
    const prev = index.get(key) ?? 0;
    if (ts > prev) index.set(key, ts);
  }
  return index;
}

export function buildLibraryItems(
  seriesList: AnimeSeries[],
  activityList: ActivityEvent[] = [],
): LibraryItem[] {
  const activityIndex = buildActivityIndex(activityList);

  return seriesList.map((series) => {
    const seasons = series.seasons ?? [];
    const movies = series.movies ?? [];
    const overallStatus = overallSeriesStatus(series);
    const primaryRelease = selectPrimaryRelease(series);

    const coverUrl =
      primaryRelease?.release.cover_image_url ||
      primaryRelease?.release.image_url ||
      series.cover_image_url ||
      series.image_url ||
      seasons.find((s) => s.cover_image_url || s.image_url)?.cover_image_url ||
      seasons.find((s) => s.image_url)?.image_url ||
      movies.find((m) => m.cover_image_url || m.image_url)?.cover_image_url ||
      movies.find((m) => m.image_url)?.image_url ||
      null;

    // Episodes across seasons
    let watchedEpisodes = 0;
    let knownTotalEpisodes = 0;
    let allSeasonsHaveTotal = seasons.length > 0;
    for (const season of seasons) {
      watchedEpisodes += Math.max(0, season.progress || 0);
      if (season.total_episodes !== null && season.total_episodes !== undefined) {
        knownTotalEpisodes += Math.max(0, season.total_episodes);
      } else {
        allSeasonsHaveTotal = false;
      }
    }
    const totalEpisodes = allSeasonsHaveTotal ? knownTotalEpisodes : null;

    // Ratings
    const ratings: number[] = [];
    for (const s of seasons) {
      if (s.rating !== null && s.rating !== undefined) ratings.push(s.rating);
    }
    for (const m of movies) {
      if (m.rating !== null && m.rating !== undefined) ratings.push(m.rating);
    }
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : null;
    const bestRating = ratings.length ? Math.max(...ratings) : null;
    const hasTenScore = ratings.some((r) => r === 10);

    // Notes: collect all non-empty notes across seasons, episode_notes, and movies
    const noteEntries: Array<{ text: string; context: string; ts: number; order: number }> = [];
    let order = 0;
    for (const season of seasons) {
      const s = season as AnimeSeason & WithOptionalDates;
      const trimmed = season.notes?.trim();
      if (trimmed) {
        noteEntries.push({
          text: trimmed,
          context: `Season ${season.season_number}`,
          ts: Math.max(
            parseTimestamp(s.updated_at),
            parseTimestamp(season.finish_date),
            parseTimestamp(season.start_date),
            parseTimestamp(season.created_at),
          ),
          order: order++,
        });
      }
      for (const ep of season.episode_notes ?? []) {
        const epText = ep.note?.trim();
        if (epText) {
          noteEntries.push({
            text: epText,
            context: `Season ${season.season_number} · Ep ${ep.episode_number}`,
            ts: parseTimestamp(ep.created_at),
            order: order++,
          });
        }
      }
    }
    for (const movie of movies) {
      const m = movie as AnimeMovie & WithOptionalDates;
      const trimmed = movie.notes?.trim();
      if (trimmed) {
        noteEntries.push({
          text: trimmed,
          context: movie.title ? `Movie · ${movie.title}` : 'Movie',
          ts: Math.max(
            parseTimestamp(m.updated_at),
            parseTimestamp(movie.finish_date),
            parseTimestamp(movie.start_date),
            parseTimestamp(movie.created_at),
          ),
          order: order++,
        });
      }
    }

    const hasAnyNote = noteEntries.length > 0;
    let latestNote: string | null = null;
    let latestNoteContext: string | null = null;
    if (noteEntries.length > 0) {
      const sortedNotes = [...noteEntries].sort((a, b) => {
        if (b.ts !== a.ts) return b.ts - a.ts;
        return b.order - a.order;
      });
      latestNote = sortedNotes[0].text;
      latestNoteContext = sortedNotes[0].context;
    }

    // Activity & updated_at fallback
    let activityMs = activityIndex.get(`series:${series.id}`) ?? 0;
    let updatedAtMs = parseTimestamp((series as AnimeSeries & WithOptionalDates).updated_at);
    let dateFallbackMs = parseTimestamp(series.created_at);

    for (const season of seasons) {
      activityMs = Math.max(
        activityMs,
        activityIndex.get(`season:${season.id}`) ?? 0,
        activityIndex.get(`episode:${season.id}`) ?? 0,
      );
      for (const ep of season.episode_notes ?? []) {
        activityMs = Math.max(activityMs, activityIndex.get(`episode:${ep.id}`) ?? 0);
        dateFallbackMs = Math.max(dateFallbackMs, parseTimestamp(ep.created_at));
      }
      updatedAtMs = Math.max(
        updatedAtMs,
        parseTimestamp((season as AnimeSeason & WithOptionalDates).updated_at),
      );
      dateFallbackMs = Math.max(
        dateFallbackMs,
        parseTimestamp(season.finish_date),
        parseTimestamp(season.start_date),
        parseTimestamp(season.created_at),
      );
    }

    for (const movie of movies) {
      activityMs = Math.max(activityMs, activityIndex.get(`movie:${movie.id}`) ?? 0);
      updatedAtMs = Math.max(
        updatedAtMs,
        parseTimestamp((movie as AnimeMovie & WithOptionalDates).updated_at),
      );
      dateFallbackMs = Math.max(
        dateFallbackMs,
        parseTimestamp(movie.finish_date),
        parseTimestamp(movie.start_date),
        parseTimestamp(movie.created_at),
      );
    }

    const lastActivityMs = Math.max(activityMs, updatedAtMs) || dateFallbackMs;

    // Studios & Genres
    const genreIdSet = new Set<number>();
    const genreNameSet = new Set<string>();
    for (const g of series.genres ?? []) {
      genreIdSet.add(g.id);
      if (g.name) genreNameSet.add(g.name);
    }

    const studioIdSet = new Set<number>();
    const studioNameSet = new Set<string>();
    for (const st of series.studios ?? []) {
      studioIdSet.add(st.id);
      if (st.name) studioNameSet.add(st.name);
    }
    for (const season of seasons) {
      for (const st of season.studios ?? []) {
        studioIdSet.add(st.id);
        if (st.name) studioNameSet.add(st.name);
      }
    }
    for (const movie of movies) {
      for (const st of movie.studios ?? []) {
        studioIdSet.add(st.id);
        if (st.name) studioNameSet.add(st.name);
      }
    }

    const quickStepTarget = resolveQuickStep(series);
    const year = extractSeriesYear(series, primaryRelease);

    return {
      series,
      overallStatus,
      primaryRelease,
      coverUrl,
      metaLabel: formatMetaLabel(series, primaryRelease),
      watchedEpisodes,
      totalEpisodes,
      avgRating,
      bestRating,
      latestNote,
      latestNoteContext,
      hasAnyNote,
      hasTenScore,
      year,
      lastActivityMs,
      studioIds: Array.from(studioIdSet),
      genreIds: Array.from(genreIdSet),
      studioNames: Array.from(studioNameSet),
      genreNames: Array.from(genreNameSet),
      searchableNotes: noteEntries.map((n) => n.text),
      canQuickStep: quickStepTarget !== null,
      quickStepTarget,
    };
  });
}

export function matchesLibraryFacetAndQuery(
  item: LibraryItem,
  filters: Pick<LibraryFilters, 'genreId' | 'studioId' | 'q'>,
): boolean {
  if (filters.genreId != null && filters.genreId !== 'ALL') {
    if (!item.genreIds.includes(filters.genreId)) return false;
  }
  if (filters.studioId != null && filters.studioId !== 'ALL') {
    if (!item.studioIds.includes(filters.studioId)) return false;
  }
  const query = filters.q?.trim().toLowerCase();
  if (query) {
    const matchesText =
      item.series.title.toLowerCase().includes(query) ||
      (item.series.romaji_title?.toLowerCase().includes(query) ?? false) ||
      (item.series.japanese_title?.toLowerCase().includes(query) ?? false) ||
      item.studioNames.some((name) => name.toLowerCase().includes(query)) ||
      item.genreNames.some((name) => name.toLowerCase().includes(query)) ||
      item.searchableNotes.some((note) => note.toLowerCase().includes(query));
    if (!matchesText) return false;
  }
  return true;
}

export function filterAndSortLibrary(
  items: LibraryItem[],
  filters: LibraryFilters = {},
): LibraryItem[] {
  const status = filters.status ?? 'ALL';
  const sort = filters.sort ?? 'recent';

  const filtered = items.filter((item) => {
    if (status !== 'ALL' && item.overallStatus !== status) return false;
    return matchesLibraryFacetAndQuery(item, filters);
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'rating') {
      const avgDiff = (b.avgRating ?? -1) - (a.avgRating ?? -1);
      if (avgDiff !== 0) return avgDiff;
      const bestDiff = (b.bestRating ?? -1) - (a.bestRating ?? -1);
      if (bestDiff !== 0) return bestDiff;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.series.title.localeCompare(b.series.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'title') {
      return a.series.title.localeCompare(b.series.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'aired') {
      if (a.year === null && b.year !== null) return 1;
      if (a.year !== null && b.year === null) return -1;
      if (a.year !== null && b.year !== null && b.year !== a.year) return b.year - a.year;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.series.title.localeCompare(b.series.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'note') {
      const noteDiff = (b.hasAnyNote ? 1 : 0) - (a.hasAnyNote ? 1 : 0);
      if (noteDiff !== 0) return noteDiff;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.series.title.localeCompare(b.series.title, undefined, { sensitivity: 'base' });
    }
    // Default: 'recent' (Last activity)
    if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
    return b.series.id - a.series.id;
  });
}

export function groupByYear(items: LibraryItem[]): LibraryYearGroup[] {
  const dated = new Map<number, LibraryItem[]>();
  const undated: LibraryItem[] = [];

  for (const item of items) {
    if (item.year === null) {
      undated.push(item);
    } else {
      const bucket = dated.get(item.year);
      if (bucket) bucket.push(item);
      else dated.set(item.year, [item]);
    }
  }

  const years = Array.from(dated.keys()).sort((a, b) => b - a);
  const groups: LibraryYearGroup[] = years.map((yr) => ({
    yearLabel: String(yr),
    items: dated.get(yr) ?? [],
  }));

  if (undated.length > 0) {
    groups.push({ yearLabel: 'Undated', items: undated });
  }

  return groups;
}

export function selectHallOfFame(items: LibraryItem[]): LibraryItem[] {
  return items
    .filter((item) => item.hasTenScore)
    .sort((a, b) => {
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.series.title.localeCompare(b.series.title, undefined, { sensitivity: 'base' });
    });
}
