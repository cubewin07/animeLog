import { storage } from './storage';
import { Anime, Book, FavoriteCharacter, Genre, JournalStats, Rewatch, Studio } from '../types';

// Simulate slight network delay for authentic async behavior and loading states
const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const animeApi = {
  async list(): Promise<Anime[]> {
    await delay();
    const animeList = storage.getAnime();
    const rewatches = storage.getRewatches();
    const characters = storage.getCharacters();

    // Attach related items
    return animeList.map((a) => ({
      ...a,
      rewatches: rewatches.filter((r) => r.anime === a.id),
      favorite_characters: characters.filter((c) => c.anime === a.id),
    }));
  },

  async get(id: number): Promise<Anime | undefined> {
    await delay();
    const animeList = await animeApi.list();
    return animeList.find((a) => a.id === id);
  },

  async create(data: Omit<Anime, 'id' | 'created_at'>): Promise<Anime> {
    await delay();
    const current = storage.getAnime();
    const newId = current.length > 0 ? Math.max(...current.map((a) => a.id)) + 1 : 1;
    const newEntry: Anime = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    storage.saveAnime([newEntry, ...current]);
    return newEntry;
  },

  async update(id: number, data: Partial<Anime>): Promise<Anime> {
    await delay();
    const current = storage.getAnime();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Anime with ID ${id} not found.`);

    const updated: Anime = { ...current[index], ...data };
    // Auto-mark completed if progress equals total_episodes
    if (updated.total_episodes && updated.progress >= updated.total_episodes && updated.status === 'WATCHING') {
      updated.status = 'COMPLETED';
      if (!updated.finish_date) {
        updated.finish_date = new Date().toISOString().split('T')[0];
      }
    }

    current[index] = updated;
    storage.saveAnime(current);
    return updated;
  },

  async updateProgress(id: number, delta: number): Promise<Anime> {
    await delay(60);
    const current = storage.getAnime();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Anime with ID ${id} not found.`);

    const target = current[index];
    const max = target.total_episodes || 9999;
    const newProgress = Math.max(0, Math.min(max, target.progress + delta));

    return animeApi.update(id, {
      progress: newProgress,
      status:
        target.status === 'PLAN_TO_WATCH' && newProgress > 0
          ? 'WATCHING'
          : target.status,
    });
  },

  async delete(id: number): Promise<void> {
    await delay();
    const current = storage.getAnime();
    storage.saveAnime(current.filter((a) => a.id !== id));
  },
};

export const bookApi = {
  async list(): Promise<Book[]> {
    await delay();
    return storage.getBooks();
  },

  async get(id: number): Promise<Book | undefined> {
    await delay();
    const books = storage.getBooks();
    return books.find((b) => b.id === id);
  },

  async create(data: Omit<Book, 'id' | 'created_at'>): Promise<Book> {
    await delay();
    const current = storage.getBooks();
    const newId = current.length > 0 ? Math.max(...current.map((b) => b.id)) + 1 : 1;
    const newEntry: Book = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    storage.saveBooks([newEntry, ...current]);
    return newEntry;
  },

  async update(id: number, data: Partial<Book>): Promise<Book> {
    await delay();
    const current = storage.getBooks();
    const index = current.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`Book with ID ${id} not found.`);

    const updated: Book = { ...current[index], ...data };
    if (updated.total_pages && updated.progress >= updated.total_pages && updated.status === 'READING') {
      updated.status = 'COMPLETED';
      if (!updated.finish_date) {
        updated.finish_date = new Date().toISOString().split('T')[0];
      }
    }

    current[index] = updated;
    storage.saveBooks(current);
    return updated;
  },

  async updateProgress(id: number, delta: number): Promise<Book> {
    await delay(60);
    const current = storage.getBooks();
    const index = current.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`Book with ID ${id} not found.`);

    const target = current[index];
    const max = target.total_pages || 99999;
    const newProgress = Math.max(0, Math.min(max, target.progress + delta));

    return bookApi.update(id, {
      progress: newProgress,
      status:
        target.status === 'PLAN_TO_READ' && newProgress > 0
          ? 'READING'
          : target.status,
    });
  },

  async delete(id: number): Promise<void> {
    await delay();
    const current = storage.getBooks();
    storage.saveBooks(current.filter((b) => b.id !== id));
  },
};

