import { describe, expect, it, vi } from 'vitest';
import { buildPaletteItems, PaletteCallbacks, PaletteSources } from './paletteSearch';
import { getStatusMeta } from '../lib/status';

const makeCallbacks = (): PaletteCallbacks => ({
  navigate: vi.fn(),
  openComposer: vi.fn(),
  openNewSeries: vi.fn(),
  openNewBook: vi.fn(),
  openNewCharacter: vi.fn(),
  openNewRewatch: vi.fn(),
  openShortcuts: vi.fn(),
  seasonDelta: vi.fn(),
  movieDelta: vi.fn(),
  bookDelta: vi.fn(),
});

const sampleSources: PaletteSources = {
  seriesList: [
    {
      id: 1,
      title: "Frieren: Beyond Journey's End",
      romaji_title: 'Sousou no Frieren',
      japanese_title: '葬送のフリーレン',
      cover_image: null,
      genres: [],
      studios: [],
      seasons: [
        {
          id: 10,
          series: 1,
          title: 'Season 1',
          season_number: 1,
          status: 'WATCHING',
          progress: 14,
          total_episodes: 28,
          rating: 10,
          start_date: null,
          finish_date: null,
          notes: 'Time moves differently when you outlive your friends.',
          studios: [],
          episode_notes: [
            {
              id: 100,
              season: 10,
              episode_number: 14,
              episode_title: 'Privilege of the Young',
              note: 'Himmel gave the lotus ring on his knees.',
              rating: 10,
              created_at: '2026-01-01',
            },
          ],
          rewatches: [],
          created_at: '2026-01-01',
        },
      ],
      movies: [],
      favorite_characters: [],
      rewatches: [],
      created_at: '2026-01-01',
    },
  ],
  bookList: [
    {
      id: 2,
      title: 'No Longer Human',
      author: 'Osamu Dazai',
      status: 'READING',
      progress: 40,
      total_pages: 176,
      rating: 9,
      start_date: null,
      finish_date: null,
      notes: 'Clowning as armor.',
      genres: [],
      created_at: '2026-01-01',
    },
  ],
  characterList: [
    {
      id: 5,
      series: 1,
      series_title: 'Attack on Titan',
      name: 'Erwin Smith',
      why: 'Give up on your dreams and charge.',
      images: [],
    },
  ],
  reflections: [
    {
      id: 'ep-100',
      kind: 'episode',
      targetKind: 'season',
      targetId: 10,
      seriesId: 1,
      title: "Frieren: Beyond Journey's End",
      context: 'S1 · Ep 14 (Privilege of the Young)',
      note: 'Himmel gave the lotus ring on his knees.',
      rating: 10,
      episodeNumber: 14,
      timestamp: 1000,
    },
  ],
};

describe('buildPaletteItems', () => {
  it('shows active watching/reading items first when query is empty', () => {
    const cb = makeCallbacks();
    const items = buildPaletteItems('', sampleSources, cb);
    expect(items[0].kind).toBe('recent');
    expect(items[0].title).toContain('Frieren');
  });

  it('finds full-text matches inside episode and title notes and links to the exact episode', () => {
    const cb = makeCallbacks();
    const items = buildPaletteItems('lotus ring', sampleSources, cb);
    const noteItem = items.find((i) => i.kind === 'note');
    expect(noteItem).toBeDefined();
    expect(noteItem?.title).toContain('lotus ring');
    noteItem?.run();
    expect(cb.navigate).toHaveBeenCalledWith('/anime/1?release=season-10&ep=14');
  });

  it('runs "+1 Frieren" action to increment the watching season', () => {
    const cb = makeCallbacks();
    const items = buildPaletteItems('+1 Frieren', sampleSources, cb);
    expect(items[0].id).toBe('action-plus-season-10');
    items[0].run();
    expect(cb.seasonDelta).toHaveBeenCalledWith(10, 1);
  });

  it('runs "write about Erwin" action to open Composer on that character', () => {
    const cb = makeCallbacks();
    const items = buildPaletteItems('write about Erwin', sampleSources, cb);
    const writeAction = items.find((i) => i.id === 'action-write-char-5');
    expect(writeAction).toBeDefined();
    writeAction?.run();
    expect(cb.openComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        targetKind: 'character',
        id: 5,
        title: 'Erwin Smith',
        defaultKind: 'why',
      })
    );
  });

  it('runs "go to Achievements" navigation action to /me', () => {
    const cb = makeCallbacks();
    const items = buildPaletteItems('achievements', sampleSources, cb);
    const navAction = items.find((i) => i.id === 'action-go-me');
    expect(navAction).toBeDefined();
    navAction?.run();
    expect(cb.navigate).toHaveBeenCalledWith('/me');
  });

  it('uses plain fan vocabulary for status labels', () => {
    expect(getStatusMeta('WATCHING').label).toBe('Watching');
    expect(getStatusMeta('READING').label).toBe('Reading');
    expect(getStatusMeta('COMPLETED').label).toBe('Completed');
    expect(getStatusMeta('PLAN_TO_WATCH').label).toBe('Plan to watch');
    expect(getStatusMeta('PLAN_TO_READ').label).toBe('Plan to read');
    expect(getStatusMeta('ON_HOLD').label).toBe('On hold');
    expect(getStatusMeta('DROPPED').label).toBe('Dropped');
  });
});
