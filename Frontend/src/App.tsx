import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route, useParams } from 'react-router-dom';
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
  RewatchTargetType,
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
import { ConfirmDialog } from './components/ConfirmDialog';
import { EntryModal, EntryModalMode } from './components/EntryModal';
import { EpisodeNoteModal } from './components/EpisodeNoteModal';
import { CharacterModal, RewatchModal } from './components/QuickModals';
import { DashboardView } from './views/DashboardView';
import { AnimeView } from './views/AnimeView';
import { FranchiseDetailView } from './views/FranchiseDetailView';
import { BookView } from './views/BookView';
import { BookDetailView } from './views/BookDetailView';
import { CharactersView } from './views/CharactersView';
import { RewatchesView } from './views/RewatchesView';
import { MediaView } from './views/MediaView';
import { Loader2 } from 'lucide-react';

// Wrapper for FranchiseDetailView to extract route params
const FranchiseDetailRouteWrapper: React.FC<{
  seriesList: AnimeSeries[];
  allRewatches: Rewatch[];
  onBack: () => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason: (series: AnimeSeries) => void;
  onAddMovie: (series: AnimeSeries) => void;
  onEditSeason: (season: AnimeSeason) => void;
  onDeleteSeason: (id: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onEditMovie: (movie: AnimeMovie) => void;
  onDeleteMovie: (id: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onOpenEpisodeNotes: (season: AnimeSeason) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddCharacter: (series: AnimeSeries) => void;
}> = (props) => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const idNum = Number(seriesId);
  const series = props.seriesList.find((s) => s.id === idNum);

  if (!series) {
    return (
      <div className="desk-card" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 8 }}>Franchise Not Found</h3>
        <p style={{ color: 'var(--text-desk-muted)', marginBottom: 16 }}>
          The requested franchise entry could not be found.
        </p>
        <button onClick={props.onBack} className="btn btn-secondary">
          Return to Anime Journal
        </button>
      </div>
    );
  }

  return <FranchiseDetailView series={series} {...props} />;
};

