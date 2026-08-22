import React, { useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Film,
  Tv,
  Clapperboard,
  BookmarkCheck,
  Sparkles,
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
  // Expand series by default
  const [expandedSeriesIds, setExpandedSeriesIds] = useState<number[]>(
    seriesList.map((s) => s.id)
  );
  const [expandedNotesSeasonId, setExpandedNotesSeasonId] = useState<number | null>(null);
  const [expandedNotesMovieId, setExpandedNotesMovieId] = useState<number | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const toggleSeriesExpand = (id: number) => {
    setExpandedSeriesIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  useGSAP(
    () => {
      if (prefersReducedMotion() || !tableBodyRef.current) return;
      const rows = tableBodyRef.current.querySelectorAll('.series-master-row');
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, x: -8 },
          {
            opacity: 1,
            x: 0,
            duration: 0.3,
            stagger: 0.04,
            ease: EASING.gentle,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: tableBodyRef, dependencies: [seriesList.length] }
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

  // Metrics across all series
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* High-clarity Summary Strip */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Franchises
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              {seriesList.length}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Releases
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-secondary)' }}>
              {totalSeasons} TV · {totalMovies} Film{totalMovies === 1 ? '' : 's'}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              TV Episodes Watched
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {totalTvWatched} <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/ {totalTvKnown}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click any franchise row to expand its TV seasons & films.
        </div>
      </div>

      {/* Franchise & Releases Table */}
      <div
        className="glass-card"
        style={{
          overflowX: 'auto',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-medium)',
                background: 'rgba(5, 20, 36, 0.8)',
              }}
            >
              <th style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Franchise & Release
              </th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Status
              </th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Progress
              </th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Score
              </th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Studios & Genres
              </th>
              <th style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody ref={tableBodyRef}>
            {seriesList.map((series) => {
              const isExpanded = expandedSeriesIds.includes(series.id);

              const allReleasesCount = series.seasons.length + series.movies.length;
              const completedReleasesCount =
                series.seasons.filter((s) => s.status === 'COMPLETED').length +
                series.movies.filter((m) => m.status === 'COMPLETED').length;

              const seriesTvWatched = series.seasons.reduce((sum, s) => sum + s.progress, 0);
              const seriesTvTotal = series.seasons.reduce(
                (sum, s) => sum + (s.total_episodes || s.progress),
                0
              );

              return (
                <React.Fragment key={series.id}>
                  {/* Top-Level Franchise Row */}
                  <tr
                    className="series-master-row"
                    onClick={() => toggleSeriesExpand(series.id)}
                    style={{
                      background: 'rgba(18, 33, 49, 0.75)',
                      borderBottom: '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Title + Toggle */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }}>
                              {series.title}
                            </span>
                            <span
                              className="mono"
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                              }}
                            >
                              FRANCHISE
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Completion Metric */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                        {completedReleasesCount} / {allReleasesCount} completed
                      </span>
                    </td>

                    {/* Franchise Episode Summary */}
                    <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                      {series.seasons.length > 0 ? (
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {seriesTvWatched} / {seriesTvTotal || '??'} TV eps
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Films only</span>
                      )}
                    </td>

                    {/* Placeholder */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
                    </td>

                    {/* Derived Studios & Genres */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {series.studios && series.studios.length > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
                            {series.studios.map((s) => s.name).join(', ')}
                          </span>
                        )}
                        {series.genres &&
                          series.genres.map((g) => (
                            <span key={g.id} className="genre-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                              {g.name}
                            </span>
                          ))}
                      </div>
                    </td>

                    {/* Franchise Actions */}
                    <td
                      style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 7px', fontSize: '11px' }}
                          onClick={() => onAddSeason(series)}
                          title="Add new TV Season to this franchise"
                        >
                          <Plus size={12} />
                          <span>Season</span>
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 7px', fontSize: '11px' }}
                          onClick={() => onAddMovie(series)}
                          title="Add Film to this franchise"
                        >
                          <Plus size={12} />
                          <span>Film</span>
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 7px', fontSize: '11px' }}
                          onClick={() => onAddCharacter(series)}
                          title="Remember a character from this franchise"
                        >
                          <Sparkles size={12} />
                          <span>Character</span>
                        </button>
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
                    </td>
                  </tr>

                  {/* Child Releases: Seasons & Movies */}
                  {isExpanded && (
                    <>
                      {/* Seasons */}
                      {series.seasons.map((season) => {
                        const progressPct =
                          season.total_episodes && season.total_episodes > 0
                            ? Math.min(100, Math.round((season.progress / season.total_episodes) * 100))
                            : season.progress > 0
                            ? 50
                            : 0;
                        const isSeasonNotesOpen = expandedNotesSeasonId === season.id;
                        const episodeNotesCount = season.episode_notes?.length || 0;

                        return (
                          <React.Fragment key={`season-${season.id}`}>
                            <tr
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isSeasonNotesOpen ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                              className="table-row-hover"
                            >
                              {/* Season Title */}
                              <td style={{ padding: '12px 18px 12px 36px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Tv size={14} color="var(--color-primary)" />
                                  <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                                    Season {season.season_number}: {season.title}
                                  </span>
                                  {season.rewatches && season.rewatches.length > 0 && (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: 'rgba(196, 193, 251, 0.15)',
                                        color: 'var(--color-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                      title={`${season.rewatches.length} rewatch pass(es)`}
                                    >
                                      <RotateCcw size={10} /> {season.rewatches.length}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                {getStatusBadge(season.status)}
                              </td>

                              {/* Progress Stepper */}
                              <td style={{ padding: '12px 16px', minWidth: '180px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                      {season.progress} / {season.total_episodes ?? '??'} eps
                                    </span>
                                    <div style={{ display: 'flex', gap: '3px' }}>
                                      <button
                                        className="btn-icon"
                                        style={{ padding: '2px 4px' }}
                                        onClick={() => onSeasonProgressDelta(season.id, -1)}
                                        disabled={season.progress <= 0}
                                        title="Subtract 1 episode"
                                      >
                                        <Minus size={11} />
                                      </button>
                                      <button
                                        className="btn-icon"
                                        style={{ padding: '2px 4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}
                                        onClick={() => onSeasonProgressDelta(season.id, 1)}
                                        disabled={season.total_episodes !== null && season.progress >= season.total_episodes}
                                        title="Add 1 episode"
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
                                </div>
                              </td>

                              {/* Score */}
                              <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                {season.rating ? (
                                  <div className="rating-pill" style={{ padding: '2px 6px', fontSize: '11px' }}>
                                    <Star size={11} fill="#fbbf24" color="#fbbf24" />
                                    <span>{season.rating}/10</span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
                                )}
                              </td>

                              {/* Studios */}
                              <td style={{ padding: '12px 16px' }}>
                                {season.studios && season.studios.length > 0 && (
                                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                                    {season.studios.map((s) => s.name).join(', ')}
                                  </span>
                                )}
                              </td>

                              {/* Season Actions */}
                              <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                  <button
                                    className="btn-icon"
                                    onClick={() => onOpenEpisodeNotes(season)}
                                    title={`Standout episode notes (${episodeNotesCount})`}
                                    style={{
                                      color: episodeNotesCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                                      position: 'relative',
                                    }}
                                  >
                                    <BookmarkCheck size={13} />
                                    {episodeNotesCount > 0 && (
                                      <span
                                        className="mono"
                                        style={{
                                          fontSize: '9px',
                                          marginLeft: '2px',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {episodeNotesCount}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => onAddRewatchSeason(season)}
                                    title="Add rewatch pass"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => setExpandedNotesSeasonId(isSeasonNotesOpen ? null : season.id)}
                                    title="View reflection & notes"
                                    style={{ color: isSeasonNotesOpen ? 'var(--color-primary)' : 'var(--text-muted)' }}
                                  >
                                    <BookOpen size={13} />
                                  </button>
                                  <button className="btn-icon" onClick={() => onEditSeason(season)} title="Edit season">
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => onDeleteSeason(season.id)}
                                    title="Delete season"
                                    style={{ color: '#fb7185' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Season Reflection Drawer */}
                            {isSeasonNotesOpen && (
                              <tr style={{ background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <td colSpan={6} style={{ padding: '12px 20px 16px 36px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* Overall Season Note */}
                                    {season.notes && (
                                      <div
                                        style={{
                                          background: 'rgba(5, 20, 36, 0.8)',
                                          padding: '12px 16px',
                                          borderRadius: 'var(--radius-md)',
                                          borderLeft: '3px solid var(--color-primary-action)',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                          <BookOpen size={13} color="var(--color-primary)" />
                                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                            Season Reflection & Takeaways
                                          </span>
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#d4e4fa', fontStyle: 'italic', lineHeight: '1.5' }}>
                                          "{season.notes}"
                                        </p>
                                      </div>
                                    )}

                                    {/* Standout Episode Notes */}
                                    {season.episode_notes && season.episode_notes.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                          Standout Episode Memories:
                                        </span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                                          {season.episode_notes.map((ep) => (
                                            <div
                                              key={ep.id}
                                              style={{
                                                background: 'rgba(13, 28, 45, 0.9)',
                                                padding: '10px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border-subtle)',
                                              }}
                                            >
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                                                  Ep {ep.episode_number}{ep.episode_title ? `: ${ep.episode_title}` : ''}
                                                </span>
                                                {ep.rating && (
                                                  <span style={{ fontSize: '11px', color: '#fbbf24' }}>
                                                    ★ {ep.rating}
                                                  </span>
                                                )}
                                              </div>
                                              <p style={{ fontSize: '12px', color: '#d4e4fa', fontStyle: 'italic', lineHeight: '1.4' }}>
                                                "{ep.note}"
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {!season.notes && (!season.episode_notes || season.episode_notes.length === 0) && (
                                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                        No reflections or standout episode notes recorded yet.
                                      </p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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
                        const isMovieNotesOpen = expandedNotesMovieId === movie.id;

                        return (
                          <React.Fragment key={`movie-${movie.id}`}>
                            <tr
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: isMovieNotesOpen ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                              className="table-row-hover"
                            >
                              {/* Movie Title */}
                              <td style={{ padding: '12px 18px 12px 36px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Clapperboard size={14} color="var(--color-accent-cyan)" />
                                  <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                                    Film: {movie.title}
                                  </span>
                                  <span
                                    className="mono"
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      color: 'var(--color-accent-cyan)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    MOVIE
                                  </span>
                                  {movie.rewatches && movie.rewatches.length > 0 && (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: 'rgba(196, 193, 251, 0.15)',
                                        color: 'var(--color-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                      title={`${movie.rewatches.length} rewatch pass(es)`}
                                    >
                                      <RotateCcw size={10} /> {movie.rewatches.length}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                {getStatusBadge(movie.status)}
                              </td>

                              {/* Minute Progress Stepper */}
                              <td style={{ padding: '12px 16px', minWidth: '180px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                      {movie.progress_minutes} / {movie.total_minutes ?? '??'} min
                                    </span>
                                    <div style={{ display: 'flex', gap: '3px' }}>
                                      <button
                                        className="btn-icon"
                                        style={{ padding: '2px 4px' }}
                                        onClick={() => onMovieProgressDelta(movie.id, -Math.min(10, movie.progress_minutes))}
                                        disabled={movie.progress_minutes <= 0}
                                        title="Subtract 10 minutes"
                                      >
                                        <Minus size={11} />
                                      </button>
                                      <button
                                        className="btn-icon"
                                        style={{ padding: '2px 4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent-cyan)' }}
                                        onClick={() => onMovieProgressDelta(
                                          movie.id,
                                          movie.total_minutes === null
                                            ? 10
                                            : Math.min(10, movie.total_minutes - movie.progress_minutes)
                                        )}
                                        disabled={movie.total_minutes !== null && movie.progress_minutes >= movie.total_minutes}
                                        title="Add 10 minutes"
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
                                </div>
                              </td>

                              {/* Score */}
                              <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                {movie.rating ? (
                                  <div className="rating-pill" style={{ padding: '2px 6px', fontSize: '11px' }}>
                                    <Star size={11} fill="#fbbf24" color="#fbbf24" />
                                    <span>{movie.rating}/10</span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
                                )}
                              </td>

                              {/* Studios */}
                              <td style={{ padding: '12px 16px' }}>
                                {movie.studios && movie.studios.length > 0 && (
                                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                                    {movie.studios.map((s) => s.name).join(', ')}
                                  </span>
                                )}
                              </td>

                              {/* Movie Actions (No Episode Notes) */}
                              <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                  <button
                                    className="btn-icon"
                                    onClick={() => onAddRewatchMovie(movie)}
                                    title="Add rewatch pass"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => setExpandedNotesMovieId(isMovieNotesOpen ? null : movie.id)}
                                    title="View movie reflection"
                                    style={{ color: isMovieNotesOpen ? 'var(--color-accent-cyan)' : 'var(--text-muted)' }}
                                  >
                                    <BookOpen size={13} />
                                  </button>
                                  <button className="btn-icon" onClick={() => onEditMovie(movie)} title="Edit movie">
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => onDeleteMovie(movie.id)}
                                    title="Delete movie"
                                    style={{ color: '#fb7185' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Movie Reflection Drawer */}
                            {isMovieNotesOpen && (
                              <tr style={{ background: 'rgba(56, 189, 248, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <td colSpan={6} style={{ padding: '12px 20px 16px 36px' }}>
                                  <div
                                    style={{
                                      background: 'rgba(5, 20, 36, 0.8)',
                                      padding: '12px 16px',
                                      borderRadius: 'var(--radius-md)',
                                      borderLeft: '3px solid var(--color-accent-cyan)',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                      <BookOpen size={13} color="var(--color-accent-cyan)" />
                                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent-cyan)', textTransform: 'uppercase' }}>
                                        Film Reflection & Memory
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#d4e4fa', fontStyle: 'italic', lineHeight: '1.5' }}>
                                      "{movie.notes || 'No reflection logged yet.'}"
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
