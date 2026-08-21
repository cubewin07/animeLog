import React, { useState } from 'react';
import { Anime } from '../types';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SeriesTableViewProps {
  animeList: Anime[];
  onEdit: (anime: Anime) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
  onAddRewatch: (anime: Anime) => void;
}

type SortField = 'title' | 'progress' | 'rating' | 'status' | 'date';
type SortOrder = 'asc' | 'desc';

export const SeriesTableView: React.FC<SeriesTableViewProps> = ({
  animeList,
  onEdit,
  onDelete,
  onProgressDelta,
  onAddRewatch,
}) => {
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedNotesId, setExpandedNotesId] = useState<number | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'title' ? 'asc' : 'desc');
    }
  };

  const sortedList = [...animeList].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === 'rating') {
      const rA = a.rating || 0;
      const rB = b.rating || 0;
      comparison = rA - rB;
    } else if (sortField === 'progress') {
      comparison = a.progress - b.progress;
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'date') {
      const dA = a.start_date || a.created_at;
      const dB = b.start_date || b.created_at;
      comparison = dA.localeCompare(dB);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

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

  // Helper to detect season name or sub-label from title
  const parseSeason = (title: string) => {
    const match = title.match(/(Season\s*\d+|S\d+|Part\s*\d+|Cour\s*\d+|Movie|II|III|IV|V)/i);
    return match ? match[0] : null;
  };

  // Total summary metrics
  const totalEpisodesWatched = animeList.reduce((sum, a) => sum + a.progress, 0);
  const totalEpisodesOverall = animeList.reduce((sum, a) => sum + (a.total_episodes || a.progress), 0);
  const ratedAnime = animeList.filter((a) => a.rating !== null);
  const avgScore =
    ratedAnime.length > 0
      ? (ratedAnime.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedAnime.length).toFixed(1)
      : 'N/A';

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
              Total Series
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              {animeList.length}
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Episodes Watched
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {totalEpisodesWatched} <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/ {totalEpisodesOverall}</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Mean Score
            </span>
            <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
              ★ {avgScore}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click column headers to sort series.
        </div>
      </div>

      {/* Structured Table */}
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
              <th
                onClick={() => handleSort('title')}
                style={{
                  padding: '14px 18px',
                  fontSize: '12px',
                  color: sortField === 'title' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Series & Season</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                style={{
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: sortField === 'status' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Status</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th
                onClick={() => handleSort('progress')}
                style={{
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: sortField === 'progress' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Episode Progress</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th
                onClick={() => handleSort('rating')}
                style={{
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: sortField === 'rating' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Score</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>

              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Studio & Genres
              </th>

              <th style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((anime) => {
              const seasonLabel = parseSeason(anime.title);
              const progressPct =
                anime.total_episodes && anime.total_episodes > 0
                  ? Math.min(100, Math.round((anime.progress / anime.total_episodes) * 100))
                  : anime.progress > 0
                  ? 50
                  : 0;

              const isNotesOpen = expandedNotesId === anime.id;

              return (
                <React.Fragment key={anime.id}>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isNotesOpen ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    className="table-row-hover"
                  >
                    {/* Series Title */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>
                          {anime.title}
                        </span>
                        {seasonLabel && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--color-primary)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              fontWeight: 600,
                            }}
                          >
                            {seasonLabel}
                          </span>
                        )}
                        {anime.rewatches && anime.rewatches.length > 0 && (
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
                            title={`${anime.rewatches.length} rewatch pass(es)`}
                          >
                            <RotateCcw size={10} /> {anime.rewatches.length}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(anime.status)}
                    </td>

                    {/* Episode Progress & Stepper */}
                    <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                            {anime.progress} / {anime.total_episodes ?? '??'}
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              ({progressPct}%)
                            </span>
                          </span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <button
                              className="btn-icon"
                              style={{ padding: '3px 5px' }}
                              onClick={() => onProgressDelta(anime.id, -1)}
                              disabled={anime.progress <= 0}
                              title="Subtract 1 episode"
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              className="btn-icon"
                              style={{ padding: '3px 5px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}
                              onClick={() => onProgressDelta(anime.id, 1)}
                              disabled={anime.total_episodes !== null && anime.progress >= anime.total_episodes}
                              title="Add 1 episode"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        <div className="progress-track" style={{ height: '4px' }}>
                          <div
                            className={`progress-fill ${anime.status === 'COMPLETED' ? 'completed' : ''}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {anime.rating ? (
                        <div className="rating-pill" style={{ padding: '2px 6px', fontSize: '11px' }}>
                          <Star size={11} fill="#fbbf24" color="#fbbf24" />
                          <span>{anime.rating}/10</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>

                    {/* Studios & Genres */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {anime.studios && anime.studios.length > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
                            {anime.studios.map((s) => s.name).join(', ')}
                          </span>
                        )}
                        {anime.genres &&
                          anime.genres.slice(0, 2).map((g) => (
                            <span key={g.id} className="genre-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                              {g.name}
                            </span>
                          ))}
                        {anime.genres && anime.genres.length > 2 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                            +{anime.genres.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {anime.notes && (
                          <button
                            className="btn-icon"
                            onClick={() => setExpandedNotesId(isNotesOpen ? null : anime.id)}
                            title="View lesson & reflection"
                            style={{ color: isNotesOpen ? 'var(--color-primary)' : 'var(--text-muted)' }}
                          >
                            <BookOpen size={13} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => onAddRewatch(anime)}
                          title="Add rewatch pass"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button className="btn-icon" onClick={() => onEdit(anime)} title="Edit series">
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onDelete(anime.id)}
                          title="Delete"
                          style={{ color: '#fb7185' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Lesson Drawer */}
                  {isNotesOpen && (
                    <tr style={{ background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <td colSpan={6} style={{ padding: '12px 20px 16px 20px' }}>
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
                              Recorded Lesson & Memory
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#d4e4fa', fontStyle: 'italic', lineHeight: '1.5' }}>
                            "{anime.notes}"
                          </p>
                        </div>
                      </td>
                    </tr>
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
