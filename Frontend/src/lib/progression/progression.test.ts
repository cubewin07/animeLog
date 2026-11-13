import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LEVEL_TIERS,
  computeAchievements,
  computeProgression,
  computeStreak,
  computeTodayXp,
  computeXpBreakdown,
  getGamePrefs,
  resolveLevel,
  saveGamePrefs,
} from './index';
import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Rewatch,
} from '../../types';

const makeSeason = (fields: Partial<AnimeSeason> = {}): AnimeSeason => ({
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
  total_minutes: 120,
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
  status: 'READING',
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

let eventCounter = 1;
const makeEvent = (fields: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: eventCounter++,
  kind: 'EPISODE_PROGRESS',
  target_type: 'season',
  target_id: 1,
  title: 'Frieren — Season 1',
  delta: 1,
  backfilled: false,
  created_at: '2026-11-12',
  ...fields,
});

describe('xp & level calculation', () => {
  it('computes exact XP weights across episodes, notes, characters, and completions', () => {
    const xp = computeXpBreakdown({
      seriesList: [
        makeSeries({
          seasons: [
            makeSeason({
              progress: 12, // 12 * 1 = 12
              status: 'COMPLETED', // +20
              notes: 'A quiet journey about time.', // +15
              episode_notes: [
                {
                  id: 1,
                  season: 1,
                  episode_number: 1,
                  episode_title: 'The Journey Ends',
                  note: 'Bittersweet opener.', // +5
                  rating: 9,
                  created_at: '2026-11-01T00:00:00Z',
                },
                {
                  id: 2,
                  season: 1,
                  episode_number: 2,
                  episode_title: null,
                  note: '   ', // blank ignored
                  rating: null,
                  created_at: '2026-11-02T00:00:00Z',
                },
              ],
            }),
          ],
          movies: [
            makeMovie({
              status: 'COMPLETED', // +20
              notes: 'Stunning animation.', // +15
            }),
          ],
        }),
      ],
      bookList: [
        makeBook({
          status: 'COMPLETED', // +20
          notes: 'Comfort read.', // +15
        }),
      ],
      characterList: [
        makeCharacter({ why: 'Shows grief slowly.' }), // +10
        makeCharacter({ id: 2, name: 'Fern', why: '   ' }), // blank ignored
      ],
      rewatchList: [
        makeRewatch({ notes: 'Noticed so much foreshadowing.' }), // +15
      ],
    });

    expect(xp.episodesWatched).toBe(12);
    expect(xp.episodeNotes).toBe(1);
    expect(xp.characterWhys).toBe(1);
    expect(xp.journalNotes).toBe(4);
    expect(xp.completedCount).toBe(3);
    expect(xp.total).toBe(12 + 5 + 10 + 60 + 60);
  });

  it('resolves all level thresholds and Sensei 1200+ scaling', () => {
    expect(LEVEL_TIERS.map((t) => t.name)).toEqual([
      'Newcomer',
      'Regular',
      'Binger',
      'Otaku',
      'Critic',
      'Sensei',
    ]);

    expect(resolveLevel(0)).toMatchObject({ level: 1, name: 'Newcomer', minXp: 0, nextXp: 50 });
    expect(resolveLevel(49)).toMatchObject({ level: 1, name: 'Newcomer', xpToNext: 1 });
    expect(resolveLevel(50)).toMatchObject({ level: 2, name: 'Regular', minXp: 50, nextXp: 150 });
    expect(resolveLevel(150)).toMatchObject({ level: 3, name: 'Binger', minXp: 150, nextXp: 300 });
    expect(resolveLevel(300)).toMatchObject({ level: 4, name: 'Otaku', minXp: 300, nextXp: 500 });
    expect(resolveLevel(500)).toMatchObject({ level: 5, name: 'Critic', minXp: 500, nextXp: 800 });
    expect(resolveLevel(800)).toMatchObject({
      level: 6,
      name: 'Sensei',
      minXp: 800,
      nextXp: 1200,
      progressPct: 0,
    });
    expect(resolveLevel(1000)).toMatchObject({
      level: 6,
      name: 'Sensei',
      minXp: 800,
      nextXp: 1200,
      progressPct: 50,
    });
    expect(resolveLevel(1250)).toMatchObject({
      level: 6,
      name: 'Sensei',
      minXp: 1200,
      nextXp: 1600,
      xpIntoLevel: 50,
      xpToNext: 350,
    });
  });

  it('computes todayXp from non-backfilled events including undo adjustments', () => {
    const events = [
      makeEvent({ kind: 'EPISODE_PROGRESS', delta: 3, created_at: '2026-11-12' }),
      makeEvent({ kind: 'EPISODE_PROGRESS', delta: -1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'COMPLETED', delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'episode', delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'episode', delta: 1, backfilled: true, created_at: '2026-11-12' }),
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'season', delta: 1, created_at: '2026-11-11' }),
    ];

    expect(computeTodayXp(events, '2026-11-12')).toBe(27);
  });

  it('deduplicates repeated NOTE_WRITTEN and CHARACTER_ADDED events on the same target and cancels +1/-1 COMPLETED pairs', () => {
    const events = [
      // Repeated season note edits on the same target today -> 15 XP once
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'season', target_id: 10, delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'season', target_id: 10, delta: 1, created_at: '2026-11-12' }),
      // Same numeric ID but different target_type -> still counts once (5 XP)
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'episode', target_id: 10, delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'NOTE_WRITTEN', target_type: 'episode', target_id: 10, delta: 1, created_at: '2026-11-12' }),
      // Repeated character add/edit on same target today -> 10 XP once
      makeEvent({ kind: 'CHARACTER_ADDED', target_type: 'character', target_id: 7, delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'CHARACTER_ADDED', target_type: 'character', target_id: 7, delta: 1, created_at: '2026-11-12' }),
      // Completed then reopened on the same target today -> cancels to 0 XP
      makeEvent({ kind: 'COMPLETED', target_type: 'season', target_id: 10, delta: 1, created_at: '2026-11-12' }),
      makeEvent({ kind: 'COMPLETED', target_type: 'season', target_id: 10, delta: -1, created_at: '2026-11-12' }),
    ];

    expect(computeTodayXp(events, '2026-11-12')).toBe(30);

    // Pure +1/-1 COMPLETED pair yields 0 XP
    expect(
      computeTodayXp(
        [
          makeEvent({ kind: 'COMPLETED', target_type: 'book', target_id: 5, delta: 1, created_at: '2026-11-12' }),
          makeEvent({ kind: 'COMPLETED', target_type: 'book', target_id: 5, delta: -1, created_at: '2026-11-12' }),
        ],
        '2026-11-12',
      ),
    ).toBe(0);
  });
});

