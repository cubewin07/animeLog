import React, { useState } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, FavoriteCharacter, ImageAsset, Rewatch } from '../types';
import { ProgressStepper } from '../components/ProgressStepper';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { CharacterCard } from '../components/CharacterCard';
import { CharacterDetailModal } from '../components/CharacterDetailModal';
import { characterApi } from '../api/client';
import {
  ArrowLeft,
  Tv,
  Film,
  Plus,
  PenLine,
  Trash2,
  Sparkles,
  RotateCcw,
  Layers,
} from 'lucide-react';

interface FranchiseDetailViewProps {
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
  onOpenEpisodeNotes: (season: AnimeSeason) => void;
  onAddRewatchSeries?: (series: AnimeSeries) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddRewatchEpisode?: (season: AnimeSeason, episodeNumber: number) => void;
  onAddCharacter: (series: AnimeSeries) => void;
  onEditCharacter?: (character: FavoriteCharacter) => void;
  onDeleteCharacter?: (id: number) => void;
  onRefresh?: () => Promise<void>;
}

export const FranchiseDetailView: React.FC<FranchiseDetailViewProps> = ({
  series,
  allRewatches = [],
  onBack,
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
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onRefresh,
}) => {
  // Select active season/movie by default (prefer WATCHING or first available)
  const defaultSeason = series.seasons?.find((s) => s.status === 'WATCHING') || series.seasons?.[0];
  const [selectedType, setSelectedType] = useState<'season' | 'movie'>('season');
  const [selectedId, setSelectedId] = useState<number>(defaultSeason?.id || series.movies?.[0]?.id || 0);
  const [rewatchFilter, setRewatchFilter] = useState<'release' | 'all'>('release');
  const [selectedCharacterForDetail, setSelectedCharacterForDetail] = useState<FavoriteCharacter | null>(null);

  const currentSeason = series.seasons?.find((s) => s.id === selectedId);
  const currentMovie = series.movies?.find((m) => m.id === selectedId);

  // Active release (season or movie)
  const activeRelease =
    selectedType === 'season'
      ? currentSeason || series.seasons?.[0]
      : currentMovie || series.movies?.[0];

  const activeStatus = activeRelease?.status || 'PLAN_TO_WATCH';

  const coverUrl =
    (activeRelease as any)?.cover_image_url ||
    ((activeRelease as any)?.cover_image as any)?.image_url ||
    series.cover_image_url ||
    (series.cover_image as any)?.image_url;

  // Franchise characters
  const franchiseCharacters = series.favorite_characters || [];

  // Rewatches for this series (franchise passes, seasons, movies, episodes)
  const seriesRewatches = allRewatches.filter((r) => {
    if (r.target_type === 'series' && r.target_id === series.id) return true;
    if (r.series_id === series.id) return true;
    if (r.target_type === 'season' && series.seasons?.some((s) => s.id === r.target_id)) return true;
    if (r.target_type === 'movie' && series.movies?.some((m) => m.id === r.target_id)) return true;
    if (r.target_type === 'episode' && series.seasons?.some((s) => s.episode_notes?.some((ep) => ep.id === r.target_id))) return true;
    if (r.season && series.seasons?.some((s) => s.id === r.season)) return true;
    if (r.movie && series.movies?.some((m) => m.id === r.movie)) return true;
    return false;
  });

  // Calculate true chronological pass number for each rewatch (oldest = Watch #1, next = Watch #2, etc.)
  const passMap = new Map<number, number>();
  [...seriesRewatches]
    .sort((a, b) => {
      const dateA = a.start_date || a.finish_date || '';
      const dateB = b.start_date || b.finish_date || '';
      if (dateA && dateB) return dateA.localeCompare(dateB);
      if (dateA) return -1;
      if (dateB) return 1;
      return a.id - b.id;
    })
    .forEach((r, i) => {
      passMap.set(r.id, i + 1);
    });

  const displayedRewatches = rewatchFilter === 'all'
    ? seriesRewatches
    : seriesRewatches.filter((r) => {
        if (selectedType === 'season') {
          return (r.target_type === 'season' && r.target_id === activeRelease?.id) ||
                 (r.season === activeRelease?.id) ||
                 (r.target_type === 'episode' && (activeRelease as AnimeSeason)?.episode_notes?.some(ep => ep.id === r.target_id));
        } else {
          return (r.target_type === 'movie' && r.target_id === activeRelease?.id) ||
                 (r.movie === activeRelease?.id);
        }
      });

  const activeRating = activeRelease?.rating;
  const studioNames = series.studios?.map((s) => s.name).join(', ') || 'Independent';

  const formatLabel =
    selectedType === 'season'
      ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} (TV Series)`
      : `Anime Movie`;

  const eyebrowLabel =
    selectedType === 'season'
      ? `TV Series · Season ${(activeRelease as AnimeSeason)?.season_number || 1}`
      : `Anime Film`;

  const getRatingBandClass = (score?: number | null) => {
    if (!score) return 'rating-band-empty';
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const getPassNodeColor = (passNumber: number, totalPasses: number) => {
    if (passNumber === 1) return 'var(--graphite)';
    if (passNumber === totalPasses && totalPasses > 1) return 'var(--ember)';
    return 'var(--tungsten)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Top Breadcrumb / Back Navigation */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            fontSize: 14,
            color: 'var(--text-desk-muted)',
          }}
          aria-label="Back to anime journal"
        >
          <ArrowLeft size={16} />
          <span>Back to Anime Journal</span>
        </button>
      </div>

      {/* 2-Column Split: Left Sticky Catalog Column & Right Literary Journal Column */}
      <div className="detail-split-layout">
        {/* =========================================================
            LEFT COLUMN (Poster Still + Release Switcher + Quick Stats)
            ========================================================= */}
        <aside className="detail-sidebar">
          {/* Poster Still with Status Edge */}
          <div className={`detail-poster-wrapper poster-edge-${activeStatus.toLowerCase()}`}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={series.title}
                className="detail-poster-img"
                width={360}
                height={500}
                loading="eager"
              />
            ) : (
              <div className="detail-poster-placeholder">
                <Tv size={48} color="var(--graphite)" />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>No Poster Still</span>
              </div>
            )}
          </div>

          {/* Release Switcher in Franchise */}
          <div className="release-switcher-box">
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-desk-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={13} color="var(--tungsten)" />
              <span>Franchise Releases</span>
            </div>

            <div className="release-pill-list">
              {series.seasons?.map((s) => {
                const isSelected = selectedType === 'season' && selectedId === s.id;
                const isWatching = s.status === 'WATCHING';
                const statusClass = `pill-${s.status.toLowerCase()}`;
                return (
                  <button
                    key={`side-s-${s.id}`}
                    onClick={() => {
                      setSelectedType('season');
                      setSelectedId(s.id);
                    }}
                    className={`release-pill-btn ${statusClass} ${isSelected ? `active active.${statusClass}` : ''}`}
                    aria-label={`Select Season ${s.season_number}: ${s.title}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Tv
                        size={14}
                        style={{
                          flexShrink: 0,
                          color: isWatching ? 'var(--tungsten)' : 'var(--text-desk-muted)',
                        }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Season {s.season_number}: {s.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isWatching && <span className="watching-dot" title="Currently watching" />}
                      {s.rating && (
                        <span
                          className={getRatingBandClass(s.rating)}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}
                        >
                          ★{s.rating}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {series.movies?.map((m) => {
                const isSelected = selectedType === 'movie' && selectedId === m.id;
                const isWatching = m.status === 'WATCHING';
                const statusClass = `pill-${m.status.toLowerCase()}`;
                return (
                  <button
                    key={`side-m-${m.id}`}
                    onClick={() => {
                      setSelectedType('movie');
                      setSelectedId(m.id);
                    }}
                    className={`release-pill-btn ${statusClass} ${isSelected ? `active active.${statusClass}` : ''}`}
                    aria-label={`Select Movie: ${m.title}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Film size={14} style={{ flexShrink: 0, color: 'var(--night-text)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Film: {m.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isWatching && <span className="watching-dot" title="Currently watching" />}
                      {m.rating && (
                        <span
                          className={getRatingBandClass(m.rating)}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}
                        >
                          ★{m.rating}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Season / Movie Buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                onClick={() => onAddSeason(series)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 12, padding: '6px 8px', justifyContent: 'center' }}
              >
                <Plus size={13} />
                <span>Season</span>
              </button>
              <button
                onClick={() => onAddMovie(series)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 12, padding: '6px 8px', justifyContent: 'center' }}
              >
                <Plus size={13} />
                <span>Movie</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="quick-stats-box">
            {/* Score with Rating Band Coloring */}
            <div className="stats-score-row">
              <span className="stats-score-label">SCORE</span>
              <div className="stats-score-val">
                {activeRating ? (
                  <>
                    <span className={getRatingBandClass(activeRating)}>★ {activeRating}</span>
                    <span className="score-total">/10</span>
                  </>
                ) : (
                  <span className="rating-band-empty" style={{ fontSize: 14, fontWeight: 500 }}>
                    Unrated
                  </span>
                )}
              </div>
            </div>

            <div className="stats-divider" />

            {/* Metadata Table */}
            <div className="stats-meta-list">
              <div className="stats-meta-row">
                <span className="meta-key">Format</span>
                <span className="meta-val">{formatLabel}</span>
              </div>

              <div className="stats-meta-row">
                <span className="meta-key">Studio</span>
                <span className="meta-val" title={studioNames}>
                  {studioNames}
                </span>
              </div>

              {activeRelease?.status && (
                <div className="stats-meta-row">
                  <span className="meta-key">Status</span>
                  <span className={`status-indicator ${activeRelease.status.toLowerCase()}`}>
                    {activeRelease.status}
                  </span>
                </div>
              )}

              {/* Stepper Progress shown ONLY if WATCHING */}
              {selectedType === 'season' && activeRelease && (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  {activeRelease.status === 'WATCHING' ? (
                    <ProgressStepper
                      current={(activeRelease as AnimeSeason).progress || 0}
                      total={(activeRelease as AnimeSeason).total_episodes}
                      unit="eps"
                      onDelta={(d) => onSeasonProgressDelta(activeRelease.id, d)}
                      ariaLabelPrefix={`${series.title} S${(activeRelease as AnimeSeason).season_number}`}
                    />
                  ) : (
                    <span className="meta-val-mono">
                      {(activeRelease as AnimeSeason).total_episodes || (activeRelease as AnimeSeason).progress || 0} eps
                    </span>
                  )}
                </div>
              )}

              {selectedType === 'movie' && activeRelease && (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  {activeRelease.status === 'WATCHING' ? (
                    <ProgressStepper
                      current={(activeRelease as AnimeMovie).progress_minutes || 0}
                      total={(activeRelease as AnimeMovie).total_minutes}
                      unit="mins"
                      step={10}
                      onDelta={(d) => onMovieProgressDelta(activeRelease.id, d)}
                      ariaLabelPrefix={`${(activeRelease as AnimeMovie).title}`}
                    />
                  ) : (
                    <span className="meta-val-mono">
                      {(activeRelease as AnimeMovie).total_minutes || (activeRelease as AnimeMovie).progress_minutes || 0} mins
                    </span>
                  )}
                </div>
              )}

              {activeRelease?.start_date && (
                <div className="stats-meta-row">
                  <span className="meta-key">Logged</span>
                  <span className="meta-val-mono">{activeRelease.start_date}</span>
                </div>
              )}
            </div>

            <div className="stats-divider" />

            {/* Action Bar: Edit release, Edit franchise (labelled), Delete (seal) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeRelease && (
                  <button
                    onClick={() => {
                      if (selectedType === 'season') {
                        onEditSeason(activeRelease as AnimeSeason);
                      } else {
                        onEditMovie(activeRelease as AnimeMovie);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, padding: '7px 10px', justifyContent: 'center' }}
                    aria-label="Edit active release"
                  >
                    <PenLine size={13} />
                    <span>Edit Release</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteSeries(series.id)}
                  className="btn-icon danger"
                  title="Delete Franchise"
                  aria-label="Delete Franchise"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <button
                onClick={() => onEditSeries(series)}
                className="btn btn-ghost"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  justifyContent: 'center',
                  border: '1px solid var(--border-desk-subtle)',
                }}
                aria-label="Edit Franchise Metadata"
              >
                <PenLine size={13} />
                <span>Edit Franchise Metadata</span>
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================
            RIGHT COLUMN (Takeaway Slip, Episode Notes, Rewatches, Characters)
            ========================================================= */}
        <main className="detail-main-content">
          {/* Header Title Block */}
          <div>
            <div className="detail-eyebrow">
              <span className={`status-indicator ${activeStatus.toLowerCase()}`} style={{ fontSize: 12 }}>
                {eyebrowLabel}
              </span>
            </div>

            <h1 className="detail-main-title">{series.title}</h1>

            {/* Genres & Studios Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {series.genres?.map((g) => (
                <span key={g.id} className="genre-tag">
                  {g.name}
                </span>
              ))}
              {series.studios?.map((st) => (
                <span key={st.id} className="studio-tag">
                  {st.name}
                </span>
              ))}
            </div>
          </div>

          {/* Section 1: Main Takeaway Slip (Cream paper surface) */}
          <section className="detail-section-takeaway">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="section-title" style={{ color: 'var(--text-desk)', margin: 0, fontSize: 20 }}>
                {selectedType === 'season'
                  ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} Takeaway`
                  : 'Film Reflection'}
              </h2>
            </div>

            <TakeawaySlip
              isDetail
              status={activeRelease?.status}
              text={activeRelease?.notes}
              label={
                selectedType === 'season'
                  ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} Takeaway`
                  : 'Film Reflection'
              }
              rating={activeRelease?.rating}
              onWrite={() => {
                if (selectedType === 'season') {
                  onEditSeason(activeRelease as AnimeSeason);
                } else {
                  onEditMovie(activeRelease as AnimeMovie);
                }
              }}
              emptyText="No life lesson captured yet for this release. A title without notes is incomplete."
              emptyCtaText="Capture Takeaway"
            />
          </section>

          {/* Section 2: Episode Memories (TV Season) */}
          {selectedType === 'season' && activeRelease && (
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2, fontSize: 18 }}>
                    Episode Memories
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-desk-muted)' }}>
                    Pivotal takeaways and moments captured per episode.
                  </p>
                </div>

                <button
                  onClick={() => onOpenEpisodeNotes(activeRelease as AnimeSeason)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  <Plus size={14} />
                  <span>Log Episode Memory</span>
                </button>
              </div>

              {(activeRelease as AnimeSeason).episode_notes &&
              (activeRelease as AnimeSeason).episode_notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(activeRelease as AnimeSeason).episode_notes.map((ep) => (
                    <div key={ep.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <TakeawaySlip
                        compact
                        status={activeRelease.status}
                        label={`Episode ${ep.episode_number}${ep.episode_title ? `: ${ep.episode_title}` : ''}`}
                        text={ep.note}
                        rating={ep.rating}
                        onWrite={() => onOpenEpisodeNotes(activeRelease as AnimeSeason)}
                      />
                      {onAddRewatchEpisode && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 4 }}>
                          <button
                            onClick={() => onAddRewatchEpisode(activeRelease as AnimeSeason, ep.episode_number)}
                            className="btn btn-ghost"
                            style={{
                              padding: '2px 8px',
                              fontSize: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: 'var(--text-desk-dim)',
                            }}
                            title={`Log rewatch pass for Episode ${ep.episode_number}`}
                          >
                            <RotateCcw size={11} />
                            <span>Rewatch Ep {ep.episode_number}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <TakeawaySlip
                  compact
                  emptyText={`No episode memories logged yet for Season ${(activeRelease as AnimeSeason).season_number}.`}
                  emptyCtaText="Log Episode Memory"
                  onWrite={() => onOpenEpisodeNotes(activeRelease as AnimeSeason)}
                />
              )}
            </section>
          )}

          {/* Section 3: Rewatches Timeline */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2, fontSize: 18 }}>
                  Rewatches
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-desk-muted)' }}>
                  How perspectives and insights deepened with subsequent passes.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Filter toggle: This release vs Whole franchise */}
                <div
                  style={{
                    display: 'inline-flex',
                    background: 'var(--desk-surface)',
                    borderRadius: 'var(--radius-pill)',
                    padding: 2,
                    border: '1px solid var(--border-desk-subtle)',
                  }}
                >
                  <button
                    onClick={() => setRewatchFilter('release')}
                    className={`btn ${rewatchFilter === 'release' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      minHeight: 28,
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    This Release
                  </button>
                  <button
                    onClick={() => setRewatchFilter('all')}
                    className={`btn ${rewatchFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      minHeight: 28,
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    Whole Franchise
                  </button>
                </div>

                {rewatchFilter === 'all' && onAddRewatchSeries && (
                  <button
                    onClick={() => onAddRewatchSeries(series)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    <Layers size={13} />
                    <span>Log Franchise Rewatch</span>
                  </button>
                )}

                {selectedType === 'season' && activeRelease && (
                  <button
                    onClick={() => onAddRewatchSeason(activeRelease as AnimeSeason)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    <RotateCcw size={13} />
                    <span>Log Season Rewatch</span>
                  </button>
                )}
                {selectedType === 'movie' && activeRelease && (
                  <button
                    onClick={() => onAddRewatchMovie(activeRelease as AnimeMovie)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    <RotateCcw size={13} />
                    <span>Log Film Rewatch</span>
                  </button>
                )}
              </div>
            </div>

            {displayedRewatches.length > 0 ? (
              <div className="evolving-timeline">
                {displayedRewatches.map((r, idx) => {
                  const passNumber = passMap.get(r.id) || idx + 1;
                  const nodeColor = getPassNodeColor(passNumber, passMap.size);
                  return (
                    <div key={r.id} className="timeline-row">
                      {/* Left Pass Label + Date */}
                      <div className="timeline-pass-col">
                        <span
                          className="timeline-pass-badge"
                          style={{ color: nodeColor }}
                        >
                          Watch #{passNumber}
                        </span>
                        <span className="timeline-pass-date">{r.start_date || r.finish_date || 'Pass'}</span>
                      </div>

                      {/* Stem & Ring */}
                      <div className="timeline-stem-col">
                        <div
                          className="timeline-node-ring"
                          style={{ borderColor: nodeColor }}
                        />
                        <div className="timeline-stem-line" />
                      </div>

                      {/* Content Card: On Paper Slip */}
                      <div className="timeline-content-col">
                        <TakeawaySlip
                          compact
                          status="COMPLETED"
                          label={r.release_title || series.title}
                          subTitle={r.start_date ? `Logged: ${r.start_date}` : undefined}
                          text={r.notes}
                          rating={r.rating}
                          emptyText="Rewatch logged without additional perspective notes."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <TakeawaySlip
                compact
                emptyText={
                  rewatchFilter === 'release'
                    ? 'No rewatch passes recorded for this release yet. Rewatching is how lessons deepen.'
                    : 'No rewatch passes recorded for this franchise yet. Rewatching is how lessons deepen.'
                }
                emptyCtaText="Log a rewatch"
                onWrite={() => {
                  if (rewatchFilter === 'all' && onAddRewatchSeries) {
                    onAddRewatchSeries(series);
                  } else if (selectedType === 'season' && activeRelease) {
                    onAddRewatchSeason(activeRelease as AnimeSeason);
                  } else if (selectedType === 'movie' && activeRelease) {
                    onAddRewatchMovie(activeRelease as AnimeMovie);
                  }
                }}
              />
            )}
          </section>

          {/* Section 4: Memorable Characters */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2, fontSize: 18 }}>
                  Memorable Characters
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-desk-muted)' }}>
                  Characters whose choices, flaws, or philosophies left a mark.
                </p>
              </div>

              <button
                onClick={() => onAddCharacter(series)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                <Plus size={14} />
                <span>Add Character</span>
              </button>
            </div>

            {franchiseCharacters.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 20,
                }}
              >
                {franchiseCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onClick={(c) => setSelectedCharacterForDetail(c)}
                    onEdit={onEditCharacter}
                    onDelete={onDeleteCharacter}
                  />
                ))}
              </div>
            ) : (
              <TakeawaySlip
                compact
                emptyText="No favorite characters recorded yet from this franchise."
                emptyCtaText="Add Character"
                onWrite={() => onAddCharacter(series)}
              />
            )}
          </section>
        </main>
      </div>

      {/* Character Detail Modal */}
      {selectedCharacterForDetail && (
        <CharacterDetailModal
          isOpen={Boolean(selectedCharacterForDetail)}
          onClose={() => setSelectedCharacterForDetail(null)}
          character={selectedCharacterForDetail}
          onEdit={onEditCharacter}
          onSetCoverImage={async (charId, imageId) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              const updatedImages = existingImageIds.includes(imageId)
                ? existingImageIds
                : [...existingImageIds, imageId];

              const updated = await characterApi.update(charId, {
                cover_image: imageId,
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to set cover image:', err);
            }
          }}
          onAddImage={async (charId, image) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              if (existingImageIds.includes(image.id)) return;

              const updatedImages = [...existingImageIds, image.id];
              const updated = await characterApi.update(charId, {
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to attach image to character:', err);
            }
          }}
          onRemoveImage={async (charId, imageId) => {
            try {
              const char = franchiseCharacters.find((c) => c.id === charId);
              const existingImageIds = (char?.images || []).map((img) => img.id);
              const updatedImages = existingImageIds.filter((id) => id !== imageId);
              const newCoverImage =
                char?.cover_image === imageId ? updatedImages[0] || null : char?.cover_image;

              const updated = await characterApi.update(charId, {
                cover_image: newCoverImage,
                images: updatedImages,
              });
              setSelectedCharacterForDetail(updated);
              if (onRefresh) await onRefresh();
            } catch (err) {
              console.error('Failed to remove image from character:', err);
            }
          }}
        />
      )}
    </div>
  );
};
