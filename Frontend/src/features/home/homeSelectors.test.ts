import { describe, expect, it } from 'vitest';
import {
  selectContinueItems,
  selectFinishStoryItems,
  selectNextUpItems,
  selectPastNote,
} from './homeSelectors';
import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Rewatch,
} from '../../types';
import type { JournalReflection } from '../../state/useReflections';

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

const makeBook = (fields: Partial<Book> = {}): Book => ({
  id: 1,
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  status: 'PLAN_TO_READ',
  rating: null,
  progress: 0,
  total_pages: 300,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-10-01T00:00:00Z',
  genres: [],
  ...fields,
});

const makeCharacter = (fields: Partial<FavoriteCharacter> = {}): FavoriteCharacter => ({
  id: 1,
  series: 1,
  series_title: 'Frieren',
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

let eventSeq = 1;
const makeEvent = (fields: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: eventSeq++,
  kind: 'EPISODE_PROGRESS',
  target_type: 'season',
  target_id: 1,
  title: 'Frieren',
  delta: 1,
  backfilled: false,
  created_at: '2026-11-12T10:00:00Z',
  ...fields,
});

const makeReflection = (fields: Partial<JournalReflection> = {}): JournalReflection => ({
  id: 'season-1',
  kind: 'season',
  targetKind: 'season',
  targetId: 1,
  seriesId: 1,
  title: 'Frieren',
  context: 'Season 1 · Beyond Journey',
  note: 'A thoughtful reflection that is definitely longer than twenty-five characters.',
  rating: 9,
  timestamp: Date.parse('2026-01-10T00:00:00Z'),
  dateStr: '2026-01-10',
  ...fields,
});

describe('selectContinueItems', () => {
  it('sorts active items across seasons, movies, and books by latest activity timestamp', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Frieren',
        seasons: [
          makeSeason({
            id: 10,
            series: 1,
            season_number: 1,
            title: 'Season 1',
            status: 'WATCHING',
            progress: 14,
            total_episodes: 28,
            created_at: '2026-10-01T00:00:00Z',
          }),
        ],
      }),
      makeSeries({
        id: 2,
        title: 'Spirited Away',
        movies: [
          makeMovie({
            id: 20,
            series: 2,
            title: 'Spirited Away',
            status: 'WATCHING',
            progress_minutes: 45,
            total_minutes: 125,
            created_at: '2026-10-05T00:00:00Z',
          }),
        ],
      }),
    ];

    const bookList: Book[] = [
      makeBook({
        id: 30,
        title: 'Dune',
        author: 'Frank Herbert',
        status: 'READING',
        progress: 295,
        total_pages: 300,
        created_at: '2026-10-02T00:00:00Z',
      }),
    ];

    const activityList: ActivityEvent[] = [
      makeEvent({ target_type: 'season', target_id: 10, created_at: '2026-11-10T12:00:00Z' }),
      makeEvent({
        kind: 'NOTE_WRITTEN',
        target_type: 'episode',
        target_id: 10,
        created_at: '2026-11-12T08:00:00Z',
      }),
      makeEvent({
        kind: 'BOOK_PROGRESS',
        target_type: 'book',
        target_id: 30,
        created_at: '2026-11-12T15:00:00Z',
      }),
    ];

    const result = selectContinueItems({ seriesList, bookList, activityList });

    expect(result.hero?.key).toBe('book-30');
    expect(result.hero?.stepDelta).toBe(5);
    expect(result.hero?.href).toBe('/books/30');
    expect(result.hero?.isFallbackCompleted).toBe(false);

    expect(result.rest.map((item) => item.key)).toEqual(['season-10', 'movie-20']);
    expect(result.rest[0].href).toBe('/anime/1?release=season-10');
    expect(result.rest[1].href).toBe('/anime/2?release=movie-20');
  });

  it('falls back to updated_at, dates, rating, then id when activityList has no match', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Older Watching',
        seasons: [
          makeSeason({
            id: 1,
            series: 1,
            status: 'WATCHING',
            created_at: '2026-09-01T00:00:00Z',
          }),
          makeSeason({
            id: 2,
            series: 1,
            season_number: 2,
            title: 'Updated Later',
            status: 'WATCHING',
            created_at: '2026-09-01T00:00:00Z',
            updated_at: '2026-11-05T00:00:00Z',
          } as AnimeSeason & { updated_at: string }),
        ],
      }),
    ];

    const result = selectContinueItems({ seriesList, bookList: [], activityList: [] });
    expect(result.hero?.key).toBe('season-2');
    expect(result.rest.map((item) => item.key)).toEqual(['season-1']);
  });

  it('falls back to the most recently updated completed title when nothing is in progress', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Odd Taxi',
        seasons: [
          makeSeason({
            id: 5,
            series: 1,
            status: 'COMPLETED',
            progress: 13,
            total_episodes: 13,
            finish_date: '2026-11-11',
          }),
        ],
      }),
    ];
    const bookList: Book[] = [
      makeBook({
        id: 9,
        title: 'Piranesi',
        status: 'COMPLETED',
        progress: 245,
        total_pages: 245,
        finish_date: '2026-10-01',
      }),
    ];

    const result = selectContinueItems({ seriesList, bookList, activityList: [] });
    expect(result.hero?.key).toBe('season-5');
    expect(result.hero?.isFallbackCompleted).toBe(true);
    expect(result.hero?.canStep).toBe(false);
    expect(result.rest).toEqual([]);
  });

  it('returns null hero and empty rest when library has no active or completed titles', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        seasons: [makeSeason({ status: 'PLAN_TO_WATCH', progress: 0 })],
      }),
    ];

    const result = selectContinueItems({ seriesList, bookList: [], activityList: [] });
    expect(result.hero).toBeNull();
    expect(result.rest).toEqual([]);
  });
});