describe('streak calculation', () => {
  it('returns zeroes cleanly for empty activity', () => {
    const streak = computeStreak([], '2026-11-12');
    expect(streak).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      activeDaysLast7: 0,
      activeToday: false,
      restDaysUsedThisWeek: 0,
      thisWeekEpisodes: 0,
      dailyMap: {},
    });
  });

  it('forgets 1 rest day per 7-day window and preserves streak across weeks', () => {
    // Active Nov 1..6 (6 days), rest Nov 7, active Nov 8..12 (5 days) -> 11 active days!
    const activeDates = [
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      // rest 2026-11-07
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
    ];
    const events = activeDates.map((date) => makeEvent({ created_at: date }));
    const streak = computeStreak(events, '2026-11-12');

    expect(streak.currentStreak).toBe(11);
    expect(streak.longestStreak).toBe(11);
    expect(streak.activeToday).toBe(true);
    expect(streak.activeDaysLast7).toBe(6);
    expect(streak.restDaysUsedThisWeek).toBe(1);
    expect(streak.thisWeekEpisodes).toBe(6);
  });

  it('breaks the streak when 2 rest days occur within the same 7-day window', () => {
    // Active Nov 6, 7; rest Nov 8; active Nov 9; rest Nov 10; active Nov 11, 12
    const events = [
      makeEvent({ created_at: '2026-11-06' }),
      makeEvent({ created_at: '2026-11-07' }),
      // rest Nov 8
      makeEvent({ created_at: '2026-11-09' }),
      // rest Nov 10
      makeEvent({ created_at: '2026-11-11' }),
      makeEvent({ created_at: '2026-11-12' }),
    ];

    const streak = computeStreak(events, '2026-11-12');
    // Nov 8 and Nov 10 are 2 days apart (< 7), so streak before Nov 9 drops: current = Nov 9, 11, 12 (3 days)
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
  });

  it('ignores negative undo deltas and excludes backfilled events from streaks', () => {
    const events = [
      makeEvent({ created_at: '2026-11-09', backfilled: true }),
      makeEvent({ created_at: '2026-11-10', delta: -1 }),
      makeEvent({ created_at: '2026-11-11', delta: 2 }),
      makeEvent({ created_at: '2026-11-12', delta: 1 }),
      makeEvent({ created_at: '2026-11-12', delta: -1 }),
    ];

    const streak = computeStreak(events, '2026-11-12');
    expect(streak.currentStreak).toBe(2);
    expect(streak.dailyMap['2026-11-09']?.count).toBe(1);
    expect(streak.dailyMap['2026-11-10']).toBeUndefined();
    expect(streak.thisWeekEpisodes).toBe(1);
  });
});

