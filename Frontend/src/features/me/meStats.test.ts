import { describe, expect, it } from 'vitest';
import {
  buildActivityCalendar,
  computeLibraryAnalytics,
  computeYearRecap,
} from './meStats';
import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  ImageAsset,
  Rewatch,
} from '../../types';
import type { DailyActivityEntry } from '../../lib/progression';
import type { JournalReflection } from '../../state/useReflections';

const makeImage = (id: number): ImageAsset => ({
  id,
  file: `img-${id}.jpg`,
  url: `https://example.com/img-${id}.jpg`,
  title: `Img ${id}`,
  created_at: '2026-04-01T00:00:00Z',
});

const makeSeason = (fields: Partial<AnimeSeason> & { season_aired?: string | null; aired?: string | null } = {}): AnimeSeason => ({
  id: 1,
  series: 1,
  title: 'Season 1',
  season_number: 1,
  status: 'WATCHING',
  progress: 0,
  total_episodes: 12,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
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
  total_minutes: 120,
  rating: null,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  studios: [],
  ...fields,
});

const makeSeries = (fields: Partial<AnimeSeries> = {}): AnimeSeries => ({
  id: 1,
  title: 'Frieren',
  created_at: '2026-01-01T00:00:00Z',
  genres: [],
  studios: [],
  seasons: [],
  movies: [],
  ...fields,
});

const makeBook = (fields: Partial<Book> = {}): Book => ({
  id: 1,
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  status: 'READING',
  rating: null,
  progress: 0,
  total_pages: 300,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  genres: [],
  ...fields,
});

const makeCharacter = (fields: Partial<FavoriteCharacter> = {}): FavoriteCharacter => ({
  id: 1,
  series: 1,
  name: 'Frieren',
  why: null,
  ...fields,
});

const makeRewatch = (fields: Partial<Rewatch> = {}): Rewatch => ({
  id: 1,
  target_type: 'season',
  target_id: 1,
  start_date: null,
  finish_date: null,
  rating: null,
  notes: null,
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
  created_at: '2026-04-12T10:00:00Z',
  ...fields,
});

const makeReflection = (fields: Partial<JournalReflection> = {}): JournalReflection => ({
  id: 'season-1',
  kind: 'season',
  targetKind: 'season',
  targetId: 1,
  seriesId: 1,
  title: 'Frieren',
  context: 'Season 1',
  note: 'Time passes gently when you pay attention.',
  rating: 9,
  timestamp: new Date('2026-04-12T00:00:00Z').getTime(),
  dateStr: '2026-04-12',
  ...fields,
});

