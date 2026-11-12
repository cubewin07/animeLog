import { describe, expect, it } from 'vitest';
import type {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Rewatch,
} from '../../types';
import type { JournalReflection } from '../../state/useReflections';
import {
  buildThenVsNowItems,
  countJournalKinds,
  enrichJournalEntries,
  filterJournalEntries,
  filterThenVsNowItems,
  formatRatingDelta,
  groupJournalByMonth,
  normalizeJournalKind,
  parseJournalMonth,
} from './journalUtils';

const makeSeason = (overrides: Partial<AnimeSeason> = {}): AnimeSeason => ({
  id: 10,
  series: 1,
  series_title: 'Frieren',
  title: 'Season 1',
  season_number: 1,
  cover_image_url: null,
  image_url: null,
  status: 'COMPLETED',
  progress: 28,
  total_episodes: 28,
  rating: 8,
  start_date: '2026-01-01',
  finish_date: '2026-03-20',
  notes: 'Time passes gently when you actually pay attention.',
  created_at: '2026-01-01T00:00:00Z',
  studios: [],
  episode_notes: [],
  rewatches: [],
  ...overrides,
});

const makeMovie = (overrides: Partial<AnimeMovie> = {}): AnimeMovie => ({
  id: 10,
  series: 2,
  series_title: 'Spirited Away',
  title: 'Spirited Away',
  cover_image_url: null,
  image_url: null,
  status: 'COMPLETED',
  progress_minutes: 125,
  total_minutes: 125,
  rating: 9,
  start_date: '2026-02-10',
  finish_date: '2026-02-10',
  notes: 'Remembering your name is remembering who you are.',
  created_at: '2026-02-10T00:00:00Z',
  studios: [],
  rewatches: [],
  ...overrides,
});

const makeSeries = (overrides: Partial<AnimeSeries> = {}): AnimeSeries => ({
  id: 1,
  title: 'Frieren',
  cover_image_url: 'https://cdn.example.com/frieren-series.jpg',
  image_url: null,
  created_at: '2026-01-01T00:00:00Z',
  genres: [],
  studios: [],
  seasons: [],
  movies: [],
  ...overrides,
});

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 50,
  title: 'The Left Hand of Darkness',
  author: 'Ursula K. Le Guin',
  cover_image_url: 'https://cdn.example.com/book-50.jpg',
  image_url: null,
  status: 'COMPLETED',
  rating: 10,
  progress: 304,
  total_pages: 304,
  start_date: '2026-04-01',
  finish_date: '2026-04-14',
  notes: 'Light is the left hand of darkness.',
  created_at: '2026-04-01T00:00:00Z',
  genres: [],
  ...overrides,
});

const makeCharacter = (overrides: Partial<FavoriteCharacter> = {}): FavoriteCharacter => ({
  id: 70,
  series: 1,
  series_title: 'Frieren',
  name: 'Himmel',
  why: 'A hero who chose kindness in small moments.',
  cover_image_url: 'https://cdn.example.com/himmel.jpg',
  image_url: null,
  images: [],
  ...overrides,
});

const makeRewatch = (overrides: Partial<Rewatch> = {}): Rewatch => ({
  id: 100,
  target_type: 'season',
  target_id: 10,
  series_id: 1,
  season_id: 10,
  movie_id: null,
  start_date: '2026-04-02',
  finish_date: '2026-04-12',
  rating: 10,
  notes: 'Hits completely differently once you know every farewell.',
  ...overrides,
});

describe('normalizeJournalKind', () => {
  it('maps film to movie and accepts all valid kinds', () => {
    expect(normalizeJournalKind('film')).toBe('movie');
    expect(normalizeJournalKind('FILM')).toBe('movie');
    expect(normalizeJournalKind('movie')).toBe('movie');
    expect(normalizeJournalKind('episode')).toBe('episode');
    expect(normalizeJournalKind('season')).toBe('season');
    expect(normalizeJournalKind('book')).toBe('book');
    expect(normalizeJournalKind('character')).toBe('character');
    expect(normalizeJournalKind('rewatch')).toBe('rewatch');
    expect(normalizeJournalKind('ALL')).toBe('ALL');
    expect(normalizeJournalKind('all')).toBe('ALL');
  });

  it('falls back to ALL for null, empty, or unknown values', () => {
    expect(normalizeJournalKind(null)).toBe('ALL');
    expect(normalizeJournalKind(undefined)).toBe('ALL');
    expect(normalizeJournalKind('   ')).toBe('ALL');
    expect(normalizeJournalKind('unknown')).toBe('ALL');
  });
});

