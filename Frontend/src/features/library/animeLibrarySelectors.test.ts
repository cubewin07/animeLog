import { describe, expect, it } from 'vitest';
import {
  buildLibraryItems,
  filterAndSortLibrary,
  groupByYear,
  selectHallOfFame,
} from './animeLibrarySelectors';
import { overallSeriesStatus } from '../../lib/selectors/seriesStatus';
import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  EpisodeNote,
} from '../../types';

const makeEpisodeNote = (fields: Partial<EpisodeNote> = {}): EpisodeNote => ({
  id: 1,
  season: 1,
  episode_number: 1,
  episode_title: null,
  note: '',
  rating: null,
  created_at: '2026-10-01T10:00:00Z',
  ...fields,
});

const makeSeason = (fields: Partial<AnimeSeason> = {}): AnimeSeason => ({
  id: 1,
  series: 1,
  title: 'Season 1',
  season_number: 1,
  status: 'WATCHING',
  progress: 4,
  total_episodes: 12,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-10-01T00:00:00Z',
  studios: [],
  episode_notes: [],
  ...fields,
});

const makeMovie = (fields: Partial<AnimeMovie> = {}): AnimeMovie => ({
  id: 1,
  series: 1,
  title: 'Movie 1',
  status: 'PLAN_TO_WATCH',
  progress_minutes: 0,
  total_minutes: 110,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-10-01T00:00:00Z',
  studios: [],
  ...fields,
});

const makeSeries = (fields: Partial<AnimeSeries> = {}): AnimeSeries => ({
  id: 1,
  title: 'Frieren',
  created_at: '2026-10-01T00:00:00Z',
  genres: [],
  studios: [],
  seasons: [],
  movies: [],
  ...fields,
});

const makeEvent = (fields: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: 1,
  kind: 'EPISODE_PROGRESS',
  target_type: 'season',
  target_id: 1,
  title: 'Frieren',
  delta: 1,
  backfilled: false,
  created_at: '2026-11-10T12:00:00Z',
  ...fields,
});