describe('achievements & full progression', () => {
  it('computes all 20 achievements including First Cour, Every Episode Counts, Changed My Mind, Studio Loyalist, and Foil Collector', () => {
    const studioA = { id: 1, name: 'Kyoto Animation' };
    const studioB = { id: 2, name: 'Madhouse' };

    const seriesList: AnimeSeries[] = [
      makeSeries({
        id: 1,
        title: 'Violet Evergarden',
        genres: [
          { id: 1, name: 'Drama' },
          { id: 2, name: 'Slice of Life' },
        ],
        studios: [studioA],
        seasons: [
          makeSeason({
            id: 10,
            series: 1,
            status: 'COMPLETED',
            progress: 3,
            total_episodes: 3,
            rating: 7,
            notes: 'Letters connect people.',
            studios: [studioA],
            episode_notes: [
              { id: 1, season: 10, episode_number: 1, episode_title: null, note: 'Ep 1', rating: 7, created_at: '2026-11-01' },
              { id: 2, season: 10, episode_number: 2, episode_title: null, note: 'Ep 2', rating: 8, created_at: '2026-11-02' },
              { id: 3, season: 10, episode_number: 3, episode_title: null, note: 'Ep 3', rating: 9, created_at: '2026-11-03' },
            ],
          }),
          makeSeason({
            id: 11,
            series: 1,
            season_number: 2,
            status: 'COMPLETED',
            progress: 12,
            total_episodes: 12,
            rating: 10,
            studios: [studioA],
          }),
        ],
      }),
      makeSeries({
        id: 2,
        title: 'Hyouka',
        genres: [{ id: 3, name: 'Mystery' }],
        studios: [studioA],
      }),
      makeSeries({
        id: 3,
        title: 'Hibike! Euphonium',
        genres: [{ id: 4, name: 'Music' }],
        studios: [studioA],
      }),
      makeSeries({
        id: 4,
        title: 'Frieren',
        genres: [{ id: 5, name: 'Fantasy' }],
        studios: [studioB],
        seasons: [
          makeSeason({
            id: 12,
            series: 4,
            status: 'WATCHING',
            progress: 15,
            total_episodes: 28,
            rating: 9,
          }),
        ],
      }),
    ];

    const bookList: Book[] = [
      makeBook({
        id: 1,
        status: 'COMPLETED',
        rating: 9,
        notes: 'Wonderfully cozy.',
        genres: [{ id: 5, name: 'Fantasy' }],
      }),
    ];

    const characterList: FavoriteCharacter[] = [
      makeCharacter({
        id: 1,
        name: 'Violet',
        why: 'Learning what love means.',
        cover_image: 99,
        images: [
          { id: 1, file: 'a.jpg', url: '/a.jpg', title: '1', created_at: '2026-11-01' },
          { id: 2, file: 'b.jpg', url: '/b.jpg', title: '2', created_at: '2026-11-01' },
          { id: 3, file: 'c.jpg', url: '/c.jpg', title: '3', created_at: '2026-11-01' },
        ],
      }),
    ];

    const rewatchList: Rewatch[] = [
      makeRewatch({
        id: 1,
        target_type: 'season',
        target_id: 10,
        season_id: 10,
        rating: 9, // original season 10 rating is 7 -> diff 2
        notes: 'Hit harder the second time.',
      }),
    ];

    const activityList: ActivityEvent[] = [
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
    ].map((date) => makeEvent({ created_at: date }));

    const progression = computeProgression(
      { seriesList, bookList, characterList, rewatchList, activityList },
      '2026-11-12'
    );

    expect(progression.achievements).toHaveLength(20);
    const byId = Object.fromEntries(progression.achievements.map((a) => [a.id, a]));

    expect(byId['first-cour'].unlocked).toBe(true);
    expect(byId['every-episode-counts'].unlocked).toBe(true);
    expect(byId['changed-my-mind'].unlocked).toBe(true);
    expect(byId['studio-loyalist'].unlocked).toBe(true);
    expect(byId['foil-collector'].unlocked).toBe(true);
    expect(byId['masterpiece'].unlocked).toBe(true);
    expect(byId['high-praise'].unlocked).toBe(true);
    expect(byId['genre-explorer'].unlocked).toBe(true);
    expect(byId['cross-media-reader'].unlocked).toBe(true);
    expect(byId['steady-habit'].unlocked).toBe(true);
    expect(byId['long-runner'].unlocked).toBe(false);
    expect(progression.nearestAchievement).not.toBeNull();
    expect(progression.unlockedCount).toBe(
      progression.achievements.filter((a) => a.unlocked).length
    );
  });

  it('does not unlock First Cour for an in-progress season or Changed My Mind when diff < 2', () => {
    const streak = computeStreak([], '2026-11-12');
    const achievements = computeAchievements({
      seriesList: [
        makeSeries({
          seasons: [
            makeSeason({
              id: 1,
              status: 'WATCHING',
              progress: 14,
              total_episodes: 24,
              rating: 8,
            }),
          ],
        }),
      ],
      bookList: [],
      characterList: [],
      rewatchList: [
        makeRewatch({ id: 1, target_type: 'season', target_id: 1, season_id: 1, rating: 9 }),
      ],
      streak,
    });

    const byId = Object.fromEntries(achievements.map((a) => [a.id, a]));
    expect(byId['first-cour'].unlocked).toBe(false);
    expect(byId['changed-my-mind'].unlocked).toBe(false);
    expect(byId['every-episode-counts'].unlocked).toBe(false);
  });
});

describe('game preferences', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns default preferences when localStorage is unavailable or empty', () => {
    expect(getGamePrefs()).toEqual({ xp: true, streak: true, celebrations: true });
  });

  it('persists and merges partial updates in localStorage', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, val);
      },
    });

    expect(saveGamePrefs({ streak: false })).toEqual({
      xp: true,
      streak: false,
      celebrations: true,
    });
    expect(getGamePrefs()).toEqual({
      xp: true,
      streak: false,
      celebrations: true,
    });
  });
});