describe('selectPastNote', () => {
  it('prioritizes "On this day" reflections from a previous year', () => {
    const reflections: JournalReflection[] = [
      makeReflection({
        id: 'season-1',
        title: 'Recent Show',
        dateStr: '2026-11-12', // same year -> not "On this day"
      }),
      makeReflection({
        id: 'season-2',
        targetId: 2,
        title: 'Cowboy Bebop',
        dateStr: '2024-11-12', // 2 years ago today!
        note: 'See you space cowboy.',
      }),
    ];

    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 3,
        title: 'Mob Psycho 100',
        seasons: [makeSeason({ id: 3, series: 3, notes: 'Original note', rating: 8 })],
      }),
    ];
    const rewatchList: Rewatch[] = [
      makeRewatch({
        id: 7,
        target_type: 'season',
        target_id: 3,
        season_id: 3,
        notes: 'Even warmer the second time.',
        rating: 10,
      }),
    ];

    const result = selectPastNote({
      reflections,
      seriesList,
      rewatchList,
      now: '2026-11-12',
    });

    expect(result.note?.mode).toBe('on-this-day');
    expect(result.note?.badge).toBe('On this day · 2024');
    expect(result.note?.title).toBe('Cowboy Bebop');
    expect(result.totalChoices).toBeGreaterThanOrEqual(3);
  });

  it('prioritizes "Then vs now" rewatches paired with original season or movie notes and rating delta', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Eva',
        seasons: [
          makeSeason({
            id: 5,
            series: 1,
            season_number: 1,
            notes: 'Confused at first.',
            rating: 7,
            finish_date: '2023-04-10',
          }),
        ],
        movies: [
          makeMovie({
            id: 5, // same numeric id as season 5! Must stay separate
            series: 1,
            title: 'End of Eva',
            notes: 'Unforgettable finale.',
            rating: 9,
          }),
        ],
      }),
    ];

    const rewatchList: Rewatch[] = [
      makeRewatch({
        id: 11,
        target_type: 'season',
        target_id: 5,
        season_id: 5,
        rating: 10,
        notes: 'Everything clicked on the second watch.',
        finish_date: '2026-08-14',
      }),
    ];

    const result = selectPastNote({
      reflections: [makeReflection({ id: 'season-5', dateStr: '2026-01-01' })],
      seriesList,
      rewatchList,
      now: '2026-11-12',
    });

    expect(result.note?.mode).toBe('then-vs-now');
    expect(result.note?.badge).toBe('Then vs now');
    expect(result.note?.comparison).toEqual({
      originalNote: 'Confused at first.',
      originalRating: 7,
      originalDateStr: '2023-04-10',
      rewatchNote: 'Everything clicked on the second watch.',
      rewatchRating: 10,
      rewatchDateStr: '2026-08-14',
      ratingDelta: 3,
    });

    // Clicking "Another note" (offset=1) advances to the remaining substantive notes
    const next = selectPastNote({
      reflections: [
        makeReflection({ id: 'season-5', dateStr: '2026-01-01' }),
        makeReflection({ id: 'rewatch-11', kind: 'rewatch', dateStr: '2026-08-14' }),
      ],
      seriesList,
      rewatchList,
      offset: 1,
      now: '2026-11-12',
    });
    expect(next.note?.id).toBe('season-5');
    expect(next.note?.mode).toBe('daily-pick');
  });

  it('picks substantive reflections deterministically by day and rotates with offset', () => {
    const reflections: JournalReflection[] = [
      makeReflection({ id: 'short', note: 'Too short' }),
      makeReflection({
        id: 'long-1',
        title: 'Title One',
        note: 'First substantive reflection with more than twenty-five characters.',
      }),
      makeReflection({
        id: 'long-2',
        title: 'Title Two',
        note: 'Second substantive reflection with more than twenty-five characters.',
      }),
      makeReflection({
        id: 'long-3',
        title: 'Title Three',
        note: 'Third substantive reflection with more than twenty-five characters.',
      }),
    ];

    const pickA = selectPastNote({
      reflections,
      seriesList: [],
      rewatchList: [],
      now: '2026-11-12',
    });
    const pickASameDay = selectPastNote({
      reflections,
      seriesList: [],
      rewatchList: [],
      now: '2026-11-12',
    });
    const pickNextOffset = selectPastNote({
      reflections,
      seriesList: [],
      rewatchList: [],
      offset: 1,
      now: '2026-11-12',
    });

    expect(pickA.note?.mode).toBe('daily-pick');
    expect(pickA.note?.id).not.toBe('short');
    expect(pickA.note?.id).toBe(pickASameDay.note?.id);
    expect(pickNextOffset.note?.id).not.toBe(pickA.note?.id);
    expect(pickA.totalChoices).toBe(3);
  });

  it('returns null when there are no notes at all', () => {
    const result = selectPastNote({
      reflections: [],
      seriesList: [],
      rewatchList: [],
      now: '2026-11-12',
    });
    expect(result).toEqual({ note: null, totalChoices: 0 });
  });
});