describe('parseJournalMonth', () => {
  it('parses YYYY-MM strings into monthKey and full English monthLabel', () => {
    expect(parseJournalMonth('2026-04-01')).toEqual({
      monthKey: '2026-04',
      monthLabel: 'April 2026',
    });
    expect(parseJournalMonth('2026-03-31T23:59:59Z')).toEqual({
      monthKey: '2026-03',
      monthLabel: 'March 2026',
    });
  });

  it('falls back to timestamp when dateStr is absent and Undated when both are missing', () => {
    const aprMs = Date.UTC(2026, 3, 15, 12, 0, 0);
    expect(parseJournalMonth(null, aprMs)).toEqual({
      monthKey: '2026-04',
      monthLabel: 'April 2026',
    });
    expect(parseJournalMonth(null, 0)).toEqual({
      monthKey: 'undated',
      monthLabel: 'Undated',
    });
    expect(parseJournalMonth('not-a-date', 0)).toEqual({
      monthKey: 'undated',
      monthLabel: 'Undated',
    });
  });
});

describe('enrichJournalEntries', () => {
  const season = makeSeason({
    id: 10,
    cover_image_url: 'https://cdn.example.com/frieren-s1.jpg',
    episode_notes: [
      {
        id: 501,
        season: 10,
        episode_number: 14,
        episode_title: 'Privilege of the Young',
        note: 'The ring scene quietly says everything.',
        rating: 10,
        created_at: '2026-04-05T18:00:00Z',
      },
    ],
  });
  const frierenSeries = makeSeries({ id: 1, title: 'Frieren', seasons: [season] });
  const spiritedMovie = makeMovie({
    id: 20,
    series: 2,
    cover_image_url: null,
    image_url: 'https://cdn.example.com/spirited-movie.jpg',
  });
  const spiritedSeries = makeSeries({
    id: 2,
    title: 'Spirited Away',
    cover_image_url: 'https://cdn.example.com/spirited-series.jpg',
    movies: [spiritedMovie],
  });
  const book = makeBook();
  const character = makeCharacter();

  const reflections: JournalReflection[] = [
    {
      id: 'ep-501',
      kind: 'episode',
      targetKind: 'season',
      targetId: 10,
      seriesId: 1,
      title: 'Frieren',
      context: 'S1 · Ep 14 (Privilege of the Young)',
      note: 'The ring scene quietly says everything.',
      rating: 10,
      episodeNumber: 14,
      timestamp: Date.parse('2026-04-05T18:00:00Z'),
      dateStr: '2026-04-05T18:00:00Z',
    },
    {
      id: 'movie-20',
      kind: 'film',
      targetKind: 'movie',
      targetId: 20,
      seriesId: 2,
      title: 'Spirited Away',
      context: 'Movie · Spirited Away',
      note: 'Remembering your name is remembering who you are.',
      rating: 9,
      timestamp: Date.parse('2026-02-10T00:00:00Z'),
      dateStr: '2026-02-10',
    },
    {
      id: 'book-50',
      kind: 'book',
      targetKind: 'book',
      targetId: 50,
      title: 'The Left Hand of Darkness',
      context: 'by Ursula K. Le Guin',
      note: 'Light is the left hand of darkness.',
      rating: 10,
      timestamp: Date.parse('2026-04-14T00:00:00Z'),
      dateStr: '2026-04-14',
    },
    {
      id: 'char-70',
      kind: 'character',
      targetKind: 'character',
      targetId: 70,
      seriesId: 1,
      title: 'Himmel',
      context: 'Character · Frieren',
      note: 'A hero who chose kindness in small moments.',
      timestamp: 0,
    },
  ];

  it('attaches artwork, canonical href, normalized kind, month label, and composer target', () => {
    const enriched = enrichJournalEntries(reflections, {
      seriesList: [frierenSeries, spiritedSeries],
      bookList: [book],
      characterList: [character],
    });

    expect(enriched[0]).toMatchObject({
      id: 'ep-501',
      normalizedKind: 'episode',
      kindLabel: 'Episode Note',
      coverUrl: 'https://cdn.example.com/frieren-s1.jpg',
      coverVariant: 'poster',
      href: '/anime/1?release=season-10&ep=14',
      monthKey: '2026-04',
      monthLabel: 'April 2026',
      composerTarget: {
        targetKind: 'season',
        id: 10,
        defaultKind: 'episode',
        episodeNumber: 14,
      },
    });

    expect(enriched[1]).toMatchObject({
      id: 'movie-20',
      normalizedKind: 'movie',
      kindLabel: 'Movie Note',
      coverUrl: 'https://cdn.example.com/spirited-movie.jpg',
      href: '/anime/2?release=movie-20',
      monthKey: '2026-02',
      monthLabel: 'February 2026',
      composerTarget: {
        targetKind: 'movie',
        id: 20,
        defaultKind: 'lesson',
      },
    });

    expect(enriched[2]).toMatchObject({
      id: 'book-50',
      normalizedKind: 'book',
      kindLabel: 'Book Note',
      coverUrl: 'https://cdn.example.com/book-50.jpg',
      href: '/books/50',
      monthKey: '2026-04',
      monthLabel: 'April 2026',
    });

    expect(enriched[3]).toMatchObject({
      id: 'char-70',
      normalizedKind: 'character',
      kindLabel: 'Character Note',
      coverUrl: 'https://cdn.example.com/himmel.jpg',
      coverVariant: 'portrait',
      href: '/characters/70',
      monthKey: 'undated',
      monthLabel: 'Undated',
      composerTarget: {
        targetKind: 'character',
        id: 70,
        defaultKind: 'why',
      },
    });
  });

  it('falls back to series cover when season or movie has no dedicated cover', () => {
    const plainSeason = makeSeason({ id: 99, series: 1, cover_image_url: null, image_url: null });
    const series = makeSeries({
      id: 1,
      cover_image_url: 'https://cdn.example.com/series-fallback.jpg',
      seasons: [plainSeason],
    });
    const [entry] = enrichJournalEntries(
      [
        {
          id: 'season-99',
          kind: 'season',
          targetKind: 'season',
          targetId: 99,
          seriesId: 1,
          title: 'Frieren',
          context: 'Season 1',
          note: 'A quiet journey.',
          timestamp: 0,
        },
      ],
      { seriesList: [series], bookList: [], characterList: [] },
    );

    expect(entry.coverUrl).toBe('https://cdn.example.com/series-fallback.jpg');
  });
});