// Wrapper for BookDetailView to extract route params
const BookDetailRouteWrapper: React.FC<{
  bookList: Book[];
  onBack: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}> = (props) => {
  const { bookId } = useParams<{ bookId: string }>();
  const idNum = Number(bookId);
  const book = props.bookList.find((b) => b.id === idNum);

  if (!book) {
    return (
      <div className="desk-card" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 8 }}>Book Not Found</h3>
        <p style={{ color: 'var(--text-desk-muted)', marginBottom: 16 }}>
          The requested book journal entry could not be found.
        </p>
        <button onClick={props.onBack} className="btn btn-secondary">
          Return to Book Journal
        </button>
      </div>
    );
  }

  return <BookDetailView book={book} {...props} />;
};

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  // In-Page Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        options.onConfirm();
      },
    });
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
  const [rewatchTargetSeries, setRewatchTargetSeries] = useState<AnimeSeries | null>(null);
  const [rewatchTargetSeason, setRewatchTargetSeason] = useState<AnimeSeason | null>(null);
  const [rewatchTargetMovie, setRewatchTargetMovie] = useState<AnimeMovie | null>(null);
  const [rewatchTargetEpisodeNumber, setRewatchTargetEpisodeNumber] = useState<number | null>(null);
  const [editRewatchTarget, setEditRewatchTarget] = useState<Rewatch | null>(null);

  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [characterTargetSeries, setCharacterTargetSeries] = useState<AnimeSeries | null>(null);
  const [editCharacterTarget, setEditCharacterTarget] = useState<FavoriteCharacter | null>(null);

  // Determine active tab from URL path
  const getActiveTabFromPath = (path: string): ActiveTab => {
    if (path.startsWith('/anime')) return 'anime';
    if (path.startsWith('/books')) return 'books';
    if (path.startsWith('/characters')) return 'characters';
    if (path.startsWith('/rewatches')) return 'rewatches';
    if (path.startsWith('/media')) return 'media';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  // Handle Tab Change via Router
  const handleTabChange = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        navigate('/');
        break;
      case 'anime':
        navigate('/anime');
        break;
      case 'books':
        navigate('/books');
        break;
      case 'characters':
        navigate('/characters');
        break;
      case 'rewatches':
        navigate('/rewatches');
        break;
      case 'media':
        navigate('/media');
        break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    data: { title: string; cover_image?: number | null; genres: number[]; initial_season?: any },
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

  const handleDeleteSeries = (id: number) => {
    requestConfirm({
      title: 'Delete Franchise',
      message: 'Delete this anime franchise and all its seasons, movies, and notes?',
      confirmLabel: 'Delete Franchise',
      onConfirm: async () => {
        try {
          await seriesApi.delete(id);
          addToast('Franchise removed');
          await refreshAll();
          if (location.pathname.startsWith('/anime/')) {
            navigate('/anime');
          }
        } catch (err) {
          console.error(err);
          addToast('Error deleting franchise', 'error');
        }
      },
    });
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

  const handleDeleteSeason = (id: number) => {
    requestConfirm({
      title: 'Delete Season',
      message: 'Delete this TV season and all its episode memories?',
      confirmLabel: 'Delete Season',
      onConfirm: async () => {
        try {
          await seasonApi.delete(id);
          addToast('Season removed');
          await refreshAll();
        } catch (err) {
          console.error(err);
          addToast('Error deleting season', 'error');
        }
      },
    });
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

  const handleDeleteMovie = (id: number) => {
    requestConfirm({
      title: 'Delete Film',
      message: 'Delete this anime film entry and its takeaways?',
      confirmLabel: 'Delete Film',
      onConfirm: async () => {
        try {
          await movieApi.delete(id);
          addToast('Film removed');
          await refreshAll();
        } catch (err) {
          console.error(err);
          addToast('Error deleting movie', 'error');
        }
      },
    });
  };

  const handleMovieProgressDelta = async (id: number, delta: number) => {
    try {
      await movieApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Could not update film progress.', 'error');
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
        addToast(`Updated Ep ${data.episode_number} memory`);
      } else {
        await episodeNoteApi.create(data);
        addToast(`Recorded Ep ${data.episode_number} memory`);
      }
      await refreshAll();
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
      addToast('Episode memory deleted');
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
  const handleSaveRewatch = async (
    data: {
      target_type: RewatchTargetType;
      target_id: number;
      episode_number?: number | null;
      episode_title?: string | null;
      start_date?: string | null;
      finish_date?: string | null;
      rating?: number | null;
      notes?: string | null;
    },
    rewatchId?: number
  ) => {
    try {
      if (rewatchId) {
        const updated = await rewatchApi.update(rewatchId, data);
        addToast(`Updated rewatch reflection for "${updated.release_title || 'entry'}"`);
      } else {
        const created = await rewatchApi.create(data);
        addToast(`Recorded rewatch pass for "${created.release_title || 'entry'}"`);
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving rewatch pass', 'error');
    }
  };

  const handleDeleteRewatch = (id: number) => {
    requestConfirm({
      title: 'Delete Rewatch Pass',
      message: 'Delete this rewatch reflection entry?',
      confirmLabel: 'Delete Pass',
      onConfirm: async () => {
        try {
          await rewatchApi.delete(id);
          addToast('Rewatch pass deleted');
          await refreshAll();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // --- Character Handlers ---
  const handleSaveCharacter = async (
    data: { series: number; name: string; why?: string | null; images?: number[] },
    characterId?: number
  ) => {
    try {
      if (characterId) {
        const updated = await characterApi.update(characterId, data);
        addToast(`Updated "${updated.name}" reflection`);
      } else {
        const created = await characterApi.create(data);
        addToast(`Added "${created.name}" to memorable characters`);
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
      addToast('Error saving character', 'error');
    }
  };

  const handleDeleteCharacter = (id: number) => {
    requestConfirm({
      title: 'Remove Character',
      message: 'Remove this character from your memory log?',
      confirmLabel: 'Remove Character',
      onConfirm: async () => {
        try {
          await characterApi.delete(id);
          addToast('Character removed');
          await refreshAll();
        } catch (err) {
          console.error(err);
        }
      },
    });
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

  const handleDeleteBook = (id: number) => {
    requestConfirm({
      title: 'Delete Book Journal',
      message: 'Delete this book journal entry and all its reflections?',
      confirmLabel: 'Delete Book',
      onConfirm: async () => {
        try {
          await bookApi.delete(id);
          setBookList((prev) => prev.filter((b) => b.id !== id));
          addToast('Book entry removed');
          refreshStats();
          if (location.pathname.startsWith('/books/')) {
            navigate('/books');
          }
        } catch (err) {
          console.error(err);
          addToast('Error deleting book entry', 'error');
        }
      },
    });
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

  const openAddRewatchSeries = (series: AnimeSeries) => {
    setRewatchTargetSeries(series);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchSeason = (season: AnimeSeason) => {
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(season);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchMovie = (movie: AnimeMovie) => {
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(movie);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchEpisode = (season: AnimeSeason, episodeNumber?: number) => {
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(season);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(episodeNumber || 1);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openEditRewatchModal = (rewatch: Rewatch) => {
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(rewatch);
    setRewatchModalOpen(true);
  };

  const openAddCharacterModal = (series?: AnimeSeries) => {
    setCharacterTargetSeries(series || seriesList[0] || null);
    setEditCharacterTarget(null);
    setCharacterModalOpen(true);
  };

  const openEditCharacterModal = (character: FavoriteCharacter) => {
    setCharacterTargetSeries(null);
    setEditCharacterTarget(character);
    setCharacterModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
      <main id="journal-main" className="main-content">
        {loading ? (
          <div
            style={{
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--text-desk-muted)',
            }}
          >
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} color="var(--tungsten)" />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontStyle: 'italic' }}>
              Preparing the desk and reflections...
            </p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  stats={stats}
                  seriesList={seriesList}
                  bookList={bookList}
                  characterList={characterList}
                  rewatchList={rewatchList}
                  onNavigate={(tab, id) => {
                    if (tab === 'anime' && id) {
                      navigate(`/anime/${id}`);
                    } else if (tab === 'books' && id) {
                      navigate(`/books/${id}`);
                    } else {
                      handleTabChange(tab);
                    }
                  }}
                  onSeasonProgressDelta={handleSeasonProgressDelta}
                  onMovieProgressDelta={handleMovieProgressDelta}
                  onProgressBook={handleBookProgressDelta}
                  onEditSeason={(series, season) => openEditSeasonModal(season)}
                  onEditMovie={(series, movie) => openEditMovieModal(movie)}
                  onEditBook={openEditBookModal}
                  onOpenLogModal={openNewFranchiseModal}
                />
              }
            />

            <Route
              path="/anime"
              element={
                <AnimeView
                  seriesList={seriesList}
                  searchQuery={searchQuery}
                  onOpenDetail={(seriesId) => navigate(`/anime/${seriesId}`)}
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
              }
            />

            <Route
              path="/anime/:seriesId"
              element={
                <FranchiseDetailRouteWrapper
                  seriesList={seriesList}
                  allRewatches={rewatchList}
                  onBack={() => navigate('/anime')}
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
                />
              }
            />

            <Route
              path="/books"
              element={
                <BookView
                  bookList={bookList}
                  searchQuery={searchQuery}
                  onOpenDetail={(bookId) => navigate(`/books/${bookId}`)}
                  onEdit={openEditBookModal}
                  onDelete={handleDeleteBook}
                  onProgressDelta={handleBookProgressDelta}
                  onOpenNewModal={openNewBookModal}
                />
              }
            />

            <Route
              path="/books/:bookId"
              element={
                <BookDetailRouteWrapper
                  bookList={bookList}
                  onBack={() => navigate('/books')}
                  onEdit={openEditBookModal}
                  onDelete={handleDeleteBook}
                  onProgressDelta={handleBookProgressDelta}
                />
              }
            />

            <Route
              path="/characters"
              element={
                <CharactersView
                  characters={characterList}
                  searchQuery={searchQuery}
                  onEdit={openEditCharacterModal}
                  onDelete={handleDeleteCharacter}
                  onOpenAddModal={() => openAddCharacterModal()}
                />
              }
            />

            <Route
              path="/rewatches"
              element={
                <RewatchesView
                  rewatches={rewatchList}
                  seriesList={seriesList}
                  searchQuery={searchQuery}
                  onEdit={openEditRewatchModal}
                  onDelete={handleDeleteRewatch}
                  onOpenRewatchModal={() => {
                    setRewatchTargetSeason(null);
                    setRewatchTargetMovie(null);
                    setEditRewatchTarget(null);
                    setRewatchModalOpen(true);
                  }}
                />
              }
            />

            <Route
              path="/media"
              element={<MediaView onNotify={addToast} onRequestConfirm={requestConfirm} />}
            />
          </Routes>
        )}
      </main>

      {/* Global Modals */}
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

      <EpisodeNoteModal
        isOpen={episodeNoteModalOpen}
        onClose={() => setEpisodeNoteModalOpen(false)}
        season={targetSeasonForNotes}
        onSaveNote={handleSaveEpisodeNote}
        onDeleteNote={handleDeleteEpisodeNote}
      />

      <RewatchModal
        isOpen={rewatchModalOpen}
        onClose={() => setRewatchModalOpen(false)}
        targetSeries={rewatchTargetSeries}
        targetSeason={rewatchTargetSeason}
        targetMovie={rewatchTargetMovie}
        targetEpisodeNumber={rewatchTargetEpisodeNumber}
        editRewatch={editRewatchTarget}
        seriesList={seriesList}
        onSave={handleSaveRewatch}
      />

      <CharacterModal
        isOpen={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        seriesList={seriesList}
        preselectedSeries={characterTargetSeries}
        editCharacter={editCharacterTarget}
        onSave={handleSaveCharacter}
      />
    </div>
  );
};
