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

export interface Folder {
  id: number;
  name: string;
  parent: number | null;
  parent_name?: string | null;
  images_count?: number;
  created_at: string;
}

export interface ImageAsset {
  id: number;
  file: string;
  url: string;
  title: string;
  alt_text?: string | null;
  folder?: number | null;
  folder_name?: string | null;
  created_at: string;
}

export interface EpisodeNote {
  id: number;
  season: number;
  season_title?: string;
  episode_number: number;
  episode_title: string | null;
  cover_image?: number | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  note: string;
  rating: number | null;
  created_at: string;
}

export type RewatchTargetType = 'series' | 'season' | 'movie' | 'episode';

export interface Rewatch {
  id: number;
  target_type: RewatchTargetType;
  target_id: number;
  release_title?: string;
  series_title?: string;
  episode_number?: number | null;
  episode_title?: string | null;
  series_id?: number | null;
  season_id?: number | null;
  movie_id?: number | null;
  // Legacy / convenience optional fields
  season?: number | null;
  movie?: number | null;
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  notes: string | null;
}

export interface FavoriteCharacter {
  id: number;
  series: number;
  series_title?: string;
  name: string;
  why: string | null;
  images?: ImageAsset[];
  image_url?: string | null;
}

export interface AnimeSeason {
  id: number;
  series: number;
  series_title?: string;
  title: string;
  season_number: number;
  cover_image?: number | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  status: AnimeStatus;
  progress: number;
  total_episodes: number | null;
  rating: number | null;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  created_at: string;
  studios: Studio[];
  episode_notes?: EpisodeNote[];
  rewatches?: Rewatch[];
}

export interface AnimeMovie {
  id: number;
  series: number;
  series_title?: string;
  title: string;
  cover_image?: number | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  status: AnimeStatus;
  progress_minutes: number;
  total_minutes: number | null;
  rating: number | null;
  start_date: string | null;
  finish_date: string | null;
  notes: string | null;
  created_at: string;
  studios: Studio[];
  rewatches?: Rewatch[];
}

export interface AnimeSeries {
  id: number;
  title: string;
  japanese_title?: string | null;
  romaji_title?: string | null;
  cover_image?: number | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  created_at: string;
  genres: Genre[];
  studios: Studio[];
  seasons: AnimeSeason[];
  movies: AnimeMovie[];
  favorite_characters?: FavoriteCharacter[];
  rewatches?: Rewatch[];
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  cover_image?: number | null;
  cover_image_url?: string | null;
  image_url?: string | null;
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

export type ActiveTab = 'dashboard' | 'anime' | 'books' | 'characters' | 'rewatches' | 'media';

export interface JournalStats {
  activeWatching: number;
  activeReading: number;
  totalCompleted: number;
  totalLessons: number;
  rewatchesCount: number;
  charactersCount: number;
}
