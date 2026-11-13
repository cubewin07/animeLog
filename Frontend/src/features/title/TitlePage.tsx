import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Film,
  Minus,
  MoreHorizontal,
  PenLine,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import type {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
} from '../../types';
import { useJournalActions, useJournalUI } from '../../state/JournalContext';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import { formatDate } from '../../lib/format';
import { rewatchesForRelease } from '../../lib/selectors/rewatches';
import {
  cardTier,
  CoverArt,
  EpisodeMap,
  KfButton,
  KfCharacterCard,
  NotePaper,
  ScoreTag,
  StatusTag,
} from '../../ui/keyframe';
import {
  adjacentEpisode,
  canStepReleaseProgress,
  clampedMovieDelta,
  computeRatingDelta,
  effectiveEpisodeCount,
  mapEpisodeNotes,
  nextNoteEpisode,
  parseEpisodeParam,
  resolveInitialRelease,
  resolveTitleTab,
  sortRewatchesChronological,
  TITLE_TABS,
  type TitleTab,
} from './titlePageUtils';
import '../../styles/keyframe.css';
import './TitlePage.css';

export interface TitlePageProps {
  series: AnimeSeries;
  allRewatches?: Rewatch[];
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
  onOpenEpisodeNotes: (season: AnimeSeason, note?: EpisodeNote) => void;
  onAddRewatchSeries?: (series: AnimeSeries) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddRewatchEpisode?: (season: AnimeSeason, episodeNumber: number) => void;
  onEditRewatch?: (rewatch: Rewatch) => void;
  onDeleteRewatch?: (id: number) => void;
  onAddCharacter: (series: AnimeSeries) => void;
  onEditCharacter?: (character: FavoriteCharacter) => void;
  onDeleteCharacter?: (id: number) => void;
  onRefresh?: () => Promise<void>;
}

interface OptionalReleaseMeta {
  season_aired?: string | null;
  synopsis?: string | null;
  description?: string | null;
}

function progressPercent(current: number, total: number | null | undefined, status: string): number {
  if (total && total > 0) {
    return Math.min(100, Math.round((current / total) * 100));
  }
  return status === 'COMPLETED' ? 100 : 0;
}

