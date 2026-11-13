import type { ActivityEvent, Book, BookStatus } from '../../types';
import { nextBookState } from '../../lib/journal/progress';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/;

export type BookViewMode = 'grid' | 'list' | 'year' | 'fame';
export type BookSort = 'recent' | 'rating' | 'title' | 'author' | 'note';
export type BookStatusFilter = 'ALL' | BookStatus;

export const BOOK_STATUS_DEFS: readonly { id: BookStatusFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'READING', label: 'Reading' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PLAN_TO_READ', label: 'Plan to read' },
  { id: 'ON_HOLD', label: 'On hold' },
  { id: 'DROPPED', label: 'Dropped' },
] as const;

export interface BookStatusCount {
  id: BookStatusFilter;
  label: string;
  count: number;
}

export interface BookOptionalMeta {
  updated_at?: string | null;
  year?: number | string | null;
  published_year?: number | string | null;
  isbn?: string | null;
  publisher?: string | null;
  synopsis?: string | null;
  description?: string | null;
}

export type BookWithOptionalMeta = Book & BookOptionalMeta;

export interface BookItem {
  book: BookWithOptionalMeta;
  coverUrl: string | null;
  year: number | null;
  yearLabel: string;
  progressPercent: number;
  remainingPages: number | null;
  progressLabel: string;
  hasNote: boolean;
  isHallOfFame: boolean;
  lastActivityMs: number;
  genreIds: number[];
  genreNames: string[];
}

export interface BookFilters {
  status?: BookStatusFilter;
  genreId?: number | 'ALL' | null;
  q?: string;
  sort?: BookSort;
}

export interface BookYearGroup {
  yearLabel: string;
  items: BookItem[];
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const dateOnly = DATE_ONLY_RE.exec(trimmed);
  if (dateOnly) {
    return Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseYearFromValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value >= 1900 && value <= 2100 ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = YEAR_RE.exec(trimmed);
  if (!match) return null;
  const yr = Number(match[1]);
  return yr >= 1900 && yr <= 2100 ? yr : null;
}

/** Resolves the best cover URL available for a book. */
export function bookCoverUrl(book: Pick<Book, 'cover_image_url' | 'image_url'>): string | null {
  return book.cover_image_url || book.image_url || null;
}

/** Computes 0–100 reading progress percentage, treating completed books without total_pages as 100%. */
export function bookProgressPercent(
  book: Pick<Book, 'progress' | 'total_pages' | 'status'>,
): number {
  const current = Math.max(0, book.progress || 0);
  if (book.total_pages && book.total_pages > 0) {
    return Math.min(100, Math.round((current / book.total_pages) * 100));
  }
  return book.status === 'COMPLETED' ? 100 : 0;
}

/** Returns remaining pages when total_pages is known, otherwise null. */
export function bookRemainingPages(book: Pick<Book, 'progress' | 'total_pages'>): number | null {
  if (!book.total_pages || book.total_pages <= 0) return null;
  return Math.max(0, book.total_pages - Math.max(0, book.progress || 0));
}

/** Formats concise page progress text such as "120 / 340 pages" or "120 pages". */
export function bookProgressLabel(book: Pick<Book, 'progress' | 'total_pages'>): string {
  const current = Math.max(0, book.progress || 0);
  if (book.total_pages && book.total_pages > 0) {
    return `${current} / ${book.total_pages} pages`;
  }
  return `${current} ${current === 1 ? 'page' : 'pages'}`;
}

/** Extracts a display year from finish_date, start_date, or year/published_year (never created_at). */
export function bookYear(book: BookWithOptionalMeta): number | null {
  return (
    parseYearFromValue(book.finish_date) ??
    parseYearFromValue(book.start_date) ??
    parseYearFromValue(book.year) ??
    parseYearFromValue(book.published_year)
  );
}

/** Formats a book's year or "Undated" when no date/year metadata is set. */
export function bookYearLabel(book: BookWithOptionalMeta): string {
  const yr = bookYear(book);
  return yr !== null ? String(yr) : 'Undated';
}

/** Clamps a page progress delta so +10p/-10p cleanly finishes or rewinds to bounds. */
export function clampedBookDelta(
  book: Pick<Book, 'progress' | 'total_pages'>,
  delta: number,
): number {
  const current = Math.max(0, book.progress || 0);
  if (delta > 0) {
    if (book.total_pages != null && book.total_pages > 0) {
      if (current >= book.total_pages) return 0;
      return Math.min(delta, book.total_pages - current);
    }
    return delta;
  }
  if (delta < 0) {
    if (current <= 0) return 0;
    return -Math.min(Math.abs(delta), current);
  }
  return 0;
}

/** Checks whether stepping by exact `delta` is valid under optimistic progress rules. */
export function canStepBookProgress(book: Book | null | undefined, delta: number): boolean {
  if (!book) return false;
  return nextBookState(book, delta) !== null;
}

/** Collects exact status counts across ALL and every BookStatus value. */
export function collectBookStatusCounts(books: readonly Book[]): BookStatusCount[] {
  const counts = new Map<BookStatus, number>();
  for (const book of books) {
    counts.set(book.status, (counts.get(book.status) ?? 0) + 1);
  }
  return BOOK_STATUS_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    count: def.id === 'ALL' ? books.length : (counts.get(def.id) ?? 0),
  }));
}

