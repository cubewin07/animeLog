import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
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
import {
  findMovie,
  findSeason,
  nextBookState,
  nextMovieState,
  nextSeasonState,
  patchBook,
  patchMovie,
  patchSeason,
} from '../lib/journal/progress';
import { ProgressQueue } from '../lib/journal/progressQueue';
import { loadSnapshot, saveSnapshot } from './journalCache';
import { ToastMessage } from '../components/Toast';
import type { EntryModalMode } from '../components/EntryModal';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface JournalContextValue {
  // Data
  loading: boolean;
  loadFailed: boolean;
  retryLoad: () => void;
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
  confirmDialog: ConfirmDialogState;
  closeConfirm: () => void;
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
  handleSeasonProgressDelta: (id: number, delta: number) => void;
  handleSaveMovie: (data: any, id?: number) => Promise<void>;
  handleDeleteMovie: (id: number) => void;
  handleMovieProgressDelta: (id: number, delta: number) => void;
  handleSaveBook: (data: any, id?: number) => Promise<void>;
  handleDeleteBook: (id: number) => void;
  handleBookProgressDelta: (id: number, delta: number) => void;
  handleSaveCharacter: (data: any, id?: number) => Promise<void>;
  handleDeleteCharacter: (id: number) => void;
  handleSaveRewatch: (data: any, id?: number) => Promise<void>;
  handleDeleteRewatch: (id: number) => void;
  handleSaveEpisodeNote: (data: any, id?: number) => Promise<void>;
  handleDeleteEpisodeNote: (id: number) => Promise<void>;

  // Modal Triggers
  openNewFranchiseModal: () => void;
  openEditSeriesModal: (series: AnimeSeries) => void;
  openAddSeasonModal: (series: AnimeSeries) => void;
  openEditSeasonModal: (season: AnimeSeason) => void;
  openAddMovieModal: (series: AnimeSeries) => void;
  openEditMovieModal: (movie: AnimeMovie) => void;
  openNewBookModal: () => void;
  openEditBookModal: (book: Book) => void;
  openAddRewatch: () => void;
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

type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never }[keyof T];
type DataKeys =
  | 'loading'
  | 'loadFailed'
  | 'seriesList'
  | 'bookList'
  | 'rewatchList'
  | 'characterList'
  | 'genres'
  | 'studios'
  | 'stats';

export type JournalData = Pick<JournalContextValue, DataKeys>;
export type JournalActions = Pick<JournalContextValue, FunctionKeys<JournalContextValue>>;
export type JournalUI = Omit<JournalContextValue, DataKeys | FunctionKeys<JournalContextValue>>;

/*
 * Three contexts, so a component only re-renders for what it uses. A toast or an opening modal
 * no longer re-renders every page, and actions never change identity at all.
 */
const JournalDataContext = createContext<JournalData | null>(null);
const JournalActionsContext = createContext<JournalActions | null>(null);
const JournalUIContext = createContext<JournalUI | null>(null);

function useRequired<T>(context: React.Context<T | null>): T {
  const value = useContext(context);
  if (!value) throw new Error('Journal hooks must be used within a JournalProvider');
  return value;
}

export const useJournalData = (): JournalData => useRequired(JournalDataContext);
export const useJournalActions = (): JournalActions => useRequired(JournalActionsContext);
export const useJournalUI = (): JournalUI => useRequired(JournalUIContext);

/** Stable wrappers that always call the latest version of each action. */
function buildStableActions(
  value: JournalContextValue,
  latest: React.RefObject<JournalContextValue>
): JournalActions {
  const entries = Object.entries(value)
    .filter(([, member]) => typeof member === 'function')
    .map(([key]) => [
      key,
      (...args: unknown[]) => (latest.current[key as keyof JournalContextValue] as (...a: unknown[]) => unknown)(...args),
    ]);
  return Object.fromEntries(entries) as JournalActions;
}