describe('filterJournalEntries and groupJournalByMonth', () => {
  const series = makeSeries({ id: 1, seasons: [makeSeason({ id: 10 })] });
  const enriched = enrichJournalEntries(
    [
      {
        id: 'season-10',
        kind: 'season',
        targetKind: 'season',
        targetId: 10,
        seriesId: 1,
        title: 'Frieren',
        context: 'Season 1',
        note: 'Memories accumulate slowly.',
        timestamp: Date.parse('2026-03-20T00:00:00Z'),
        dateStr: '2026-03-20',
      },
      {
        id: 'movie-1',
        kind: 'film',
        targetKind: 'movie',
        targetId: 1,
        seriesId: 1,
        title: 'Silent Voice',
        context: 'Movie · Kyoto',
        note: 'Listening requires courage.',
        timestamp: Date.parse('2026-04-10T00:00:00Z'),
        dateStr: '2026-04-10',
      },
      {
        id: 'char-70',
        kind: 'character',
        targetKind: 'character',
        targetId: 70,
        seriesId: 1,
        title: 'Himmel',
        context: 'Character · Frieren',
        note: 'Kindness remembered.',
        timestamp: 0,
      },
    ],
    { seriesList: [series], bookList: [], characterList: [makeCharacter()] },
  );

  it('filters by kind (normalizing film -> movie) and searches title, context, and note', () => {
    expect(filterJournalEntries(enriched, { kind: 'film' }).map((e) => e.id)).toEqual(['movie-1']);
    expect(filterJournalEntries(enriched, { kind: 'ALL', q: 'courage' }).map((e) => e.id)).toEqual([
      'movie-1',
    ]);
    expect(filterJournalEntries(enriched, { kind: 'ALL', q: 'KYOTO' }).map((e) => e.id)).toEqual([
      'movie-1',
    ]);
    expect(filterJournalEntries(enriched, { kind: 'character', q: 'himmel' }).map((e) => e.id)).toEqual([
      'char-70',
    ]);
  });

  it('groups descending by month and places Undated at the bottom', () => {
    const groups = groupJournalByMonth(enriched);
    expect(groups.map((g) => g.monthLabel)).toEqual(['April 2026', 'March 2026', 'Undated']);
    expect(groups[0].entries.map((e) => e.id)).toEqual(['movie-1']);
    expect(groups[1].entries.map((e) => e.id)).toEqual(['season-10']);
    expect(groups[2].entries.map((e) => e.id)).toEqual(['char-70']);
  });
});

