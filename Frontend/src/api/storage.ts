import {
  INITIAL_ANIME,
  INITIAL_BOOKS,
  INITIAL_CHARACTERS,
  INITIAL_GENRES,
  INITIAL_REWATCHES,
  INITIAL_STUDIOS,
} from './mockData';
import { Anime, Book, FavoriteCharacter, Genre, Rewatch, Studio } from '../types';

const STORAGE_KEYS = {
  ANIME: 'animelog_anime_v1',
  BOOKS: 'animelog_books_v1',
  REWATCHES: 'animelog_rewatches_v1',
  CHARACTERS: 'animelog_characters_v1',
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
  getAnime(): Anime[] {
    return getItem<Anime[]>(STORAGE_KEYS.ANIME, INITIAL_ANIME);
  },
  saveAnime(items: Anime[]): void {
    setItem(STORAGE_KEYS.ANIME, items);
  },

  getBooks(): Book[] {
    return getItem<Book[]>(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
  },
  saveBooks(items: Book[]): void {
    setItem(STORAGE_KEYS.BOOKS, items);
  },

  getRewatches(): Rewatch[] {
    return getItem<Rewatch[]>(STORAGE_KEYS.REWATCHES, INITIAL_REWATCHES);
  },
  saveRewatches(items: Rewatch[]): void {
    setItem(STORAGE_KEYS.REWATCHES, items);
  },

  getCharacters(): FavoriteCharacter[] {
    return getItem<FavoriteCharacter[]>(STORAGE_KEYS.CHARACTERS, INITIAL_CHARACTERS);
  },
  saveCharacters(items: FavoriteCharacter[]): void {
    setItem(STORAGE_KEYS.CHARACTERS, items);
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
    localStorage.removeItem(STORAGE_KEYS.ANIME);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.REWATCHES);
    localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
    localStorage.removeItem(STORAGE_KEYS.GENRES);
    localStorage.removeItem(STORAGE_KEYS.STUDIOS);
  },
};
