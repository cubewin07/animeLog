import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
} from '../types';
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
} from '../api/client';
import { ToastMessage } from '../components/Toast';
import { EntryModalMode } from '../components/EntryModal';

export interface JournalContextValue {
  // Data
  loading: boolean;
  seriesList: AnimeSeries[];
  bookList: Book[];
  rewatchList: Rewatch[];
  characterList: FavoriteCharacter[];
  genres: Genre[];
  studios: Studio[];
  stats: JournalStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshAll: () => Promise<void>;

  // Toast & Confirm
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  requestConfirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => void;

  // Mutation Handlers
  handleSaveSeries: (data: any, id?: number) => Promise<void>;
  handleDeleteSeries: (id: number) => void;
  handleSaveSeason: (data: any, id?: number) => Promise<void>;
  handleDeleteSeason: (id: number) => void;
  handleSeasonProgressDelta: (id: number, delta: number) => Promise<void>;
  handleSaveMovie: (data: any, id?: number) => Promise<void>;
  handleDeleteMovie: (id: number) => void;
  handleMovieProgressDelta: (id: number, delta: number) => Promise<void>;
  handleSaveBook: (data: any, id?: number) => Promise<void>;
  handleDeleteBook: (id: number) => void;
  handleBookProgressDelta: (id: number, delta: number) => Promise<void>;
  handleSaveCharacter: (data: any, id?: number) => Promise<void>;
  handleDeleteCharacter: (id: number) => void;
  handleSaveRewatch: (data: any, id?: number) => Promise<void>;
  handleDeleteRewatch: (id: number) => void;
  handleSaveEpisodeNote: (data: any, id?: number) => Promise<void>;
  handleDeleteEpisodeNote: (id: number) => void;

  // Modal Triggers
  openNewFranchiseModal: () => void;
  openEditSeriesModal: (series: AnimeSeries) => void;
  openAddSeasonModal: (series: AnimeSeries) => void;
  openEditSeasonModal: (season: AnimeSeason) => void;
  openAddMovieModal: (series: AnimeSeries) => void;
  openEditMovieModal: (movie: AnimeMovie) => void;
  openNewBookModal: () => void;
  openEditBookModal: (book: Book) => void;
  openAddRewatchSeries: (series: AnimeSeries) => void;
  openAddRewatchSeason: (season: AnimeSeason) => void;
  openAddRewatchMovie: (movie: AnimeMovie) => void;
  openAddRewatchEpisode: (season: AnimeSeason, episodeNumber: number) => void;
  openEditRewatchModal: (rewatch: Rewatch) => void;
  openAddCharacterModal: (series?: AnimeSeries) => void;
  openEditCharacterModal: (character: FavoriteCharacter) => void;
  openEpisodeNotesModal: (season: AnimeSeason, note?: EpisodeNote) => void;

  // Modal visibility states & controls
  entryModalOpen: boolean;
  setEntryModalOpen: (open: boolean) => void;
  entryModalMode: EntryModalMode;
  entryModalEditTarget: { type: 'series' | 'season' | 'movie' | 'book'; data: any } | null;
  entryModalTargetSeries: AnimeSeries | null;

  episodeNoteModalOpen: boolean;
  setEpisodeNoteModalOpen: (open: boolean) => void;
  targetSeasonForNotes: AnimeSeason | null;
  targetNoteForEpisodeModal: EpisodeNote | null;

  rewatchModalOpen: boolean;
  setRewatchModalOpen: (open: boolean) => void;
  rewatchTargetSeries: AnimeSeries | null;
  rewatchTargetSeason: AnimeSeason | null;
  rewatchTargetMovie: AnimeMovie | null;
  rewatchTargetEpisodeNumber: number | null;
  editRewatchTarget: Rewatch | null;

  characterModalOpen: boolean;
  setCharacterModalOpen: (open: boolean) => void;
  characterTargetSeries: AnimeSeries | null;
  editCharacterTarget: FavoriteCharacter | null;

