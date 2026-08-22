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
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tv,
  Clapperboard,
  BookmarkCheck,
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
  const [expanded, setExpanded] = useState(true);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'WATCHING':
        return 'watching';
      case 'COMPLETED':
        return 'completed';
      case 'PLAN_TO_WATCH':
        return 'plan_to_watch';
      case 'ON_HOLD':
        return 'on_hold';
      case 'DROPPED':
        return 'dropped';
      default:
        return '';
    }
  };

  const allReleasesCount = series.seasons.length + series.movies.length;
  const completedReleasesCount =
    series.seasons.filter((s) => s.status === 'COMPLETED').length +
    series.movies.filter((m) => m.status === 'COMPLETED').length;

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header: Franchise Title + Derived Studios + Genres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff' }}>{series.title}</h3>
            <span
              className="mono"
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {completedReleasesCount}/{allReleasesCount} COMPLETED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {series.studios && series.studios.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 500 }}>
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

        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" onClick={() => onEditSeries(series)} title="Edit franchise">
            <Edit3 size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDeleteSeries(series.id)}
            title="Delete franchise"
            style={{ color: '#fb7185' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Releases Section (TV Seasons & Movies) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Seasons */}
        {series.seasons.map((season) => {
          const progressPct =
            season.total_episodes && season.total_episodes > 0
              ? Math.min(100, Math.round((season.progress / season.total_episodes) * 100))
              : season.progress > 0
              ? 50
              : 0;
          const noteCount = season.episode_notes?.length || 0;

          return (
            <div
              key={`card-season-${season.id}`}
              style={{
                background: 'rgba(5, 20, 36, 0.6)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tv size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    Season {season.season_number}: {season.title}
                  </span>
                  <span className={`status-badge ${getStatusClass(season.status)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {season.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {season.rating && (
                    <div className="rating-pill" style={{ padding: '1px 5px', fontSize: '10px' }}>
                      <Star size={10} fill="#fbbf24" color="#fbbf24" />
                      <span>{season.rating}</span>
                    </div>
                  )}
                  <button className="btn-icon" onClick={() => onEditSeason(season)} title="Edit season">
                    <Edit3 size={11} />
                  </button>
                  <button className="btn-icon" onClick={() => onDeleteSeason(season.id)} title="Delete season" style={{ color: '#fb7185' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Progress bar and stepper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {season.progress} / {season.total_episodes ?? '??'} eps
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-icon"
                    onClick={() => onSeasonProgressDelta(season.id, -1)}
                    disabled={season.progress <= 0}
                    title="Subtract 1 episode"
                  >
                    <Minus size={11} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => onSeasonProgressDelta(season.id, 1)}
                    disabled={season.total_episodes !== null && season.progress >= season.total_episodes}
                    title="Add 1 episode"
                    style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              <div className="progress-track" style={{ height: '3px' }}>
                <div
                  className={`progress-fill ${season.status === 'COMPLETED' ? 'completed' : ''}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Sub-actions for season */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '2px 6px', fontSize: '11px' }}
                  onClick={() => onOpenEpisodeNotes(season)}
                  title="Standout episode memories"
                >
                  <BookmarkCheck size={12} />
                  <span>Notes ({noteCount})</span>
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '2px 6px', fontSize: '11px' }}
                  onClick={() => onAddRewatchSeason(season)}
                  title="Log rewatch"
                >
                  <RotateCcw size={12} />
                  <span>Rewatch</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Movies */}
        {series.movies.map((movie) => {
          const progressPct =
            movie.total_minutes && movie.total_minutes > 0
              ? Math.min(100, Math.round((movie.progress_minutes / movie.total_minutes) * 100))
              : movie.progress_minutes > 0
              ? 50
              : 0;

          return (
            <div
              key={`card-movie-${movie.id}`}
              style={{
                background: 'rgba(5, 20, 36, 0.6)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clapperboard size={14} color="var(--color-accent-cyan)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    Film: {movie.title}
                  </span>
                  <span className={`status-badge ${getStatusClass(movie.status)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {movie.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {movie.rating && (
                    <div className="rating-pill" style={{ padding: '1px 5px', fontSize: '10px' }}>
                      <Star size={10} fill="#fbbf24" color="#fbbf24" />
                      <span>{movie.rating}</span>
                    </div>
                  )}
                  <button className="btn-icon" onClick={() => onEditMovie(movie)} title="Edit movie">
                    <Edit3 size={11} />
                  </button>
                  <button className="btn-icon" onClick={() => onDeleteMovie(movie.id)} title="Delete movie" style={{ color: '#fb7185' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Progress minute stepper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {movie.progress_minutes} / {movie.total_minutes ?? '??'} min
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-icon"
                    onClick={() => onMovieProgressDelta(movie.id, -10)}
                    disabled={movie.progress_minutes <= 0}
                    title="Subtract 10 minutes"
                  >
                    <Minus size={11} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => onMovieProgressDelta(movie.id, 10)}
                    disabled={movie.total_minutes !== null && movie.progress_minutes >= movie.total_minutes}
                    title="Add 10 minutes"
                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent-cyan)' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              <div className="progress-track" style={{ height: '3px' }}>
                <div
                  className={`progress-fill ${movie.status === 'COMPLETED' ? 'completed' : ''}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '2px 6px', fontSize: '11px' }}
                  onClick={() => onAddRewatchMovie(movie)}
                  title="Log rewatch"
                >
                  <RotateCcw size={12} />
                  <span>Rewatch</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Characters & Rewatches preview */}
      {series.favorite_characters && series.favorite_characters.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
          {series.favorite_characters.map((c) => (
            <span
              key={c.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-accent-emerald)',
                background: 'rgba(78, 222, 163, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              <Sparkles size={11} />
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Quick Franchise Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '3px 7px', fontSize: '11px' }}
            onClick={() => onAddSeason(series)}
            title="Add TV Season"
          >
            <Plus size={12} />
            <span>Season</span>
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '3px 7px', fontSize: '11px' }}
            onClick={() => onAddMovie(series)}
            title="Add Film"
          >
            <Plus size={12} />
            <span>Film</span>
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '3px 7px', fontSize: '11px' }}
            onClick={() => onAddCharacter(series)}
            title="Remember a character"
          >
            <Sparkles size={12} />
            <span>Character</span>
          </button>
        </div>
      </div>
    </div>
  );
};
