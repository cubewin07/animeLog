import React, { useState } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, FavoriteCharacter, Rewatch } from '../types';
import { ProgressStepper } from '../components/ProgressStepper';
import {
  ArrowLeft,
  Tv,
  Film,
  Plus,
  PenLine,
  Trash2,
  Sparkles,
  RotateCcw,
  Calendar,
  Star,
  Quote,
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
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddCharacter: (series: AnimeSeries) => void;
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
  onAddRewatchSeason,
  onAddRewatchMovie,
  onAddCharacter,
}) => {
  // Select active season/movie by default (prefer WATCHING or first available)
  const defaultSeason = series.seasons?.find((s) => s.status === 'WATCHING') || series.seasons?.[0];
  const [selectedType, setSelectedType] = useState<'season' | 'movie'>('season');
  const [selectedId, setSelectedId] = useState<number>(defaultSeason?.id || series.movies?.[0]?.id || 0);

  const currentSeason = series.seasons?.find((s) => s.id === selectedId);
  const currentMovie = series.movies?.find((m) => m.id === selectedId);

  // Active release (season or movie)
  const activeRelease =
    selectedType === 'season'
      ? currentSeason || series.seasons?.[0]
      : currentMovie || series.movies?.[0];

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

  const activeRating = activeRelease?.rating || series.rating;
  const studioNames = series.studios?.map((s) => s.name).join(', ') || 'Independent';

  const formatLabel =
    selectedType === 'season'
      ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} (TV Series)`
      : `Anime Movie`;

  const eyebrowLabel =
    selectedType === 'season'
      ? `ARCHIVE // TV ANIME · S${(activeRelease as AnimeSeason)?.season_number || 1}`
      : `ARCHIVE // ANIME FILM`;

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
          {/* Poster Still */}
          <div className="detail-poster-wrapper">
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
                <Tv size={48} />
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
                return (
                  <button
                    key={`side-s-${s.id}`}
                    onClick={() => {
                      setSelectedType('season');
                      setSelectedId(s.id);
                    }}
                    className={`release-pill-btn ${isSelected ? 'active' : ''} ${isWatching ? 'watching' : ''}`}
                    aria-label={`Select Season ${s.season_number}: ${s.title}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Tv size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Season {s.season_number}: {s.title}
                      </span>
                    </div>
                    {s.rating && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.9 }}>
                        ★{s.rating}
                      </span>
                    )}
                  </button>
                );
              })}

              {series.movies?.map((m) => {
                const isSelected = selectedType === 'movie' && selectedId === m.id;
                const isWatching = m.status === 'WATCHING';
                return (
                  <button
                    key={`side-m-${m.id}`}
                    onClick={() => {
                      setSelectedType('movie');
                      setSelectedId(m.id);
                    }}
                    className={`release-pill-btn ${isSelected ? 'active' : ''} ${isWatching ? 'watching' : ''}`}
                    aria-label={`Select Movie: ${m.title}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Film size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Film: {m.title}
                      </span>
                    </div>
                    {m.rating && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.9 }}>
                        ★{m.rating}
                      </span>
                    )}
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
            {/* Score */}
            <div className="stats-score-row">
              <span className="stats-score-label">SCORE</span>
              <div className="stats-score-val">
                {activeRating ? (
                  <>
                    <span>★ {activeRating}</span>
                    <span className="score-total">/10</span>
                  </>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--text-desk-muted)', fontWeight: 500 }}>
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

              {/* Stepper Progress */}
              {selectedType === 'season' && activeRelease && (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  <ProgressStepper
                    current={(activeRelease as AnimeSeason).progress || 0}
                    total={(activeRelease as AnimeSeason).total_episodes}
                    unit="eps"
                    onDelta={(d) => onSeasonProgressDelta(activeRelease.id, d)}
                    ariaLabelPrefix={`${series.title} S${(activeRelease as AnimeSeason).season_number}`}
                  />
                </div>
              )}

              {selectedType === 'movie' && activeRelease && (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  <ProgressStepper
                    current={(activeRelease as AnimeMovie).progress_minutes || 0}
                    total={(activeRelease as AnimeMovie).total_minutes}
                    unit="mins"
                    step={10}
                    onDelta={(d) => onMovieProgressDelta(activeRelease.id, d)}
                    ariaLabelPrefix={`${(activeRelease as AnimeMovie).title}`}
                  />
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

            {/* Action Bar */}
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
                onClick={() => onEditSeries(series)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '7px 10px' }}
                title="Edit Franchise Metadata"
                aria-label="Edit Franchise Metadata"
              >
                <PenLine size={13} />
              </button>

              <button
                onClick={() => onDeleteSeries(series.id)}
                className="btn-icon danger"
                title="Delete Franchise"
                aria-label="Delete Franchise"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================
            RIGHT COLUMN (Narrative Journal, Pull Quotes, Evolution)
            ========================================================= */}
        <main className="detail-main-content">
          {/* Header Title Block */}
          <div>
            <div className="detail-eyebrow">
              <span>{eyebrowLabel}</span>
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

          {/* Section 1: Main Takeaway & Editorial Pull Quote */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="section-title" style={{ color: 'var(--text-desk)', margin: 0 }}>
                {selectedType === 'season'
                  ? `Season ${(activeRelease as AnimeSeason)?.season_number || 1} Takeaway & Lessons`
                  : 'Film Reflection & Lessons'}
              </h2>

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
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  <PenLine size={12} />
                  <span>{activeRelease.notes ? 'Edit Lesson' : 'Write Lesson'}</span>
                </button>
              )}
            </div>

            {activeRelease?.notes ? (
              <div className="editorial-pull-quote">
                <p className="editorial-pull-quote-text">“{activeRelease.notes}”</p>
                <div className="editorial-pull-quote-footer">
                  <span className="editorial-pull-quote-label">
                    CORE LESSON // {activeRelease.status || 'RECORDED'}
                  </span>
                  {activeRelease.rating && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tungsten)' }}>
                      Rating: {activeRelease.rating}/10
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="desk-card"
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    color: 'var(--text-desk-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  No life lesson captured yet for this release. A title without notes is incomplete.
                </span>
                <button
                  onClick={() => {
                    if (selectedType === 'season') {
                      onEditSeason(activeRelease as AnimeSeason);
                    } else {
                      onEditMovie(activeRelease as AnimeMovie);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                >
                  <PenLine size={13} />
                  <span>Capture Takeaway</span>
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Episode Memories (if TV Season) */}
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
                  <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2 }}>
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
                    <div
                      key={ep.id}
                      className="desk-card"
                      style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--tungsten)',
                          }}
                        >
                          Episode {ep.episode_number}
                          {ep.episode_title ? `: ${ep.episode_title}` : ''}
                        </span>

                        {ep.rating && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 13,
                              color: 'var(--text-desk)',
                            }}
                          >
                            ★ {ep.rating}/10
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 15.5,
                          lineHeight: 1.6,
                          color: 'var(--text-desk)',
                          margin: 0,
                        }}
                      >
                        {ep.note}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="desk-card"
                  style={{
                    padding: '24px 20px',
                    textAlign: 'center',
                    color: 'var(--text-desk-muted)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, margin: 0 }}>
                    No episode memories logged yet for Season {(activeRelease as AnimeSeason).season_number}.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Section 3: "Evolving Perspectives" Rewatch Timeline */}
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
                <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2 }}>
                  Evolving Perspectives & Rewatches
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-desk-muted)' }}>
                  How lessons and insights deepened with subsequent viewings.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
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
                    <span>Log Movie Rewatch</span>
                  </button>
                )}
              </div>
            </div>

            {seriesRewatches.length > 0 ? (
              <div className="evolving-timeline">
                {seriesRewatches.map((r, idx) => (
                  <div key={r.id} className="timeline-row">
                    {/* Left Pass Label + Date */}
                    <div className="timeline-pass-col">
                      <span className="timeline-pass-badge">Watch #{passMap.get(r.id) || idx + 1}</span>
                      <span className="timeline-pass-date">{r.start_date || r.finish_date || 'Pass'}</span>
                    </div>

                    {/* Stem & Ring */}
                    <div className="timeline-stem-col">
                      <div className="timeline-node-ring" />
                      <div className="timeline-stem-line" />
                    </div>

                    {/* Content Card */}
                    <div className="timeline-content-col">
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <span className="timeline-card-title">
                            <RotateCcw size={14} color="var(--tungsten)" />
                            <span>{r.release_title || series.title}</span>
                          </span>

                          {r.rating && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 13,
                                color: 'var(--tungsten)',
                                fontWeight: 600,
                              }}
                            >
                              ★ {r.rating}/10
                            </span>
                          )}
                        </div>

                        {r.notes ? (
                          <p className="timeline-card-text">"{r.notes}"</p>
                        ) : (
                          <p
                            style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: 14,
                              color: 'var(--text-desk-muted)',
                              fontStyle: 'italic',
                              margin: 0,
                            }}
                          >
                            Rewatch logged without additional perspective notes.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="desk-card"
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'var(--text-desk-muted)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, margin: 0 }}>
                  No rewatch passes recorded yet. Rewatching is how lessons deepen.
                </p>
              </div>
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
                <h2 className="section-title" style={{ color: 'var(--text-desk)', marginBottom: 2 }}>
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {franchiseCharacters.map((char) => {
                  const charImg =
                    char.images && char.images.length > 0
                      ? (char.images[0] as any).image_url || (char.images[0] as any).url
                      : null;
                  return (
                    <div
                      key={char.id}
                      className="desk-card"
                      style={{ display: 'flex', gap: 14, padding: 16, alignItems: 'start' }}
                    >
                      {charImg ? (
                        <img
                          src={charImg}
                          alt={char.name}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1.5px solid var(--border-desk-medium)',
                          }}
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: 'var(--desk-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--graphite)',
                            flexShrink: 0,
                          }}
                        >
                          <Sparkles size={18} />
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontSize: 15, color: 'var(--text-desk)', marginBottom: 4 }}>
                          {char.name}
                        </h4>
                        {char.why && (
                          <p
                            style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: 14.5,
                              color: 'var(--text-desk-muted)',
                              lineHeight: 1.5,
                              margin: 0,
                            }}
                          >
                            {char.why}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="desk-card"
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'var(--text-desk-muted)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, margin: 0 }}>
                  No favorite characters recorded yet from this franchise.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
