import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActiveTab,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  EpisodeNote,
  FavoriteCharacter,
  Genre,
  JournalStats,
  Rewatch,
  Studio,
} from './types';
import {
  bookApi,
  characterApi,
  episodeNoteApi,
  genreApi,
  movieApi,
  rewatchApi,
  seasonApi,
  seriesApi,
  statsApi,
  studioApi,
} from './api/client';
import { Navigation } from './components/Navigation';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EntryModal, EntryModalMode } from './components/EntryModal';
import { EpisodeNoteModal } from './components/EpisodeNoteModal';
import { CharacterModal, RewatchModal } from './components/QuickModals';
import { DashboardView } from './views/DashboardView';
import { AnimeView } from './views/AnimeView';
import { BookView } from './views/BookView';
import { CharactersView } from './views/CharactersView';
import { RewatchesView } from './views/RewatchesView';
import { Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from './utils/animations';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const viewContainerRef = useRef<HTMLDivElement>(null);

  // Data states
  const [seriesList, setSeriesList] = useState<AnimeSeries[]>([]);
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
  const [entryModalMode, setEntryModalMode] = useState<EntryModalMode>('new-franchise');
  const [entryModalEditTarget, setEntryModalEditTarget] = useState<{
    type: 'series' | 'season' | 'movie' | 'book';
    data: any;
  } | null>(null);
  const [entryModalTargetSeries, setEntryModalTargetSeries] = useState<AnimeSeries | null>(null);

  const [episodeNoteModalOpen, setEpisodeNoteModalOpen] = useState(false);
  const [targetSeasonForNotes, setTargetSeasonForNotes] = useState<AnimeSeason | null>(null);

  const [rewatchModalOpen, setRewatchModalOpen] = useState(false);
  const [rewatchTargetSeason, setRewatchTargetSeason] = useState<AnimeSeason | null>(null);
  const [rewatchTargetMovie, setRewatchTargetMovie] = useState<AnimeMovie | null>(null);

  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [characterTargetSeries, setCharacterTargetSeries] = useState<AnimeSeries | null>(null);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, b, r, c, g, st, stt] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        genreApi.list(),
        studioApi.list(),
        statsApi.getStats(),
      ]);
      setSeriesList(s);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setGenres(g);
      setStudios(st);
      setStats(stt);
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

  // Tab View Transition Animation
  useGSAP(
    () => {
      if (prefersReducedMotion() || !viewContainerRef.current) return;

      gsap.fromTo(
        viewContainerRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: EASING.smooth,
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: viewContainerRef, dependencies: [activeTab, loading] }
  );

  const refreshStats = async () => {
    try {
      const st = await statsApi.getStats();
      setStats(st);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    try {
      const [s, b, r, c, st] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        statsApi.getStats(),
      ]);
      setSeriesList(s);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setStats(st);
    } catch (e) {
      console.error('Failed to refresh journal data:', e);
    }
  };

  // --- Series Handlers ---
  const handleSaveSeries = async (
    data: { title: string; genres: number[]; initial_season?: any },
    id?: number
  ) => {
    try {
      if (id) {
        await seriesApi.update(id, data);
        addToast(`Updated franchise "${data.title}"`);
      } else {
        const created = await seriesApi.create(data);
        addToast(`Logged new franchise "${created.title}"`);
      }
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      addToast('Error saving franchise', 'error');
    }
  };

  const handleDeleteSeries = async (id: number) => {
    if (!window.confirm('Delete this anime franchise and all its seasons, movies, and notes?')) return;
    try {
      await seriesApi.delete(id);
      addToast('Franchise removed');
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error deleting franchise', 'error');
    }
  };

  // --- Season Handlers ---
  const handleSaveSeason = async (data: any, id?: number) => {
    try {
      if (id) {
        await seasonApi.update(id, data);
        addToast(`Updated season "${data.title}"`);
      } else {
        await seasonApi.create(data);
        addToast(`Added new season "${data.title}"`);
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving season', 'error');
    }
  };

  const handleDeleteSeason = async (id: number) => {
    if (!window.confirm('Delete this TV season and its notes?')) return;
    try {
      await seasonApi.delete(id);
      addToast('Season removed');
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error deleting season', 'error');
    }
  };

  const handleSeasonProgressDelta = async (id: number, delta: number) => {
    try {
      await seasonApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Could not update season progress.', 'error');
    }
  };

  // --- Movie Handlers ---
  const handleSaveMovie = async (data: any, id?: number) => {
    try {
      if (id) {
        await movieApi.update(id, data);
        addToast(`Updated film "${data.title}"`);
      } else {
        await movieApi.create(data);
        addToast(`Added new film "${data.title}"`);
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving movie', 'error');
    }
  };

  const handleDeleteMovie = async (id: number) => {
    if (!window.confirm('Delete this anime film entry?')) return;
    try {
      await movieApi.delete(id);
      addToast('Movie removed');
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error deleting movie', 'error');
    }
  };

  const handleMovieProgressDelta = async (id: number, delta: number) => {
    try {
      await movieApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Could not update movie progress.', 'error');
    }
  };

  // --- Episode Note Handlers ---
  const handleSaveEpisodeNote = async (
    data: { season: number; episode_number: number; episode_title?: string | null; note: string; rating?: number | null },
    noteId?: number
  ) => {
    try {
      if (noteId) {
        await episodeNoteApi.update(noteId, data);
        addToast(`Updated Ep ${data.episode_number} standout note`);
      } else {
        await episodeNoteApi.create(data);
        addToast(`Recorded Ep ${data.episode_number} memory`);
      }
      await refreshSeries();
      // Update targetSeasonForNotes if open
      if (targetSeasonForNotes) {
        const freshSeason = await seasonApi.get(targetSeasonForNotes.id);
        setTargetSeasonForNotes(freshSeason);
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteEpisodeNote = async (noteId: number) => {
    try {
      await episodeNoteApi.delete(noteId);
      addToast('Episode note deleted');
      await refreshAll();
      if (targetSeasonForNotes) {
        const freshSeason = await seasonApi.get(targetSeasonForNotes.id);
        setTargetSeasonForNotes(freshSeason);
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting episode note', 'error');
    }
  };

  // --- Rewatch Handlers ---
  const handleSaveRewatch = async (data: {
    season?: number | null;
    movie?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    rating?: number | null;
    notes?: string | null;
  }) => {
    try {
      const created = await rewatchApi.create(data);
      addToast(`Recorded rewatch pass for "${created.release_title}"`);
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving rewatch pass', 'error');
    }
  };

  const handleDeleteRewatch = async (id: number) => {
    if (!window.confirm('Delete this rewatch reflection?')) return;
    try {
      await rewatchApi.delete(id);
      addToast('Rewatch pass deleted');
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Character Handlers ---
  const handleSaveCharacter = async (data: { series: number; name: string; why?: string | null }) => {
    try {
      const created = await characterApi.create(data);
      addToast(`Added "${created.name}" to memorable characters`);
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving character', 'error');
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (!window.confirm('Remove this character from memory log?')) return;
    try {
      await characterApi.delete(id);
      addToast('Character removed');
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Book Handlers ---
  const handleSaveBook = async (data: Omit<Book, 'id' | 'created_at'>, id?: number) => {
    try {
      if (id) {
        const updated = await bookApi.update(id, data);
        setBookList((prev) => prev.map((b) => (b.id === id ? updated : b)));
        addToast(`Updated "${updated.title}" journal`);
      } else {
        const created = await bookApi.create(data);
        setBookList((prev) => [created, ...prev]);
        addToast(`Logged new book "${created.title}"`);
      }
      refreshStats();
    } catch (err) {
      console.error(err);
      addToast('Error saving book entry', 'error');
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm('Delete this book journal entry?')) return;
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

  // --- Modal Openers ---
  const openNewFranchiseModal = () => {
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(null);
    setEntryModalMode('new-franchise');
    setEntryModalOpen(true);
  };

  const openAddSeasonModal = (series: AnimeSeries) => {
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(series);
    setEntryModalMode('add-season');
    setEntryModalOpen(true);
  };

  const openAddMovieModal = (series: AnimeSeries) => {
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(series);
    setEntryModalMode('add-movie');
    setEntryModalOpen(true);
  };

  const openEditSeriesModal = (series: AnimeSeries) => {
    setEntryModalEditTarget({ type: 'series', data: series });
    setEntryModalTargetSeries(series);
    setEntryModalMode('edit-series');
    setEntryModalOpen(true);
  };

  const openEditSeasonModal = (season: AnimeSeason) => {
    setEntryModalEditTarget({ type: 'season', data: season });
    setEntryModalMode('edit-season');
    setEntryModalOpen(true);
  };

  const openEditMovieModal = (movie: AnimeMovie) => {
    setEntryModalEditTarget({ type: 'movie', data: movie });
    setEntryModalMode('edit-movie');
    setEntryModalOpen(true);
  };

  const openNewBookModal = () => {
    setEntryModalEditTarget(null);
    setEntryModalMode('book');
    setEntryModalOpen(true);
  };

  const openEditBookModal = (book: Book) => {
    setEntryModalEditTarget({ type: 'book', data: book });
    setEntryModalMode('edit-book');
    setEntryModalOpen(true);
  };

  const openEpisodeNotesModal = (season: AnimeSeason) => {
    setTargetSeasonForNotes(season);
    setEpisodeNoteModalOpen(true);
  };

  const openAddRewatchSeason = (season: AnimeSeason) => {
    setRewatchTargetSeason(season);
    setRewatchTargetMovie(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchMovie = (movie: AnimeMovie) => {
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(movie);
    setRewatchModalOpen(true);
  };

  const openAddCharacterModal = (series?: AnimeSeries) => {
    setCharacterTargetSeries(series || seriesList[0] || null);
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
        onOpenNewModal={() => {
          if (activeTab === 'books') {
            openNewBookModal();
          } else {
            openNewFranchiseModal();
          }
        }}
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
          <div ref={viewContainerRef}>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                seriesList={seriesList}
                bookList={bookList}
                onNavigate={setActiveTab}
                onSeasonProgressDelta={handleSeasonProgressDelta}
                onMovieProgressDelta={handleMovieProgressDelta}
                onEditBook={openEditBookModal}
                onDeleteBook={handleDeleteBook}
                onProgressBook={handleBookProgressDelta}
              />
            )}

            {activeTab === 'anime' && (
              <AnimeView
                seriesList={seriesList}
                searchQuery={searchQuery}
                onEditSeries={openEditSeriesModal}
                onDeleteSeries={handleDeleteSeries}
                onAddSeason={openAddSeasonModal}
                onAddMovie={openAddMovieModal}
                onEditSeason={openEditSeasonModal}
                onDeleteSeason={handleDeleteSeason}
                onSeasonProgressDelta={handleSeasonProgressDelta}
                onEditMovie={openEditMovieModal}
                onDeleteMovie={handleDeleteMovie}
                onMovieProgressDelta={handleMovieProgressDelta}
                onOpenEpisodeNotes={openEpisodeNotesModal}
                onAddRewatchSeason={openAddRewatchSeason}
                onAddRewatchMovie={openAddRewatchMovie}
                onAddCharacter={openAddCharacterModal}
                onOpenNewFranchiseModal={openNewFranchiseModal}
              />
            )}

            {activeTab === 'books' && (
              <BookView
                bookList={bookList}
                searchQuery={searchQuery}
                onEdit={openEditBookModal}
                onDelete={handleDeleteBook}
                onProgressDelta={handleBookProgressDelta}
                onOpenNewModal={openNewBookModal}
              />
            )}

            {activeTab === 'characters' && (
              <CharactersView
                characters={characterList}
                searchQuery={searchQuery}
                onDelete={handleDeleteCharacter}
                onOpenAddModal={() => openAddCharacterModal()}
              />
            )}

            {activeTab === 'rewatches' && (
              <RewatchesView
                rewatches={rewatchList}
                seriesList={seriesList}
                searchQuery={searchQuery}
                onDelete={handleDeleteRewatch}
                onOpenRewatchModal={() => {
                  setRewatchTargetSeason(null);
                  setRewatchTargetMovie(null);
                  setRewatchModalOpen(true);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Entry Modal */}
      <EntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        mode={entryModalMode}
        editTarget={entryModalEditTarget}
        targetSeries={entryModalTargetSeries}
        seriesList={seriesList}
        genres={genres}
        studios={studios}
        onSaveSeries={handleSaveSeries}
        onSaveSeason={handleSaveSeason}
        onSaveMovie={handleSaveMovie}
        onSaveBook={handleSaveBook}
      />

      {/* Standout Episode Note Modal */}
      <EpisodeNoteModal
        isOpen={episodeNoteModalOpen}
        onClose={() => setEpisodeNoteModalOpen(false)}
        season={targetSeasonForNotes}
        onSaveNote={handleSaveEpisodeNote}
        onDeleteNote={handleDeleteEpisodeNote}
      />

      {/* Rewatch Modal */}
      <RewatchModal
        isOpen={rewatchModalOpen}
        onClose={() => setRewatchModalOpen(false)}
        targetSeason={rewatchTargetSeason}
        targetMovie={rewatchTargetMovie}
        seriesList={seriesList}
        onSave={handleSaveRewatch}
      />

      {/* Character Modal */}
      <CharacterModal
        isOpen={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        seriesList={seriesList}
        preselectedSeries={characterTargetSeries}
        onSave={handleSaveCharacter}
      />
    </div>
  );
};
