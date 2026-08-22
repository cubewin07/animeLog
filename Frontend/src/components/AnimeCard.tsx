import React, { useState } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  Sparkles,
  Tv,
  Clapperboard,
  BookmarkCheck,
  Quote,
  CheckCircle2,
  Sparkle,
  Film,
} from 'lucide-react';

interface AnimeCardProps {
  series: AnimeSeries;
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

export const AnimeCard: React.FC<AnimeCardProps> = ({
  series,
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
  // Combine all releases (seasons + movies) into a unified selectable release list
  const allReleases: Array<{
    type: 'season' | 'movie';
    id: number;
    title: string;
    label: string;
    data: AnimeSeason | AnimeMovie;
  }> = [
    ...series.seasons.map((s) => ({
      type: 'season' as const,
      id: s.id,
      title: s.title,
      label: `S${s.season_number}: ${s.title}`,
      data: s,
    })),
    ...series.movies.map((m) => ({
      type: 'movie' as const,
      id: m.id,
      title: m.title,
      label: `Film: ${m.title}`,
      data: m,
    })),
  ];

  const [activeReleaseIndex, setActiveReleaseIndex] = useState<number>(0);
  const activeRelease = allReleases[activeReleaseIndex] || allReleases[0] || null;

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

  const totalReleases = series.seasons.length + series.movies.length;
  const completedReleases =
    series.seasons.filter((s) => s.status === 'COMPLETED').length +
    series.movies.filter((m) => m.status === 'COMPLETED').length;

  const isAllCompleted = totalReleases > 0 && completedReleases === totalReleases;

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'linear-gradient(180deg, rgba(16, 32, 54, 0.9) 0%, rgba(9, 20, 36, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: isAllCompleted
            ? 'linear-gradient(90deg, #10b981, #38bdf8)'
            : 'linear-gradient(90deg, var(--color-primary-action), #818cf8)',
        }}
      />

