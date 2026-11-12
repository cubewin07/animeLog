import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  SkipForward,
  Upload,
} from 'lucide-react';
import {
  bookApi,
  characterApi,
  folderApi,
  imageApi,
  lookupApi,
  movieApi,
  seasonApi,
  seriesApi,
} from '../../api/client';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { Cover } from '../../ui';
import type { Folder } from '../../types';
import {
  buildFindArtItems,
  FindArtItem,
  FindArtKind,
  summarizeFindArt,
} from './findArtQueue';
import './FindArt.css';

interface FindArtCandidate {
  key: string;
  title: string;
  imageUrl: string;
  meta: string[];
}

interface CachedLookup {
  query: string;
  results: FindArtCandidate[];
}

type KindFilter = 'all' | FindArtKind;
type RunnerState = 'idle' | 'running' | 'paused' | 'error';

const RATE_LIMIT_DELAY_MS = 1100;

const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'series', label: 'Series' },
  { key: 'season', label: 'Seasons' },
  { key: 'movie', label: 'Movies' },
  { key: 'book', label: 'Books' },
  { key: 'character', label: 'Characters' },
];

const KIND_LABELS: Record<FindArtKind, string> = {
  series: 'Series',
  season: 'Season',
  movie: 'Movie',
  book: 'Book',
  character: 'Character',
};

function coverVariantForKind(kind: FindArtKind): 'poster' | 'book' | 'portrait' {
  if (kind === 'book') return 'book';
  if (kind === 'character') return 'portrait';
  return 'poster';
}

function formatLookupError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Unknown error');
  if (raw.includes('429') || raw.toLowerCase().includes('rate')) {
    return 'Rate limit reached (HTTP 429). Wait a few seconds before retrying.';
  }
  return `Lookup service could not be reached (${raw}).`;
}

async function fetchCandidatesForItem(
  item: FindArtItem,
  query: string
): Promise<FindArtCandidate[]> {
  if (item.kind === 'book') {
    const results = await lookupApi.searchBook(query);
    return results
      .filter((r) => Boolean(r.cover_url))
      .slice(0, 6)
      .map((r, idx) => ({
        key: `book-${r.key || r.title}-${idx}`,
        title: r.title,
        imageUrl: r.cover_url as string,
        meta: [
          r.author || null,
          r.first_publish_year ? String(r.first_publish_year) : null,
          r.total_pages ? `${r.total_pages} pages` : null,
        ].filter((v): v is string => Boolean(v)),
      }));
  }

  if (item.kind === 'character') {
    const results = await lookupApi.searchCharacter(query);
    return results
      .filter((r) => Boolean(r.portrait_url))
      .slice(0, 6)
      .map((r, idx) => ({
        key: `char-${r.source_id}-${idx}`,
        title: r.name,
        imageUrl: r.portrait_url as string,
        meta: [r.name_kanji || null].filter((v): v is string => Boolean(v)),
      }));
  }

  const results = await lookupApi.searchAnime(query);
  return results
    .filter((r) => Boolean(r.cover_url))
    .slice(0, 6)
    .map((r, idx) => ({
      key: `anime-${r.source_id}-${idx}`,
      title: r.title,
      imageUrl: r.cover_url as string,
      meta: [
        r.format || (r.media_type === 'movie' ? 'Movie' : 'TV'),
        r.total_episodes ? `${r.total_episodes} eps` : null,
        r.total_minutes ? `${r.total_minutes} min` : null,
        r.studios?.[0] || null,
      ].filter((v): v is string => Boolean(v)),
    }));
}