export const TitlePage: React.FC<TitlePageProps> = ({
  series,
  allRewatches = [],
  onEditSeries,
  onDeleteSeries,
  onAddSeason,
  onAddMovie,
  onEditSeason,
  onDeleteSeason,
  onSeasonProgressDelta,
  onEditMovie,
  onDeleteMovie,
  onMovieProgressDelta,
  onOpenEpisodeNotes,
  onAddRewatchSeries,
  onAddRewatchSeason,
  onAddRewatchMovie,
  onAddRewatchEpisode,
  onEditRewatch,
  onDeleteRewatch,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
}) => {
  const { openComposer } = useJournalActions();
  const {
    composerOpen,
    paletteOpen,
    entryModalOpen,
    episodeNoteModalOpen,
    rewatchModalOpen,
    characterModalOpen,
    confirmDialog,
  } = useJournalUI();

  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const seasons = useMemo(
    () => [...(series.seasons ?? [])].sort((a, b) => a.season_number - b.season_number || a.id - b.id),
    [series.seasons],
  );
  const movies = useMemo(() => series.movies ?? [], [series.movies]);
  const characters = useMemo(() => series.favorite_characters ?? [], [series.favorite_characters]);

  const resolvedRelease = useMemo(
    () => resolveInitialRelease({ seasons, movies }, searchParams.get('release')),
    [seasons, movies, searchParams],
  );

  const selectedType = resolvedRelease?.type ?? null;
  const currentSeason = useMemo(
    () =>
      resolvedRelease?.type === 'season'
        ? seasons.find((s) => s.id === resolvedRelease.id) ?? null
        : null,
    [resolvedRelease, seasons],
  );
  const currentMovie = useMemo(
    () =>
      resolvedRelease?.type === 'movie'
        ? movies.find((m) => m.id === resolvedRelease.id) ?? null
        : null,
    [resolvedRelease, movies],
  );
  const activeRelease = currentSeason ?? currentMovie;

  const activeTab = resolveTitleTab(
    searchParams.get('tab'),
    searchParams.get('ep'),
    selectedType,
  );

  const selectedEp =
    selectedType === 'season' ? parseEpisodeParam(searchParams.get('ep')) : null;

  const selectRelease = (type: 'season' | 'movie', id: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('release', `${type}-${id}`);
    next.delete('ep');
    if (type === 'movie' && next.get('tab') === 'episodes') {
      next.set('tab', 'overview');
    }
    setSearchParams(next, { replace: true });
  };

  const selectTab = (tab: TitleTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview' && !next.get('ep')) {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const selectEpisode = useCallback(
    (epNum: number | null, switchToEpisodes = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (currentSeason) {
            next.set('release', `season-${currentSeason.id}`);
          }
          if (epNum === null) {
            next.delete('ep');
          } else {
            next.set('ep', String(epNum));
            if (switchToEpisodes || activeTab !== 'episodes') {
              next.set('tab', 'episodes');
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [currentSeason, activeTab, setSearchParams],
  );

  const activeCoverUrl =
    activeRelease?.cover_image_url ||
    activeRelease?.image_url ||
    series.cover_image_url ||
    series.image_url ||
    null;

  const {
    accent: titleAccent,
    onImageReady,
    onCorsBlocked,
  } = useCoverAccent(series.title, activeCoverUrl);

  const backdropUrl = activeCoverUrl
    ? cloudinaryThumbUrl(activeCoverUrl, 'card') ?? activeCoverUrl
    : null;
  const showBackdrop = Boolean(backdropUrl && failedBackdropUrl !== backdropUrl);

  const releaseLabel = currentSeason
    ? `Season ${currentSeason.season_number}${currentSeason.title && currentSeason.title !== series.title ? ` · ${currentSeason.title}` : ''}`
    : currentMovie
      ? `Movie · ${currentMovie.title}`
      : null;

  const episodeNotesMap = useMemo(
    () => mapEpisodeNotes(currentSeason?.episode_notes),
    [currentSeason?.episode_notes],
  );

  const episodeCount = useMemo(
    () => (currentSeason ? effectiveEpisodeCount(currentSeason) : { total: 0, isEstimated: false }),
    [currentSeason],
  );

  const episodeMapNotes = useMemo(
    () =>
      (currentSeason?.episode_notes ?? []).map((n) => ({
        episode: n.episode_number,
        rating: n.rating,
      })),
    [currentSeason?.episode_notes],
  );

  const selectedEpisodeNote = selectedEp !== null ? episodeNotesMap.get(selectedEp) : undefined;
  const prevEp =
    currentSeason && selectedEp !== null
      ? adjacentEpisode(selectedEp, -1, episodeCount.total)
      : null;
  const nextEp =
    currentSeason && selectedEp !== null
      ? adjacentEpisode(selectedEp, 1, episodeCount.total)
      : null;

  const releaseRewatches = useMemo(() => {
    const filtered = activeRelease && selectedType
      ? rewatchesForRelease(allRewatches, {
          type: selectedType,
          id: activeRelease.id,
          seriesId: series.id,
        })
      : allRewatches.filter((r) => r.target_type === 'series' && r.series_id === series.id);
    return sortRewatchesChronological(filtered);
  }, [allRewatches, activeRelease, selectedType, series.id]);

  // Close Manage menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  // Keyboard navigation in Episode inspector (ArrowLeft / ArrowRight / Escape)
  const anyModalOpen =
    composerOpen ||
    paletteOpen ||
    entryModalOpen ||
    episodeNoteModalOpen ||
    rewatchModalOpen ||
    characterModalOpen ||
    confirmDialog.isOpen ||
    menuOpen;

  useEffect(() => {
    if (activeTab !== 'episodes' || selectedType !== 'season' || selectedEp === null) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (anyModalOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (prevEp !== null) {
          e.preventDefault();
          selectEpisode(prevEp);
        }
      } else if (e.key === 'ArrowRight') {
        if (nextEp !== null) {
          e.preventDefault();
          selectEpisode(nextEp);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        selectEpisode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedType, selectedEp, anyModalOpen, prevEp, nextEp, selectEpisode]);

  const moviePlusDelta = currentMovie ? clampedMovieDelta(currentMovie, 10) : 0;
  const movieMinusDelta = currentMovie ? clampedMovieDelta(currentMovie, -10) : 0;

  const canStepPlus = currentSeason
    ? canStepReleaseProgress({ type: 'season', data: currentSeason }, 1)
    : currentMovie
      ? moviePlusDelta > 0 && canStepReleaseProgress({ type: 'movie', data: currentMovie }, moviePlusDelta)
      : false;

  const canStepMinus = currentSeason
    ? canStepReleaseProgress({ type: 'season', data: currentSeason }, -1)
    : currentMovie
      ? movieMinusDelta < 0 && canStepReleaseProgress({ type: 'movie', data: currentMovie }, movieMinusDelta)
      : false;

  const handlePrimaryPlus = () => {
    if (currentSeason) onSeasonProgressDelta(currentSeason.id, 1);
    else if (currentMovie && moviePlusDelta > 0) onMovieProgressDelta(currentMovie.id, moviePlusDelta);
  };

  const handlePrimaryMinus = () => {
    if (currentSeason) onSeasonProgressDelta(currentSeason.id, -1);
    else if (currentMovie && movieMinusDelta < 0) onMovieProgressDelta(currentMovie.id, movieMinusDelta);
  };

  const handleHeroNote = () => {
    if (currentSeason) {
      openComposer({
        targetKind: 'season',
        id: currentSeason.id,
        title: series.title,
        context: `Season ${currentSeason.season_number}`,
        defaultKind: 'episode',
        episodeNumber: nextNoteEpisode(currentSeason),
      });
    } else if (currentMovie) {
      openComposer({
        targetKind: 'movie',
        id: currentMovie.id,
        title: series.title,
        context: currentMovie.title,
        defaultKind: 'lesson',
      });
    }
  };

  const handleReleaseLessonNote = () => {
    if (currentSeason) {
      openComposer({
        targetKind: 'season',
        id: currentSeason.id,
        title: series.title,
        context: `Season ${currentSeason.season_number}`,
        defaultKind: 'lesson',
      });
    } else if (currentMovie) {
      openComposer({
        targetKind: 'movie',
        id: currentMovie.id,
        title: series.title,
        context: currentMovie.title,
        defaultKind: 'lesson',
      });
    }
  };

  const handleLogRewatch = () => {
    if (currentSeason) onAddRewatchSeason(currentSeason);
    else if (currentMovie) onAddRewatchMovie(currentMovie);
    else onAddRewatchSeries?.(series);
  };

  const releaseSlate = useMemo(() => {
    if (currentSeason) {
      return [
        `Season ${currentSeason.season_number}`,
        currentSeason.title !== series.title ? currentSeason.title : '',
        currentSeason.rating ? `Rated ${currentSeason.rating}/10` : '',
        currentSeason.finish_date
          ? formatDate(currentSeason.finish_date)
          : currentSeason.start_date
            ? `Started ${formatDate(currentSeason.start_date)}`
            : 'Season note',
      ].filter(Boolean);
    }
    if (currentMovie) {
      return [
        'Movie',
        currentMovie.title !== series.title ? currentMovie.title : '',
        currentMovie.rating ? `Rated ${currentMovie.rating}/10` : '',
        currentMovie.finish_date
          ? formatDate(currentMovie.finish_date)
          : currentMovie.start_date
            ? `Started ${formatDate(currentMovie.start_date)}`
            : 'Movie note',
      ].filter(Boolean);
    }
    return ['Series'];
  }, [currentSeason, currentMovie, series.title]);

  const combinedStudios = useMemo(() => {
    const map = new Map<number, string>();
    series.studios?.forEach((st) => map.set(st.id, st.name));
    activeRelease?.studios?.forEach((st) => map.set(st.id, st.name));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [series.studios, activeRelease?.studios]);

  const optionalMeta = (activeRelease ?? series) as OptionalReleaseMeta;
  const seriesOptionalMeta = series as OptionalReleaseMeta;
  const synopsisText =
    optionalMeta.synopsis ||
    optionalMeta.description ||
    seriesOptionalMeta.synopsis ||
    seriesOptionalMeta.description ||
    null;

  const pct = currentSeason
    ? progressPercent(currentSeason.progress || 0, currentSeason.total_episodes, currentSeason.status)
    : currentMovie
      ? progressPercent(currentMovie.progress_minutes || 0, currentMovie.total_minutes, currentMovie.status)
      : 0;

  return (
    <div
      className="kf kf-title"
      style={{ '--title-accent': titleAccent } as React.CSSProperties}
    >
      {/* 1. Full-Width Keyframe Hero */}
      <header className="kf-title-hero">
        <div className="kf-title-hero-media" aria-hidden="true">
          {showBackdrop && backdropUrl && (
            <img
              key={backdropUrl}
              src={backdropUrl}
              alt=""
              loading="eager"
              decoding="async"
              className="kf-title-hero-backdrop-img"
              onError={() => setFailedBackdropUrl(backdropUrl)}
            />
          )}
        </div>

        <div className="kf-title-hero-top">
          <Link viewTransition to="/anime" className="kf-title-back">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Anime</span>
          </Link>

          <div className="kf-title-menu-wrap" ref={menuWrapRef}>
            <button
              ref={menuTriggerRef}
              type="button"
              className="kf-btn is-secondary is-md kf-title-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Edit or delete series and release"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="kf-title-menu-popover" role="menu" aria-label="Manage title">
                <button
                  type="button"
                  role="menuitem"
                  className="kf-title-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditSeries(series);
                  }}
                >
                  <Pencil size={14} aria-hidden="true" />
                  <span>Edit Series</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="kf-title-menu-item is-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteSeries(series.id);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Delete Series</span>
                </button>

                {currentSeason && (
                  <>
                    <div className="kf-title-menu-divider" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      className="kf-title-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditSeason(currentSeason);
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      <span>Edit Season {currentSeason.season_number}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="kf-title-menu-item is-danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteSeason(currentSeason.id);
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Delete Season</span>
                    </button>
                  </>
                )}

                {currentMovie && (
                  <>
                    <div className="kf-title-menu-divider" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      className="kf-title-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditMovie(currentMovie);
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      <span>Edit Movie</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="kf-title-menu-item is-danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteMovie(currentMovie.id);
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Delete Movie</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="kf-title-hero-inner">
          <div className="kf-title-hero-poster">
            <CoverArt
              title={series.title}
              imageUrl={activeCoverUrl}
              accent={titleAccent}
              variant="poster"
              size="hero"
              fetchPriority="high"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>

          <div className="kf-title-hero-copy">
            {activeRelease && (
              <div className="kf-title-hero-badges">
                <StatusTag status={activeRelease.status} />
                <ScoreTag score={activeRelease.rating} />
                {releaseLabel && <span className="kf-title-release-chip">{releaseLabel}</span>}
              </div>
            )}

            <h1 className="kf-title-hero-heading">{series.title}</h1>

            {series.romaji_title && <p className="kf-title-romaji">{series.romaji_title}</p>}

            {currentSeason && (
              <div className="kf-title-hero-progress-wrap">
                <p className="kf-title-hero-progress">
                  <strong>Ep {currentSeason.progress || 0}</strong>
                  {currentSeason.total_episodes ? ` of ${currentSeason.total_episodes}` : ' watched'}
                </p>
                <div
                  className="kf-title-hero-bar"
                  role="progressbar"
                  aria-valuenow={currentSeason.progress || 0}
                  aria-valuemin={0}
                  aria-valuemax={currentSeason.total_episodes ?? Math.max(1, currentSeason.progress || 0)}
                  aria-label={`Season ${currentSeason.season_number} episode progress`}
                >
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {currentMovie && (
              <div className="kf-title-hero-progress-wrap">
                <p className="kf-title-hero-progress">
                  <strong>{currentMovie.progress_minutes || 0}</strong>
                  {currentMovie.total_minutes ? ` of ${currentMovie.total_minutes} min` : ' min watched'}
                </p>
                <div
                  className="kf-title-hero-bar"
                  role="progressbar"
                  aria-valuenow={currentMovie.progress_minutes || 0}
                  aria-valuemin={0}
                  aria-valuemax={currentMovie.total_minutes ?? Math.max(1, currentMovie.progress_minutes || 0)}
                  aria-label={`${currentMovie.title} progress`}
                >
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {!activeRelease ? (
              <div className="kf-title-hero-empty-release">
                <span>Add a season or movie to start logging episodes and notes.</span>
                <KfButton variant="primary" icon={<Plus size={16} />} onClick={() => onAddSeason(series)}>
                  Add Season
                </KfButton>
                <KfButton variant="secondary" icon={<Plus size={16} />} onClick={() => onAddMovie(series)}>
                  Add Movie
                </KfButton>
              </div>
            ) : (
              <div className="kf-title-hero-actions">
                <div className="kf-title-step-group">
                  <KfButton
                    variant="secondary"
                    size="lg"
                    className="kf-title-step-minus"
                    icon={<Minus size={16} />}
                    disabled={!canStepMinus}
                    aria-label={
                      currentSeason
                        ? 'Decrease episode by 1'
                        : `Decrease progress by ${movieMinusDelta < 0 ? Math.abs(movieMinusDelta) : 10} minutes`
                    }
                    onClick={handlePrimaryMinus}
                  />
                  <KfButton
                    variant="primary"
                    size="lg"
                    icon={<Plus size={18} />}
                    disabled={!canStepPlus}
                    onClick={handlePrimaryPlus}
                  >
                    {currentSeason ? '+1 Episode' : `+${moviePlusDelta > 0 ? moviePlusDelta : 10} min`}
                  </KfButton>
                </div>

                <KfButton
                  variant="secondary"
                  size="lg"
                  icon={<PenLine size={16} />}
                  onClick={handleHeroNote}
                >
                  Note
                </KfButton>

                <KfButton
                  variant="quiet"
                  size="lg"
                  icon={<RotateCcw size={16} />}
                  onClick={handleLogRewatch}
                >
                  Rewatch
                </KfButton>
              </div>
            )}
          </div>

          {series.japanese_title && (
            <div className="kf-title-hero-jp" lang="ja" aria-hidden="true">
              {series.japanese_title}
            </div>
          )}
        </div>

        {/* Season & Movie Switcher Pills */}
        <div className="kf-title-releases">
          <span className="kf-title-releases-label">Releases</span>
          <div className="kf-title-release-pills">
            {seasons.map((s) => {
              const isSelected = selectedType === 'season' && currentSeason?.id === s.id;
              return (
                <button
                  key={`season-${s.id}`}
                  type="button"
                  aria-pressed={isSelected}
                  className={`kf-title-release-pill ${isSelected ? 'is-active' : ''}`}
                  onClick={() => selectRelease('season', s.id)}
                >
                  <Tv size={13} aria-hidden="true" />
                  <span>
                    S{s.season_number}
                    {s.title && s.title !== series.title ? ` · ${s.title}` : ''}
                  </span>
                </button>
              );
            })}

            {movies.map((m) => {
              const isSelected = selectedType === 'movie' && currentMovie?.id === m.id;
              return (
                <button
                  key={`movie-${m.id}`}
                  type="button"
                  aria-pressed={isSelected}
                  className={`kf-title-release-pill ${isSelected ? 'is-active' : ''}`}
                  onClick={() => selectRelease('movie', m.id)}
                >
                  <Film size={13} aria-hidden="true" />
                  <span>Movie · {m.title}</span>
                </button>
              );
            })}

            <div className="kf-title-release-add-group">
              <button
                type="button"
                className="kf-title-release-add"
                onClick={() => onAddSeason(series)}
              >
                <Plus size={13} aria-hidden="true" />
                <span>Season</span>
              </button>
              <button
                type="button"
                className="kf-title-release-add"
                onClick={() => onAddMovie(series)}
              >
                <Plus size={13} aria-hidden="true" />
                <span>Movie</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Tabs */}
      <nav className="kf-title-tabs" role="tablist" aria-label="Title sections">
        {TITLE_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          let count: number | null = null;
          if (tab.id === 'episodes' && currentSeason) {
            count = episodeNotesMap.size;
          } else if (tab.id === 'characters') {
            count = characters.length;
          } else if (tab.id === 'rewatches') {
            count = releaseRewatches.length;
          }

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`kf-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`kf-tabpanel-${tab.id}`}
              className={`kf-title-tab ${isSelected ? 'is-active' : ''}`}
              onClick={() => selectTab(tab.id)}
            >
              <span>{tab.label}</span>
              {count !== null && count > 0 && (
                <span className="kf-title-tab-count">{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Tab Panels */}
      {activeTab === 'overview' && (
        <section
          role="tabpanel"
          id="kf-tabpanel-overview"
          aria-labelledby="kf-tab-overview"
          className="kf-title-overview"
        >
          {/* Release Note on NotePaper */}
          <div className="kf-title-note-block">
            <div className="kf-title-section-head">
              <div>
                <h2>{currentMovie ? 'Movie Note' : 'Season Note'}</h2>
                <p className="kf-title-section-sub">
                  Adding to your note keeps everything you wrote before.
                </p>
              </div>
              {activeRelease && (
                <KfButton
                  variant={activeRelease.notes?.trim() ? 'secondary' : 'primary'}
                  icon={<PenLine size={15} />}
                  onClick={handleReleaseLessonNote}
                >
                  {activeRelease.notes?.trim() ? 'Add to note' : 'Write note'}
                </KfButton>
              )}
            </div>

            <NotePaper slate={releaseSlate}>
              {activeRelease?.notes?.trim() ? (
                <p>{activeRelease.notes}</p>
              ) : (
                <p className="kf-title-empty-paper">
                  No note written yet. What stayed with you after watching?
                </p>
              )}
            </NotePaper>
          </div>

          {/* Summary Strip */}
          {activeRelease && (
            <div className="kf-title-overview-grid">
              <div className="kf-title-stat-card">
                <span className="kf-title-stat-label">Progress</span>
                <span className="kf-title-stat-value">
                  {currentSeason
                    ? `Ep ${currentSeason.progress || 0}${currentSeason.total_episodes ? ` of ${currentSeason.total_episodes}` : ''}`
                    : `${currentMovie?.progress_minutes || 0}${currentMovie?.total_minutes ? ` of ${currentMovie.total_minutes} min` : ' min'}`}
                </span>
                <span className="kf-title-stat-meta">
                  {currentSeason
                    ? `${episodeNotesMap.size} episode note${episodeNotesMap.size === 1 ? '' : 's'}`
                    : `${pct}% watched`}
                </span>
              </div>

              <div className="kf-title-stat-card">
                <span className="kf-title-stat-label">Started</span>
                <span className="kf-title-stat-value">
                  {activeRelease.start_date ? formatDate(activeRelease.start_date) : 'Undated'}
                </span>
                <span className="kf-title-stat-meta">
                  {activeRelease.finish_date
                    ? `Finished ${formatDate(activeRelease.finish_date)}`
                    : activeRelease.status === 'WATCHING'
                      ? 'Currently watching'
                      : 'Not finished yet'}
                </span>
              </div>

              <div className="kf-title-stat-card">
                <span className="kf-title-stat-label">Rewatches &amp; Cast</span>
                <span className="kf-title-stat-value">
                  {releaseRewatches.length} rewatch{releaseRewatches.length === 1 ? '' : 'es'}
                </span>
                <span className="kf-title-stat-meta">
                  {characters.length} favorite character{characters.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}

          {/* Mini EpisodeMap Preview (Seasons only) */}
          {currentSeason && (
            <div className="kf-title-overview-strip">
              <div className="kf-title-section-head">
                <div>
                  <h2>Episode Map</h2>
                  <p className="kf-title-section-sub">
                    Click any episode to open its note in the Episodes tab.
                  </p>
                </div>
                <KfButton
                  variant="quiet"
                  icon={<ArrowRight size={15} />}
                  onClick={() => selectTab('episodes')}
                >
                  Open Episodes
                </KfButton>
              </div>
              <EpisodeMap
                total={episodeCount.total}
                watched={currentSeason.progress || 0}
                notes={episodeMapNotes}
                selected={selectedEp}
                onSelect={(ep) => selectEpisode(ep, true)}
              />
            </div>
          )}

          {/* Recent Rewatch Snippet */}
          {releaseRewatches.length > 0 && (
            <div className="kf-title-overview-strip">
              <div className="kf-title-section-head">
                <h2>Latest Rewatch</h2>
                <KfButton
                  variant="quiet"
                  icon={<ArrowRight size={15} />}
                  onClick={() => selectTab('rewatches')}
                >
                  View all rewatches
                </KfButton>
              </div>
              {(() => {
                const latest = releaseRewatches[releaseRewatches.length - 1];
                const delta = computeRatingDelta(activeRelease?.rating, latest.rating);
                return (
                  <div className="kf-title-mini-rewatch">
                    <div className="kf-title-mini-rewatch-copy">
                      <strong>
                        Rewatch {releaseRewatches.length} · {formatDate(latest.finish_date || latest.start_date)}
                      </strong>
                      <p>
                        {latest.notes?.trim()
                          ? latest.notes
                          : 'No rewatch note recorded yet.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ScoreTag score={latest.rating} />
                      {delta && (
                        <span className={`kf-title-delta is-${delta.direction}`}>
                          {delta.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Top Characters Strip */}
          {characters.length > 0 && (
            <div className="kf-title-overview-strip">
              <div className="kf-title-section-head">
                <h2>Characters</h2>
                <KfButton
                  variant="quiet"
                  icon={<ArrowRight size={15} />}
                  onClick={() => selectTab('characters')}
                >
                  All characters ({characters.length})
                </KfButton>
              </div>
              <div className="kf-title-chars-grid">
                {characters.slice(0, 4).map((char) => (
                  <Link
                    key={char.id}
                    viewTransition
                    to={`/characters/${char.id}`}
                    className="kf-title-char-link"
                  >
                    <KfCharacterCard
                      tier={cardTier({
                        hasPortrait: Boolean(char.cover_image_url || char.image_url),
                        hasWhy: Boolean(char.why?.trim()),
                        imageCount: char.images?.length ?? 0,
                      })}
                      name={char.name}
                      why={char.why}
                      imageUrl={char.cover_image_url || char.image_url}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'episodes' && (
        <section
          role="tabpanel"
          id="kf-tabpanel-episodes"
          aria-labelledby="kf-tab-episodes"
          className="kf-title-episodes"
        >
          {currentSeason ? (
            <>
              <div className="kf-title-section-head">
                <div>
                  <h2>Episode Map</h2>
                  <p className="kf-title-section-sub">
                    {currentSeason.progress || 0} of{' '}
                    {currentSeason.total_episodes ?? `${episodeCount.total}+`} watched ·{' '}
                    {episodeNotesMap.size} noted
                    {episodeCount.isEstimated &&
                      ` · Total episodes unset — showing up to Ep ${episodeCount.total}`}
                  </p>
                </div>
                <KfButton
                  variant="secondary"
                  icon={<Plus size={15} />}
                  onClick={() =>
                    openComposer({
                      targetKind: 'season',
                      id: currentSeason.id,
                      title: series.title,
                      context: `Season ${currentSeason.season_number}`,
                      defaultKind: 'episode',
                      episodeNumber: selectedEp ?? nextNoteEpisode(currentSeason),
                    })
                  }
                >
                  Add Episode Note
                </KfButton>
              </div>

              <div
                className={`kf-title-episodes-layout ${selectedEp !== null ? 'has-inspector' : ''}`}
              >
                <div className="kf-title-epmap-col">
                  <EpisodeMap
                    total={episodeCount.total}
                    watched={currentSeason.progress || 0}
                    notes={episodeMapNotes}
                    selected={selectedEp}
                    onSelect={(ep) => selectEpisode(ep)}
                  />

                  <div className="kf-title-epmap-legend" aria-label="Episode map legend">
                    <span className="kf-title-legend-item">
                      <span className="kf-title-legend-swatch is-watched" aria-hidden="true" />
                      Watched
                    </span>
                    <span className="kf-title-legend-item">
                      <span className="kf-title-legend-swatch is-note" aria-hidden="true" />
                      Has note
                    </span>
                    <span className="kf-title-legend-item">
                      <span className="kf-title-legend-swatch is-top" aria-hidden="true" />
                      Rated 9–10
                    </span>
                    <span className="kf-title-legend-item">
                      <span className="kf-title-legend-swatch is-next" aria-hidden="true" />
                      Up next
                    </span>
                  </div>

                  {selectedEp === null && (
                    <p className="kf-title-epmap-hint">
                      Select any episode cell to read or write its note without leaving this page.
                    </p>
                  )}
                </div>

                {selectedEp !== null && (
                  <aside
                    className="kf-title-ep-inspector"
                    aria-label={`Episode ${selectedEp} inspector`}
                  >
                    <div className="kf-title-ep-inspector-head">
                      <div>
                        <h3 className="kf-title-ep-inspector-title">Episode {selectedEp}</h3>
                        <p className="kf-title-ep-inspector-sub">
                          {selectedEpisodeNote?.episode_title || `Season ${currentSeason.season_number}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ScoreTag score={selectedEpisodeNote?.rating} />
                        <button
                          type="button"
                          className="kf-title-ep-inspector-close"
                          aria-label="Close episode inspector"
                          onClick={() => selectEpisode(null)}
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="kf-title-ep-nav">
                      <KfButton
                        variant="secondary"
                        icon={<ArrowLeft size={14} />}
                        disabled={prevEp === null}
                        aria-label="Previous episode"
                        onClick={() => prevEp !== null && selectEpisode(prevEp)}
                      >
                        Prev
                      </KfButton>
                      <span className="kf-title-ep-nav-hint">← / → · Esc</span>
                      <KfButton
                        variant="secondary"
                        disabled={nextEp === null}
                        aria-label="Next episode"
                        onClick={() => nextEp !== null && selectEpisode(nextEp)}
                      >
                        Next
                        <ArrowRight size={14} aria-hidden="true" />
                      </KfButton>
                    </div>

                    <NotePaper
                      slate={[
                        `Ep ${selectedEp}`,
                        selectedEpisodeNote?.episode_title || `Season ${currentSeason.season_number}`,
                        selectedEpisodeNote?.rating ? `Rated ${selectedEpisodeNote.rating}/10` : '',
                        selectedEpisodeNote?.created_at
                          ? formatDate(selectedEpisodeNote.created_at)
                          : 'Unnoted',
                      ].filter(Boolean)}
                    >
                      {selectedEpisodeNote?.note?.trim() ? (
                        <p>{selectedEpisodeNote.note}</p>
                      ) : (
                        <p className="kf-title-empty-paper">
                          No note for Episode {selectedEp} yet.
                        </p>
                      )}
                    </NotePaper>

                    <div className="kf-title-ep-inspector-actions">
                      <KfButton
                        variant="primary"
                        icon={<PenLine size={15} />}
                        onClick={() =>
                          openComposer({
                            targetKind: 'season',
                            id: currentSeason.id,
                            title: series.title,
                            context: `Season ${currentSeason.season_number}`,
                            defaultKind: 'episode',
                            episodeNumber: selectedEp,
                          })
                        }
                      >
                        {selectedEpisodeNote?.note?.trim() ? 'Add to note' : 'Write episode note'}
                      </KfButton>

                      <KfButton
                        variant="secondary"
                        onClick={() => onOpenEpisodeNotes(currentSeason, selectedEpisodeNote)}
                      >
                        Full modal
                      </KfButton>

                      {onAddRewatchEpisode && (
                        <KfButton
                          variant="quiet"
                          icon={<RotateCcw size={14} />}
                          onClick={() => onAddRewatchEpisode(currentSeason, selectedEp)}
                        >
                          Log ep rewatch
                        </KfButton>
                      )}
                    </div>
                  </aside>
                )}
              </div>
            </>
          ) : (
            <div className="kf-title-empty">
              <p>
                Episode maps belong to seasons.{' '}
                {seasons.length > 0
                  ? 'Select a season below to inspect its episodes.'
                  : 'Add a season to track episode-by-episode notes.'}
              </p>
              {seasons.length > 0 ? (
                <KfButton variant="secondary" onClick={() => selectRelease('season', seasons[0].id)}>
                  Switch to Season {seasons[0].season_number}
                </KfButton>
              ) : (
                <KfButton variant="primary" icon={<Plus size={16} />} onClick={() => onAddSeason(series)}>
                  Add Season
                </KfButton>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'characters' && (
        <section
          role="tabpanel"
          id="kf-tabpanel-characters"
          aria-labelledby="kf-tab-characters"
        >
          <div className="kf-title-section-head">
            <div>
              <h2>Characters</h2>
              <p className="kf-title-section-sub">
                Add portraits, write why they stayed with you, and level up each card.
              </p>
            </div>
            <KfButton
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => onAddCharacter(series)}
            >
              Add Character
            </KfButton>
          </div>

          {characters.length > 0 ? (
            <div className="kf-title-chars-grid">
              {characters.map((char) => (
                <div key={char.id} className="kf-title-char-item">
                  <Link
                    viewTransition
                    to={`/characters/${char.id}`}
                    className="kf-title-char-link"
                  >
                    <KfCharacterCard
                      tier={cardTier({
                        hasPortrait: Boolean(char.cover_image_url || char.image_url),
                        hasWhy: Boolean(char.why?.trim()),
                        imageCount: char.images?.length ?? 0,
                      })}
                      name={char.name}
                      seriesTitle={series.title}
                      why={char.why}
                      imageUrl={char.cover_image_url || char.image_url}
                    />
                  </Link>

                  {(onEditCharacter || onDeleteCharacter) && (
                    <div className="kf-title-char-actions">
                      {onEditCharacter && (
                        <button
                          type="button"
                          className="kf-title-icon-btn"
                          aria-label={`Edit ${char.name}`}
                          onClick={() => onEditCharacter(char)}
                        >
                          <Pencil size={13} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onDeleteCharacter && (
                        <button
                          type="button"
                          className="kf-title-icon-btn is-danger"
                          aria-label={`Delete ${char.name}`}
                          onClick={() => onDeleteCharacter(char.id)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="kf-title-empty">
              <Sparkles size={24} aria-hidden="true" color="var(--kf-text-2)" />
              <p>No characters added yet for {series.title}.</p>
              <KfButton
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => onAddCharacter(series)}
              >
                Add Character
              </KfButton>
            </div>
          )}
        </section>
      )}

      {activeTab === 'rewatches' && (
        <section
          role="tabpanel"
          id="kf-tabpanel-rewatches"
          aria-labelledby="kf-tab-rewatches"
        >
          <div className="kf-title-section-head">
            <div>
              <h2>Then vs Now</h2>
              <p className="kf-title-section-sub">
                Compare your original watch alongside every rewatch pass.
              </p>
            </div>
            <KfButton variant="primary" icon={<RotateCcw size={16} />} onClick={handleLogRewatch}>
              Log Rewatch
            </KfButton>
          </div>

          {releaseRewatches.length > 0 ? (
            <div className="kf-title-rewatch-list">
              {releaseRewatches.map((rewatch, idx) => {
                const delta = computeRatingDelta(activeRelease?.rating, rewatch.rating);
                const scopeTag =
                  rewatch.target_type === 'episode' && rewatch.episode_number
                    ? `Episode ${rewatch.episode_number}`
                    : rewatch.target_type === 'series'
                      ? 'Full series'
                      : null;

                return (
                  <article key={rewatch.id} className="kf-title-then-now">
                    <header className="kf-title-then-now-head">
                      <div className="kf-title-then-now-meta">
                        <strong>Rewatch {idx + 1}</strong>
                        {scopeTag && <span className="kf-title-release-chip">{scopeTag}</span>}
                        <span className="kf-title-then-now-date">
                          {formatDate(rewatch.finish_date || rewatch.start_date)}
                        </span>
                        {delta && (
                          <span
                            className={`kf-title-delta is-${delta.direction}`}
                            aria-label={`Rating change ${delta.label}`}
                          >
                            {delta.label}
                          </span>
                        )}
                      </div>

                      {(onEditRewatch || onDeleteRewatch) && (
                        <div className="kf-title-char-actions">
                          {onEditRewatch && (
                            <button
                              type="button"
                              className="kf-title-icon-btn"
                              aria-label={`Edit rewatch ${idx + 1}`}
                              onClick={() => onEditRewatch(rewatch)}
                            >
                              <Pencil size={13} aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                          )}
                          {onDeleteRewatch && (
                            <button
                              type="button"
                              className="kf-title-icon-btn is-danger"
                              aria-label={`Delete rewatch ${idx + 1}`}
                              onClick={() => onDeleteRewatch(rewatch.id)}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </header>

                    <div className="kf-title-then-now-grid">
                      <div className="kf-title-then-col">
                        <div className="kf-title-then-col-head">
                          <span className="kf-title-then-col-label">Then · Original</span>
                          <ScoreTag score={activeRelease?.rating} />
                        </div>
                        {activeRelease?.notes?.trim() ? (
                          <p className="kf-title-then-col-body">{activeRelease.notes}</p>
                        ) : (
                          <p className="kf-title-then-col-empty">No original note recorded.</p>
                        )}
                      </div>

                      <div className="kf-title-then-col">
                        <div className="kf-title-then-col-head">
                          <span className="kf-title-then-col-label">Now · Rewatch {idx + 1}</span>
                          <ScoreTag score={rewatch.rating} />
                        </div>
                        {rewatch.notes?.trim() ? (
                          <p className="kf-title-then-col-body">{rewatch.notes}</p>
                        ) : (
                          <p className="kf-title-then-col-empty">No rewatch note recorded.</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="kf-title-empty">
              <RotateCcw size={24} aria-hidden="true" color="var(--kf-text-2)" />
              <p>
                No rewatches logged yet for {releaseLabel ?? series.title}. Log a second pass to see
                how your perspective changed.
              </p>
              <KfButton variant="primary" icon={<RotateCcw size={16} />} onClick={handleLogRewatch}>
                Log Rewatch
              </KfButton>
            </div>
          )}
        </section>
      )}

      {activeTab === 'details' && (
        <section
          role="tabpanel"
          id="kf-tabpanel-details"
          aria-labelledby="kf-tab-details"
        >
          <div className="kf-title-section-head">
            <h2>Details</h2>
          </div>

          <div className="kf-title-details-grid">
            <div className="kf-title-detail-card">
              <h3>Titles</h3>
              <dl className="kf-title-dl">
                <div>
                  <dt>Title</dt>
                  <dd>{series.title}</dd>
                </div>
                {series.romaji_title && (
                  <div>
                    <dt>Romaji</dt>
                    <dd>{series.romaji_title}</dd>
                  </div>
                )}
                {series.japanese_title && (
                  <div>
                    <dt>Japanese</dt>
                    <dd lang="ja">{series.japanese_title}</dd>
                  </div>
                )}
              </dl>
            </div>

            {activeRelease && (
              <div className="kf-title-detail-card">
                <h3>Active Release</h3>
                <dl className="kf-title-dl">
                  <div>
                    <dt>Format</dt>
                    <dd>
                      {currentSeason
                        ? `TV / Season ${currentSeason.season_number}${currentSeason.total_episodes ? ` · ${currentSeason.total_episodes} episodes` : ''}`
                        : `Movie${currentMovie?.total_minutes ? ` · ${currentMovie.total_minutes} min` : ''}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Start date</dt>
                    <dd>{formatDate(activeRelease.start_date)}</dd>
                  </div>
                  <div>
                    <dt>Finish date</dt>
                    <dd>{formatDate(activeRelease.finish_date)}</dd>
                  </div>
                  {optionalMeta.season_aired && (
                    <div>
                      <dt>Season aired</dt>
                      <dd>{optionalMeta.season_aired}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="kf-title-detail-card">
              <h3>Genres &amp; Studios</h3>
              {series.genres?.length > 0 && (
                <div>
                  <span className="kf-title-stat-label">Genres</span>
                  <div className="kf-title-chips" style={{ marginTop: 8 }}>
                    {series.genres.map((g) => (
                      <span key={g.id} className="kf-title-chip">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {combinedStudios.length > 0 && (
                <div>
                  <span className="kf-title-stat-label">Studios</span>
                  <div className="kf-title-chips" style={{ marginTop: 8 }}>
                    {combinedStudios.map((st) => (
                      <span key={st.id} className="kf-title-chip">
                        {st.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!series.genres?.length && combinedStudios.length === 0 && (
                <p style={{ margin: 0, color: 'var(--kf-text-2)', fontSize: 'var(--kf-text-sm)' }}>
                  No genres or studios recorded yet.
                </p>
              )}
            </div>

            <div className="kf-title-detail-card">
              <h3>Journal Summary</h3>
              <dl className="kf-title-dl">
                <div>
                  <dt>Releases</dt>
                  <dd>
                    {seasons.length} season{seasons.length === 1 ? '' : 's'} · {movies.length} movie
                    {movies.length === 1 ? '' : 's'}
                  </dd>
                </div>
                <div>
                  <dt>Characters</dt>
                  <dd>{characters.length}</dd>
                </div>
                <div>
                  <dt>Rewatches for this release</dt>
                  <dd>{releaseRewatches.length}</dd>
                </div>
                <div>
                  <dt>First logged</dt>
                  <dd>{formatDate(series.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {synopsisText && (
            <div className="kf-title-panel" style={{ marginTop: 'var(--kf-4)' }}>
              <h3
                style={{
                  margin: '0 0 var(--kf-2)',
                  color: 'var(--kf-text-2)',
                  font: '700 var(--kf-text-xs) / 1 var(--kf-font-ui)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Synopsis
              </h3>
              <p style={{ margin: 0, color: 'var(--kf-text)', lineHeight: 1.6 }}>{synopsisText}</p>
            </div>
          )}
        </section>
      )}

      {/* 4. Phone Sticky Action Bar (<= 768px) */}
      {activeRelease && (
        <div className="kf-title-sticky-bar" role="region" aria-label="Quick actions">
          <KfButton
            variant="secondary"
            className="kf-title-sticky-minus"
            icon={<Minus size={16} />}
            disabled={!canStepMinus}
            aria-label={
              currentSeason
                ? 'Decrease episode by 1'
                : `Decrease progress by ${movieMinusDelta < 0 ? Math.abs(movieMinusDelta) : 10} minutes`
            }
            onClick={handlePrimaryMinus}
          />
          <KfButton
            variant="primary"
            className="kf-title-sticky-step"
            icon={<Plus size={17} />}
            disabled={!canStepPlus}
            onClick={handlePrimaryPlus}
          >
            {currentSeason ? '+1 Episode' : `+${moviePlusDelta > 0 ? moviePlusDelta : 10} min`}
          </KfButton>
          <KfButton
            variant="secondary"
            className="kf-title-sticky-note"
            icon={<PenLine size={16} />}
            onClick={handleHeroNote}
          >
            Note
          </KfButton>
        </div>
      )}
    </div>
  );
};
