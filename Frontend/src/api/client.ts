import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  EpisodeNote,
  FavoriteCharacter,
  Folder,
  Genre,
  ImageAsset,
  JournalStats,
  Rewatch,
  RewatchTargetType,
  Studio,
} from '../types';

const API_BASE = '/api';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

function withQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export const folderApi = {
  async list(params?: { parent?: number | string }): Promise<Folder[]> {
    return fetchJson<Folder[]>(`${API_BASE}/folders/${withQuery(params)}`);
  },

  async create(data: { name: string; parent?: number | null }): Promise<Folder> {
    return fetchJson<Folder>(`${API_BASE}/folders/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/folders/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const imageApi = {
  async list(params?: { folder?: number | string; search?: string }): Promise<ImageAsset[]> {
    return fetchJson<ImageAsset[]>(`${API_BASE}/images/${withQuery(params)}`);
  },

  async get(id: number): Promise<ImageAsset> {
    return fetchJson<ImageAsset>(`${API_BASE}/images/${id}/`);
  },

  async upload(
    file: File,
    options?: { folder?: number | null; title?: string; alt_text?: string }
  ): Promise<ImageAsset> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder !== undefined && options.folder !== null) {
      formData.append('folder', String(options.folder));
    }
    if (options?.title) {
      formData.append('title', options.title);
    }
    if (options?.alt_text) {
      formData.append('alt_text', options.alt_text);
    }

    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const res = await fetch(`${API_BASE}/images/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = `Upload failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (typeof errorData === 'object' && errorData !== null) {
          errorMessage = JSON.stringify(errorData);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMessage);
    }

    return res.json();
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/images/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const seriesApi = {
  async list(params?: { status?: string; search?: string; genre?: string | number }): Promise<AnimeSeries[]> {
    return fetchJson<AnimeSeries[]>(`${API_BASE}/series/${withQuery(params)}`);
  },

  async get(id: number): Promise<AnimeSeries> {
    return fetchJson<AnimeSeries>(`${API_BASE}/series/${id}/`);
  },

  async create(data: {
    title: string;
    japanese_title?: string | null;
    romaji_title?: string | null;
    cover_image?: number | null;
    genres?: number[] | Genre[];
    initial_season?: any;
  }): Promise<AnimeSeries> {
    return fetchJson<AnimeSeries>(`${API_BASE}/series/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<Omit<AnimeSeries, 'genres' | 'studios'>> & {
      genres?: number[] | Genre[];
      studios?: number[] | Studio[];
    }
  ): Promise<AnimeSeries> {
    return fetchJson<AnimeSeries>(`${API_BASE}/series/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/series/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const seasonApi = {
  async list(params?: { series?: number; status?: string; search?: string }): Promise<AnimeSeason[]> {
    return fetchJson<AnimeSeason[]>(`${API_BASE}/seasons/${withQuery(params)}`);
  },

  async get(id: number): Promise<AnimeSeason> {
    return fetchJson<AnimeSeason>(`${API_BASE}/seasons/${id}/`);
  },

  async create(data: {
    series: number;
    title: string;
    season_number: number;
    cover_image?: number | null;
    status?: string;
    progress?: number;
    total_episodes?: number | null;
    rating?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    notes?: string | null;
    studios?: number[] | Studio[];
  }): Promise<AnimeSeason> {
    return fetchJson<AnimeSeason>(`${API_BASE}/seasons/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<Omit<AnimeSeason, 'studios'>> & { studios?: number[] | Studio[] }
  ): Promise<AnimeSeason> {
    return fetchJson<AnimeSeason>(`${API_BASE}/seasons/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateProgress(id: number, delta: number): Promise<AnimeSeason> {
    return fetchJson<AnimeSeason>(`${API_BASE}/seasons/${id}/progress/`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/seasons/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const movieApi = {
  async list(params?: { series?: number; status?: string; search?: string }): Promise<AnimeMovie[]> {
    return fetchJson<AnimeMovie[]>(`${API_BASE}/movies/${withQuery(params)}`);
  },

  async get(id: number): Promise<AnimeMovie> {
    return fetchJson<AnimeMovie>(`${API_BASE}/movies/${id}/`);
  },

  async create(data: {
    series: number;
    title: string;
    cover_image?: number | null;
    status?: string;
    progress_minutes?: number;
    total_minutes?: number | null;
    rating?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    notes?: string | null;
    studios?: number[] | Studio[];
  }): Promise<AnimeMovie> {
    return fetchJson<AnimeMovie>(`${API_BASE}/movies/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<Omit<AnimeMovie, 'studios'>> & { studios?: number[] | Studio[] }
  ): Promise<AnimeMovie> {
    return fetchJson<AnimeMovie>(`${API_BASE}/movies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateProgress(id: number, delta: number): Promise<AnimeMovie> {
    return fetchJson<AnimeMovie>(`${API_BASE}/movies/${id}/progress/`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/movies/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const episodeNoteApi = {
  async list(seasonId?: number): Promise<EpisodeNote[]> {
    return fetchJson<EpisodeNote[]>(`${API_BASE}/episode-notes/${withQuery({ season: seasonId })}`);
  },

  async get(id: number): Promise<EpisodeNote> {
    return fetchJson<EpisodeNote>(`${API_BASE}/episode-notes/${id}/`);
  },

  async create(data: {
    season: number;
    episode_number: number;
    episode_title?: string | null;
    cover_image?: number | null;
    note: string;
    rating?: number | null;
  }): Promise<EpisodeNote> {
    return fetchJson<EpisodeNote>(`${API_BASE}/episode-notes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<EpisodeNote>): Promise<EpisodeNote> {
    return fetchJson<EpisodeNote>(`${API_BASE}/episode-notes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/episode-notes/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const bookApi = {
  async list(params?: { status?: string; search?: string; genre?: string | number }): Promise<Book[]> {
    return fetchJson<Book[]>(`${API_BASE}/books/${withQuery(params)}`);
  },

  async get(id: number): Promise<Book> {
    return fetchJson<Book>(`${API_BASE}/books/${id}/`);
  },

  async create(
    data: Omit<Book, 'id' | 'created_at' | 'genres'> & { genres?: number[] | Genre[] }
  ): Promise<Book> {
    return fetchJson<Book>(`${API_BASE}/books/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<Omit<Book, 'genres'>> & { genres?: number[] | Genre[] }
  ): Promise<Book> {
    return fetchJson<Book>(`${API_BASE}/books/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateProgress(id: number, delta: number): Promise<Book> {
    const current = await bookApi.get(id);
    const max = current.total_pages || 99999;
    const newProgress = Math.max(0, Math.min(max, current.progress + delta));
    const newStatus =
      current.status === 'PLAN_TO_READ' && newProgress > 0
        ? 'READING'
        : current.total_pages && newProgress >= current.total_pages && current.status === 'READING'
          ? 'COMPLETED'
          : current.status;

    return bookApi.update(id, {
      progress: newProgress,
      status: newStatus,
      finish_date:
        newStatus === 'COMPLETED' && !current.finish_date
          ? new Date().toISOString().split('T')[0]
          : current.finish_date,
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/books/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const rewatchApi = {
  async list(params?: {
    series?: number;
    season?: number;
    movie?: number;
    episode?: number;
    target_type?: string;
    target_id?: number;
    search?: string;
  }): Promise<Rewatch[]> {
    return fetchJson<Rewatch[]>(`${API_BASE}/rewatches/${withQuery(params)}`);
  },

  async create(data: {
    target_type?: RewatchTargetType;
    target_id?: number;
    episode_number?: number | null;
    episode_title?: string | null;
    season?: number | null;
    movie?: number | null;
    series?: number | null;
    episode?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    rating?: number | null;
    notes?: string | null;
  }): Promise<Rewatch> {
    return fetchJson<Rewatch>(`${API_BASE}/rewatches/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<{
      target_type?: RewatchTargetType;
      target_id?: number;
      episode_number?: number | null;
      episode_title?: string | null;
      season?: number | null;
      movie?: number | null;
      series?: number | null;
      episode?: number | null;
      start_date?: string | null;
      finish_date?: string | null;
      rating?: number | null;
      notes?: string | null;
    }>
  ): Promise<Rewatch> {
    return fetchJson<Rewatch>(`${API_BASE}/rewatches/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/rewatches/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const characterApi = {
  async list(seriesId?: number): Promise<FavoriteCharacter[]> {
    return fetchJson<FavoriteCharacter[]>(`${API_BASE}/characters/${withQuery({ series: seriesId })}`);
  },

  async create(data: {
    series: number;
    name: string;
    why?: string | null;
    images?: number[];
  }): Promise<FavoriteCharacter> {
    return fetchJson<FavoriteCharacter>(`${API_BASE}/characters/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<FavoriteCharacter> & { images?: number[] }): Promise<FavoriteCharacter> {
    return fetchJson<FavoriteCharacter>(`${API_BASE}/characters/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/characters/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const genreApi = {
  async list(): Promise<Genre[]> {
    return fetchJson<Genre[]>(`${API_BASE}/genres/`);
  },
};

export const studioApi = {
  async list(): Promise<Studio[]> {
    return fetchJson<Studio[]>(`${API_BASE}/studios/`);
  },
};

export const statsApi = {
  async getStats(): Promise<JournalStats> {
    return fetchJson<JournalStats>(`${API_BASE}/stats/`);
  },
};