describe('buildThenVsNowItems', () => {
  it('pairs rewatches with original release, pass number, cover, href, and numeric ratingDelta', () => {
    const season10 = makeSeason({
      id: 10,
      series: 1,
      title: 'First Cour',
      season_number: 1,
      rating: 8,
      notes: 'Great fantasy.',
      cover_image_url: 'https://cdn.example.com/season10.jpg',
      episode_notes: [
        {
          id: 90,
          season: 10,
          episode_number: 14,
          episode_title: 'Privilege',
          note: 'Subtle ring gift.',
          rating: 9,
          created_at: '2026-01-10T00:00:00Z',
        },
      ],
    });
    // Movie shares ID 10 with season10 to verify season vs movie disambiguation
    const movie10 = makeMovie({
      id: 10,
      series: 2,
      title: 'Spirited Away',
      rating: 10,
      notes: 'Pure wonder.',
      cover_image_url: 'https://cdn.example.com/movie10.jpg',
    });

    const s1 = makeSeries({ id: 1, title: 'Frieren', seasons: [season10] });
    const s2 = makeSeries({ id: 2, title: 'Spirited Away', movies: [movie10] });

    const rewatches: Rewatch[] = [
      makeRewatch({
        id: 1,
        target_type: 'season',
        target_id: 10,
        series_id: 1,
        season_id: 10,
        movie_id: null,
        finish_date: '2026-03-01',
        rating: 9,
        notes: 'Caught so much foreshadowing.',
      }),
      makeRewatch({
        id: 2,
        target_type: 'season',
        target_id: 10,
        series_id: 1,
        season_id: 10,
        movie_id: null,
        finish_date: '2026-04-20',
        rating: 10,
        notes: 'Masterpiece.',
      }),
      makeRewatch({
        id: 3,
        target_type: 'movie',
        target_id: 10,
        series_id: 2,
        season_id: null,
        movie_id: 10,
        finish_date: '2026-04-05',
        rating: 9,
        notes: 'Noticed the train scene.',
      }),
      makeRewatch({
        id: 4,
        target_type: 'episode',
        target_id: 10,
        series_id: 1,
        season_id: 10,
        episode_number: 14,
        movie_id: null,
        finish_date: '2026-04-12',
        rating: 9,
        notes: 'Even warmer the second time.',
      }),
    ];

    const items = buildThenVsNowItems(rewatches, [s1, s2]);

    // Sorted newest-first: id 2 (Apr 20), id 4 (Apr 12), id 3 (Apr 05), id 1 (Mar 01)
    expect(items.map((i) => i.id)).toEqual([2, 4, 3, 1]);

    const pass2 = items[0];
    expect(pass2).toMatchObject({
      id: 2,
      passNumber: 2,
      title: 'Frieren',
      context: 'Season 1 · First Cour',
      coverUrl: 'https://cdn.example.com/season10.jpg',
      href: '/anime/1?release=season-10',
      originalNote: 'Great fantasy.',
      originalRating: 8,
      rewatchNote: 'Masterpiece.',
      rewatchRating: 10,
      ratingDelta: 2,
      monthKey: '2026-04',
      monthLabel: 'April 2026',
    });

    const epPass = items[1];
    expect(epPass).toMatchObject({
      id: 4,
      passNumber: 1,
      href: '/anime/1?release=season-10&ep=14',
      originalNote: 'Subtle ring gift.',
      originalRating: 9,
      rewatchRating: 9,
      ratingDelta: 0,
    });

    const moviePass = items[2];
    expect(moviePass).toMatchObject({
      id: 3,
      passNumber: 1,
      title: 'Spirited Away',
      coverUrl: 'https://cdn.example.com/movie10.jpg',
      href: '/anime/2?release=movie-10',
      originalNote: 'Pure wonder.',
      originalRating: 10,
      rewatchRating: 9,
      ratingDelta: -1,
    });

    const pass1 = items[3];
    expect(pass1.passNumber).toBe(1);
    expect(pass1.ratingDelta).toBe(1);
  });

  it('returns null ratingDelta when either original or rewatch rating is missing', () => {
    const season = makeSeason({ id: 10, rating: null, notes: null });
    const series = makeSeries({ id: 1, seasons: [season] });
    const [item] = buildThenVsNowItems(
      [makeRewatch({ id: 5, rating: 9, finish_date: null, start_date: null })],
      [series],
    );

    expect(item.ratingDelta).toBeNull();
    expect(item.dateLabel).toBe('Undated');
    expect(item.monthLabel).toBe('Undated');
  });
});

