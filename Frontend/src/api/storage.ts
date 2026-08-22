import {
  INITIAL_BOOKS,
  INITIAL_GENRES,
  INITIAL_SERIES,
  INITIAL_STUDIOS,
} from './mockData';
import { AnimeSeries, Book, Genre, Studio } from '../types';

const STORAGE_KEYS = {
  SERIES: 'animelog_series_v2',
  BOOKS: 'animelog_books_v1',
  GENRES: 'animelog_genres_v1',
  STUDIOS: 'animelog_studios_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage for key: ${key}`, err);
  }
}

export const storage = {
  getSeries(): AnimeSeries[] {
    return getItem<AnimeSeries[]>(STORAGE_KEYS.SERIES, INITIAL_SERIES);
  },
  saveSeries(items: AnimeSeries[]): void {
    setItem(STORAGE_KEYS.SERIES, items);
  },

  getBooks(): Book[] {
    return getItem<Book[]>(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
  },
  saveBooks(items: Book[]): void {
    setItem(STORAGE_KEYS.BOOKS, items);
  },

  getGenres(): Genre[] {
    return getItem<Genre[]>(STORAGE_KEYS.GENRES, INITIAL_GENRES);
  },
  saveGenres(items: Genre[]): void {
    setItem(STORAGE_KEYS.GENRES, items);
  },

  getStudios(): Studio[] {
    return getItem<Studio[]>(STORAGE_KEYS.STUDIOS, INITIAL_STUDIOS);
  },
  saveStudios(items: Studio[]): void {
    setItem(STORAGE_KEYS.STUDIOS, items);
  },

  resetDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.SERIES);
    localStorage.removeItem('animelog_anime_v1');
    localStorage.removeItem('animelog_rewatches_v1');
    localStorage.removeItem('animelog_characters_v1');
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.GENRES);
    localStorage.removeItem(STORAGE_KEYS.STUDIOS);
  },
};
