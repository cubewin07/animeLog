import React, { useState } from 'react';
import { Anime } from '../types';
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
} from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  onEdit: (anime: Anime) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
  onAddRewatch: (anime: Anime) => void;
  onAddCharacter: (anime: Anime) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onEdit,
  onDelete,
  onProgressDelta,
  onAddRewatch,
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

  const formatStatus = (status: string) => {
    switch (status) {
      case 'WATCHING':
        return 'Watching';
      case 'COMPLETED':
        return 'Completed';
      case 'PLAN_TO_WATCH':
        return 'Plan to Watch';
      case 'ON_HOLD':
        return 'On Hold';
      case 'DROPPED':
        return 'Dropped';
      default:
        return status;
    }
  };

  const progressPercent =
    anime.total_episodes && anime.total_episodes > 0
      ? Math.min(100, Math.round((anime.progress / anime.total_episodes) * 100))
      : anime.progress > 0
      ? 50
      : 0;

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header: Title + Status + Rating */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff' }}>{anime.title}</h3>
            <span className={`status-badge ${getStatusClass(anime.status)}`}>
              {formatStatus(anime.status)}
            </span>
          </div>

          {/* Studios & Genres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {anime.studios && anime.studios.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 500 }}>
                {anime.studios.map((s) => s.name).join(', ')}
              </span>
            )}
            {anime.genres &&
              anime.genres.map((g) => (
                <span key={g.id} className="genre-tag">
                  {g.name}
                </span>
              ))}
          </div>
        </div>

        {/* Rating Score */}
        {anime.rating ? (
          <div className="rating-pill">
            <Star size={13} fill="#fbbf24" color="#fbbf24" />
            <span>{anime.rating}/10</span>
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Unrated
          </span>
        )}
      </div>

      {/* Progress Section */}
      <div
        style={{
          background: 'rgba(5, 20, 36, 0.5)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Episode Progress
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              {anime.progress} / {anime.total_episodes ?? '??'} eps
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-icon"
                onClick={() => onProgressDelta(anime.id, -1)}
                disabled={anime.progress <= 0}
                title="Subtract 1 episode"
              >
                <Minus size={13} />
              </button>
              <button
                className="btn-icon"
                onClick={() => onProgressDelta(anime.id, 1)}
                disabled={anime.total_episodes !== null && anime.progress >= anime.total_episodes}
                title="Add 1 episode"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--color-primary)',
                  borderColor: 'var(--border-glow)',
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div
            className={`progress-fill ${anime.status === 'COMPLETED' ? 'completed' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lesson / Notes Section (First-Class Citizen) */}
      <div
        style={{
          background: 'rgba(13, 28, 45, 0.9)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={14} color="var(--color-primary)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              Lessons & Takeaways
            </span>
          </div>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: '10px' }}>
            {anime.notes && anime.notes.trim().length > 0 ? (
              <p
                style={{
                  fontSize: '13px',
                  color: '#d4e4fa',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  borderLeft: '3px solid var(--color-primary-action)',
                  paddingLeft: '12px',
                }}
              >
                "{anime.notes}"
              </p>
            ) : (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                }}
              >
                No reflections logged yet. Click edit to record your thoughts and memories.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sub-items (Rewatches & Favorite Characters preview) */}
      {((anime.rewatches && anime.rewatches.length > 0) ||
        (anime.favorite_characters && anime.favorite_characters.length > 0)) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
          {anime.rewatches && anime.rewatches.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-secondary)',
                background: 'rgba(196, 193, 251, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              <RotateCcw size={12} />
              {anime.rewatches.length} {anime.rewatches.length === 1 ? 'Rewatch' : 'Rewatches'}
            </span>
          )}
          {anime.favorite_characters && anime.favorite_characters.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-accent-emerald)',
                background: 'rgba(78, 222, 163, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              <Sparkles size={12} />
              {anime.favorite_characters.length}{' '}
              {anime.favorite_characters.length === 1 ? 'Character' : 'Characters'}
            </span>
          )}
        </div>
      )}

      {/* Footer: Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          marginTop: '2px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => onAddRewatch(anime)}
            title="Log a rewatch pass"
          >
            <RotateCcw size={13} />
            <span>+ Rewatch</span>
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => onAddCharacter(anime)}
            title="Remember a favorite character"
          >
            <Sparkles size={13} />
            <span>+ Character</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn-icon" onClick={() => onEdit(anime)} title="Edit entry">
            <Edit3 size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(anime.id)}
            title="Delete entry"
            style={{ color: '#fb7185' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
