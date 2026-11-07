import type { AnimeSeries, Book, FavoriteCharacter, Genre, JournalStats, Rewatch, Studio } from '../types';

export interface JournalSnapshot {
  seriesList: AnimeSeries[];
  bookList: Book[];
  rewatchList: Rewatch[];
  characterList: FavoriteCharacter[];
  genres: Genre[];
  studios: Studio[];
  stats: JournalStats;
}

// Bump the version when the shape changes, so old copies are ignored instead of crashing a page.
const KEY = 'animelog_snapshot_v1';

/** The last journal seen on this device, so the app can draw instantly while it refreshes. */
export function loadSnapshot(): JournalSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as JournalSnapshot;
    return Array.isArray(snapshot.seriesList) && Array.isArray(snapshot.bookList) ? snapshot : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: JournalSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // A full or blocked store only costs the instant start on the next visit.
  }
}
