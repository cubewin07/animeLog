import { describe, expect, it } from 'vitest';
import {
  bookProgressLabel,
  bookProgressPercent,
  bookRemainingPages,
  bookYear,
  bookYearLabel,
  buildBookItems,
  canStepBookProgress,
  clampedBookDelta,
  collectBookStatusCounts,
  filterAndSortBooks,
  groupBooksByYear,
  selectBookHallOfFame,
  type BookWithOptionalMeta,
} from './booksUtils';
import type { ActivityEvent, Book } from '../../types';

const makeBook = (fields: Partial<BookWithOptionalMeta> = {}): BookWithOptionalMeta => ({
  id: 1,
  title: 'Meditations',
  author: 'Marcus Aurelius',
  status: 'READING',
  rating: null,
  progress: 0,
  total_pages: 256,
  start_date: null,
  finish_date: null,
  notes: null,
  created_at: '2026-10-01T00:00:00Z',
  genres: [],
  ...fields,
});

const makeEvent = (fields: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: 1,
  kind: 'BOOK_PROGRESS',
  target_type: 'book',
  target_id: 1,
  title: 'Meditations',
  delta: 10,
  backfilled: false,
  created_at: '2026-11-10T12:00:00Z',
  ...fields,
});

describe('collectBookStatusCounts', () => {
  it('collects exact counts for ALL and every BookStatus', () => {
    const books: Book[] = [
      makeBook({ id: 1, status: 'READING' }),
      makeBook({ id: 2, status: 'READING' }),
      makeBook({ id: 3, status: 'COMPLETED' }),
      makeBook({ id: 4, status: 'PLAN_TO_READ' }),
      makeBook({ id: 5, status: 'ON_HOLD' }),
      makeBook({ id: 6, status: 'DROPPED' }),
    ];

    expect(collectBookStatusCounts(books)).toEqual([
      { id: 'ALL', label: 'All', count: 6 },
      { id: 'READING', label: 'Reading', count: 2 },
      { id: 'COMPLETED', label: 'Completed', count: 1 },
      { id: 'PLAN_TO_READ', label: 'Plan to read', count: 1 },
      { id: 'ON_HOLD', label: 'On hold', count: 1 },
      { id: 'DROPPED', label: 'Dropped', count: 1 },
    ]);
  });

  it('returns zeroes for an empty library', () => {
    expect(collectBookStatusCounts([]).map((entry) => entry.count)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('page progress helpers', () => {
  it('computes bookProgressPercent, bookRemainingPages, and bookProgressLabel cleanly', () => {
    const mid = makeBook({ progress: 120, total_pages: 340, status: 'READING' });
    expect(bookProgressPercent(mid)).toBe(35);
    expect(bookRemainingPages(mid)).toBe(220);
    expect(bookProgressLabel(mid)).toBe('120 / 340 pages');

    const overflow = makeBook({ progress: 400, total_pages: 340, status: 'COMPLETED' });
    expect(bookProgressPercent(overflow)).toBe(100);
    expect(bookRemainingPages(overflow)).toBe(0);

    const unknownTotalCompleted = makeBook({ progress: 180, total_pages: null, status: 'COMPLETED' });
    expect(bookProgressPercent(unknownTotalCompleted)).toBe(100);
    expect(bookRemainingPages(unknownTotalCompleted)).toBeNull();
    expect(bookProgressLabel(unknownTotalCompleted)).toBe('180 pages');

    const singlePage = makeBook({ progress: 1, total_pages: null, status: 'READING' });
    expect(bookProgressPercent(singlePage)).toBe(0);
    expect(bookProgressLabel(singlePage)).toBe('1 page');
  });

  it('clamps page deltas and checks step bounds', () => {
    const nearEnd = makeBook({ progress: 335, total_pages: 340, status: 'READING' });
    expect(clampedBookDelta(nearEnd, 10)).toBe(5);
    expect(clampedBookDelta(nearEnd, -10)).toBe(-10);
    expect(canStepBookProgress(nearEnd, 10)).toBe(false);
    expect(canStepBookProgress(nearEnd, 5)).toBe(true);
    expect(canStepBookProgress(nearEnd, 1)).toBe(true);

    const nearStart = makeBook({ progress: 4, total_pages: 340, status: 'READING' });
    expect(clampedBookDelta(nearStart, -10)).toBe(-4);
    expect(canStepBookProgress(nearStart, -10)).toBe(false);
    expect(canStepBookProgress(nearStart, -4)).toBe(true);

    const atZero = makeBook({ progress: 0, total_pages: null, status: 'PLAN_TO_READ' });
    expect(clampedBookDelta(atZero, -10)).toBe(0);
    expect(clampedBookDelta(atZero, 10)).toBe(10);
    expect(canStepBookProgress(atZero, 10)).toBe(true);
    expect(canStepBookProgress(null, 10)).toBe(false);
  });
});

describe('year extraction', () => {
  it('prefers finish_date, then start_date, then year, and falls back to Undated without reading created_at', () => {
    const byFinish = makeBook({
      finish_date: '2025-02-14',
      start_date: '2024-12-01',
      year: 2020,
    });
    const byStart = makeBook({
      finish_date: null,
      start_date: '2024-11-05',
      year: 2020,
    });
    const byYear = makeBook({
      finish_date: null,
      start_date: null,
      year: 1998,
    });
    const byPublishedYearString = makeBook({
      finish_date: null,
      start_date: null,
      published_year: 'First published 2016',
    });
    const undated = makeBook({
      finish_date: null,
      start_date: null,
      year: null,
      created_at: '2026-11-01T00:00:00Z',
    });

    expect(bookYear(byFinish)).toBe(2025);
    expect(bookYearLabel(byFinish)).toBe('2025');
    expect(bookYear(byStart)).toBe(2024);
    expect(bookYear(byYear)).toBe(1998);
    expect(bookYear(byPublishedYearString)).toBe(2016);
    expect(bookYear(undated)).toBeNull();
    expect(bookYearLabel(undated)).toBe('Undated');
  });
});

describe('buildBookItems & filterAndSortBooks', () => {
  const sampleBooks = (): BookWithOptionalMeta[] => [
    makeBook({
      id: 1,
      title: 'Dune',
      author: 'Frank Herbert',
      status: 'COMPLETED',
      rating: 10,
      progress: 412,
      total_pages: 412,
      finish_date: '2024-06-15',
      notes: 'Fear is the mind-killer.',
      genres: [{ id: 1, name: 'Sci-Fi' }],
    }),
    makeBook({
      id: 2,
      title: 'Atomic Habits',
      author: 'James Clear',
      status: 'READING',
      rating: 8,
      progress: 120,
      total_pages: 320,
      start_date: '2025-01-10',
      notes: '   ',
      genres: [{ id: 2, name: 'Psychology' }],
    }),
    makeBook({
      id: 3,
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      status: 'PLAN_TO_READ',
      rating: null,
      progress: 0,
      total_pages: 310,
      notes: null,
      genres: [{ id: 3, name: 'Fantasy' }],
    }),
    makeBook({
      id: 4,
      title: 'Anonymous Folktales',
      author: null,
      status: 'COMPLETED',
      rating: 10,
      progress: 150,
      total_pages: 150,
      finish_date: '2023-03-20',
      notes: 'Oral traditions adapt across generations.',
      genres: [{ id: 3, name: 'Fantasy' }],
    }),
  ];

  const sampleEvents: ActivityEvent[] = [
    makeEvent({ id: 1, target_type: 'book', target_id: 2, created_at: '2026-11-12T09:00:00Z' }),
    makeEvent({ id: 2, target_type: 'book', target_id: 1, created_at: '2026-11-10T09:00:00Z' }),
    makeEvent({ id: 3, target_type: 'season', target_id: 2, created_at: '2026-11-15T09:00:00Z' }),
  ];

  it('ignores non-book activity events and whitespace-only notes', () => {
    const items = buildBookItems(sampleBooks(), sampleEvents);
    const dune = items.find((i) => i.book.id === 1)!;
    const atomic = items.find((i) => i.book.id === 2)!;

    expect(dune.hasNote).toBe(true);
    expect(dune.isHallOfFame).toBe(true);
    expect(atomic.hasNote).toBe(false);
    expect(atomic.lastActivityMs).toBe(Date.parse('2026-11-12T09:00:00Z'));
  });

  it('filters by status, genreId, and search query across title, author, notes, and genre names', () => {
    const items = buildBookItems(sampleBooks(), sampleEvents);

    expect(filterAndSortBooks(items, { status: 'READING' }).map((i) => i.book.id)).toEqual([2]);
    expect(filterAndSortBooks(items, { genreId: 3 }).map((i) => i.book.id)).toEqual([4, 3]);
    expect(filterAndSortBooks(items, { q: 'dune' }).map((i) => i.book.id)).toEqual([1]);
    expect(filterAndSortBooks(items, { q: 'james clear' }).map((i) => i.book.id)).toEqual([2]);
    expect(filterAndSortBooks(items, { q: 'mind-killer' }).map((i) => i.book.id)).toEqual([1]);
    expect(filterAndSortBooks(items, { q: 'fantasy' }).map((i) => i.book.id)).toEqual([4, 3]);
  });

  it('sorts by recent, rating, title, author, and note without mutating input', () => {
    const items = buildBookItems(sampleBooks(), sampleEvents);
    const originalOrder = items.map((i) => i.book.id);

    expect(filterAndSortBooks(items, { sort: 'recent' }).map((i) => i.book.id)).toEqual([2, 1, 4, 3]);
    expect(filterAndSortBooks(items, { sort: 'rating' }).map((i) => i.book.id)).toEqual([1, 4, 2, 3]);
    expect(filterAndSortBooks(items, { sort: 'title' }).map((i) => i.book.id)).toEqual([4, 2, 1, 3]);
    expect(filterAndSortBooks(items, { sort: 'author' }).map((i) => i.book.id)).toEqual([1, 3, 2, 4]);
    expect(filterAndSortBooks(items, { sort: 'note' }).map((i) => i.book.id)).toEqual([1, 4, 2, 3]);

    expect(items.map((i) => i.book.id)).toEqual(originalOrder);
  });
});

describe('groupBooksByYear & selectBookHallOfFame', () => {
  it('groups books descending by year with Undated last', () => {
    const items = buildBookItems([
      makeBook({ id: 1, title: 'Old', finish_date: '2021-05-01' }),
      makeBook({ id: 2, title: 'No Date', finish_date: null, start_date: null }),
      makeBook({ id: 3, title: 'New', finish_date: '2025-03-01' }),
      makeBook({ id: 4, title: 'Mid', start_date: '2024-02-01' }),
    ]);

    const groups = groupBooksByYear(items);
    expect(groups.map((g) => g.yearLabel)).toEqual(['2025', '2024', '2021', 'Undated']);
    expect(groups[3].items.map((i) => i.book.title)).toEqual(['No Date']);
  });

  it('selects only rating === 10 books for Hall of Fame ordered by recent activity then title', () => {
    const items = buildBookItems(
      [
        makeBook({ id: 1, title: 'Beta', rating: 10 }),
        makeBook({ id: 2, title: 'Nine', rating: 9 }),
        makeBook({ id: 3, title: 'Alpha', rating: 10 }),
        makeBook({ id: 4, title: 'Latest Ten', rating: 10 }),
      ],
      [
        makeEvent({ id: 1, target_type: 'book', target_id: 4, created_at: '2026-11-12T10:00:00Z' }),
        makeEvent({ id: 2, target_type: 'book', target_id: 1, created_at: '2026-11-10T10:00:00Z' }),
        makeEvent({ id: 3, target_type: 'book', target_id: 3, created_at: '2026-11-10T10:00:00Z' }),
      ],
    );

    expect(selectBookHallOfFame(items).map((i) => i.book.title)).toEqual([
      'Latest Ten',
      'Alpha',
      'Beta',
    ]);
  });
});
