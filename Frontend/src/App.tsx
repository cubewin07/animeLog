import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Anime, Book, FavoriteCharacter, Genre, JournalStats, Rewatch, Studio } from './types';
import {
  animeApi,
  bookApi,
  characterApi,
  genreApi,
  rewatchApi,
  statsApi,
  studioApi,
} from './api/client';
import { Navigation } from './components/Navigation';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EntryModal } from './components/EntryModal';
import { CharacterModal, RewatchModal } from './components/QuickModals';
import { DashboardView } from './views/DashboardView';
import { AnimeView } from './views/AnimeView';
import { BookView } from './views/BookView';
import { CharactersView } from './views/CharactersView';
import { RewatchesView } from './views/RewatchesView';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [bookList, setBookList] = useState<Book[]>([]);
  const [rewatchList, setRewatchList] = useState<Rewatch[]>([]);
  const [characterList, setCharacterList] = useState<FavoriteCharacter[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [stats, setStats] = useState<JournalStats>({
    activeWatching: 0,
    activeReading: 0,
    totalCompleted: 0,
    totalLessons: 0,
    rewatchesCount: 0,
    charactersCount: 0,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals state
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryModalEditItem, setEntryModalEditItem] = useState<Anime | Book | null>(null);
  const [entryModalDefaultType, setEntryModalDefaultType] = useState<'anime' | 'book'>('anime');

  const [rewatchModalOpen, setRewatchModalOpen] = useState(false);
  const [rewatchTargetAnime, setRewatchTargetAnime] = useState<Anime | null>(null);

  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [characterTargetAnime, setCharacterTargetAnime] = useState<Anime | null>(null);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [a, b, r, c, g, s, st] = await Promise.all([
        animeApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        genreApi.list(),
        studioApi.list(),
        statsApi.getStats(),
      ]);
      setAnimeList(a);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setGenres(g);
      setStudios(s);
      setStats(st);
    } catch (err) {
      console.error('Failed to load journal data:', err);
      addToast('Failed to load journal entries.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh stats helper
  const refreshStats = async () => {
    const st = await statsApi.getStats();
    setStats(st);
  };

  // Anime Handlers
  const handleSaveAnime = async (data: Omit<Anime, 'id' | 'created_at'>, id?: number) => {
    try {
      if (id) {
        const updated = await animeApi.update(id, data);
        setAnimeList((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
        addToast(`Updated "${updated.title}" journal`);
      } else {
        const created = await animeApi.create(data);
        setAnimeList((prev) => [created, ...prev]);
        addToast(`Logged new anime: "${created.title}"`);
      }
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error saving anime entry', 'error');
    }
  };

  const handleDeleteAnime = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this anime journal entry?')) return;
    try {
      await animeApi.delete(id);
      setAnimeList((prev) => prev.filter((a) => a.id !== id));
      addToast('Anime entry removed');
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error deleting anime entry', 'error');
    }
  };

  const handleAnimeProgressDelta = async (id: number, delta: number) => {
    try {
      const updated = await animeApi.updateProgress(id, delta);
      setAnimeList((prev) => prev.map((a) => (a.id === id ? updated : a)));
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Book Handlers
  const handleSaveBook = async (data: Omit<Book, 'id' | 'created_at'>, id?: number) => {
    try {
      if (id) {
        const updated = await bookApi.update(id, data);
        setBookList((prev) => prev.map((b) => (b.id === id ? updated : b)));
        addToast(`Updated "${updated.title}" journal`);
      } else {
        const created = await bookApi.create(data);
        setBookList((prev) => [created, ...prev]);
        addToast(`Logged new book: "${created.title}"`);
      }
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error saving book entry', 'error');
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this book journal entry?')) return;
    try {
      await bookApi.delete(id);
      setBookList((prev) => prev.filter((b) => b.id !== id));
      addToast('Book entry removed');
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error deleting book entry', 'error');
    }
  };

  const handleBookProgressDelta = async (id: number, delta: number) => {
    try {
      const updated = await bookApi.updateProgress(id, delta);
      setBookList((prev) => prev.map((b) => (b.id === id ? updated : b)));
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Rewatch Handlers
  const handleSaveRewatch = async (data: Omit<Rewatch, 'id'>) => {
    try {
      const created = await rewatchApi.create(data);
      setRewatchList((prev) => [created, ...prev]);
      // Update anime's internal rewatches array
      setAnimeList((prev) =>
        prev.map((a) =>
          a.id === data.anime
            ? { ...a, rewatches: [created, ...(a.rewatches || [])] }
            : a
        )
      );
      addToast(`Recorded rewatch pass for "${created.anime_title}"`);
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error saving rewatch pass', 'error');
    }
  };

  const handleDeleteRewatch = async (id: number) => {
    if (!window.confirm('Delete this rewatch reflection?')) return;
    try {
      await rewatchApi.delete(id);
      setRewatchList((prev) => prev.filter((r) => r.id !== id));
      setAnimeList((prev) =>
        prev.map((a) => ({
          ...a,
          rewatches: (a.rewatches || []).filter((r) => r.id !== id),
        }))
      );
      addToast('Rewatch pass deleted');
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Character Handlers
  const handleSaveCharacter = async (data: Omit<FavoriteCharacter, 'id'>) => {
    try {
      const created = await characterApi.create(data);
      setCharacterList((prev) => [created, ...prev]);
      setAnimeList((prev) =>
        prev.map((a) =>
          a.id === data.anime
            ? { ...a, favorite_characters: [created, ...(a.favorite_characters || [])] }
            : a
        )
      );
      addToast(`Added "${created.name}" to memorable characters`);
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error saving character', 'error');
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (!window.confirm('Remove this character from memory log?')) return;
    try {
      await characterApi.delete(id);
      setCharacterList((prev) => prev.filter((c) => c.id !== id));
      setAnimeList((prev) =>
        prev.map((a) => ({
          ...a,
          favorite_characters: (a.favorite_characters || []).filter((c) => c.id !== id),
        }))
      );
      addToast('Character removed');
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Modal Openers
  const openNewEntry = (type: 'anime' | 'book' = activeTab === 'books' ? 'book' : 'anime') => {
    setEntryModalEditItem(null);
    setEntryModalDefaultType(type);
    setEntryModalOpen(true);
  };

  const openEditAnime = (anime: Anime) => {
    setEntryModalEditItem(anime);
    setEntryModalDefaultType('anime');
    setEntryModalOpen(true);
  };

  const openEditBook = (book: Book) => {
    setEntryModalEditItem(book);
    setEntryModalDefaultType('book');
    setEntryModalOpen(true);
  };

  const openAddRewatch = (anime: Anime) => {
    setRewatchTargetAnime(anime);
    setRewatchModalOpen(true);
  };

  const openAddCharacter = (anime: Anime) => {
    setCharacterTargetAnime(anime);
    setCharacterModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewModal={() => openNewEntry()}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {loading ? (
          <div
            style={{
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
            <p style={{ fontSize: '14px' }}>Loading your reflections & journal...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                animeList={animeList}
                bookList={bookList}
                onNavigate={setActiveTab}
                onEditAnime={openEditAnime}
                onDeleteAnime={handleDeleteAnime}
                onProgressAnime={handleAnimeProgressDelta}
                onAddRewatch={openAddRewatch}
                onAddCharacter={openAddCharacter}
                onEditBook={openEditBook}
                onDeleteBook={handleDeleteBook}
                onProgressBook={handleBookProgressDelta}
              />
            )}

            {activeTab === 'anime' && (
              <AnimeView
                animeList={animeList}
                searchQuery={searchQuery}
                onEdit={openEditAnime}
                onDelete={handleDeleteAnime}
                onProgressDelta={handleAnimeProgressDelta}
                onAddRewatch={openAddRewatch}
                onAddCharacter={openAddCharacter}
                onOpenNewModal={() => openNewEntry('anime')}
              />
            )}

            {activeTab === 'books' && (
              <BookView
                bookList={bookList}
                searchQuery={searchQuery}
                onEdit={openEditBook}
                onDelete={handleDeleteBook}
                onProgressDelta={handleBookProgressDelta}
                onOpenNewModal={() => openNewEntry('book')}
              />
            )}

            {activeTab === 'characters' && (
              <CharactersView
                characters={characterList}
                searchQuery={searchQuery}
                onDelete={handleDeleteCharacter}
                onOpenAddModal={() => {
                  setCharacterTargetAnime(animeList[0] || null);
                  setCharacterModalOpen(true);
                }}
              />
            )}

            {activeTab === 'rewatches' && (
              <RewatchesView
                rewatches={rewatchList}
                animeList={animeList}
                searchQuery={searchQuery}
                onDelete={handleDeleteRewatch}
                onOpenRewatchModal={() => {
                  setRewatchTargetAnime(animeList[0] || null);
                  setRewatchModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Entry Modal (Add / Edit for Anime and Books) */}
      <EntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        onSaveAnime={handleSaveAnime}
        onSaveBook={handleSaveBook}
        editItem={entryModalEditItem}
        defaultType={entryModalDefaultType}
        genres={genres}
        studios={studios}
      />

      {/* Rewatch Modal */}
      <RewatchModal
        isOpen={rewatchModalOpen}
        onClose={() => setRewatchModalOpen(false)}
        anime={rewatchTargetAnime}
        onSave={handleSaveRewatch}
      />

      {/* Character Modal */}
      <CharacterModal
        isOpen={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        animeList={animeList}
        preselectedAnime={characterTargetAnime}
        onSave={handleSaveCharacter}
      />
    </div>
  );
};
