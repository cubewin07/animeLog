import { describe, expect, it } from 'vitest';
import type { AnimeMovie, AnimeSeason, AnimeSeries, EpisodeNote } from '../../types';
import {
  adjacentEpisode,
  clampedMovieDelta,
  computeRatingDelta,
  effectiveEpisodeCount,
  nextNoteEpisode,
  parseEpisodeParam,
  resolveInitialRelease,
  resolveTitleTab,
} from './titlePageUtils';

const makeSeason = (overrides: Partial<AnimeSeason> = {}): AnimeSeason => ({
  id: 1,
  series: 10,
  title: 'Season 1',
  season_number: 1,
  status: 'PLAN_TO_WATCH',
  progress: 0,
  total_episodes: 12,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  studios: [],
  episode_notes: [],
  ...overrides,
});

const makeMovie = (overrides: Partial<AnimeMovie> = {}): AnimeMovie => ({
  id: 100,
  series: 10,
  title: 'The Movie',
  status: 'PLAN_TO_WATCH',
  progress_minutes: 0,
  total_minutes: 110,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  studios: [],
  ...overrides,
});

const makeSeries = (
  seasons: AnimeSeason[] = [],
  movies: AnimeMovie[] = [],
): Pick<AnimeSeries, 'seasons' | 'movies'> => ({
  seasons,
  movies,
});

describe('nextNoteEpisode', () => {
  it('targets progress + 1 while watching', () => {
    expect(nextNoteEpisode({ progress: 0, total_episodes: 24 })).toBe(1);
    expect(nextNoteEpisode({ progress: 6, total_episodes: 24 })).toBe(7);
  });

  it('clamps to total_episodes when season is finished', () => {
    expect(nextNoteEpisode({ progress: 12, total_episodes: 12 })).toBe(12);
    expect(nextNoteEpisode({ progress: 15, total_episodes: 12 })).toBe(12);
  });

  it('returns progress + 1 when total_episodes is unset', () => {
    expect(nextNoteEpisode({ progress: 8, total_episodes: null })).toBe(9);
    expect(nextNoteEpisode({ progress: 0, total_episodes: null })).toBe(1);
  });
});

describe('effectiveEpisodeCount', () => {
  it('uses total_episodes directly when set', () => {
    expect(
      effectiveEpisodeCount({ progress: 4, total_episodes: 28, episode_notes: [] }),
    ).toEqual({ total: 28, isEstimated: false });
  });

  it('defaults to 12 when total_episodes is unset and progress/notes are smaller', () => {
    expect(
      effectiveEpisodeCount({ progress: 3, total_episodes: null, episode_notes: [] }),
    ).toEqual({ total: 12, isEstimated: true });
  });

  it('expands to max of progress and highest noted episode when total_episodes is unset', () => {
    const notes = [{ episode_number: 18 } as EpisodeNote, { episode_number: 7 } as EpisodeNote];
    expect(
      effectiveEpisodeCount({ progress: 14, total_episodes: null, episode_notes: notes }),
    ).toEqual({ total: 18, isEstimated: true });

    expect(
      effectiveEpisodeCount({ progress: 22, total_episodes: null, episode_notes: notes }),
    ).toEqual({ total: 22, isEstimated: true });
  });
});

describe('adjacentEpisode', () => {
  it('moves forward and backward within [1, max]', () => {
    expect(adjacentEpisode(5, -1, 12)).toBe(4);
    expect(adjacentEpisode(5, 1, 12)).toBe(6);
  });

  it('returns null at boundaries or when unset', () => {
    expect(adjacentEpisode(1, -1, 12)).toBeNull();
    expect(adjacentEpisode(12, 1, 12)).toBeNull();
    expect(adjacentEpisode(null, 1, 12)).toBeNull();
    expect(adjacentEpisode(1, 1, 0)).toBeNull();
  });
});

describe('computeRatingDelta', () => {
  it('computes positive, negative, and unchanged deltas', () => {
    expect(computeRatingDelta(7, 9)).toEqual({ diff: 2, label: '+2', direction: 'up' });
    expect(computeRatingDelta(9, 8)).toEqual({ diff: -1, label: '-1', direction: 'down' });
    expect(computeRatingDelta(8, 8)).toEqual({ diff: 0, label: 'Same', direction: 'same' });
  });

  it('returns null when either rating is missing', () => {
    expect(computeRatingDelta(null, 8)).toBeNull();
    expect(computeRatingDelta(8, null)).toBeNull();
    expect(computeRatingDelta(undefined, undefined)).toBeNull();
  });
});

