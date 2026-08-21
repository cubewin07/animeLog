export type AnimeStatus =
  | 'WATCHING'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'DROPPED'
  | 'PLAN_TO_WATCH';

export type BookStatus =
  | 'READING'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'DROPPED'
  | 'PLAN_TO_READ';

export interface Genre {
  id: number;
  name: string;
}

export interface Studio {
  id: number;
  name: string;
}

export interface Rewatch {
  id: number;
  anime: number;
  anime_title?: string;
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  notes: string | null;
}

export interface FavoriteCharacter {
  id: number;
  anime: number;
  anime_title?: string;
  name: string;
  why: string | null;
}

export interface Anime {
  id: number;
  title: string;
  status: AnimeStatus;
  rating: number | null;
  progress: number;
  total_episodes: number | null;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  created_at: string;
  genres: Genre[];
  studios: Studio[];
  rewatches?: Rewatch[];
  favorite_characters?: FavoriteCharacter[];
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  status: BookStatus;
  rating: number | null;
  progress: number;
  total_pages: number | null;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  created_at: string;
  genres: Genre[];
}

export type ActiveTab = 'dashboard' | 'anime' | 'books' | 'characters' | 'rewatches';

export interface JournalStats {
  activeWatching: number;
  activeReading: number;
  totalCompleted: number;
  totalLessons: number;
  rewatchesCount: number;
  charactersCount: number;
}