export const rewatchApi = {
  async list(): Promise<Rewatch[]> {
    await delay();
    const rewatches = storage.getRewatches();
    const animeList = storage.getAnime();
    return rewatches.map((r) => ({
      ...r,
      anime_title: animeList.find((a) => a.id === r.anime)?.title || `Anime #${r.anime}`,
    }));
  },

  async create(data: Omit<Rewatch, 'id'>): Promise<Rewatch> {
    await delay();
    const current = storage.getRewatches();
    const animeList = storage.getAnime();
    const newId = current.length > 0 ? Math.max(...current.map((r) => r.id)) + 1 : 1;
    const animeTitle = animeList.find((a) => a.id === data.anime)?.title || `Anime #${data.anime}`;
    const newEntry: Rewatch = {
      ...data,
      id: newId,
      anime_title: animeTitle,
    };
    storage.saveRewatches([newEntry, ...current]);
    return newEntry;
  },

  async delete(id: number): Promise<void> {
    await delay();
    const current = storage.getRewatches();
    storage.saveRewatches(current.filter((r) => r.id !== id));
  },
};

export const characterApi = {
  async list(): Promise<FavoriteCharacter[]> {
    await delay();
    const characters = storage.getCharacters();
    const animeList = storage.getAnime();
    return characters.map((c) => ({
      ...c,
      anime_title: animeList.find((a) => a.id === c.anime)?.title || `Anime #${c.anime}`,
    }));
  },

  async create(data: Omit<FavoriteCharacter, 'id'>): Promise<FavoriteCharacter> {
    await delay();
    const current = storage.getCharacters();
    const animeList = storage.getAnime();
    const newId = current.length > 0 ? Math.max(...current.map((c) => c.id)) + 1 : 1;
    const animeTitle = animeList.find((a) => a.id === data.anime)?.title || `Anime #${data.anime}`;
    const newEntry: FavoriteCharacter = {
      ...data,
      id: newId,
      anime_title: animeTitle,
    };
    storage.saveCharacters([newEntry, ...current]);
    return newEntry;
  },

  async delete(id: number): Promise<void> {
    await delay();
    const current = storage.getCharacters();
    storage.saveCharacters(current.filter((c) => c.id !== id));
  },
};

export const genreApi = {
  async list(): Promise<Genre[]> {
    return storage.getGenres();
  },
};

export const studioApi = {
  async list(): Promise<Studio[]> {
    return storage.getStudios();
  },
};

export const statsApi = {
  async getStats(): Promise<JournalStats> {
    const [anime, books, rewatches, characters] = await Promise.all([
      animeApi.list(),
      bookApi.list(),
      rewatchApi.list(),
      characterApi.list(),
    ]);

    const activeWatching = anime.filter((a) => a.status === 'WATCHING').length;
    const activeReading = books.filter((b) => b.status === 'READING').length;
    const completedAnime = anime.filter((a) => a.status === 'COMPLETED').length;
    const completedBooks = books.filter((b) => b.status === 'COMPLETED').length;
    const animeLessons = anime.filter((a) => a.notes && a.notes.trim().length > 0).length;
    const bookLessons = books.filter((b) => b.notes && b.notes.trim().length > 0).length;
    const rewatchLessons = rewatches.filter((r) => r.notes && r.notes.trim().length > 0).length;

    return {
      activeWatching,
      activeReading,
      totalCompleted: completedAnime + completedBooks,
      totalLessons: animeLessons + bookLessons + rewatchLessons,
      rewatchesCount: rewatches.length,
      charactersCount: characters.length,
    };
  },
};
