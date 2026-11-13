import type { AnimeMovie, AnimeSeason, AnimeSeries, EpisodeNote, Rewatch } from '../../types';
import { nextMovieState, nextSeasonState } from '../../lib/journal/progress';

export type TitleTab = 'overview' | 'episodes' | 'characters' | 'rewatches' | 'details';

export const TITLE_TABS: readonly { id: TitleTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'episodes', label: 'Episodes' },
  { id: 'characters', label: 'Characters' },
  { id: 'rewatches', label: 'Rewatches' },
  { id: 'details', label: 'Details' },
] as const;

export type ResolvedRelease =
  | { type: 'season'; id: number }
  | { type: 'movie'; id: number };

export interface RatingDelta {
  diff: number;
  label: string;
  direction: 'up' | 'down' | 'same';
}

export interface EffectiveEpisodeCount {
  total: number;
  isEstimated: boolean;
}

/**
 * Returns the next episode number to pre-fill when opening the Note composer from a season.
 * Clamps to `total_episodes` when known so completed seasons target their final episode.
 */
export function nextNoteEpisode(season: Pick<AnimeSeason, 'progress' | 'total_episodes'>): number {
  const next = Math.max(1, (season.progress || 0) + 1);
  if (season.total_episodes && season.total_episodes > 0) {
    return Math.min(next, season.total_episodes);
  }
  return next;
}

/**
 * Computes the episode grid length for `EpisodeMap`.
 * When `total_episodes` is unset, scales up to `max(progress, maxNotedEpisode, 12)` and flags `isEstimated`.
 */
export function effectiveEpisodeCount(
  season: Pick<AnimeSeason, 'progress' | 'total_episodes' | 'episode_notes'>,
): EffectiveEpisodeCount {
  if (season.total_episodes && season.total_episodes > 0) {
    return { total: season.total_episodes, isEstimated: false };
  }
  const maxNoted = (season.episode_notes ?? []).reduce(
    (highest, note) => Math.max(highest, note.episode_number || 0),
    0,
  );
  return {
    total: Math.max(season.progress || 0, maxNoted, 12),
    isEstimated: true,
  };
}

/**
 * Steps `current` episode by `delta` within `[1, max]`, returning `null` when out of bounds or unset.
 */
export function adjacentEpisode(current: number | null, delta: number, max: number): number | null {
  if (current === null || !Number.isInteger(current) || max < 1) return null;
  const next = current + delta;
  if (next < 1 || next > max) return null;
  return next;
}

/**
 * Compares a rewatch rating against the original release rating for Then vs Now cards.
 */
export function computeRatingDelta(
  original: number | null | undefined,
  rewatch: number | null | undefined,
): RatingDelta | null {
  if (original == null || rewatch == null) return null;
  const diff = rewatch - original;
  if (diff > 0) return { diff, label: `+${diff}`, direction: 'up' };
  if (diff < 0) return { diff, label: `${diff}`, direction: 'down' };
  return { diff: 0, label: 'Same', direction: 'same' };
}

/**
 * Resolves which season or movie is active from `?release=season-<id>` / `?release=movie-<id>`.
 * Falls back to the first `WATCHING` season or movie, then the first season, then the first movie.
 */
export function resolveInitialRelease(
  series: Pick<AnimeSeries, 'seasons' | 'movies'>,
  releaseParam: string | null,
): ResolvedRelease | null {
  const seasons = series.seasons ?? [];
  const movies = series.movies ?? [];

  if (releaseParam?.startsWith('season-')) {
    const parsed = Number(releaseParam.slice('season-'.length));
    if (Number.isInteger(parsed) && seasons.some((s) => s.id === parsed)) {
      return { type: 'season', id: parsed };
    }
  } else if (releaseParam?.startsWith('movie-')) {
    const parsed = Number(releaseParam.slice('movie-'.length));
    if (Number.isInteger(parsed) && movies.some((m) => m.id === parsed)) {
      return { type: 'movie', id: parsed };
    }
  }

  const watchingSeason = seasons.find((s) => s.status === 'WATCHING');
  if (watchingSeason) return { type: 'season', id: watchingSeason.id };

  const watchingMovie = movies.find((m) => m.status === 'WATCHING');
  if (watchingMovie) return { type: 'movie', id: watchingMovie.id };

  if (seasons[0]) return { type: 'season', id: seasons[0].id };
  if (movies[0]) return { type: 'movie', id: movies[0].id };

  return null;
}

/**
 * Parses `?ep=<number>` into a positive integer episode number, or `null` when absent/invalid.
 */
export function parseEpisodeParam(epParam: string | null): number | null {
  if (!epParam) return null;
  const parsed = Number(epParam);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

const VALID_TABS = new Set<TitleTab>(['overview', 'episodes', 'characters', 'rewatches', 'details']);

/**
 * Resolves the active tab from `?tab=` and `?ep=`.
 * When `?ep=N` is present on mount without an explicit `?tab=` (on a season), switches to `episodes`.
 */
export function resolveTitleTab(
  tabParam: string | null,
  epParam: string | null,
  releaseType: 'season' | 'movie' | null,
): TitleTab {
  if (tabParam && VALID_TABS.has(tabParam as TitleTab)) {
    const tab = tabParam as TitleTab;
    if (tab === 'episodes' && releaseType !== 'season') return 'overview';
    return tab;
  }
  if (releaseType === 'season' && parseEpisodeParam(epParam) !== null) {
    return 'episodes';
  }
  return 'overview';
}

/**
 * Clamps a movie minute delta to remaining minutes (`[0, total_minutes]`) when `total_minutes` is known.
 * Matches Home/Library selectors so near-completion movies step by `+N min` (e.g. `+4 min`) instead of disabling.
 */
export function clampedMovieDelta(
  movie: Pick<AnimeMovie, 'progress_minutes' | 'total_minutes'>,
  delta: number,
): number {
  const current = Math.max(0, movie.progress_minutes || 0);
  if (delta > 0) {
    if (movie.total_minutes != null && movie.total_minutes > 0) {
      if (current >= movie.total_minutes) return 0;
      return Math.min(delta, movie.total_minutes - current);
    }
    if (movie.total_minutes === 0) return 0;
    return delta;
  }
  if (delta < 0) {
    if (current <= 0) return 0;
    return -Math.min(Math.abs(delta), current);
  }
  return 0;
}

/**
 * Checks whether a release can step by `delta` using the same bounds as optimistic progress updates.
 */
export function canStepReleaseProgress(
  release: { type: 'season'; data: AnimeSeason } | { type: 'movie'; data: AnimeMovie } | null,
  delta: number,
): boolean {
  if (!release) return false;
  if (release.type === 'season') {
    return nextSeasonState(release.data, delta) !== null;
  }
  return nextMovieState(release.data, delta) !== null;
}

/**
 * Sorts rewatches oldest-first so pass numbers are deterministic (Rewatch 1, Rewatch 2, ...).
 */
export function sortRewatchesChronological(rewatches: Rewatch[]): Rewatch[] {
  return [...rewatches].sort((a, b) => {
    const dateA = a.finish_date || a.start_date || '';
    const dateB = b.finish_date || b.start_date || '';
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    return a.id - b.id;
  });
}

/**
 * Indexes a season's episode notes by `episode_number`.
 */
export function mapEpisodeNotes(notes?: EpisodeNote[]): Map<number, EpisodeNote> {
  const map = new Map<number, EpisodeNote>();
  if (!notes) return map;
  for (const note of notes) {
    map.set(note.episode_number, note);
  }
  return map;
}