describe('buildActivityCalendar', () => {
  it('builds Sunday-Saturday week columns with accurate intensities and tooltips', () => {
    // 2026-04-15 is a Wednesday (dayOfWeek = 3)
    const now = new Date(2026, 3, 15);
    const dailyMap: Record<string, DailyActivityEntry> = {
      '2026-04-12': { count: 3, events: [] },
      '2026-04-13': { count: 1, events: [] },
      '2026-04-14': { count: 5, events: [] },
      '2026-04-15': { count: 7, events: [] },
    };

    const weeks = buildActivityCalendar(dailyMap, 4, now);
    expect(weeks).toHaveLength(4);
    for (const week of weeks) {
      expect(week.days).toHaveLength(7);
      expect(week.days.map((d) => d.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }

    const lastWeek = weeks[3];
    const apr12 = lastWeek.days[0];
    const apr13 = lastWeek.days[1];
    const apr14 = lastWeek.days[2];
    const apr15 = lastWeek.days[3];
    const apr16 = lastWeek.days[4];

    expect(apr12.dateKey).toBe('2026-04-12');
    expect(apr12.intensity).toBe(2);
    expect(apr12.tooltip).toBe('Apr 12 · 3 activities');

    expect(apr13.intensity).toBe(1);
    expect(apr13.tooltip).toBe('Apr 13 · 1 activity');

    expect(apr14.intensity).toBe(3);

    expect(apr15.isToday).toBe(true);
    expect(apr15.isFuture).toBe(false);
    expect(apr15.intensity).toBe(4);
    expect(apr15.tooltip).toBe('Apr 15 · 7 activities');

    expect(apr16.isFuture).toBe(true);
    expect(apr16.intensity).toBe(0);
    expect(apr16.count).toBe(0);
    expect(apr16.tooltip).toBe('Apr 16 · Upcoming');
  });

  it('defaults to 26 weeks and labels empty days cleanly', () => {
    const weeks = buildActivityCalendar({}, 26, new Date(2026, 3, 15));
    expect(weeks).toHaveLength(26);
    expect(weeks[0].days[0].tooltip).toMatch(/· No activity$/);
  });
});

describe('computeLibraryAnalytics', () => {
  it('computes episodes, estimated hours, genres, studios, ratings, seasons, HoF, characters, and years', () => {
    const fantasy = { id: 1, name: 'Fantasy' };
    const drama = { id: 2, name: 'Drama' };
    const sciFi = { id: 3, name: 'Sci-Fi' };
    const madhouse = { id: 10, name: 'Madhouse' };
    const kyoto = { id: 11, name: 'Kyoto Animation' };

    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Frieren',
        cover_image_url: 'https://example.com/frieren.jpg',
        genres: [fantasy, drama],
        studios: [madhouse],
        seasons: [
          makeSeason({
            id: 1,
            series: 1,
            title: 'Cour 1',
            status: 'COMPLETED',
            progress: 28,
            rating: 10,
            season_aired: 'Fall 2023',
            start_date: '2023-10-01',
            finish_date: '2024-03-22',
            notes: 'A quiet reflection on grief and memory.',
            episode_notes: [
              {
                id: 100,
                season: 1,
                episode_number: 1,
                episode_title: 'The Journey Begins',
                note: 'Unforgettable opening.',
                rating: 10,
                created_at: '2024-01-05T00:00:00Z',
              },
            ],
          }),
        ],
        movies: [],
      }),
      makeSeries({
        id: 2,
        title: 'Violet Evergarden',
        cover_image_url: 'https://example.com/violet.jpg',
        genres: [drama],
        studios: [kyoto],
        seasons: [
          makeSeason({
            id: 2,
            series: 2,
            title: 'TV',
            status: 'COMPLETED',
            progress: 13,
            rating: 9,
            start_date: '2025-01-10',
            finish_date: '2025-02-04',
            studios: [kyoto],
          }),
        ],
        movies: [
          makeMovie({
            id: 20,
            series: 2,
            title: 'The Movie',
            status: 'COMPLETED',
            progress_minutes: 140,
            total_minutes: 140,
            rating: 10,
            finish_date: '2025-05-12',
            notes: 'Letters across time.',
            studios: [kyoto],
          }),
        ],
      }),
    ];

    const bookList: Book[] = [
      makeBook({
        id: 1,
        title: 'Earthsea',
        author: 'Ursula K. Le Guin',
        status: 'COMPLETED',
        rating: 10,
        finish_date: '2025-08-20',
        notes: 'Balance and naming.',
        genres: [fantasy, sciFi],
      }),
      makeBook({
        id: 2,
        title: 'Dune',
        status: 'READING',
        rating: 7,
        start_date: '2026-01-03',
        genres: [sciFi],
      }),
    ];

    const characterList: FavoriteCharacter[] = [
      makeCharacter({ id: 1, series: 1, name: 'Sketch Char', why: null }),
      makeCharacter({
        id: 2,
        series: 1,
        name: 'Color Short',
        cover_image_url: 'https://example.com/c2.jpg',
        why: 'Short why',
      }),
      makeCharacter({
        id: 3,
        series: 2,
        name: 'Foil Char',
        cover_image_url: 'https://example.com/c3.jpg',
        why: 'Deep empathy',
        images: [makeImage(1), makeImage(2), makeImage(3)],
      }),
      makeCharacter({
        id: 4,
        series: 1,
        name: 'Inked Char',
        cover_image_url: 'https://example.com/c4.jpg',
        why: null,
      }),
      makeCharacter({
        id: 5,
        series: 1,
        name: 'Color Long',
        cover_image_url: 'https://example.com/c5.jpg',
        why: 'A much longer note explaining why this character endures.',
        images: [makeImage(4), makeImage(5)],
      }),
    ];

    const result = computeLibraryAnalytics(
      {
        seriesList,
        bookList,
        characterList,
        rewatchList: [makeRewatch({ finish_date: '2025-11-02', notes: 'Even richer on rewatch.' })],
        activityList: [makeEvent({ created_at: '2026-04-12T10:00:00Z' })],
      },
      new Date(2026, 3, 15),
    );

    // 28 + 13 = 41 episodes -> 16.4h + 140/60 (2.333h) = 18.733h -> 18.7
    expect(result.totalEpisodes).toBe(41);
    expect(result.estimatedHours).toBe(18.7);
    expect(result.completedAnime).toBe(3);
    expect(result.completedBooks).toBe(1);
    expect(result.completedTotal).toBe(4);

    // Genres: Drama (2), Fantasy (2), Sci-Fi (2)
    expect(result.topGenres).toHaveLength(3);
    expect(result.topGenres.map((g) => g.name)).toEqual(['Drama', 'Fantasy', 'Sci-Fi']);

    // Studios deduplicated per series: Kyoto Animation (1), Madhouse (1)
    expect(result.topStudios).toEqual([
      { id: 11, name: 'Kyoto Animation', count: 1 },
      { id: 10, name: 'Madhouse', count: 1 },
    ]);

    // Rating spread 1..10: 7 -> 1, 9 -> 1, 10 -> 3
    expect(result.ratingSpread).toHaveLength(10);
    expect(result.ratingSpread.find((b) => b.score === 10)?.count).toBe(3);
    expect(result.ratingSpread.find((b) => b.score === 9)?.count).toBe(1);
    expect(result.ratingSpread.find((b) => b.score === 7)?.count).toBe(1);

    // Seasonal breakdown:
    // Frieren season_aired 'Fall 2023' -> Fall
    // Violet TV finish_date '2025-02-04' -> Winter
    // Violet Movie finish_date '2025-05-12' -> Spring
    // Earthsea finish_date '2025-08-20' -> Summer
    expect(result.seasonalBreakdown.map((s) => ({ season: s.season, count: s.count }))).toEqual([
      { season: 'Winter', count: 1 },
      { season: 'Spring', count: 1 },
      { season: 'Summer', count: 1 },
      { season: 'Fall', count: 1 },
    ]);

    // Hall of fame: 3 10/10 titles
    expect(result.hallOfFame).toHaveLength(3);
    expect(result.hallOfFame.map((h) => h.id)).toEqual(['season-1', 'movie-20', 'book-1']);
    expect(result.hallOfFame[0].href).toBe('/anime/1?release=season-1');
    expect(result.hallOfFame[1].href).toBe('/anime/2?release=movie-20');
    expect(result.hallOfFame[2].href).toBe('/books/1');

    // Top characters: foil > color (2 imgs) > color (1 img) > inked > sketch
    expect(result.topCharacters.map((c) => c.character.name)).toEqual([
      'Foil Char',
      'Color Long',
      'Color Short',
      'Inked Char',
      'Sketch Char',
    ]);

    // Recap years sorted descending across dates + current year
    expect(result.availableRecapYears).toEqual([2026, 2025, 2024, 2023]);
  });

  it('caps topGenres and topStudios at 6 items', () => {
    const genres = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Genre ${i + 1}` }));
    const studios = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Studio ${i + 1}` }));

    const result = computeLibraryAnalytics({
      seriesList: [makeSeries({ genres, studios })],
      bookList: [],
      characterList: [],
      rewatchList: [],
      activityList: [],
    });

    expect(result.topGenres).toHaveLength(6);
    expect(result.topStudios).toHaveLength(6);
  });
});