function sleepWithAbort(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export const FindArtPage: React.FC = () => {
  const { loading, seriesList, bookList, characterList } = useJournalData();
  const { refreshAll, addToast } = useJournalActions();

  const allItems = useMemo(
    () => buildFindArtItems({ seriesList, bookList, characterList }),
    [seriesList, bookList, characterList]
  );
  const summary = useMemo(() => summarizeFindArt(allItems), [allItems]);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [missingOnlyOverride, setMissingOnlyOverride] = useState<boolean | null>(null);
  const missingOnly = missingOnlyOverride ?? (loading || summary.missing > 0);
  const [showSkipped, setShowSkipped] = useState<boolean>(false);
  const [skippedUids, setSkippedUids] = useState<Set<string>>(() => new Set());
  const [savedUids, setSavedUids] = useState<Set<string>>(() => new Set());

  const [customQueries, setCustomQueries] = useState<Record<string, string>>({});
  const [candidateCache, setCandidateCache] = useState<Record<string, CachedLookup>>({});
  const candidateCacheRef = useRef<Record<string, CachedLookup>>({});

  const [runnerState, setRunnerState] = useState<RunnerState>('idle');
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [runnerError, setRunnerError] = useState<string | null>(null);

  const [searchingUids, setSearchingUids] = useState<Set<string>>(() => new Set());
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingUid, setUploadingUid] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    folderApi
      .list()
      .then((list) => {
        if (mountedRef.current) setFolders(list);
      })
      .catch(() => {
        // Folder list is optional; uploads still succeed without a folder ID
      });
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const getQuery = useCallback(
    (item: FindArtItem): string => customQueries[item.uid] ?? item.defaultQuery,
    [customQueries]
  );

  const visibleItems = useMemo(() => {
    return allItems.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      const isSavedNow = item.hasArt || savedUids.has(item.uid);
      if (missingOnly && isSavedNow) return false;
      if (!showSkipped && skippedUids.has(item.uid)) return false;
      return true;
    });
  }, [allItems, kindFilter, missingOnly, showSkipped, skippedUids, savedUids]);

  const checkedCount = useMemo(() => {
    let count = 0;
    for (const item of visibleItems) {
      const q = getQuery(item).trim();
      const cached = candidateCache[item.uid];
      if (cached && cached.query === q) {
        count += 1;
      }
    }
    return count;
  }, [visibleItems, candidateCache, getQuery]);

  const totalVisible = visibleItems.length;
  const progressPct = totalVisible > 0 ? Math.round((checkedCount / totalVisible) * 100) : 0;

  const stopRunner = useCallback((nextState: RunnerState = 'paused') => {
    abortRef.current?.abort();
    abortRef.current = null;
    setActiveUid(null);
    setRunnerState(nextState);
  }, []);

  const startRunner = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunnerError(null);
    setRunnerState('running');

    const queue = visibleItems.slice();
    let madeRequest = false;

    for (const item of queue) {
      if (controller.signal.aborted || !mountedRef.current) return;

      const query = (customQueries[item.uid] ?? item.defaultQuery).trim();
      if (!query) continue;

      const cached = candidateCacheRef.current[item.uid];
      if (cached && cached.query === query) {
        continue;
      }

      if (madeRequest) {
        const ok = await sleepWithAbort(RATE_LIMIT_DELAY_MS, controller.signal);
        if (!ok || !mountedRef.current) return;
      }

      setActiveUid(item.uid);
      try {
        const results = await fetchCandidatesForItem(item, query);
        madeRequest = true;
        if (controller.signal.aborted || !mountedRef.current) return;

        const nextEntry: CachedLookup = { query, results };
        candidateCacheRef.current = {
          ...candidateCacheRef.current,
          [item.uid]: nextEntry,
        };
        setCandidateCache((prev) => ({
          ...prev,
          [item.uid]: nextEntry,
        }));
        setCardErrors((prev) => {
          if (!prev[item.uid]) return prev;
          const copy = { ...prev };
          delete copy[item.uid];
          return copy;
        });
      } catch (err) {
        if (controller.signal.aborted || !mountedRef.current) return;
        setActiveUid(null);
        setRunnerState('error');
        setRunnerError(formatLookupError(err));
        return;
      }
    }

    if (!controller.signal.aborted && mountedRef.current) {
      setActiveUid(null);
      setRunnerState('idle');
    }
  }, [visibleItems, customQueries]);

  const runSingleLookup = useCallback(
    async (item: FindArtItem, rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;

      setSearchingUids((prev) => new Set(prev).add(item.uid));
      setCardErrors((prev) => {
        if (!prev[item.uid]) return prev;
        const copy = { ...prev };
        delete copy[item.uid];
        return copy;
      });

      try {
        const results = await fetchCandidatesForItem(item, query);
        if (!mountedRef.current) return;
        const nextEntry: CachedLookup = { query, results };
        candidateCacheRef.current = {
          ...candidateCacheRef.current,
          [item.uid]: nextEntry,
        };
        setCandidateCache((prev) => ({
          ...prev,
          [item.uid]: nextEntry,
        }));
      } catch (err) {
        if (!mountedRef.current) return;
        setCardErrors((prev) => ({
          ...prev,
          [item.uid]: formatLookupError(err),
        }));
      } finally {
        if (mountedRef.current) {
          setSearchingUids((prev) => {
            const next = new Set(prev);
            next.delete(item.uid);
            return next;
          });
        }
      }
    },
    []
  );

  const attachImageToItem = useCallback(
    async (item: FindArtItem, imageId: number) => {
      switch (item.kind) {
        case 'series':
          await seriesApi.update(item.id, { cover_image: imageId });
          break;
        case 'season':
          await seasonApi.update(item.id, { cover_image: imageId });
          break;
        case 'movie':
          await movieApi.update(item.id, { cover_image: imageId });
          break;
        case 'book':
          await bookApi.update(item.id, { cover_image: imageId });
          break;
        case 'character': {
          const char = characterList.find((c) => c.id === item.id);
          const existingIds = (char?.images || []).map((img) => img.id);
          const updatedImages = existingIds.includes(imageId)
            ? existingIds
            : [...existingIds, imageId];
          await characterApi.update(item.id, {
            cover_image: imageId,
            images: updatedImages,
          });
          break;
        }
      }
    },
    [characterList]
  );

  const handleConfirmCandidate = useCallback(
    async (item: FindArtItem, candidate: FindArtCandidate) => {
      const key = `${item.uid}:${candidate.key}`;
      setSavingKey(key);
      setCardErrors((prev) => {
        if (!prev[item.uid]) return prev;
        const copy = { ...prev };
        delete copy[item.uid];
        return copy;
      });

      try {
        const img = await imageApi.importUrl(candidate.imageUrl, item.title, item.folderName);
        await attachImageToItem(item, img.id);
        await refreshAll();
        if (!mountedRef.current) return;
        setSavedUids((prev) => new Set(prev).add(item.uid));
        setSkippedUids((prev) => {
          if (!prev.has(item.uid)) return prev;
          const next = new Set(prev);
          next.delete(item.uid);
          return next;
        });
        addToast(`Saved cover art for ${item.title}`, 'success');
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : 'Failed to import artwork';
        setCardErrors((prev) => ({ ...prev, [item.uid]: msg }));
        addToast(`Could not save cover art for ${item.title}`, 'error');
      } finally {
        if (mountedRef.current) {
          setSavingKey(null);
        }
      }
    },
    [attachImageToItem, refreshAll, addToast]
  );

  const handleLocalUpload = useCallback(
    async (item: FindArtItem, file: File | undefined) => {
      if (!file) return;
      setUploadingUid(item.uid);
      setCardErrors((prev) => {
        if (!prev[item.uid]) return prev;
        const copy = { ...prev };
        delete copy[item.uid];
        return copy;
      });

      try {
        const matchingFolder = folders.find(
          (f) => f.name.toLowerCase() === item.folderName.toLowerCase()
        );
        const img = await imageApi.upload(file, {
          title: item.title,
          folder: matchingFolder ? matchingFolder.id : null,
        });
        await attachImageToItem(item, img.id);
        await refreshAll();
        if (!mountedRef.current) return;
        setSavedUids((prev) => new Set(prev).add(item.uid));
        setSkippedUids((prev) => {
          if (!prev.has(item.uid)) return prev;
          const next = new Set(prev);
          next.delete(item.uid);
          return next;
        });
        addToast(`Uploaded cover art for ${item.title}`, 'success');
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setCardErrors((prev) => ({ ...prev, [item.uid]: msg }));
        addToast(`Upload failed for ${item.title}`, 'error');
      } finally {
        if (mountedRef.current) {
          setUploadingUid(null);
        }
      }
    },
    [folders, attachImageToItem, refreshAll, addToast]
  );

  const toggleSkip = useCallback((uid: string) => {
    setSkippedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }, []);

  const primaryButtonLabel =
    runnerState === 'running'
      ? 'Pause'
      : runnerState === 'error'
        ? 'Retry'
        : runnerState === 'paused' || (checkedCount > 0 && checkedCount < totalVisible)
          ? 'Resume'
          : 'Start finding art';

  return (
    <div className="kf-findart">
      <header className="kf-findart-header">
        <div className="kf-findart-header-copy">
          <Link viewTransition to="/settings" className="kf-findart-back">
            <ArrowLeft size={15} />
            <span>Back to Settings</span>
          </Link>
          <h1 className="kf-findart-title">Find Art</h1>
          <p className="kf-findart-subtitle">
            Review matches from MyAnimeList and OpenLibrary one at a time, or upload local artwork.
            Nothing is saved until you confirm a match.
          </p>
        </div>

        <div className="kf-findart-stats-pill" aria-label="Artwork coverage summary">
          <span>
            <strong>{summary.total}</strong> total
          </span>
          <span aria-hidden="true">·</span>
          <span className="kf-findart-stats-missing">{summary.missing} missing</span>
          <span aria-hidden="true">·</span>
          <span className="kf-findart-stats-saved">{summary.saved} saved</span>
        </div>
      </header>

      <section className="kf-findart-runner" aria-label="Lookup progress and controls">
        <div className="kf-findart-runner-top">
          <div className="kf-findart-runner-actions">
            {runnerState === 'running' ? (
              <button
                type="button"
                className="kf-findart-btn-secondary"
                onClick={() => stopRunner('paused')}
              >
                <Pause size={16} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                className="kf-findart-btn-primary"
                onClick={startRunner}
                disabled={totalVisible === 0 || checkedCount >= totalVisible}
              >
                {runnerState === 'error' ? <RotateCcw size={16} /> : <Play size={16} />}
                <span>{primaryButtonLabel}</span>
              </button>
            )}
          </div>

          <div className="kf-findart-progress-meta">
            {runnerState === 'running' && (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            )}
            <span>
              Checked <strong>{checkedCount}</strong> of <strong>{totalVisible}</strong>
            </span>
          </div>
        </div>

        <div
          className="kf-findart-progress-track"
          role="progressbar"
          aria-valuenow={checkedCount}
          aria-valuemin={0}
          aria-valuemax={Math.max(1, totalVisible)}
          aria-label="Lookup progress"
        >
          <div className="kf-findart-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {runnerError && (
          <div className="kf-findart-banner" role="alert">
            <div className="kf-findart-banner-body">
              <AlertCircle size={18} color="var(--kf-brand)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="kf-findart-banner-text">
                <strong>Paused automatically: {runnerError}</strong>
                <small>
                  You can retry when ready, search an individual item, or upload local art directly on any card.
                </small>
              </div>
            </div>
            <button
              type="button"
              className="kf-findart-btn-primary"
              onClick={startRunner}
            >
              <RotateCcw size={15} />
              <span>Retry</span>
            </button>
          </div>
        )}
      </section>

      <section className="kf-findart-filters" aria-label="Filter artwork queue">
        <div className="kf-findart-pills" role="tablist" aria-label="Media kind">
          {KIND_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? missingOnly
                  ? summary.missing
                  : summary.total
                : missingOnly
                  ? summary.byKind[tab.key].missing
                  : summary.byKind[tab.key].total;
            const isActive = kindFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`kf-findart-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => setKindFilter(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="kf-findart-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="kf-findart-toggles">
          <label className="kf-findart-toggle">
            <input
              type="checkbox"
              checked={missingOnly}
              onChange={(e) => setMissingOnlyOverride(e.target.checked)}
            />
            <span>Missing art only</span>
          </label>

          {skippedUids.size > 0 && (
            <label className="kf-findart-toggle">
              <input
                type="checkbox"
                checked={showSkipped}
                onChange={(e) => setShowSkipped(e.target.checked)}
              />
              <span>Show skipped ({skippedUids.size})</span>
            </label>
          )}
        </div>
      </section>

      {visibleItems.length === 0 ? (
        <div className="kf-findart-empty-state">
          <h2>
            {summary.total === 0
              ? 'Your library is empty'
              : missingOnly
                ? 'Every matching entry has cover art'
                : 'No entries match this filter'}
          </h2>
          <p>
            {summary.total === 0
              ? 'Add anime series, books, or characters first, then return here to attach artwork.'
              : missingOnly
                ? 'Turn off "Missing art only" to browse or replace existing cover artwork.'
                : 'Try switching to All or showing skipped items.'}
          </p>
          {missingOnly && summary.total > 0 && (
            <button
              type="button"
              className="kf-findart-btn-secondary"
              onClick={() => setMissingOnlyOverride(false)}
            >
              Show all {summary.total} entries
            </button>
          )}
        </div>
      ) : (
        <section className="kf-findart-list" aria-label="Artwork queue items">
          {visibleItems.map((item) => {
            const query = getQuery(item);
            const cached = candidateCache[item.uid];
            const isLookingUp = activeUid === item.uid || searchingUids.has(item.uid);
            const isUploading = uploadingUid === item.uid;
            const isSkipped = skippedUids.has(item.uid);
            const isSaved = item.hasArt || savedUids.has(item.uid);
            const cardError = cardErrors[item.uid];

            return (
              <article
                key={item.uid}
                className={`kf-findart-card ${isLookingUp ? 'is-active-lookup' : ''} ${isSaved ? 'is-saved' : ''}`}
              >
                <div className="kf-findart-card-head">
                  <div className="kf-findart-cover-wrap">
                    <Cover
                      title={item.title}
                      subtitle={item.subtitle}
                      imageUrl={item.currentImageUrl}
                      variant={coverVariantForKind(item.kind)}
                      size="thumb"
                    />
                  </div>

                  <div className="kf-findart-card-meta">
                    <div className="kf-findart-card-badges">
                      <span className="kf-findart-kind-badge">{KIND_LABELS[item.kind]}</span>
                      <span
                        className={`kf-findart-status-badge ${isSaved ? 'is-saved' : 'is-missing'}`}
                      >
                        {isSaved ? (
                          <>
                            <Check size={12} />
                            <span>Has art</span>
                          </>
                        ) : (
                          <span>Missing art</span>
                        )}
                      </span>
                      {isSkipped && (
                        <span className="kf-findart-status-badge is-skipped">Skipped</span>
                      )}
                    </div>

                    <div className="kf-findart-card-title-row">
                      <h2 className="kf-findart-card-title">{item.title}</h2>
                    </div>
                    <p className="kf-findart-card-subtitle">{item.subtitle}</p>

                    <div className="kf-findart-card-actions">
                      <Link viewTransition to={item.href} className="kf-findart-open-link">
                        <ExternalLink size={13} />
                        <span>Open item</span>
                      </Link>

                      <label className="kf-findart-upload-label">
                        {isUploading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Upload size={13} />
                        )}
                        <span>{isUploading ? 'Uploading…' : 'Upload local art'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="kf-findart-upload-input"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleLocalUpload(item, file);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        className="kf-findart-btn-ghost"
                        onClick={() => toggleSkip(item.uid)}
                      >
                        <SkipForward size={14} />
                        <span>{isSkipped ? 'Restore' : 'Skip'}</span>
                      </button>
                    </div>

                    <form
                      className="kf-findart-search-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        runSingleLookup(item, query);
                      }}
                    >
                      <input
                        type="text"
                        className="kf-findart-search-input"
                        value={query}
                        aria-label={`Search different name for ${item.title}`}
                        placeholder="Search different name…"
                        onChange={(e) =>
                          setCustomQueries((prev) => ({
                            ...prev,
                            [item.uid]: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="submit"
                        className="kf-findart-btn-secondary"
                        disabled={isLookingUp || !query.trim()}
                      >
                        {isLookingUp ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                        <span>{isLookingUp ? 'Searching…' : 'Search different name'}</span>
                      </button>
                    </form>

                    {cardError && (
                      <p className="kf-findart-card-error" role="alert">
                        {cardError}
                      </p>
                    )}
                  </div>
                </div>

                {cached && cached.results.length === 0 && (
                  <div className="kf-findart-candidates-empty">
                    No artwork matches found for “{cached.query}”. Try searching a different name or
                    upload a local image.
                  </div>
                )}

                {cached && cached.results.length > 0 && (
                  <div className="kf-findart-candidates-grid" aria-label={`Matches for ${item.title}`}>
                    {cached.results.map((candidate) => {
                      const thisSaving = savingKey === `${item.uid}:${candidate.key}`;
                      return (
                        <div key={candidate.key} className="kf-findart-candidate">
                          <div className="kf-findart-candidate-thumb">
                            <img
                              src={candidate.imageUrl}
                              alt={candidate.title}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="kf-findart-candidate-info">
                            <span className="kf-findart-candidate-title">{candidate.title}</span>
                            {candidate.meta.length > 0 && (
                              <span className="kf-findart-candidate-meta">
                                {candidate.meta.join(' · ')}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="kf-findart-confirm-btn"
                            disabled={savingKey !== null}
                            onClick={() => handleConfirmCandidate(item, candidate)}
                          >
                            {thisSaving ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving…</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>Confirm &amp; Save</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
