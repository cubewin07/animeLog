import React from 'react';
import { Book } from '../types';
import { ProgressStepper } from './ProgressStepper';
import { BookOpen, PenLine, Trash2, ArrowRight } from 'lucide-react';

interface BookRowProps {
  book: Book;
  onOpenDetail?: (bookId: number) => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}

export const BookRow: React.FC<BookRowProps> = ({
  book,
  onOpenDetail,
  onEdit,
  onDelete,
  onProgressDelta,
}) => {
  const coverUrl = book.cover_image_url || (book.cover_image as any)?.image_url;

  const getRatingBandClass = (score: number) => {
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const statusLower = book.status.toLowerCase();

  return (
    <article
      className="desk-card"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 24,
        alignItems: 'start',
        padding: 24,
      }}
    >
      {/* Cover / Spine Still with Status Edge */}
      <div
        onClick={() => onOpenDetail && onOpenDetail(book.id)}
        style={{ cursor: onOpenDetail ? 'pointer' : 'default' }}
        title={`Open ${book.title}`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className={`still-poster-list poster-edge-${statusLower}`}
            width={96}
            height={144}
            loading="lazy"
          />
        ) : (
          <div
            className={`still-poster-list poster-edge-${statusLower}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--graphite)',
            }}
          >
            <BookOpen size={32} />
          </div>
        )}
      </div>

      {/* Main Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {/* Title, Author & Top Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              onClick={() => onOpenDetail && onOpenDetail(book.id)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--text-desk)',
                cursor: onOpenDetail ? 'pointer' : 'default',
                lineHeight: 1.3,
                marginBottom: 4,
              }}
            >
              {book.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-desk-muted)' }}>
              {book.author && <span>by {book.author}</span>}
              {book.genres && book.genres.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {book.genres.map((g) => (
                    <span key={g.id} className="genre-tag">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onOpenDetail && (
              <button
                onClick={() => onOpenDetail(book.id)}
                className="btn btn-secondary"
                style={{ padding: '5px 12px', fontSize: 13 }}
                aria-label={`Read journal for ${book.title}`}
              >
                <span>Read journal</span>
                <ArrowRight size={13} />
              </button>
            )}
            <button
              onClick={() => onEdit(book)}
              className="btn-icon"
              title="Edit book"
              aria-label={`Edit ${book.title}`}
            >
              <PenLine size={14} />
            </button>
            <button
              onClick={() => onDelete(book.id)}
              className="btn-icon danger"
              title="Delete book"
              aria-label={`Delete ${book.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Status, Rating & Progress Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            paddingTop: 6,
            borderTop: '1px solid var(--border-desk-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`status-indicator ${statusLower}`}>
              {book.status}
            </span>
            {book.rating && (
              <div className={`rating-mono ${getRatingBandClass(book.rating)}`}>
                <span>★ {book.rating}</span>
                <span className="rating-mono-sub">/10</span>
              </div>
            )}
          </div>

          {book.status === 'READING' && (
            <ProgressStepper
              current={book.progress}
              total={book.total_pages}
              unit="p"
              step={10}
              tone="reading"
              onDelta={(d) => onProgressDelta(book.id, d)}
              ariaLabelPrefix={`${book.title} pages`}
            />
          )}
        </div>

        {/* Progress Bar (Visual aid) */}
        {book.total_pages && (
          <div className="progress-track">
            <div
              className={`progress-fill ${
                book.status === 'COMPLETED' ? 'completed' : book.status === 'READING' ? 'reading' : ''
              }`}
              style={{
                width: `${Math.min(100, (book.progress / book.total_pages) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* Note snippet on desk surface */}
        {book.notes && (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--text-desk-muted)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            "{book.notes}"
          </p>
        )}
      </div>
    </article>
  );
};