describe('buildLibraryItems', () => {
  it('derives overallStatus in exact agreement with overallSeriesStatus', () => {
    const seriesList = [
      makeSeries({ id: 1, seasons: [makeSeason({ status: 'COMPLETED' }), makeSeason({ id: 2, status: 'WATCHING' })] }),
      makeSeries({ id: 2, seasons: [makeSeason({ id: 3, status: 'COMPLETED' })], movies: [makeMovie({ id: 1, status: 'COMPLETED' })] }),
      makeSeries({ id: 3, seasons: [makeSeason({ id: 4, status: 'ON_HOLD' })] }),
      makeSeries({ id: 4, seasons: [makeSeason({ id: 5, status: 'DROPPED' })] }),
      makeSeries({ id: 5, seasons: [], movies: [] }),
    ];

    const items = buildLibraryItems(seriesList, []);
    items.forEach((item, idx) => {
      expect(item.overallStatus).toBe(overallSeriesStatus(seriesList[idx]));
    });
  });

  it('prefers active WATCHING release for primaryRelease, otherwise highest rated or latest', () => {
    const watchingSeries = makeSeries({
      id: 1,
      seasons: [
        makeSeason({ id: 10, season_number: 1, status: 'COMPLETED', rating: 10 }),
        makeSeason({ id: 11, season_number: 2, status: 'WATCHING', rating: null }),
      ],
    });
    const ratedSeries = makeSeries({
      id: 2,
      seasons: [
        makeSeason({ id: 20, season_number: 1, status: 'COMPLETED', rating: 8 }),
        makeSeason({ id: 21, season_number: 2, status: 'COMPLETED', rating: 10 }),
      ],
    });
    const unratedSeries = makeSeries({
      id: 3,
      seasons: [
        makeSeason({ id: 30, season_number: 1, status: 'PLAN_TO_WATCH', created_at: '2025-01-01T00:00:00Z' }),
      ],
      movies: [
        makeMovie({ id: 31, status: 'PLAN_TO_WATCH', created_at: '2026-05-01T00:00:00Z' }),
      ],
    });
    const emptySeries = makeSeries({ id: 4 });

    const [a, b, c, d] = buildLibraryItems([watchingSeries, ratedSeries, unratedSeries, emptySeries], []);
    expect(a.primaryRelease?.kind).toBe('season');
    expect(a.primaryRelease?.release.id).toBe(11);

    expect(b.primaryRelease?.kind).toBe('season');
    expect(b.primaryRelease?.release.id).toBe(21);

    expect(c.primaryRelease?.kind).toBe('movie');
    expect(c.primaryRelease?.release.id).toBe(31);

    expect(d.primaryRelease).toBeNull();
  });

  it('sums watchedEpisodes and totalEpisodes across seasons cleanly', () => {
    const full = makeSeries({
      id: 1,
      seasons: [
        makeSeason({ id: 1, progress: 12, total_episodes: 12 }),
        makeSeason({ id: 2, progress: 5, total_episodes: 12 }),
      ],
    });
    const ongoing = makeSeries({
      id: 2,
      seasons: [
        makeSeason({ id: 3, progress: 12, total_episodes: 12 }),
        makeSeason({ id: 4, progress: 3, total_episodes: null }),
      ],
    });
    const movieOnly = makeSeries({
      id: 3,
      seasons: [],
      movies: [makeMovie({ id: 1, status: 'COMPLETED' })],
    });

    const [a, b, c] = buildLibraryItems([full, ongoing, movieOnly], []);
    expect(a.watchedEpisodes).toBe(17);
    expect(a.totalEpisodes).toBe(24);
    expect(b.watchedEpisodes).toBe(15);
    expect(b.totalEpisodes).toBeNull();
    expect(c.watchedEpisodes).toBe(0);
    expect(c.totalEpisodes).toBeNull();
  });

  it('computes avgRating, bestRating, and hasTenScore across seasons and movies', () => {
    const s = makeSeries({
      id: 1,
      seasons: [
        makeSeason({ id: 1, rating: 10 }),
        makeSeason({ id: 2, rating: null }),
      ],
      movies: [makeMovie({ id: 3, rating: 9 })],
    });
    const unrated = makeSeries({
      id: 2,
      seasons: [makeSeason({ id: 4, rating: null })],
    });

    const [a, b] = buildLibraryItems([s, unrated], []);
    expect(a.avgRating).toBe(9.5);
    expect(a.bestRating).toBe(10);
    expect(a.hasTenScore).toBe(true);
    expect(b.avgRating).toBeNull();
    expect(b.bestRating).toBeNull();
    expect(b.hasTenScore).toBe(false);
  });

  it('picks latest non-empty note across season, movie, and episode notes and ignores whitespace', () => {
    const s = makeSeries({
      id: 1,
      seasons: [
        makeSeason({
          id: 1,
          notes: 'Season 1 takeaway',
          created_at: '2026-01-01T00:00:00Z',
          episode_notes: [
            makeEpisodeNote({
              id: 10,
              episode_number: 8,
              note: 'Latest episode insight',
              created_at: '2026-03-10T00:00:00Z',
            }),
          ],
        }),
      ],
      movies: [
        makeMovie({
          id: 2,
          notes: '   ',
          created_at: '2026-05-01T00:00:00Z',
        }),
      ],
    });
    const blank = makeSeries({
      id: 2,
      seasons: [makeSeason({ id: 2, notes: '   ' })],
    });

    const [a, b] = buildLibraryItems([s, blank], []);
    expect(a.hasAnyNote).toBe(true);
    expect(a.latestNote).toBe('Latest episode insight');
    expect(a.latestNoteContext).toBe('Season 1 · Ep 8');
    expect(b.hasAnyNote).toBe(false);
    expect(b.latestNote).toBeNull();
  });

  it('extracts year from finish_date, release_year, start_date, or aired string without falling back to created_at', () => {
    const byFinish = makeSeries({
      id: 1,
      seasons: [makeSeason({ id: 1, finish_date: '2024-03-22', start_date: '2023-09-29' })],
    });
    const byReleaseYear = {
      ...makeSeries({ id: 2 }),
      release_year: 2022,
    } as AnimeSeries;
    const byStartDate = makeSeries({
      id: 3,
      seasons: [makeSeason({ id: 2, start_date: '2021-04-10', finish_date: null })],
    });
    const byAired = {
      ...makeSeries({ id: 4 }),
      aired: 'Fall 2020',
    } as AnimeSeries;
    const undated = makeSeries({
      id: 5,
      created_at: '2026-11-01T00:00:00Z',
      seasons: [makeSeason({ id: 3, start_date: null, finish_date: null })],
    });

    const items = buildLibraryItems([byFinish, byReleaseYear, byStartDate, byAired, undated], []);
    expect(items.map((i) => i.year)).toEqual([2024, 2022, 2021, 2020, null]);
  });

  it('computes lastActivityMs from activityList matching series/season/episode/movie or updated_at fallback', () => {
    const s1 = makeSeries({
      id: 1,
      seasons: [makeSeason({ id: 11, episode_notes: [makeEpisodeNote({ id: 101, season: 11 })] })],
      movies: [makeMovie({ id: 21 })],
      created_at: '2025-01-01T00:00:00Z',
    });
    const s2 = {
      ...makeSeries({ id: 2, created_at: '2025-01-01T00:00:00Z' }),
      updated_at: '2026-11-05T08:00:00Z',
    } as AnimeSeries;
    const s3 = makeSeries({
      id: 3,
      movies: [makeMovie({ id: 31 })],
      created_at: '2025-01-01T00:00:00Z',
    });

    const events: ActivityEvent[] = [
      makeEvent({ id: 1, target_type: 'season', target_id: 11, created_at: '2026-11-09T10:00:00Z' }),
      makeEvent({ id: 2, target_type: 'movie', target_id: 31, created_at: '2026-11-11T10:00:00Z' }),
    ];

    const [a, b, c] = buildLibraryItems([s1, s2, s3], events);
    expect(a.lastActivityMs).toBe(Date.parse('2026-11-09T10:00:00Z'));
    expect(b.lastActivityMs).toBe(Date.parse('2026-11-05T08:00:00Z'));
    expect(c.lastActivityMs).toBe(Date.parse('2026-11-11T10:00:00Z'));
  });

  it('collects studioIds and genreIds from series and releases and resolves quick-step targets', () => {
    const watching = makeSeries({
      id: 1,
      genres: [{ id: 2, name: 'Drama' }],
      studios: [{ id: 1, name: 'Madhouse' }],
      seasons: [
        makeSeason({
          id: 5,
          status: 'WATCHING',
          progress: 6,
          total_episodes: 12,
          studios: [{ id: 1, name: 'Madhouse' }, { id: 3, name: 'Bones' }],
        }),
      ],
    });
    const maxedOut = makeSeries({
      id: 2,
      seasons: [
        makeSeason({ id: 6, status: 'WATCHING', progress: 12, total_episodes: 12 }),
      ],
    });
    const watchingMovie = makeSeries({
      id: 3,
      movies: [makeMovie({ id: 9, status: 'WATCHING', progress_minutes: 105, total_minutes: 110 })],
    });

    const [a, b, c] = buildLibraryItems([watching, maxedOut, watchingMovie], []);
    expect(a.genreIds).toEqual([2]);
    expect(a.studioIds).toEqual([1, 3]);
    expect(a.canQuickStep).toBe(true);
    expect(a.quickStepTarget).toEqual({
      kind: 'season',
      id: 5,
      delta: 1,
      current: 6,
      total: 12,
    });

    expect(b.canQuickStep).toBe(false);
    expect(b.quickStepTarget).toBeNull();

    expect(c.canQuickStep).toBe(true);
    expect(c.quickStepTarget).toEqual({
      kind: 'movie',
      id: 9,
      delta: 5,
      current: 105,
      total: 110,
    });
  });
});