  // Composer & Palette Triggers (Lamplight Shell)
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  composerInitialTarget: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
  } | null;
  openComposer: (initialTarget?: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
  }) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  openPalette: () => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export const useJournal = (): JournalContextValue => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Data
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

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm state
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

  const requestConfirm = useCallback((options: {
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
  }, []);

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
  const [targetNoteForEpisodeModal, setTargetNoteForEpisodeModal] = useState<EpisodeNote | null>(null);

  const [rewatchModalOpen, setRewatchModalOpen] = useState(false);
  const [rewatchTargetSeries, setRewatchTargetSeries] = useState<AnimeSeries | null>(null);
  const [rewatchTargetSeason, setRewatchTargetSeason] = useState<AnimeSeason | null>(null);
  const [rewatchTargetMovie, setRewatchTargetMovie] = useState<AnimeMovie | null>(null);
  const [rewatchTargetEpisodeNumber, setRewatchTargetEpisodeNumber] = useState<number | null>(null);
  const [editRewatchTarget, setEditRewatchTarget] = useState<Rewatch | null>(null);

  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [characterTargetSeries, setCharacterTargetSeries] = useState<AnimeSeries | null>(null);
  const [editCharacterTarget, setEditCharacterTarget] = useState<FavoriteCharacter | null>(null);

  // Composer & Palette
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitialTarget, setComposerInitialTarget] = useState<{
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
  } | null>(null);

  const openComposer = useCallback((initialTarget?: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
  }) => {
    setComposerInitialTarget(initialTarget || null);
    setComposerOpen(true);
  }, []);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => {
    setPaletteOpen(true);
  }, []);

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
    } catch (err: any) {
      console.error('Failed to load data:', err);
      addToast('Failed to load journal data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const refreshAll = useCallback(async () => {
    try {
      const [s, b, r, c, stt] = await Promise.all([
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
      setStats(stt);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Modal openers
  const openNewFranchiseModal = () => {
    setEntryModalMode('new-franchise');
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(null);
    setEntryModalOpen(true);
  };

  const openEditSeriesModal = (series: AnimeSeries) => {
    setEntryModalMode('edit-series');
    setEntryModalEditTarget({ type: 'series', data: series });
    setEntryModalTargetSeries(series);
    setEntryModalOpen(true);
  };

  const openAddSeasonModal = (series: AnimeSeries) => {
    setEntryModalMode('add-season');
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(series);
    setEntryModalOpen(true);
  };

  const openEditSeasonModal = (season: AnimeSeason) => {
    const parentSeries = seriesList.find((s) => s.id === season.series);
    setEntryModalMode('edit-season');
    setEntryModalEditTarget({ type: 'season', data: season });
    setEntryModalTargetSeries(parentSeries || null);
    setEntryModalOpen(true);
  };

  const openAddMovieModal = (series: AnimeSeries) => {
    setEntryModalMode('add-movie');
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(series);
    setEntryModalOpen(true);
  };

  const openEditMovieModal = (movie: AnimeMovie) => {
    const parentSeries = seriesList.find((s) => s.id === movie.series);
    setEntryModalMode('edit-movie');
    setEntryModalEditTarget({ type: 'movie', data: movie });
    setEntryModalTargetSeries(parentSeries || null);
    setEntryModalOpen(true);
  };

  const openNewBookModal = () => {
    setEntryModalMode('new-book');
    setEntryModalEditTarget(null);
    setEntryModalTargetSeries(null);
    setEntryModalOpen(true);
  };

  const openEditBookModal = (book: Book) => {
    setEntryModalMode('edit-book');
    setEntryModalEditTarget({ type: 'book', data: book });
    setEntryModalTargetSeries(null);
    setEntryModalOpen(true);
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
    const parent = seriesList.find((s) => s.id === season.series);
    setRewatchTargetSeries(parent || null);
    setRewatchTargetSeason(season);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchMovie = (movie: AnimeMovie) => {
    const parent = seriesList.find((s) => s.id === movie.series);
    setRewatchTargetSeries(parent || null);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(movie);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openAddRewatchEpisode = (season: AnimeSeason, episodeNumber: number) => {
    const parent = seriesList.find((s) => s.id === season.series);
    setRewatchTargetSeries(parent || null);
    setRewatchTargetSeason(season);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(episodeNumber);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
  };

  const openEditRewatchModal = (rewatch: Rewatch) => {
    setEditRewatchTarget(rewatch);
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(rewatch.episode_number || null);
    setRewatchModalOpen(true);
  };

  const openAddCharacterModal = (series?: AnimeSeries) => {
    setCharacterTargetSeries(series || null);
    setEditCharacterTarget(null);
    setCharacterModalOpen(true);
  };

  const openEditCharacterModal = (character: FavoriteCharacter) => {
    const parentSeries = seriesList.find((s) => s.id === character.series);
    setCharacterTargetSeries(parentSeries || null);
    setEditCharacterTarget(character);
    setCharacterModalOpen(true);
  };

  const openEpisodeNotesModal = (season: AnimeSeason, note?: EpisodeNote) => {
    setTargetSeasonForNotes(season);
    setTargetNoteForEpisodeModal(note || null);
    setEpisodeNoteModalOpen(true);
  };

  // CRUD Handlers
  const handleSaveSeries = async (data: any, id?: number) => {
    try {
      if (id) {
        await seriesApi.update(id, data);
        addToast('Franchise updated');
      } else {
        await seriesApi.create(data);
        addToast('New franchise recorded');
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving franchise: ${err.message}`, 'error');
    }
  };

  const handleDeleteSeries = (id: number) => {
    requestConfirm({
      title: 'Delete Franchise',
      message: 'Are you sure you want to delete this franchise? All seasons, movies, and notes will be permanently removed.',
      confirmLabel: 'Delete Forever',
      onConfirm: async () => {
        try {
          await seriesApi.delete(id);
          addToast('Franchise deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting franchise: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleSaveSeason = async (data: any, id?: number) => {
    try {
      if (id) {
        await seasonApi.update(id, data);
        addToast('Season updated');
      } else {
        await seasonApi.create(data);
        addToast('Season added');
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving season: ${err.message}`, 'error');
    }
  };

  const handleDeleteSeason = (id: number) => {
    requestConfirm({
      title: 'Delete Season',
      message: 'Are you sure you want to delete this season and its episode notes?',
      confirmLabel: 'Delete Season',
      onConfirm: async () => {
        try {
          await seasonApi.delete(id);
          addToast('Season deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting season: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleSeasonProgressDelta = async (id: number, delta: number) => {
    try {
      await seasonApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error updating season progress: ${err.message}`, 'error');
    }
  };

  const handleSaveMovie = async (data: any, id?: number) => {
    try {
      if (id) {
        await movieApi.update(id, data);
        addToast('Movie updated');
      } else {
        await movieApi.create(data);
        addToast('Movie added');
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving movie: ${err.message}`, 'error');
    }
  };

  const handleDeleteMovie = (id: number) => {
    requestConfirm({
      title: 'Delete Movie',
      message: 'Are you sure you want to delete this movie entry?',
      confirmLabel: 'Delete Movie',
      onConfirm: async () => {
        try {
          await movieApi.delete(id);
          addToast('Movie deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting movie: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleMovieProgressDelta = async (id: number, delta: number) => {
    try {
      await movieApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error updating movie progress: ${err.message}`, 'error');
    }
  };

  const handleSaveBook = async (data: any, id?: number) => {
    try {
      if (id) {
        await bookApi.update(id, data);
        addToast('Book updated');
      } else {
        await bookApi.create(data);
        addToast('Book added');
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving book: ${err.message}`, 'error');
    }
  };

  const handleDeleteBook = (id: number) => {
    requestConfirm({
      title: 'Delete Book',
      message: 'Are you sure you want to delete this book journal entry?',
      confirmLabel: 'Delete Book',
      onConfirm: async () => {
        try {
          await bookApi.delete(id);
          addToast('Book deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting book: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleBookProgressDelta = async (id: number, delta: number) => {
    try {
      await bookApi.updateProgress(id, delta);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error updating book progress: ${err.message}`, 'error');
    }
  };

  const handleSaveCharacter = async (data: any, id?: number) => {
    try {
      if (id) {
        await characterApi.update(id, data);
        addToast('Character reflection updated');
      } else {
        await characterApi.create(data);
        addToast('Character remembered');
      }
      setCharacterModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving character: ${err.message}`, 'error');
    }
  };

  const handleDeleteCharacter = (id: number) => {
    requestConfirm({
      title: 'Delete Character',
      message: 'Are you sure you want to remove this character from your remembered list?',
      confirmLabel: 'Remove Character',
      onConfirm: async () => {
        try {
          await characterApi.delete(id);
          addToast('Character removed');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting character: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleSaveRewatch = async (data: any, id?: number) => {
    try {
      if (id) {
        await rewatchApi.update(id, data);
        addToast('Rewatch pass updated');
      } else {
        await rewatchApi.create(data);
        addToast('Rewatch pass recorded');
      }
      setRewatchModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving rewatch pass: ${err.message}`, 'error');
    }
  };

  const handleDeleteRewatch = (id: number) => {
    requestConfirm({
      title: 'Delete Rewatch',
      message: 'Are you sure you want to delete this return reflection pass?',
      confirmLabel: 'Delete Pass',
      onConfirm: async () => {
        try {
          await rewatchApi.delete(id);
          addToast('Rewatch pass deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting rewatch pass: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleSaveEpisodeNote = async (data: any, id?: number) => {
    try {
      if (id) {
        await episodeNoteApi.update(id, data);
        addToast('Episode memory updated');
      } else {
        await episodeNoteApi.create(data);
        addToast('Episode memory recorded');
      }
      setEpisodeNoteModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving episode memory: ${err.message}`, 'error');
    }
  };

  const handleDeleteEpisodeNote = async (id: number) => {
    try {
      await episodeNoteApi.delete(id);
      addToast('Episode memory deleted');
      setEpisodeNoteModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error deleting episode memory: ${err.message}`, 'error');
    }
  };

  const value: JournalContextValue = {
    loading,
    seriesList,
    bookList,
    rewatchList,
    characterList,
    genres,
    studios,
    stats,
    searchQuery,
    setSearchQuery,
    refreshAll,
    toasts,
    addToast,
    removeToast,
    requestConfirm,
    handleSaveSeries,
    handleDeleteSeries,
    handleSaveSeason,
    handleDeleteSeason,
    handleSeasonProgressDelta,
    handleSaveMovie,
    handleDeleteMovie,
    handleMovieProgressDelta,
    handleSaveBook,
    handleDeleteBook,
    handleBookProgressDelta,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleSaveRewatch,
    handleDeleteRewatch,
    handleSaveEpisodeNote,
    handleDeleteEpisodeNote,
    openNewFranchiseModal,
    openEditSeriesModal,
    openAddSeasonModal,
    openEditSeasonModal,
    openAddMovieModal,
    openEditMovieModal,
    openNewBookModal,
    openEditBookModal,
    openAddRewatchSeries,
    openAddRewatchSeason,
    openAddRewatchMovie,
    openAddRewatchEpisode,
    openEditRewatchModal,
    openAddCharacterModal,
    openEditCharacterModal,
    openEpisodeNotesModal,
    entryModalOpen,
    setEntryModalOpen,
    entryModalMode,
    entryModalEditTarget,
    entryModalTargetSeries,
    episodeNoteModalOpen,
    setEpisodeNoteModalOpen,
    targetSeasonForNotes,
    targetNoteForEpisodeModal,
    rewatchModalOpen,
    setRewatchModalOpen,
    rewatchTargetSeries,
    rewatchTargetSeason,
    rewatchTargetMovie,
    rewatchTargetEpisodeNumber,
    editRewatchTarget,
    characterModalOpen,
    setCharacterModalOpen,
    characterTargetSeries,
    editCharacterTarget,
    composerOpen,
    setComposerOpen,
    composerInitialTarget,
    openComposer,
    paletteOpen,
    setPaletteOpen,
    openPalette,
  };

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
};