describe('computeYearRecap', () => {
  it('aggregates year-scoped activity, title of the year, taste, character, best note, and full-color unlock', () => {
    const drama = { id: 1, name: 'Drama' };
    const fantasy = { id: 2, name: 'Fantasy' };
    const madhouse = { id: 10, name: 'Madhouse' };

    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Frieren',
        cover_image_url: 'https://example.com/frieren.jpg',
        genres: [fantasy, drama],
        studios: [madhouse],
        seasons: [
          makeSeason({
            id: 1,
            series: 1,
            status: 'COMPLETED',
            progress: 12,
            rating: 10,
            start_date: '2025-12-20',
            finish_date: '2026-02-15',
            notes: 'A masterclass in pacing and quiet grief.',
          }),
        ],
        movies: [
          makeMovie({
            id: 2,
            series: 1,
            title: 'Overture',
            status: 'COMPLETED',
            progress_minutes: 90,
            rating: 8,
            finish_date: '2026-03-01',
          }),
        ],
      }),
      makeSeries({
        id: 2,
        title: 'Old Show',
        genres: [{ id: 9, name: 'Mecha' }],
        studios: [{ id: 99, name: 'Sunrise' }],
        seasons: [
          makeSeason({
            id: 9,
            series: 2,
            status: 'COMPLETED',
            progress: 24,
            rating: 9,
            finish_date: '2024-06-01',
          }),
        ],
      }),
    ];

    const bookList: Book[] = [
      makeBook({
        id: 1,
        title: 'Piranesi',
        status: 'COMPLETED',
        rating: 9,
        finish_date: '2026-04-01',
        genres: [fantasy],
      }),
    ];

    const characterList: FavoriteCharacter[] = [
      makeCharacter({
        id: 1,
        series: 1,
        name: 'Himmel',
        cover_image_url: 'https://example.com/himmel.jpg',
        why: 'Ten years was enough to change a lifetime.',
        images: [makeImage(1), makeImage(2)],
      }),
      makeCharacter({
        id: 2,
        series: 2,
        name: '2024 Pilot',
        why: 'From a 2024-only series.',
      }),
    ];

    const activityList: ActivityEvent[] = [
      makeEvent({
        id: 1,
        kind: 'EPISODE_PROGRESS',
        target_type: 'season',
        target_id: 1,
        delta: 8,
        created_at: '2026-01-15T10:00:00Z',
      }),
      makeEvent({
        id: 2,
        kind: 'MOVIE_PROGRESS',
        target_type: 'movie',
        target_id: 2,
        delta: 90,
        created_at: '2026-03-01T10:00:00Z',
      }),
    ];

    const reflections: JournalReflection[] = [
      makeReflection({
        id: 'old-2024',
        title: 'Old Show',
        note: 'Great 2024 note',
        rating: 10,
        dateStr: '2024-06-01',
      }),
      makeReflection({
        id: 'frieren-2026',
        title: 'Frieren',
        note: 'Knowing someone well takes choosing to walk slowly beside them.',
        rating: 10,
        dateStr: '2026-02-15',
      }),
    ];

    const recap = computeYearRecap(2026, {
      seriesList,
      bookList,
      characterList,
      rewatchList: [],
      activityList,
      reflections,
    });

    // 8 episodes from 2026 activity (not all 12) + 90 movie mins -> 8*0.4 + 1.5 = 4.7h
    expect(recap.episodes).toBe(8);
    expect(recap.movies).toBe(1);
    expect(recap.books).toBe(1);
    expect(recap.hours).toBe(4.7);
    expect(recap.notesCount).toBe(1);
    expect(recap.topTitle?.title).toBe('Frieren');
    expect(recap.topTitle?.rating).toBe(10);
    expect(recap.topGenre?.name).toBe('Fantasy');
    expect(recap.topStudio?.name).toBe('Madhouse');
    expect(recap.mostWrittenCharacter?.character.name).toBe('Himmel');
    expect(recap.bestNote?.id).toBe('frieren-2026');
    expect(recap.bestNoteIsFallback).toBe(false);
    expect(recap.isFullColorUnlocked).toBe(true);
  });

  it('stays in sketch mode when a year has sparse data and falls back safely for bestNote', () => {
    const reflections: JournalReflection[] = [
      makeReflection({
        id: 'older-note',
        note: 'Memorable older reflection.',
        rating: 9,
        dateStr: '2024-05-01',
      }),
    ];

    const recap = computeYearRecap(2026, {
      seriesList: [
        makeSeries({
          id: 1,
          seasons: [
            makeSeason({
              id: 1,
              series: 1,
              progress: 2,
              start_date: '2026-03-01',
            }),
          ],
        }),
      ],
      bookList: [],
      characterList: [],
      rewatchList: [],
      activityList: [],
      reflections,
    });

    expect(recap.episodes).toBe(2);
    expect(recap.titlesTouched).toBe(1);
    expect(recap.isFullColorUnlocked).toBe(false);
    expect(recap.bestNote?.id).toBe('older-note');
    expect(recap.bestNoteIsFallback).toBe(true);
  });

  it('deduplicates repeated NOTE_WRITTEN edits on the same target in Recap notesCount', () => {
    const recap = computeYearRecap(2026, {
      seriesList: [],
      bookList: [],
      characterList: [],
      rewatchList: [],
      activityList: [
        makeEvent({
          id: 1,
          kind: 'NOTE_WRITTEN',
          target_type: 'season',
          target_id: 10,
          delta: 1,
          created_at: '2026-02-01T10:00:00Z',
        }),
        makeEvent({
          id: 2,
          kind: 'NOTE_WRITTEN',
          target_type: 'season',
          target_id: 10,
          delta: 1,
          created_at: '2026-03-15T10:00:00Z',
        }),
        makeEvent({
          id: 3,
          kind: 'NOTE_WRITTEN',
          target_type: 'season',
          target_id: 10,
          delta: 1,
          created_at: '2026-04-20T10:00:00Z',
        }),
        // Different target_type with same numeric id counts separately
        makeEvent({
          id: 4,
          kind: 'NOTE_WRITTEN',
          target_type: 'book',
          target_id: 10,
          delta: 1,
          created_at: '2026-05-01T10:00:00Z',
        }),
        // Out-of-window year ignored
        makeEvent({
          id: 5,
          kind: 'NOTE_WRITTEN',
          target_type: 'movie',
          target_id: 10,
          delta: 1,
          created_at: '2025-12-31T00:00:00Z',
        }),
      ],
      reflections: [],
    });

    expect(recap.notesCount).toBe(2);
  });
});
