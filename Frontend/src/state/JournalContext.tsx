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
  ActivityEvent,
  ActivityKind,
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
  activityApi,
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
import { getGamePrefs } from '../lib/progression';
import { ToastMessage } from '../components/Toast';
import type { EntryModalMode } from '../features/add-title/AddTitleModal';

export interface QuickLogPrompt {
  kind: 'season' | 'movie' | 'book';
  targetId: number;
  title: string;
  subtitle: string;
  seriesId?: number;
  stepNumber: number;
  unit: 'episode' | 'minutes' | 'pages';
  delta: number;
  existingNote?: string | null;
  existingRating?: number | null;
  coverUrl?: string | null;
  createdAt: number;
}

export interface FinalePrompt {
  kind: 'season' | 'movie' | 'book';
  targetId: number;
  seriesId?: number;
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  totalCount?: number | null;
  existingNote?: string | null;
  currentRating?: number | null;
}

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
  activityList: ActivityEvent[];
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

  // Composer, Palette, Quick Log & Finale
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  composerInitialTarget: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
    initialNote?: string;
    initialRating?: number | null;
  } | null;
  openComposer: (initialTarget?: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
    initialNote?: string;
    initialRating?: number | null;
  }) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  openPalette: () => void;

  quickLogPrompt: QuickLogPrompt | null;
  dismissQuickLog: () => void;
  finalePrompt: FinalePrompt | null;
  dismissFinale: () => void;
}

type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never }[keyof T];
type DataKeys =
  | 'loading'
  | 'loadFailed'
  | 'seriesList'
  | 'bookList'
  | 'rewatchList'
  | 'characterList'
  | 'activityList'
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
type ActivityFetchResult = { ok: true; items: ActivityEvent[] } | { ok: false };