describe('selectFinishStoryItems', () => {
  it('collects completed seasons, movies, books without notes and characters without why, sorted and capped', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Vinland Saga',
        seasons: [
          makeSeason({ id: 1, status: 'COMPLETED', notes: '  ', rating: 9, finish_date: '2026-11-01' }),
          makeSeason({ id: 2, status: 'COMPLETED', notes: 'Already written.', rating: 10 }),
          makeSeason({ id: 3, status: 'WATCHING', notes: null }),
        ],
        movies: [
          makeMovie({ id: 4, status: 'COMPLETED', notes: '', rating: 10, finish_date: '2026-11-02' }),
        ],
      }),
    ];
    const bookList: Book[] = [
      makeBook({ id: 5, title: 'Babel', status: 'COMPLETED', notes: null, rating: 8 }),
      makeBook({ id: 6, title: 'Finished With Note', status: 'COMPLETED', notes: 'Great read.' }),
    ];
    const characterList: FavoriteCharacter[] = [
      makeCharacter({ id: 7, name: 'Thorfinn', why: null }),
      makeCharacter({ id: 8, name: 'Askeladd', why: 'Complex mentor.' }),
    ];

    const items = selectFinishStoryItems({ seriesList, bookList, characterList });

    expect(items.map((item) => item.key)).toEqual([
      'movie-4',
      'season-1',
      'book-5',
      'character-7',
    ]);
    expect(items[0].xpReward).toBe(15);
    expect(items[1].xpReward).toBe(15);
    expect(items[2].xpReward).toBe(15);
    expect(items[3].xpReward).toBe(10);
    expect(items[3].defaultKind).toBe('why');
  });

  it('caps items at the requested limit', () => {
    const characterList = Array.from({ length: 10 }, (_, idx) =>
      makeCharacter({ id: idx + 1, name: `Char ${idx + 1}`, why: null }),
    );
    const items = selectFinishStoryItems({ seriesList: [], bookList: [], characterList }, 6);
    expect(items).toHaveLength(6);
  });
});

describe('selectNextUpItems', () => {
  it('collects PLAN_TO_WATCH seasons/movies and PLAN_TO_READ books and caps at 8', () => {
    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Pluto',
        seasons: [
          makeSeason({ id: 1, status: 'PLAN_TO_WATCH', total_episodes: 8, rating: 9 }),
          makeSeason({ id: 2, status: 'WATCHING' }),
        ],
        movies: [
          makeMovie({ id: 3, title: 'Look Back', status: 'PLAN_TO_WATCH', total_minutes: 58 }),
        ],
      }),
    ];

    const bookList: Book[] = Array.from({ length: 8 }, (_, idx) =>
      makeBook({
        id: idx + 10,
        title: `Book ${idx + 1}`,
        status: idx === 7 ? 'ON_HOLD' : 'PLAN_TO_READ',
        total_pages: 250,
        created_at: `2026-11-0${(idx % 9) + 1}T00:00:00Z`,
      }),
    );

    const items = selectNextUpItems({ seriesList, bookList });
    expect(items).toHaveLength(8);
    expect(items[0].key).toBe('season-1');
    expect(items.some((item) => item.key === 'book-17')).toBe(false);
    expect(items.some((item) => item.key === 'season-2')).toBe(false);
  });
});
