import { describe, expect, it } from 'vitest';
import type { AnimeSeries, Book, FavoriteCharacter } from '../../types';
import { buildFindArtItems, summarizeFindArt } from './findArtQueue';

const baseSeries: AnimeSeries[] = [
  {
    id: 1,
    title: 'Frieren',
    romaji_title: 'Sousou no Frieren',
    japanese_title: '葬送のフリーレン',
    cover_image: null,
    cover_image_url: null,
    created_at: '2026-01-01',
    genres: [],
    studios: [],
    seasons: [
      {
        id: 11,
        series: 1,
        title: 'Season 1',
        season_number: 1,
        cover_image_url: null,
        status: 'WATCHING',
        progress: 10,
        total_episodes: 28,
        rating: 10,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
      {
        id: 12,
        series: 1,
        title: 'Season 2',
        season_number: 2,
        cover_image_url: 'https://cdn.example.com/s2.jpg',
        status: 'PLAN_TO_WATCH',
        progress: 0,
        total_episodes: 12,
        rating: null,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
      {
        id: 13,
        series: 1,
        title: 'Frieren: Beyond Journey Arc',
        season_number: 3,
        cover_image_url: null,
        status: 'PLAN_TO_WATCH',
        progress: 0,
        total_episodes: null,
        rating: null,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
      {
        id: 14,
        series: 1,
        title: 'Golden Land Arc',
        season_number: 4,
        cover_image_url: null,
        status: 'PLAN_TO_WATCH',
        progress: 0,
        total_episodes: null,
        rating: null,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
    ],
    movies: [
      {
        id: 21,
        series: 1,
        title: 'Frieren: The Movie',
        cover_image_url: null,
        status: 'PLAN_TO_WATCH',
        progress_minutes: 0,
        total_minutes: 120,
        rating: null,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
      {
        id: 22,
        series: 1,
        title: 'Journey Memories',
        image_url: 'https://cdn.example.com/movie.jpg',
        status: 'COMPLETED',
        progress_minutes: 90,
        total_minutes: 90,
        rating: 9,
        start_date: null,
        finish_date: null,
        notes: null,
        created_at: '2026-01-01',
        studios: [],
      },
    ],
  },
  {
    id: 2,
    title: 'Vinland Saga',
    romaji_title: null,
    cover_image_url: 'https://cdn.example.com/vinland.jpg',
    created_at: '2026-01-01',
    genres: [],
    studios: [],
    seasons: [],
    movies: [],
  },
];

const baseBooks: Book[] = [
  {
    id: 31,
    title: 'No Longer Human',
    author: 'Osamu Dazai',
    cover_image_url: null,
    status: 'READING',
    rating: 9,
    progress: 45,
    total_pages: 176,
    start_date: null,
    finish_date: null,
    notes: null,
    created_at: '2026-01-01',
    genres: [],
  },
  {
    id: 32,
    title: 'Meditations',
    author: null,
    cover_image_url: 'https://cdn.example.com/meditations.jpg',
    status: 'COMPLETED',
    rating: 10,
    progress: 200,
    total_pages: 200,
    start_date: null,
    finish_date: null,
    notes: null,
    created_at: '2026-01-01',
    genres: [],
  },
];

const baseCharacters: FavoriteCharacter[] = [
  {
    id: 41,
    series: 1,
    series_title: 'Frieren',
    name: 'Himmel',
    why: 'Remembered for small kindnesses.',
    cover_image_url: null,
    images: [],
  },
  {
    id: 42,
    series: 2,
    name: 'Thorfinn',
    why: 'A true warrior needs no sword.',
    cover_image_url: null,
    images: [
      {
        id: 99,
        file: '/media/thorfinn.jpg',
        url: 'https://cdn.example.com/thorfinn.jpg',
        title: 'Thorfinn',
        created_at: '2026-01-01',
      },
    ],
  },
];

describe('buildFindArtItems', () => {
  const items = buildFindArtItems({
    seriesList: baseSeries,
    bookList: baseBooks,
    characterList: baseCharacters,
  });

  it('includes all series, seasons, movies, books, and characters', () => {
    expect(items).toHaveLength(12);
    expect(items.map((i) => i.uid)).toEqual([
      'series-1',
      'season-11',
      'season-12',
      'season-13',
      'season-14',
      'movie-21',
      'movie-22',
      'series-2',
      'book-31',
      'book-32',
      'character-41',
      'character-42',
    ]);
  });

  it('computes smart defaultQuery values for every kind', () => {
    const byUid = Object.fromEntries(items.map((item) => [item.uid, item]));

    // Series prefers romaji_title, falls back to title
    expect(byUid['series-1'].defaultQuery).toBe('Sousou no Frieren');
    expect(byUid['series-2'].defaultQuery).toBe('Vinland Saga');

    // Season 1 generic strips "Season 1"
    expect(byUid['season-11'].defaultQuery).toBe('Frieren');
    // Season > 1 generic keeps "Season N"
    expect(byUid['season-12'].defaultQuery).toBe('Frieren Season 2');
    // Season title containing series title is used directly
    expect(byUid['season-13'].defaultQuery).toBe('Frieren: Beyond Journey Arc');
    // Season title not containing series title prepends series title
    expect(byUid['season-14'].defaultQuery).toBe('Frieren Golden Land Arc');

    // Movie containing series title is used directly; otherwise prepends series title
    expect(byUid['movie-21'].defaultQuery).toBe('Frieren: The Movie');
    expect(byUid['movie-22'].defaultQuery).toBe('Frieren Journey Memories');

    // Book appends author when present
    expect(byUid['book-31'].defaultQuery).toBe('No Longer Human Osamu Dazai');
    expect(byUid['book-32'].defaultQuery).toBe('Meditations');

    // Character uses name
    expect(byUid['character-41'].defaultQuery).toBe('Himmel');
  });

  it('assigns folderName, href, seriesId, and hasArt accurately', () => {
    const byUid = Object.fromEntries(items.map((item) => [item.uid, item]));

    expect(byUid['series-1']).toMatchObject({
      folderName: 'Anime Covers',
      href: '/anime/1',
      seriesId: 1,
      hasArt: false,
      currentImageUrl: null,
    });

    expect(byUid['season-11']).toMatchObject({
      folderName: 'Anime Covers',
      href: '/anime/1?release=season-11',
      seriesId: 1,
      hasArt: false,
    });

    expect(byUid['season-12'].hasArt).toBe(true);
    expect(byUid['season-12'].currentImageUrl).toBe('https://cdn.example.com/s2.jpg');

    expect(byUid['movie-22']).toMatchObject({
      folderName: 'Anime Covers',
      href: '/anime/1?release=movie-22',
      seriesId: 1,
      hasArt: true,
      currentImageUrl: 'https://cdn.example.com/movie.jpg',
    });

    expect(byUid['book-31']).toMatchObject({
      folderName: 'Book Covers',
      href: '/books/31',
      hasArt: false,
    });
    expect(byUid['book-31'].seriesId).toBeUndefined();

    expect(byUid['character-41']).toMatchObject({
      folderName: 'Character Portraits',
      href: '/characters/41',
      seriesId: 1,
      hasArt: false,
    });

    // Character with images[0] counts as having art
    expect(byUid['character-42']).toMatchObject({
      folderName: 'Character Portraits',
      href: '/characters/42',
      seriesId: 2,
      hasArt: true,
      currentImageUrl: 'https://cdn.example.com/thorfinn.jpg',
    });
  });
});

describe('summarizeFindArt', () => {
  it('counts total, missing, saved, and per-kind breakdowns', () => {
    const items = buildFindArtItems({
      seriesList: baseSeries,
      bookList: baseBooks,
      characterList: baseCharacters,
    });

    const summary = summarizeFindArt(items);

    expect(summary).toEqual({
      total: 12,
      missing: 7,
      saved: 5,
      byKind: {
        series: { total: 2, missing: 1, saved: 1 },
        season: { total: 4, missing: 3, saved: 1 },
        movie: { total: 2, missing: 1, saved: 1 },
        book: { total: 2, missing: 1, saved: 1 },
        character: { total: 2, missing: 1, saved: 1 },
      },
    });
  });

  it('handles empty inputs cleanly', () => {
    const empty = summarizeFindArt(
      buildFindArtItems({ seriesList: [], bookList: [], characterList: [] })
    );
    expect(empty).toEqual({
      total: 0,
      missing: 0,
      saved: 0,
      byKind: {
        series: { total: 0, missing: 0, saved: 0 },
        season: { total: 0, missing: 0, saved: 0 },
        movie: { total: 0, missing: 0, saved: 0 },
        book: { total: 0, missing: 0, saved: 0 },
        character: { total: 0, missing: 0, saved: 0 },
      },
    });
  });
});
