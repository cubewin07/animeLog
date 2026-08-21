import { Anime, Book, FavoriteCharacter, Genre, JournalStats, Rewatch, Studio } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    ...options,
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

export const animeApi = {
  async list(params?: { status?: string; search?: string }): Promise<Anime[]> {
    return fetchJson<Anime[]>(`${API_BASE}/anime/${withQuery(params)}`);
  },

  async get(id: number): Promise<Anime> {
    return fetchJson<Anime>(`${API_BASE}/anime/${id}/`);
  },

  async create(data: Omit<Anime, 'id' | 'created_at'>): Promise<Anime> {
    return fetchJson<Anime>(`${API_BASE}/anime/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Anime>): Promise<Anime> {
    return fetchJson<Anime>(`${API_BASE}/anime/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateProgress(id: number, delta: number): Promise<Anime> {
    const current = await animeApi.get(id);
    const max = current.total_episodes || 9999;
    const newProgress = Math.max(0, Math.min(max, current.progress + delta));
    const newStatus =
      current.status === 'PLAN_TO_WATCH' && newProgress > 0
        ? 'WATCHING'
        : current.total_episodes && newProgress >= current.total_episodes && current.status === 'WATCHING'
          ? 'COMPLETED'
          : current.status;

    return animeApi.update(id, {
      progress: newProgress,
      status: newStatus,
      finish_date:
        newStatus === 'COMPLETED' && !current.finish_date
          ? new Date().toISOString().split('T')[0]
          : current.finish_date,
    });
  },

  async delete(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/anime/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const bookApi = {
  async list(params?: { status?: string; search?: string }): Promise<Book[]> {
    return fetchJson<Book[]>(`${API_BASE}/books/${withQuery(params)}`);
  },

  async get(id: number): Promise<Book> {
    return fetchJson<Book>(`${API_BASE}/books/${id}/`);
  },

  async create(data: Omit<Book, 'id' | 'created_at'>): Promise<Book> {
    return fetchJson<Book>(`${API_BASE}/books/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Book>): Promise<Book> {
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
  async list(animeId?: number): Promise<Rewatch[]> {
    return fetchJson<Rewatch[]>(`${API_BASE}/rewatches/${withQuery({ anime: animeId })}`);
  },

  async create(data: Omit<Rewatch, 'id'>): Promise<Rewatch> {
    return fetchJson<Rewatch>(`${API_BASE}/rewatches/`, {
      method: 'POST',
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
  async list(animeId?: number): Promise<FavoriteCharacter[]> {
    return fetchJson<FavoriteCharacter[]>(`${API_BASE}/characters/${withQuery({ anime: animeId })}`);
  },

  async create(data: Omit<FavoriteCharacter, 'id'>): Promise<FavoriteCharacter> {
    return fetchJson<FavoriteCharacter>(`${API_BASE}/characters/`, {
      method: 'POST',
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