const PROGRESS_SAVE_DELAY_MS = 250;
const SNAPSHOT_SAVE_DELAY_MS = 500;
type ProgressRecord = AnimeSeason | AnimeMovie | Book;

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [snapshot] = useState(loadSnapshot);
  // With a saved copy the app draws straight away and refreshes quietly behind it
  const [loading, setLoading] = useState(!snapshot);
  const [loadFailed, setLoadFailed] = useState(false);

  // Data
  const [seriesList, setSeriesList] = useState<AnimeSeries[]>(snapshot?.seriesList ?? []);
  const [bookList, setBookList] = useState<Book[]>(snapshot?.bookList ?? []);
  const [rewatchList, setRewatchList] = useState<Rewatch[]>(snapshot?.rewatchList ?? []);
  const [characterList, setCharacterList] = useState<FavoriteCharacter[]>(snapshot?.characterList ?? []);
  const [genres, setGenres] = useState<Genre[]>(snapshot?.genres ?? []);
  const [studios, setStudios] = useState<Studio[]>(snapshot?.studios ?? []);
  const [stats, setStats] = useState<JournalStats>(snapshot?.stats ?? {
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
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

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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

  // Newest request wins, so a slow older response can't overwrite newer data
  const fetchId = useRef(0);
  const refreshWhenIdle = useRef(false);
  const progressQueue = useRef<ProgressQueue<ProgressRecord> | null>(null);

  const refreshAll = useCallback(async () => {
    // Progress taps still being saved would be overwritten by older server data, so wait for them
    if (progressQueue.current?.busy) {
      refreshWhenIdle.current = true;
      return;
    }
    const id = ++fetchId.current;
    try {
      const [s, b, r, c, stt] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        statsApi.getStats(),
      ]);
      if (id !== fetchId.current) return;
      if (progressQueue.current?.busy) {
        refreshWhenIdle.current = true;
        return;
      }
      setSeriesList(s);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setStats(stt);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  const hasSnapshot = Boolean(snapshot);
  const loadData = useCallback(async () => {
    const id = ++fetchId.current;
    setLoadFailed(false);
    try {
      const [s, b, r, c, g, st, stt] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        genreApi.list(),
        studioApi.list(),
        statsApi.getStats(),
      ]);
      setGenres(g);
      setStudios(st);
      if (id !== fetchId.current || progressQueue.current?.busy) {
        refreshWhenIdle.current = refreshWhenIdle.current || Boolean(progressQueue.current?.busy);
        return;
      }
      setSeriesList(s);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setStats(stt);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (hasSnapshot) {
        addToast('Couldn’t reach the server. Showing your last saved copy.', 'info');
      } else {
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, hasSnapshot]);

  useEffect(() => {
    // Fetching on mount is exactly what this effect is for
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const retryLoad = useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  // Keep the saved copy current, without writing on every tap
  useEffect(() => {
    if (loading || loadFailed) return;
    const timer = setTimeout(() => {
      saveSnapshot({ seriesList, bookList, rewatchList, characterList, genres, studios, stats });
    }, SNAPSHOT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, loadFailed, seriesList, bookList, rewatchList, characterList, genres, studios, stats]);

  // Instant progress: the screen changes now, the queue saves in the background
  const [queue] = useState(
    () =>
      new ProgressQueue<ProgressRecord>({
        delayMs: PROGRESS_SAVE_DELAY_MS,
        onSettled: (key, confirmed, before) => {
          applyRecord(key, confirmed);
          if (confirmed.status !== before.status) {
            statsApi.getStats().then(setStats).catch(() => {});
          }
        },
        onFailed: (key, confirmed, error) => {
          console.error('Failed to save progress:', error);
          applyRecord(key, confirmed);
          addToast('Couldn’t save your progress, so it was put back. Check that the server is running.', 'error');
        },
        onIdle: () => {
          if (refreshWhenIdle.current) {
            refreshWhenIdle.current = false;
            refreshAll();
          }
        },
      })
  );

  function applyRecord(key: string, record: ProgressRecord) {
    if (key.startsWith('season-')) setSeriesList((list) => patchSeason(list, record as AnimeSeason));
    else if (key.startsWith('movie-')) setSeriesList((list) => patchMovie(list, record as AnimeMovie));
    else setBookList((list) => patchBook(list, record as Book));
  }

  useEffect(() => {
    progressQueue.current = queue;
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') queue.flushAll();
    };
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => document.removeEventListener('visibilitychange', flushWhenHidden);
  }, [queue]);

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
    setEntryModalMode('book');
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

  const openAddRewatch = () => {
    if (seriesList.length === 0) {
      addToast('Add an anime first, then log a rewatch of it.', 'info');
      openNewFranchiseModal();
      return;
    }
    setRewatchTargetSeries(null);
    setRewatchTargetSeason(null);
    setRewatchTargetMovie(null);
    setRewatchTargetEpisodeNumber(null);
    setEditRewatchTarget(null);
    setRewatchModalOpen(true);
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
        const saved = await seasonApi.update(id, data);
        setSeriesList((list) => patchSeason(list, saved));
        addToast('Season updated');
      } else {
        await seasonApi.create(data);
        addToast('Season added');
        refreshAll();
      }
      setEntryModalOpen(false);
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

  const handleSeasonProgressDelta = (id: number, delta: number) => {
    const season = findSeason(seriesList, id);
    const next = season && nextSeasonState(season, delta);
    if (!season || !next) return;
    setSeriesList((list) => patchSeason(list, next));
    queue.enqueue(`season-${id}`, delta, season, (d) => seasonApi.updateProgress(id, d));
  };

  const handleSaveMovie = async (data: any, id?: number) => {
    try {
      if (id) {
        const saved = await movieApi.update(id, data);
        setSeriesList((list) => patchMovie(list, saved));
        addToast('Movie updated');
      } else {
        await movieApi.create(data);
        addToast('Movie added');
        refreshAll();
      }
      setEntryModalOpen(false);
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

  const handleMovieProgressDelta = (id: number, delta: number) => {
    const movie = findMovie(seriesList, id);
    const next = movie && nextMovieState(movie, delta);
    if (!movie || !next) return;
    setSeriesList((list) => patchMovie(list, next));
    queue.enqueue(`movie-${id}`, delta, movie, (d) => movieApi.updateProgress(id, d));
  };

  const handleSaveBook = async (data: any, id?: number) => {
    try {
      if (id) {
        const saved = await bookApi.update(id, data);
        setBookList((list) => patchBook(list, saved));
        addToast('Book updated');
      } else {
        const saved = await bookApi.create(data);
        setBookList((list) => [saved, ...list]);
        addToast('Book added');
      }
      setEntryModalOpen(false);
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

  const handleBookProgressDelta = (id: number, delta: number) => {
    const book = bookList.find((b) => b.id === id);
    const next = book && nextBookState(book, delta);
    if (!book || !next) return;
    setBookList((list) => patchBook(list, next));
    queue.enqueue(`book-${id}`, delta, book, (d) => bookApi.updateProgress(id, d));
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
    loadFailed,
    retryLoad,
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
    confirmDialog,
    closeConfirm,
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
    openAddRewatch,
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

  const latestValue = useRef(value);
  useLayoutEffect(() => {
    latestValue.current = value;
  });
  const [actions] = useState(() => buildStableActions(value, latestValue));

  const data = useMemo<JournalData>(
    () => ({ loading, loadFailed, seriesList, bookList, rewatchList, characterList, genres, studios, stats }),
    [loading, loadFailed, seriesList, bookList, rewatchList, characterList, genres, studios, stats]
  );

  const ui = useMemo<JournalUI>(
    () => ({
      searchQuery,
      toasts,
      confirmDialog,
      entryModalOpen,
      entryModalMode,
      entryModalEditTarget,
      entryModalTargetSeries,
      episodeNoteModalOpen,
      targetSeasonForNotes,
      targetNoteForEpisodeModal,
      rewatchModalOpen,
      rewatchTargetSeries,
      rewatchTargetSeason,
      rewatchTargetMovie,
      rewatchTargetEpisodeNumber,
      editRewatchTarget,
      characterModalOpen,
      characterTargetSeries,
      editCharacterTarget,
      composerOpen,
      composerInitialTarget,
      paletteOpen,
    }),
    [
      searchQuery,
      toasts,
      confirmDialog,
      entryModalOpen,
      entryModalMode,
      entryModalEditTarget,
      entryModalTargetSeries,
      episodeNoteModalOpen,
      targetSeasonForNotes,
      targetNoteForEpisodeModal,
      rewatchModalOpen,
      rewatchTargetSeries,
      rewatchTargetSeason,
      rewatchTargetMovie,
      rewatchTargetEpisodeNumber,
      editRewatchTarget,
      characterModalOpen,
      characterTargetSeries,
      editCharacterTarget,
      composerOpen,
      composerInitialTarget,
      paletteOpen,
    ]
  );

  return (
    <JournalActionsContext.Provider value={actions}>
      <JournalDataContext.Provider value={data}>
        <JournalUIContext.Provider value={ui}>{children}</JournalUIContext.Provider>
      </JournalDataContext.Provider>
    </JournalActionsContext.Provider>
  );
};
