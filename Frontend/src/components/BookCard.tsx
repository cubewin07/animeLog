import React, { useState } from 'react';
import { Book } from '../types';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
  onProgressDelta,
}) => {
  const [expanded, setExpanded] = useState(true);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'READING':
        return 'reading';
      case 'COMPLETED':
        return 'completed';
      case 'PLAN_TO_READ':
        return 'plan_to_read';
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
      case 'READING':
        return 'Reading';
      case 'COMPLETED':
        return 'Completed';
      case 'PLAN_TO_READ':
        return 'Plan to Read';
      case 'ON_HOLD':
        return 'On Hold';
      case 'DROPPED':
        return 'Dropped';
      default:
        return status;
    }
  };

  const progressPercent =
    book.total_pages && book.total_pages > 0
      ? Math.min(100, Math.round((book.progress / book.total_pages) * 100))
      : book.progress > 0
      ? 50
      : 0;

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header: Title + Author + Status + Rating */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff' }}>{book.title}</h3>
            <span className={`status-badge ${getStatusClass(book.status)}`}>
              {formatStatus(book.status)}
            </span>
          </div>

          {/* Author & Genres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {book.author && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <User size={12} /> {book.author}
              </span>
            )}
            {book.genres &&
              book.genres.map((g) => (
                <span key={g.id} className="genre-tag">
                  {g.name}
                </span>
              ))}
          </div>
        </div>

        {/* Rating */}
        {book.rating ? (
          <div className="rating-pill">
            <Star size={13} fill="#fbbf24" color="#fbbf24" />
            <span>{book.rating}/10</span>
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Unrated
          </span>
        )}
      </div>

      {/* Page Progress Section */}
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
            Page Progress
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              {book.progress} / {book.total_pages ?? '??'} pages ({progressPercent}%)
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-icon"
                onClick={() => onProgressDelta(book.id, -10)}
                disabled={book.progress <= 0}
                title="Subtract 10 pages"
              >
                <Minus size={13} />
              </button>
              <button
                className="btn-icon"
                onClick={() => onProgressDelta(book.id, 10)}
                disabled={book.total_pages !== null && book.progress >= book.total_pages}
                title="Add 10 pages"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--color-accent-cyan)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <div
            className={`progress-fill ${book.status === 'COMPLETED' ? 'completed' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lessons & Notes */}
      <div
        style={{
          background: 'rgba(13, 28, 45, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.15)',
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
            <BookOpen size={14} color="var(--color-accent-cyan)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-accent-cyan)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              Key Reflections & Insights
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
            {book.notes && book.notes.trim().length > 0 ? (
              <p
                style={{
                  fontSize: '13px',
                  color: '#d4e4fa',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  borderLeft: '3px solid #38bdf8',
                  paddingLeft: '12px',
                }}
              >
                "{book.notes}"
              </p>
            ) : (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                }}
              >
                No reflections logged yet. Click edit to record your thoughts.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '6px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          marginTop: '2px',
        }}
      >
        <button className="btn-icon" onClick={() => onEdit(book)} title="Edit entry">
          <Edit3 size={14} />
        </button>
        <button
          className="btn-icon"
          onClick={() => onDelete(book.id)}
          title="Delete entry"
          style={{ color: '#fb7185' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