function fetchActivitySafe(): Promise<ActivityFetchResult> {
  return activityApi.list().then(
    (items) => ({ ok: true as const, items }),
    () => ({ ok: false as const })
  );
}

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
  const [activityList, setActivityList] = useState<ActivityEvent[]>(snapshot?.activityList ?? []);
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
    initialNote?: string;
    initialRating?: number | null;
  } | null>(null);

  const openComposer = useCallback((initialTarget?: {
    targetKind: 'season' | 'movie' | 'book' | 'character';
    id: number;
    title: string;
    context?: string;
    defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
    episodeNumber?: number;
    initialNote?: string;
    initialRating?: number | null;
  }) => {
    setComposerInitialTarget(initialTarget || null);
    setComposerOpen(true);
  }, []);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => {
    setPaletteOpen(true);
  }, []);

  const [quickLogPrompt, setQuickLogPrompt] = useState<QuickLogPrompt | null>(null);
  const dismissQuickLog = useCallback(() => {
    setQuickLogPrompt(null);
  }, []);

  const [finalePrompt, setFinalePrompt] = useState<FinalePrompt | null>(null);
  const dismissFinale = useCallback(() => {
    setFinalePrompt(null);
  }, []);

  // Newest request wins, so a slow older response can't overwrite newer data
  const fetchId = useRef(0);
  const activityFetchId = useRef(0);
  const refreshWhenIdle = useRef(false);
  const needsActivityRefresh = useRef(false);
  const progressQueue = useRef<ProgressQueue<ProgressRecord> | null>(null);
  const nextSyntheticActivityId = useRef(-1);
  const syntheticIdsByKey = useRef<Map<string, Set<number>>>(new Map());

  const clearSyntheticActivityForKey = useCallback((key: string) => {
    const ids = syntheticIdsByKey.current.get(key);
    if (!ids || ids.size === 0) return;
    const idsToRemove = new Set(ids);
    syntheticIdsByKey.current.delete(key);
    setActivityList((prev) => prev.filter((e) => !idsToRemove.has(e.id)));
  }, []);

  const appendLocalActivity = useCallback(
    (kind: ActivityKind, targetType: string, targetId: number, title: string, delta: number) => {
      const syntheticId = nextSyntheticActivityId.current--;
      const key = `${targetType}-${targetId}`;
      let ids = syntheticIdsByKey.current.get(key);
      if (!ids) {
        ids = new Set<number>();
        syntheticIdsByKey.current.set(key, ids);
      }
      ids.add(syntheticId);
      const event: ActivityEvent = {
        id: syntheticId,
        kind,
        target_type: targetType,
        target_id: targetId,
        title,
        delta,
        backfilled: false,
        created_at: new Date().toISOString(),
      };
      setActivityList((prev) => [event, ...prev]);
    },
    []
  );

  const refreshActivity = useCallback(async () => {
    if (progressQueue.current?.busy) {
      needsActivityRefresh.current = true;
      return;
    }
    const id = ++activityFetchId.current;
    const actResult = await fetchActivitySafe();
    if (!actResult.ok) return;
    if (id !== activityFetchId.current || progressQueue.current?.busy) {
      if (progressQueue.current?.busy) needsActivityRefresh.current = true;
      return;
    }
    syntheticIdsByKey.current.clear();
    setActivityList(actResult.items);
  }, []);

  const refreshAll = useCallback(async () => {
    // Progress taps still being saved would be overwritten by older server data, so wait for them
    if (progressQueue.current?.busy) {
      refreshWhenIdle.current = true;
      return;
    }
    const id = ++fetchId.current;
    const actId = ++activityFetchId.current;
    try {
      const [s, b, r, c, stt, actResult] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        statsApi.getStats(),
        fetchActivitySafe(),
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
      if (actResult.ok && actId === activityFetchId.current) {
        syntheticIdsByKey.current.clear();
        setActivityList(actResult.items);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  const hasSnapshot = Boolean(snapshot);
  const loadData = useCallback(async () => {
    const id = ++fetchId.current;
    const actId = ++activityFetchId.current;
    setLoadFailed(false);
    try {
      const [s, b, r, c, g, st, stt, actResult] = await Promise.all([
        seriesApi.list(),
        bookApi.list(),
        rewatchApi.list(),
        characterApi.list(),
        genreApi.list(),
        studioApi.list(),
        statsApi.getStats(),
        fetchActivitySafe(),
      ]);
      if (id !== fetchId.current || progressQueue.current?.busy) {
        refreshWhenIdle.current = refreshWhenIdle.current || Boolean(progressQueue.current?.busy);
        return;
      }
      setGenres(g);
      setStudios(st);
      setSeriesList(s);
      setBookList(b);
      setRewatchList(r);
      setCharacterList(c);
      setStats(stt);
      if (actResult.ok && actId === activityFetchId.current) {
        syntheticIdsByKey.current.clear();
        setActivityList(actResult.items);
      }
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
      saveSnapshot({ seriesList, bookList, rewatchList, characterList, activityList, genres, studios, stats });
    }, SNAPSHOT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, loadFailed, seriesList, bookList, rewatchList, characterList, activityList, genres, studios, stats]);

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
          if (confirmed === before) {
            clearSyntheticActivityForKey(key);
          } else {
            needsActivityRefresh.current = true;
          }
        },
        onFailed: (key, confirmed, error) => {
          console.error('Failed to save progress:', error);
          clearSyntheticActivityForKey(key);
          applyRecord(key, confirmed);
          addToast('Couldn’t save your progress, so it was put back. Check that the server is running.', 'error');
        },
        onIdle: () => {
          if (refreshWhenIdle.current) {
            refreshWhenIdle.current = false;
            needsActivityRefresh.current = false;
            refreshAll();
          } else if (needsActivityRefresh.current) {
            needsActivityRefresh.current = false;
            refreshActivity();
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
        addToast('Series updated');
      } else {
        await seriesApi.create(data);
        addToast('Series added');
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving series: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDeleteSeries = (id: number) => {
    requestConfirm({
      title: 'Delete Series',
      message: 'Are you sure you want to delete this series? All seasons, movies, and notes will be permanently removed.',
      confirmLabel: 'Delete Forever',
      onConfirm: async () => {
        try {
          await seriesApi.delete(id);
          addToast('Series deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting series: ${err.message}`, 'error');
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
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving season: ${err.message}`, 'error');
      throw err;
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
    const displayTitle = season.series_title ? `${season.series_title} — ${season.title}` : season.title;
    appendLocalActivity('EPISODE_PROGRESS', 'season', id, displayTitle, delta);
    if (next.status === 'COMPLETED' && season.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'season', id, displayTitle, 1);
    } else if (season.status === 'COMPLETED' && next.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'season', id, displayTitle, -1);
    }
    queue.enqueue(`season-${id}`, delta, season, (d) => seasonApi.updateProgress(id, d));

    const parentSeries = seriesList.find((s) => s.id === season.series);
    const seriesTitle = season.series_title || parentSeries?.title || season.title;
    const coverUrl =
      season.cover_image_url ||
      season.image_url ||
      parentSeries?.cover_image_url ||
      parentSeries?.image_url ||
      null;
    const seasonSubtitle =
      season.title && season.title !== seriesTitle
        ? `Season ${season.season_number} · ${season.title}`
        : `Season ${season.season_number}`;

    if (delta > 0) {
      if (next.status === 'COMPLETED' && season.status !== 'COMPLETED' && getGamePrefs().celebrations) {
        setQuickLogPrompt(null);
        setFinalePrompt({
          kind: 'season',
          targetId: id,
          seriesId: season.series,
          title: seriesTitle,
          subtitle: season.total_episodes
            ? `${seasonSubtitle} · ${season.total_episodes} episodes`
            : seasonSubtitle,
          coverUrl,
          totalCount: season.total_episodes,
          existingNote: season.notes ?? null,
          currentRating: season.rating ?? null,
        });
      } else {
        const epNote = season.episode_notes?.find((n) => n.episode_number === next.progress);
        setQuickLogPrompt((prev) => ({
          kind: 'season',
          targetId: id,
          title: seriesTitle,
          subtitle: seasonSubtitle,
          seriesId: season.series,
          stepNumber: next.progress,
          unit: 'episode',
          delta: prev && prev.kind === 'season' && prev.targetId === id ? prev.delta + delta : delta,
          existingNote: epNote?.note ?? null,
          existingRating: epNote?.rating ?? null,
          coverUrl,
          createdAt: Date.now(),
        }));
      }
    } else if (delta < 0) {
      setQuickLogPrompt((prev) => (prev && prev.kind === 'season' && prev.targetId === id ? null : prev));
    }
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
      }
      setEntryModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving movie: ${err.message}`, 'error');
      throw err;
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
    const displayTitle = movie.series_title ? `${movie.series_title} — ${movie.title}` : movie.title;
    appendLocalActivity('MOVIE_PROGRESS', 'movie', id, displayTitle, delta);
    if (next.status === 'COMPLETED' && movie.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'movie', id, displayTitle, 1);
    } else if (movie.status === 'COMPLETED' && next.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'movie', id, displayTitle, -1);
    }
    queue.enqueue(`movie-${id}`, delta, movie, (d) => movieApi.updateProgress(id, d));

    const parentSeries = seriesList.find((s) => s.id === movie.series);
    const seriesTitle = movie.series_title || parentSeries?.title || movie.title;
    const coverUrl =
      movie.cover_image_url ||
      movie.image_url ||
      parentSeries?.cover_image_url ||
      parentSeries?.image_url ||
      null;
    const movieSubtitle = movie.title && movie.title !== seriesTitle ? movie.title : 'Movie';

    if (delta > 0) {
      if (next.status === 'COMPLETED' && movie.status !== 'COMPLETED' && getGamePrefs().celebrations) {
        setQuickLogPrompt(null);
        setFinalePrompt({
          kind: 'movie',
          targetId: id,
          seriesId: movie.series,
          title: seriesTitle,
          subtitle: movie.total_minutes
            ? `${movieSubtitle} · ${movie.total_minutes} min`
            : movieSubtitle,
          coverUrl,
          totalCount: movie.total_minutes,
          existingNote: movie.notes ?? null,
          currentRating: movie.rating ?? null,
        });
      } else {
        setQuickLogPrompt((prev) => ({
          kind: 'movie',
          targetId: id,
          title: seriesTitle,
          subtitle: movieSubtitle,
          seriesId: movie.series,
          stepNumber: next.progress_minutes,
          unit: 'minutes',
          delta: prev && prev.kind === 'movie' && prev.targetId === id ? prev.delta + delta : delta,
          existingNote: movie.notes ?? null,
          existingRating: movie.rating ?? null,
          coverUrl,
          createdAt: Date.now(),
        }));
      }
    } else if (delta < 0) {
      setQuickLogPrompt((prev) => (prev && prev.kind === 'movie' && prev.targetId === id ? null : prev));
    }
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
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving book: ${err.message}`, 'error');
      throw err;
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
    appendLocalActivity('BOOK_PROGRESS', 'book', id, book.title, delta);
    if (next.status === 'COMPLETED' && book.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'book', id, book.title, 1);
    } else if (book.status === 'COMPLETED' && next.status !== 'COMPLETED') {
      appendLocalActivity('COMPLETED', 'book', id, book.title, -1);
    }
    queue.enqueue(`book-${id}`, delta, book, (d) => bookApi.updateProgress(id, d));

    const coverUrl = book.cover_image_url || book.image_url || null;
    const bookSubtitle = book.author ? `by ${book.author}` : 'Book';

    if (delta > 0) {
      if (next.status === 'COMPLETED' && book.status !== 'COMPLETED' && getGamePrefs().celebrations) {
        setQuickLogPrompt(null);
        setFinalePrompt({
          kind: 'book',
          targetId: id,
          title: book.title,
          subtitle: book.total_pages
            ? `${bookSubtitle} · ${book.total_pages} pages`
            : bookSubtitle,
          coverUrl,
          totalCount: book.total_pages,
          existingNote: book.notes ?? null,
          currentRating: book.rating ?? null,
        });
      } else {
        setQuickLogPrompt((prev) => ({
          kind: 'book',
          targetId: id,
          title: book.title,
          subtitle: bookSubtitle,
          stepNumber: next.progress,
          unit: 'pages',
          delta: prev && prev.kind === 'book' && prev.targetId === id ? prev.delta + delta : delta,
          existingNote: book.notes ?? null,
          existingRating: book.rating ?? null,
          coverUrl,
          createdAt: Date.now(),
        }));
      }
    } else if (delta < 0) {
      setQuickLogPrompt((prev) => (prev && prev.kind === 'book' && prev.targetId === id ? null : prev));
    }
  };

  const handleSaveCharacter = async (data: any, id?: number) => {
    try {
      if (id) {
        await characterApi.update(id, data);
        addToast('Character note updated');
      } else {
        await characterApi.create(data);
        addToast('Character added');
      }
      setCharacterModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving character: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDeleteCharacter = (id: number) => {
    requestConfirm({
      title: 'Delete Character',
      message: 'Are you sure you want to remove this character from your library?',
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
        addToast('Rewatch updated');
      } else {
        await rewatchApi.create(data);
        addToast('Rewatch logged');
      }
      setRewatchModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving rewatch: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDeleteRewatch = (id: number) => {
    requestConfirm({
      title: 'Delete Rewatch',
      message: 'Are you sure you want to delete this rewatch?',
      confirmLabel: 'Delete Rewatch',
      onConfirm: async () => {
        try {
          await rewatchApi.delete(id);
          addToast('Rewatch deleted');
          await refreshAll();
        } catch (err: any) {
          addToast(`Error deleting rewatch: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleSaveEpisodeNote = async (data: any, id?: number) => {
    try {
      if (id) {
        await episodeNoteApi.update(id, data);
        addToast('Episode note updated');
      } else {
        await episodeNoteApi.create(data);
        addToast('Episode note saved');
      }
      setEpisodeNoteModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving episode note: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDeleteEpisodeNote = async (id: number) => {
    try {
      await episodeNoteApi.delete(id);
      addToast('Episode note deleted');
      setEpisodeNoteModalOpen(false);
      await refreshAll();
    } catch (err: any) {
      addToast(`Error deleting episode note: ${err.message}`, 'error');
      throw err;
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
    activityList,
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
    quickLogPrompt,
    dismissQuickLog,
    finalePrompt,
    dismissFinale,
  };

  const latestValue = useRef(value);
  useLayoutEffect(() => {
    latestValue.current = value;
  });
  const [actions] = useState(() => buildStableActions(value, latestValue));

  const data = useMemo<JournalData>(
    () => ({
      loading,
      loadFailed,
      seriesList,
      bookList,
      rewatchList,
      characterList,
      activityList,
      genres,
      studios,
      stats,
    }),
    [loading, loadFailed, seriesList, bookList, rewatchList, characterList, activityList, genres, studios, stats]
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
      quickLogPrompt,
      finalePrompt,
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
      quickLogPrompt,
      finalePrompt,
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