      {/* Franchise Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
          {series.cover_image_url || series.image_url ? (
            <img
              src={series.cover_image_url || series.image_url || ''}
              alt={series.title}
              className="franchise-card-poster"
            />
          ) : (
            <div
              className="franchise-card-poster"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--color-primary)',
              }}
            >
              <Film size={22} opacity={0.6} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {series.title}
              </h3>

              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: isAllCompleted ? 'rgba(16, 185, 129, 0.18)' : 'rgba(99, 102, 241, 0.18)',
                  color: isAllCompleted ? '#34d399' : 'var(--color-primary)',
                  border: isAllCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isAllCompleted && <CheckCircle2 size={12} />}
                {completedReleases} / {totalReleases} COMPLETED
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

        {/* Top Franchise Action Buttons */}
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          <button
            className="btn-icon"
            onClick={() => onEditSeries(series)}
            title="Edit Franchise"
            style={{ width: '32px', height: '32px' }}
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDeleteSeries(series.id)}
            title="Delete Franchise"
            style={{ width: '32px', height: '32px', color: '#fb7185' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Release Selector Tabs (If franchise has multiple releases) */}
      {allReleases.length > 1 && (
        <div className="release-tabs-container">
          {allReleases.map((rel, idx) => {
            const isActive = idx === activeReleaseIndex;
            return (
              <button
                key={`${rel.type}-${rel.id}`}
                className={`release-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveReleaseIndex(idx)}
              >
                {rel.type === 'season' ? <Tv size={12} /> : <Clapperboard size={12} />}
                <span>{rel.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Release Spotlight Workspace */}
      {activeRelease ? (
        <div
          style={{
            background: 'rgba(8, 19, 33, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {activeRelease.type === 'season' ? (
            (() => {
              const season = activeRelease.data as AnimeSeason;
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
                <>
                  {/* Release Title + Status + Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                        {season.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(season.status)}
                      {season.rating && (
                        <div className="rating-pill">
                          <Star size={11} fill="#fbbf24" color="#fbbf24" />
                          <span>{season.rating}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Counter & Tactile Stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          {season.progress}{' '}
                          <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                            / {season.total_episodes !== null ? season.total_episodes : '??'} eps
                          </span>
                        </span>
                        <span className="mono" style={{ fontSize: '12px', color: isCompleted ? '#34d399' : 'var(--text-muted)' }}>
                          ({progressPct}%)
                        </span>
                      </div>

                      <div className="stepper-group">
                        <button
                          className="stepper-btn"
                          onClick={() => onSeasonProgressDelta(season.id, -1)}
                          disabled={season.progress <= 0}
                          title="Step back 1 episode"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          className="stepper-btn"
                          style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary)' }}
                          onClick={() => onSeasonProgressDelta(season.id, 1)}
                          disabled={season.total_episodes !== null && season.progress >= season.total_episodes}
                          title="Advance 1 episode"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-track" style={{ height: '5px' }}>
                      <div
                        className={`progress-fill ${isCompleted ? 'completed' : ''}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Core Editorial Takeaway / Lesson */}
                  {season.notes ? (
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
                          Season Reflection & Lesson
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#e2eaf6', fontStyle: 'italic', lineHeight: 1.55 }}>
                        "{season.notes}"
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No reflection recorded for this season yet.
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-primary)' }}
                        onClick={() => onEditSeason(season)}
                      >
                        + Add Takeaway
                      </button>
                    </div>
                  )}

                  {/* Standout Episode Memories Grid */}
                  {season.episode_notes && season.episode_notes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Standout Episode Highlights ({season.episode_notes.length}):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {season.episode_notes.map((ep) => (
                          <div
                            key={ep.id}
                            style={{
                              background: 'rgba(5, 15, 27, 0.9)',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                              <span>
                                Ep {ep.episode_number}{ep.episode_title ? `: ${ep.episode_title}` : ''}
                              </span>
                              {ep.rating && <span style={{ color: '#fbbf24' }}>★ {ep.rating}</span>}
                            </div>
                            <p style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '12px', lineHeight: 1.4 }}>
                              "{ep.note}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Season Actions Dock */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px' }}>
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
                        <span>Ep Memories ({episodeNotesCount})</span>
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
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
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
                </>
              );
            })()
          ) : (
            (() => {
              const movie = activeRelease.data as AnimeMovie;
              const progressPct =
                movie.total_minutes && movie.total_minutes > 0
                  ? Math.min(100, Math.round((movie.progress_minutes / movie.total_minutes) * 100))
                  : movie.progress_minutes > 0
                  ? 50
                  : 0;
              const isCompleted = movie.status === 'COMPLETED';
              const rewatchesCount = movie.rewatches?.length || 0;

              return (
                <>
                  {/* Release Title + Status + Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                        {movie.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(movie.status)}
                      {movie.rating && (
                        <div className="rating-pill">
                          <Star size={11} fill="#fbbf24" color="#fbbf24" />
                          <span>{movie.rating}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Counter & Stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          {movie.progress_minutes}{' '}
                          <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                            / {movie.total_minutes !== null ? movie.total_minutes : '??'} min
                          </span>
                        </span>
                        <span className="mono" style={{ fontSize: '12px', color: isCompleted ? '#38bdf8' : 'var(--text-muted)' }}>
                          ({progressPct}%)
                        </span>
                      </div>

                      <div className="stepper-group">
                        <button
                          className="stepper-btn"
                          onClick={() => onMovieProgressDelta(movie.id, -10)}
                          disabled={movie.progress_minutes <= 0}
                          title="Step back 10 minutes"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          className="stepper-btn"
                          style={{ background: 'rgba(56, 189, 248, 0.2)', color: 'var(--color-accent-cyan)' }}
                          onClick={() => onMovieProgressDelta(movie.id, 10)}
                          disabled={movie.total_minutes !== null && movie.progress_minutes >= movie.total_minutes}
                          title="Advance 10 minutes"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-track" style={{ height: '5px' }}>
                      <div
                        className={`progress-fill ${isCompleted ? 'completed' : ''}`}
                        style={{
                          width: `${progressPct}%`,
                          background: isCompleted ? undefined : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Film Reflection */}
                  {movie.notes ? (
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
                  ) : (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No reflection recorded for this film yet.
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-accent-cyan)' }}
                        onClick={() => onEditMovie(movie)}
                      >
                        + Add Takeaway
                      </button>
                    </div>
                  )}

                  {/* Film Actions Dock */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
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

                    <div style={{ display: 'flex', gap: '4px' }}>
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
                </>
              );
            })()
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>
            No TV seasons or films added to this franchise yet.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => onAddSeason(series)} style={{ fontSize: '12px' }}>
              <Plus size={13} /> Add Season
            </button>
            <button className="btn btn-secondary" onClick={() => onAddMovie(series)} style={{ fontSize: '12px' }}>
              <Plus size={13} /> Add Film
            </button>
          </div>
        </div>
      )}

      {/* Franchise Beloved Characters Strip */}
      {series.favorite_characters && series.favorite_characters.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkle size={12} color="var(--color-accent-emerald)" />
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--color-accent-emerald)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Beloved Characters ({series.favorite_characters.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                      <Sparkles size={11} />
                    </div>
                  )}
                  <span>{c.name}</span>
                  {c.why && (
                    <span style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                      — "{c.why.slice(0, 24)}{c.why.length > 24 ? '…' : ''}"
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Bar in Card Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
            onClick={() => onAddSeason(series)}
            title="Add TV Season"
          >
            <Plus size={12} />
            <span>Season</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
            onClick={() => onAddMovie(series)}
            title="Add Film"
          >
            <Plus size={12} />
            <span>Film</span>
          </button>

          <button
            className="btn btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
            onClick={() => onAddCharacter(series)}
            title="Remember a Character"
          >
            <Sparkles size={12} />
            <span>Character</span>
          </button>
        </div>
      </div>
    </div>
  );
};