describe('formatRatingDelta, filterThenVsNowItems, and countJournalKinds', () => {
  it('formats rating deltas and counts kinds matching search query', () => {
    expect(formatRatingDelta(2)).toEqual({ label: '+2', direction: 'up' });
    expect(formatRatingDelta(-1)).toEqual({ label: '-1', direction: 'down' });
    expect(formatRatingDelta(0)).toEqual({ label: 'Same', direction: 'same' });
    expect(formatRatingDelta(null)).toBeNull();

    const s1 = makeSeries({
      id: 1,
      title: 'Frieren',
      seasons: [makeSeason({ id: 10, notes: 'Note A', rating: 8 })],
    });
    const entries = enrichJournalEntries(
      [
        {
          id: 'season-10',
          kind: 'season',
          targetKind: 'season',
          targetId: 10,
          seriesId: 1,
          title: 'Frieren',
          context: 'Season 1',
          note: 'Note A',
          timestamp: Date.parse('2026-04-01T00:00:00Z'),
          dateStr: '2026-04-01',
        },
        {
          id: 'book-50',
          kind: 'book',
          targetKind: 'book',
          targetId: 50,
          title: 'Dune',
          context: 'by Frank Herbert',
          note: 'Fear is the mind killer.',
          timestamp: Date.parse('2026-04-02T00:00:00Z'),
          dateStr: '2026-04-02',
        },
      ],
      { seriesList: [s1], bookList: [makeBook({ id: 50, title: 'Dune' })], characterList: [] },
    );

    const thenVsNow = buildThenVsNowItems(
      [makeRewatch({ id: 1, series_id: 1, season_id: 10, notes: 'Frieren again' })],
      [s1],
    );

    expect(filterThenVsNowItems(thenVsNow, 'frieren')).toHaveLength(1);
    expect(filterThenVsNowItems(thenVsNow, 'dune')).toHaveLength(0);

    expect(countJournalKinds(entries, thenVsNow, '')).toEqual({
      ALL: 2,
      episode: 0,
      season: 1,
      movie: 0,
      book: 1,
      character: 0,
      rewatch: 1,
    });

    expect(countJournalKinds(entries, thenVsNow, 'dune')).toEqual({
      ALL: 1,
      episode: 0,
      season: 0,
      movie: 0,
      book: 1,
      character: 0,
      rewatch: 0,
    });
  });
});