function buildBookActivityIndex(activityList: readonly ActivityEvent[]): Map<number, number> {
  const index = new Map<number, number>();
  for (const event of activityList) {
    if (event.target_type !== 'book') continue;
    const ts = parseTimestamp(event.created_at);
    if (ts <= 0) continue;
    const prev = index.get(event.target_id) ?? 0;
    if (ts > prev) index.set(event.target_id, ts);
  }
  return index;
}

/** Builds enriched BookItem records with cached progress, year, notes, and activity timestamps. */
export function buildBookItems(
  books: readonly BookWithOptionalMeta[],
  activityList: readonly ActivityEvent[] = [],
): BookItem[] {
  const activityIndex = buildBookActivityIndex(activityList);

  return books.map((book) => {
    const year = bookYear(book);
    const activityMs = activityIndex.get(book.id) ?? 0;
    const updatedAtMs = parseTimestamp(book.updated_at);
    const dateFallbackMs = Math.max(
      parseTimestamp(book.finish_date),
      parseTimestamp(book.start_date),
      parseTimestamp(book.created_at),
    );
    const lastActivityMs = Math.max(activityMs, updatedAtMs) || dateFallbackMs;

    const genreIds: number[] = [];
    const genreNames: string[] = [];
    for (const g of book.genres ?? []) {
      genreIds.push(g.id);
      if (g.name) genreNames.push(g.name);
    }

    return {
      book,
      coverUrl: bookCoverUrl(book),
      year,
      yearLabel: year !== null ? String(year) : 'Undated',
      progressPercent: bookProgressPercent(book),
      remainingPages: bookRemainingPages(book),
      progressLabel: bookProgressLabel(book),
      hasNote: Boolean(book.notes?.trim()),
      isHallOfFame: book.rating === 10,
      lastActivityMs,
      genreIds,
      genreNames,
    };
  });
}

/** Checks whether a BookItem matches the active genre filter and search query (title, author, notes, genres). */
export function matchesBookFacetAndQuery(
  item: BookItem,
  filters: Pick<BookFilters, 'genreId' | 'q'>,
): boolean {
  if (filters.genreId != null && filters.genreId !== 'ALL') {
    if (!item.genreIds.includes(filters.genreId)) return false;
  }

  const query = filters.q?.trim().toLowerCase();
  if (query) {
    const matches =
      item.book.title.toLowerCase().includes(query) ||
      (item.book.author?.toLowerCase().includes(query) ?? false) ||
      (item.book.notes?.toLowerCase().includes(query) ?? false) ||
      item.genreNames.some((name) => name.toLowerCase().includes(query));
    if (!matches) return false;
  }

  return true;
}

/** Filters and sorts book items without mutating the input array. */
export function filterAndSortBooks(
  items: readonly BookItem[],
  filters: BookFilters = {},
): BookItem[] {
  const status = filters.status ?? 'ALL';
  const sort = filters.sort ?? 'recent';

  const filtered = items.filter((item) => {
    if (status !== 'ALL' && item.book.status !== status) return false;
    return matchesBookFacetAndQuery(item, filters);
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'rating') {
      const ratingDiff = (b.book.rating ?? -1) - (a.book.rating ?? -1);
      if (ratingDiff !== 0) return ratingDiff;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'title') {
      return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'author') {
      const authorA = a.book.author?.trim() ?? '';
      const authorB = b.book.author?.trim() ?? '';
      if (authorA && !authorB) return -1;
      if (!authorA && authorB) return 1;
      if (authorA && authorB) {
        const cmp = authorA.localeCompare(authorB, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
      }
      return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
    }
    if (sort === 'note') {
      const noteDiff = (b.hasNote ? 1 : 0) - (a.hasNote ? 1 : 0);
      if (noteDiff !== 0) return noteDiff;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
    }
    // Default: 'recent'
    if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
    return b.book.id - a.book.id;
  });
}

/** Groups books by year in descending order with "Undated" at the end. */
export function groupBooksByYear(items: readonly BookItem[]): BookYearGroup[] {
  const dated = new Map<number, BookItem[]>();
  const undated: BookItem[] = [];

  for (const item of items) {
    if (item.year === null) {
      undated.push(item);
    } else {
      const bucket = dated.get(item.year);
      if (bucket) bucket.push(item);
      else dated.set(item.year, [item]);
    }
  }

  const years = Array.from(dated.keys()).sort((a, b) => b - a);
  const groups: BookYearGroup[] = years.map((yr) => ({
    yearLabel: String(yr),
    items: dated.get(yr) ?? [],
  }));

  if (undated.length > 0) {
    groups.push({ yearLabel: 'Undated', items: undated });
  }

  return groups;
}

/** Selects 10/10 Hall of Fame books sorted by latest activity then title. */
export function selectBookHallOfFame(items: readonly BookItem[]): BookItem[] {
  return items
    .filter((item) => item.isHallOfFame)
    .sort((a, b) => {
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.book.title.localeCompare(b.book.title, undefined, { sensitivity: 'base' });
    });
}
