import { describe, expect, it } from 'vitest';
import { overallSeriesStatus } from './seriesStatus';
import { rewatchesForRelease } from './rewatches';
import type { AnimeMovie, AnimeSeason, AnimeStatus, Rewatch } from '../../types';

const series = (seasons: AnimeStatus[], movies: AnimeStatus[] = []) => ({
  seasons: seasons.map((status) => ({ status })) as AnimeSeason[],
  movies: movies.map((status) => ({ status })) as AnimeMovie[],
});

describe('overallSeriesStatus', () => {
  it.each<[AnimeStatus[], AnimeStatus[], AnimeStatus]>([
    [[], [], 'PLAN_TO_WATCH'],
    [['COMPLETED', 'WATCHING'], [], 'WATCHING'],
    [['COMPLETED'], ['COMPLETED'], 'COMPLETED'],
    [['COMPLETED', 'PLAN_TO_WATCH'], [], 'PLAN_TO_WATCH'],
    [['ON_HOLD'], [], 'ON_HOLD'],
    [['DROPPED'], [], 'DROPPED'],
    [['COMPLETED', 'DROPPED'], [], 'COMPLETED'],
  ])('%j + movies %j is %s', (seasons, movies, expected) => {
    expect(overallSeriesStatus(series(seasons, movies))).toBe(expected);
  });
});

describe('rewatchesForRelease', () => {
  const rewatch = (r: Partial<Rewatch>) => r as Rewatch;
  const all = [
    rewatch({ id: 1, target_type: 'season', target_id: 5, season_id: 5, series_id: 1 }),
    rewatch({ id: 2, target_type: 'movie', target_id: 5, movie_id: 5, series_id: 1 }),
    rewatch({ id: 3, target_type: 'episode', target_id: 5, season_id: 5, series_id: 1 }),
    rewatch({ id: 4, target_type: 'series', target_id: 1, series_id: 1 }),
    rewatch({ id: 5, target_type: 'series', target_id: 5, series_id: 5 }),
  ];
  const ids = (list: Rewatch[]) => list.map((r) => r.id);

  it('keeps a season and a movie with the same ID apart', () => {
    expect(ids(rewatchesForRelease(all, { type: 'season', id: 5, seriesId: 1 }))).toEqual([1, 3, 4]);
    expect(ids(rewatchesForRelease(all, { type: 'movie', id: 5, seriesId: 1 }))).toEqual([2, 4]);
  });
});
