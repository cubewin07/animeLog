import React, { useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  Tv,
  Clapperboard,
  BookmarkCheck,
  Sparkles,
  Quote,
  CheckCircle2,
  Sparkle,
  Film,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface SeriesTableViewProps {
  seriesList: AnimeSeries[];
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

export const SeriesTableView: React.FC<SeriesTableViewProps> = ({
  seriesList,
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
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;
      const cards = containerRef.current.querySelectorAll('.franchise-section-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.05,
            ease: EASING.gentle,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: containerRef, dependencies: [seriesList.length] }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WATCHING':
        return <span className="status-badge watching">Watching</span>;
      case 'COMPLETED':
        return <span className="status-badge completed">Completed</span>;
      case 'PLAN_TO_WATCH':
        return <span className="status-badge plan_to_watch">Plan to Watch</span>;
      case 'ON_HOLD':
        return <span className="status-badge on_hold">On Hold</span>;
      case 'DROPPED':
        return <span className="status-badge dropped">Dropped</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  // Summary Metrics
  const totalSeasons = seriesList.reduce((acc, s) => acc + s.seasons.length, 0);
  const totalMovies = seriesList.reduce((acc, s) => acc + s.movies.length, 0);
  const totalTvWatched = seriesList.reduce(
    (acc, s) => acc + s.seasons.reduce((sAcc, sea) => sAcc + sea.progress, 0),
    0
  );
  const totalTvKnown = seriesList.reduce(
    (acc, s) =>
      acc + s.seasons.reduce((sAcc, sea) => sAcc + (sea.total_episodes || sea.progress), 0),
    0
  );

  const totalMemories = seriesList.reduce(
    (acc, s) =>
      acc +
      s.seasons.filter((sea) => sea.notes && sea.notes.trim().length > 0).length +
      s.movies.filter((m) => m.notes && m.notes.trim().length > 0).length +
      s.seasons.reduce((epAcc, sea) => epAcc + (sea.episode_notes?.length || 0), 0),
    0
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Franchise Editorial Section Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {seriesList.map((series) => {
          const allReleasesCount = series.seasons.length + series.movies.length;
          const completedReleasesCount =
            series.seasons.filter((s) => s.status === 'COMPLETED').length +
            series.movies.filter((m) => m.status === 'COMPLETED').length;

          const seriesTvWatched = series.seasons.reduce((sum, s) => sum + s.progress, 0);
          const seriesTvTotal = series.seasons.reduce(
            (sum, s) => sum + (s.total_episodes || s.progress),
            0
          );
          const isAllCompleted = allReleasesCount > 0 && completedReleasesCount === allReleasesCount;

          return (
            <div key={series.id} className="franchise-section-card">
              {/* Franchise Header Banner */}
              <div className="franchise-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {series.cover_image_url || series.image_url ? (
                    <img
                      src={series.cover_image_url || series.image_url || ''}
                      alt={series.title}
                      className="franchise-poster-thumb"
                    />
                  ) : (
                    <div
                      className="franchise-poster-thumb"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <Film size={18} opacity={0.6} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                        {series.title}
                      </h3>
                      <span
                        className="mono"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isAllCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: isAllCompleted ? '#34d399' : 'var(--color-primary)',
                          fontWeight: 700,
                        }}
                      >
                        FRANCHISE
                      </span>
                    </div>

                    {/* Studios & Genres */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {series.studios && series.studios.length > 0 && (
                        <span className="studio-tag">
                          {series.studios.map((s) => s.name).join(', ')}
                        </span>
                      )}
                      {series.genres &&
                        series.genres.map((g) => (
                          <span key={g.id} className="genre-tag">
                            {g.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right: Franchise Completion & Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isAllCompleted && <CheckCircle2 size={14} color="#34d399" />}
                    <span
                      className="mono"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isAllCompleted ? '#34d399' : '#ffffff',
                      }}
                    >
                      {completedReleasesCount} / {allReleasesCount} completed
                    </span>
                  </div>

                  {series.seasons.length > 0 && (
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {seriesTvWatched} / {seriesTvTotal} eps
                    </span>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 9px', fontSize: '11px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => onAddSeason(series)}
                      title="Add TV Season"
                    >
                      <Plus size={12} />
                      <span>Season</span>
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 9px', fontSize: '11px', border: '1px solid var(--border-subtle)' }}
                      onClick={() => onAddMovie(series)}
                      title="Add Film"
                    >
                      <Plus size={12} />
                      <span>Film</span>
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onAddCharacter(series)}
                      title="Remember a Character"
                      style={{ padding: '5px 7px' }}
                    >
                      <Sparkles size={13} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onEditSeries(series)}
                      title="Edit Franchise"
                      style={{ padding: '5px 7px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onDeleteSeries(series.id)}
                      title="Delete Franchise"
                      style={{ color: '#fb7185', padding: '5px 7px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Releases Linear List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* TV Seasons */}
                {series.seasons.map((season) => {
                  const progressPct =
                    season.total_episodes && season.total_episodes > 0
                      ? Math.min(100, Math.round((season.progress / season.total_episodes) * 100))
                      : season.progress > 0
                      ? 50
                      : 0;
                  const isCompleted = season.status === 'COMPLETED';
                  const episodeNotesCount = season.episode_notes?.length || 0;
                  const rewatchesCount = season.rewatches?.length || 0;

                  return (
                    <div key={`table-season-${season.id}`} className="release-linear-item">
                      {/* Top Release Line: Title, Status, Rating, Stepper, Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Title & Metadata */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                          {season.cover_image_url || season.image_url ? (
                            <img
                              src={season.cover_image_url || season.image_url || ''}
                              alt={season.title}
                              className="release-still-thumb"
                            />
                          ) : (
                            <div
                              className="release-still-thumb"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              <Tv size={14} opacity={0.7} />
                            </div>
                          )}
                          <span className="type-badge-tv">
                            <Tv size={11} /> S{season.season_number}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                            {season.title}
                          </span>
                          {season.studios && season.studios.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                              ({season.studios.map((s) => s.name).join(', ')})
                            </span>
                          )}
                        </div>

                        {/* Status & Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(season.status)}
                          {season.rating && (
                            <div className="rating-pill">
                              <Star size={11} fill="#fbbf24" color="#fbbf24" />
                              <span>{season.rating}/10</span>
                            </div>
                          )}
                        </div>

                        {/* Tactile Progress Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                {season.progress}{' '}
                                <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                                  / {season.total_episodes ?? '??'} eps
                                </span>
                              </span>
                              <span className="mono" style={{ fontSize: '11px', color: isCompleted ? '#34d399' : 'var(--text-muted)' }}>
                                ({progressPct}%)
                              </span>
                            </div>
                            <div className="progress-track" style={{ height: '4px' }}>
                              <div
                                className={`progress-fill ${isCompleted ? 'completed' : ''}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="stepper-group">
                            <button
                              className="stepper-btn"
                              onClick={() => onSeasonProgressDelta(season.id, -1)}
                              disabled={season.progress <= 0}
                              title="Step back 1 episode"
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              className="stepper-btn"
                              style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary)' }}
                              onClick={() => onSeasonProgressDelta(season.id, 1)}
                              disabled={season.total_episodes !== null && season.progress >= season.total_episodes}
                              title="Advance 1 episode"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Release Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              color: episodeNotesCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                              background: episodeNotesCount > 0 ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            }}
                            onClick={() => onOpenEpisodeNotes(season)}
                            title="Standout Episode Memories"
                          >
                            <BookmarkCheck size={12} />
                            <span>Ep Memories {episodeNotesCount > 0 ? `(${episodeNotesCount})` : ''}</span>
                          </button>

                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              color: rewatchesCount > 0 ? 'var(--color-secondary)' : 'var(--text-muted)',
                              background: rewatchesCount > 0 ? 'rgba(196, 193, 251, 0.12)' : 'transparent',
                            }}
                            onClick={() => onAddRewatchSeason(season)}
                            title="Log Rewatch Pass"
                          >
                            <RotateCcw size={12} />
                            <span>Rewatch {rewatchesCount > 0 ? `(${rewatchesCount})` : ''}</span>
                          </button>

                          <button className="btn-icon" onClick={() => onEditSeason(season)} title="Edit Season">
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => onDeleteSeason(season.id)}
                            title="Delete Season"
                            style={{ color: '#fb7185' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Line 2: Editorial Reflection & Standout Memories (High Readability) */}
                      {season.notes && (
                        <div className="editorial-takeaway-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Quote size={13} color="var(--color-primary)" />
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Season Takeaway
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#e2eaf6', fontStyle: 'italic', lineHeight: 1.55 }}>
                            "{season.notes}"
                          </p>
                        </div>
                      )}

                      {/* Standout Episode Notes Pills */}
                      {season.episode_notes && season.episode_notes.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {season.episode_notes.map((ep) => (
                            <div
                              key={ep.id}
                              style={{
                                background: 'rgba(9, 22, 38, 0.85)',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>
                                Ep {ep.episode_number}:
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                "{ep.note}"
                              </span>
                              {ep.rating && <span style={{ color: '#fbbf24', fontWeight: 600 }}>★{ep.rating}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Films */}
                {series.movies.map((movie) => {
                  const progressPct =
                    movie.total_minutes && movie.total_minutes > 0
                      ? Math.min(100, Math.round((movie.progress_minutes / movie.total_minutes) * 100))
                      : movie.progress_minutes > 0
                      ? 50
                      : 0;
                  const isCompleted = movie.status === 'COMPLETED';
                  const rewatchesCount = movie.rewatches?.length || 0;

                  return (
                    <div key={`table-movie-${movie.id}`} className="release-linear-item">
                      {/* Top Release Line */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Title & Metadata */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                          {movie.cover_image_url || movie.image_url ? (
                            <img
                              src={movie.cover_image_url || movie.image_url || ''}
                              alt={movie.title}
                              className="release-still-thumb"
                            />
                          ) : (
                            <div
                              className="release-still-thumb"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: 'var(--color-accent-cyan)',
                              }}
                            >
                              <Clapperboard size={14} opacity={0.7} />
                            </div>
                          )}
                          <span className="type-badge-movie">
                            <Clapperboard size={11} /> FILM
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                            {movie.title}
                          </span>
                          {movie.studios && movie.studios.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                              ({movie.studios.map((s) => s.name).join(', ')})
                            </span>
                          )}
                        </div>

                        {/* Status & Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(movie.status)}
                          {movie.rating && (
                            <div className="rating-pill">
                              <Star size={11} fill="#fbbf24" color="#fbbf24" />
                              <span>{movie.rating}/10</span>
                            </div>
                          )}
                        </div>

                        {/* Minutes Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                {movie.progress_minutes}{' '}
                                <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                                  / {movie.total_minutes ?? '??'} min
                                </span>
                              </span>
                              <span className="mono" style={{ fontSize: '11px', color: isCompleted ? '#38bdf8' : 'var(--text-muted)' }}>
                                ({progressPct}%)
                              </span>
                            </div>
                            <div className="progress-track" style={{ height: '4px' }}>
                              <div
                                className={`progress-fill ${isCompleted ? 'completed' : ''}`}
                                style={{
                                  width: `${progressPct}%`,
                                  background: isCompleted ? undefined : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                                }}
                              />
                            </div>
                          </div>

                          <div className="stepper-group">
                            <button
                              className="stepper-btn"
                              onClick={() => onMovieProgressDelta(movie.id, -10)}
                              disabled={movie.progress_minutes <= 0}
                              title="Step back 10 minutes"
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              className="stepper-btn"
                              style={{ background: 'rgba(56, 189, 248, 0.2)', color: 'var(--color-accent-cyan)' }}
                              onClick={() => onMovieProgressDelta(movie.id, 10)}
                              disabled={movie.total_minutes !== null && movie.progress_minutes >= movie.total_minutes}
                              title="Advance 10 minutes"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Release Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              color: rewatchesCount > 0 ? 'var(--color-secondary)' : 'var(--text-muted)',
                              background: rewatchesCount > 0 ? 'rgba(196, 193, 251, 0.12)' : 'transparent',
                            }}
                            onClick={() => onAddRewatchMovie(movie)}
                            title="Log Rewatch Pass"
                          >
                            <RotateCcw size={12} />
                            <span>Rewatch {rewatchesCount > 0 ? `(${rewatchesCount})` : ''}</span>
                          </button>

                          <button className="btn-icon" onClick={() => onEditMovie(movie)} title="Edit Film">
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => onDeleteMovie(movie.id)}
                            title="Delete Film"
                            style={{ color: '#fb7185' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Film Takeaway */}
                      {movie.notes && (
                        <div className="editorial-takeaway-card editorial-takeaway-movie">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Quote size={13} color="var(--color-accent-cyan)" />
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--color-accent-cyan)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Film Reflection & Memory
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#e2eaf6', fontStyle: 'italic', lineHeight: 1.55 }}>
                            "{movie.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Franchise Beloved Characters Strip */}
              {series.favorite_characters && series.favorite_characters.length > 0 && (
                <div
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(5, 15, 27, 0.5)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkle size={12} color="var(--color-accent-emerald)" />
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--color-accent-emerald)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Characters:
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {series.favorite_characters.map((c) => {
                      const charImg = (c.images && c.images.length > 0) ? c.images[0].url : c.image_url;
                      return (
                        <div key={c.id} className="character-badge" title={c.why || c.name}>
                          {charImg ? (
                            <img
                              src={charImg}
                              alt={c.name}
                              className="character-avatar-thumb"
                            />
                          ) : (
                            <div
                              className="character-avatar-thumb"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(78, 222, 163, 0.15)',
                                color: 'var(--color-accent-emerald)',
                              }}
                            >
                              <Sparkles size={10} />
                            </div>
                          )}
                          <span>{c.name}</span>
                          {c.why && (
                            <span style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                              — "{c.why.slice(0, 28)}{c.why.length > 28 ? '…' : ''}"
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