describe('filterAndSortLibrary', () => {
  const sample = () => {
    const frieren = makeSeries({
      id: 1,
      title: 'Frieren: Beyond Journey’s End',
      romaji_title: 'Sousou no Frieren',
      japanese_title: '葬送のフリーレン',
      genres: [{ id: 1, name: 'Fantasy' }],
      studios: [{ id: 10, name: 'Madhouse' }],
      seasons: [
        makeSeason({
          id: 1,
          status: 'COMPLETED',
          rating: 10,
          finish_date: '2024-03-22',
          notes: 'Time passes gently.',
        }),
      ],
    });

    const mob = makeSeries({
      id: 2,
      title: 'Mob Psycho 100',
      romaji_title: 'Mob Psycho 100',
      genres: [{ id: 2, name: 'Action' }],
      studios: [{ id: 20, name: 'Bones' }],
      seasons: [
        makeSeason({
          id: 2,
          status: 'WATCHING',
          progress: 4,
          total_episodes: 12,
          rating: 9,
          start_date: '2025-01-10',
          notes: null,
          episode_notes: [
            makeEpisodeNote({ id: 22, season: 2, episode_number: 3, note: 'Reigen shines here' }),
          ],
        }),
      ],
    });

    const lain = makeSeries({
      id: 3,
      title: 'Serial Experiments Lain',
      genres: [{ id: 3, name: 'Sci-Fi' }],
      studios: [{ id: 30, name: 'Triangle Staff' }],
      seasons: [
        makeSeason({
          id: 3,
          status: 'PLAN_TO_WATCH',
          progress: 0,
          total_episodes: 13,
          rating: null,
          notes: null,
        }),
      ],
    });

    const events: ActivityEvent[] = [
      makeEvent({ id: 1, target_type: 'season', target_id: 2, created_at: '2026-11-12T10:00:00Z' }),
      makeEvent({ id: 2, target_type: 'season', target_id: 1, created_at: '2026-11-10T10:00:00Z' }),
    ];

    return buildLibraryItems([frieren, mob, lain], events);
  };

  it('filters by status, genreId, studioId, and query across title, romaji, japanese, studio, genre, and notes', () => {
    const items = sample();

    expect(filterAndSortLibrary(items, { status: 'WATCHING' }).map((i) => i.series.id)).toEqual([2]);
    expect(filterAndSortLibrary(items, { genreId: 1 }).map((i) => i.series.id)).toEqual([1]);
    expect(filterAndSortLibrary(items, { studioId: 20 }).map((i) => i.series.id)).toEqual([2]);

    expect(filterAndSortLibrary(items, { q: 'sousou' }).map((i) => i.series.id)).toEqual([1]);
    expect(filterAndSortLibrary(items, { q: 'フリーレン' }).map((i) => i.series.id)).toEqual([1]);
    expect(filterAndSortLibrary(items, { q: 'madhouse' }).map((i) => i.series.id)).toEqual([1]);
    expect(filterAndSortLibrary(items, { q: 'sci-fi' }).map((i) => i.series.id)).toEqual([3]);
    expect(filterAndSortLibrary(items, { q: 'reigen shines' }).map((i) => i.series.id)).toEqual([2]);
  });

  it('sorts by recent, rating, title, aired, and note without mutating input', () => {
    const items = sample();
    const originalIds = items.map((i) => i.series.id);

    expect(filterAndSortLibrary(items, { sort: 'recent' }).map((i) => i.series.id)).toEqual([2, 1, 3]);
    expect(filterAndSortLibrary(items, { sort: 'rating' }).map((i) => i.series.id)).toEqual([1, 2, 3]);
    expect(filterAndSortLibrary(items, { sort: 'title' }).map((i) => i.series.id)).toEqual([1, 2, 3]);
    expect(filterAndSortLibrary(items, { sort: 'aired' }).map((i) => i.series.id)).toEqual([2, 1, 3]);
    expect(filterAndSortLibrary(items, { sort: 'note' }).map((i) => i.series.id)).toEqual([2, 1, 3]);

    expect(items.map((i) => i.series.id)).toEqual(originalIds);
  });
});