describe('resolveInitialRelease', () => {
  const s1 = makeSeason({ id: 1, season_number: 1, status: 'COMPLETED' });
  const s2 = makeSeason({ id: 2, season_number: 2, status: 'WATCHING' });
  const m1 = makeMovie({ id: 50, status: 'WATCHING' });
  const m2 = makeMovie({ id: 51, status: 'PLAN_TO_WATCH' });

  it('respects valid ?release=season-<id> and ?release=movie-<id> params', () => {
    const series = makeSeries([s1, s2], [m1]);
    expect(resolveInitialRelease(series, 'season-1')).toEqual({ type: 'season', id: 1 });
    expect(resolveInitialRelease(series, 'movie-50')).toEqual({ type: 'movie', id: 50 });
  });

  it('falls back to active WATCHING release when param is missing or invalid', () => {
    expect(resolveInitialRelease(makeSeries([s1, s2], [m1]), null)).toEqual({
      type: 'season',
      id: 2,
    });
    expect(resolveInitialRelease(makeSeries([s1], [m1]), 'season-999')).toEqual({
      type: 'movie',
      id: 50,
    });
  });

  it('falls back to first season, then first movie, then null', () => {
    expect(resolveInitialRelease(makeSeries([s1], [m2]), null)).toEqual({
      type: 'season',
      id: 1,
    });
    expect(resolveInitialRelease(makeSeries([], [m2]), null)).toEqual({
      type: 'movie',
      id: 51,
    });
    expect(resolveInitialRelease(makeSeries([], []), null)).toBeNull();
  });
});

describe('resolveTitleTab & parseEpisodeParam', () => {
  it('parses valid positive integer episode params', () => {
    expect(parseEpisodeParam('14')).toBe(14);
    expect(parseEpisodeParam('0')).toBeNull();
    expect(parseEpisodeParam('-3')).toBeNull();
    expect(parseEpisodeParam('abc')).toBeNull();
    expect(parseEpisodeParam(null)).toBeNull();
  });

  it('switches to episodes tab on mount when ?ep=N is present without ?tab=', () => {
    expect(resolveTitleTab(null, '7', 'season')).toBe('episodes');
  });

  it('keeps explicit ?tab= when present, and guards episodes tab on movies', () => {
    expect(resolveTitleTab('overview', '7', 'season')).toBe('overview');
    expect(resolveTitleTab('rewatches', null, 'movie')).toBe('rewatches');
    expect(resolveTitleTab('episodes', null, 'movie')).toBe('overview');
    expect(resolveTitleTab('unknown', null, 'season')).toBe('overview');
  });
});

describe('clampedMovieDelta', () => {
  it('clamps +10 and -10 to remaining and elapsed minutes near boundaries', () => {
    expect(clampedMovieDelta({ progress_minutes: 116, total_minutes: 120 }, 10)).toBe(4);
    expect(clampedMovieDelta({ progress_minutes: 120, total_minutes: 120 }, 10)).toBe(0);
    expect(clampedMovieDelta({ progress_minutes: 4, total_minutes: 120 }, -10)).toBe(-4);
    expect(clampedMovieDelta({ progress_minutes: 0, total_minutes: 120 }, -10)).toBe(0);
    expect(clampedMovieDelta({ progress_minutes: 60, total_minutes: 120 }, 10)).toBe(10);
    expect(clampedMovieDelta({ progress_minutes: 60, total_minutes: 120 }, -10)).toBe(-10);
  });

  it('handles unknown or zero total_minutes and zero delta safely', () => {
    expect(clampedMovieDelta({ progress_minutes: 50, total_minutes: null }, 10)).toBe(10);
    expect(clampedMovieDelta({ progress_minutes: 50, total_minutes: null }, -10)).toBe(-10);
    expect(clampedMovieDelta({ progress_minutes: 0, total_minutes: 0 }, 10)).toBe(0);
    expect(clampedMovieDelta({ progress_minutes: 50, total_minutes: 120 }, 0)).toBe(0);
  });
});