describe('groupByYear', () => {
  it('groups items in descending year order with Undated at bottom', () => {
    const items = buildLibraryItems([
      makeSeries({ id: 1, title: 'Old', seasons: [makeSeason({ id: 1, finish_date: '2021-06-01' })] }),
      makeSeries({ id: 2, title: 'Undated A', seasons: [makeSeason({ id: 2, finish_date: null, start_date: null })] }),
      makeSeries({ id: 3, title: 'New', seasons: [makeSeason({ id: 3, finish_date: '2025-02-01' })] }),
      makeSeries({ id: 4, title: 'Mid', seasons: [makeSeason({ id: 4, finish_date: '2024-08-01' })] }),
      makeSeries({ id: 5, title: 'Mid 2', seasons: [makeSeason({ id: 5, start_date: '2024-01-01' })] }),
    ]);

    const groups = groupByYear(items);
    expect(groups.map((g) => g.yearLabel)).toEqual(['2025', '2024', '2021', 'Undated']);
    expect(groups[1].items.map((i) => i.series.title)).toEqual(['Mid', 'Mid 2']);
    expect(groups[3].items.map((i) => i.series.title)).toEqual(['Undated A']);
  });
});

describe('selectHallOfFame', () => {
  it('returns 10/10 titles sorted by latest activity then title, and [] when none exist', () => {
    const none = buildLibraryItems([
      makeSeries({ id: 1, seasons: [makeSeason({ id: 1, rating: 9 })] }),
    ]);
    expect(selectHallOfFame(none)).toEqual([]);

    const mixed = buildLibraryItems(
      [
        makeSeries({ id: 1, title: 'Beta', seasons: [makeSeason({ id: 1, rating: 10 })] }),
        makeSeries({ id: 2, title: 'Nine', seasons: [makeSeason({ id: 2, rating: 9 })] }),
        makeSeries({ id: 3, title: 'Alpha', movies: [makeMovie({ id: 3, rating: 10 })] }),
        makeSeries({ id: 4, title: 'Newest Ten', seasons: [makeSeason({ id: 4, rating: 10 })] }),
      ],
      [
        makeEvent({ id: 1, target_type: 'season', target_id: 4, created_at: '2026-11-12T10:00:00Z' }),
        makeEvent({ id: 2, target_type: 'season', target_id: 1, created_at: '2026-11-10T10:00:00Z' }),
        makeEvent({ id: 3, target_type: 'movie', target_id: 3, created_at: '2026-11-10T10:00:00Z' }),
      ],
    );

    const fame = selectHallOfFame(mixed);
    expect(fame.map((i) => i.series.title)).toEqual(['Newest Ten', 'Alpha', 'Beta']);
  });
});
