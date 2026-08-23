import React from 'react';
import { Book } from '../types';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { ProgressStepper } from '../components/ProgressStepper';
import { ArrowLeft, BookOpen, PenLine, Trash2, Calendar, Star } from 'lucide-react';

interface BookDetailViewProps {
  book: Book;
  onBack: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  onBack,
  onEdit,
  onDelete,
  onProgressDelta,
}) => {
  const coverUrl = book.cover_image_url || (book.cover_image as any)?.image_url;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back Button */}
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
          aria-label="Back to book journal"
        >
          <ArrowLeft size={16} />
          <span>Back to Book Journal</span>
        </button>
      </div>

      {/* Top Banner: Cover Still + Details */}
      <section
        className="desk-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 32,
          alignItems: 'start',
          padding: 28,
        }}
      >
        <div>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="still-poster-detail"
              width={240}
              height={360}
              loading="lazy"
            />
          ) : (
            <div
              className="still-poster-detail"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--graphite)',
              }}
            >
              <BookOpen size={48} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
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
              {book.author && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--text-desk-muted)',
                    marginBottom: 4,
                  }}
                >
                  by {book.author}
                </div>
              )}
              <h1 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 8 }}>
                {book.title}
              </h1>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {book.genres.map((g) => (
                    <span key={g.id} className="genre-tag">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onEdit(book)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: 13 }}
                aria-label={`Edit ${book.title}`}
              >
                <PenLine size={13} />
                <span>Edit Book</span>
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

          {/* Reading Controls */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--desk-surface)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className={`status-indicator ${book.status.toLowerCase()}`}>
                {book.status}
              </span>

              {book.rating && (
                <div className="rating-mono">
                  <span>{book.rating}</span>
                  <span className="rating-mono-sub">/10</span>
                </div>
              )}

              {book.status === 'READING' && (
                <ProgressStepper
                  current={book.progress}
                  total={book.total_pages}
                  unit="p"
                  step={10}
                  onDelta={(d) => onProgressDelta(book.id, d)}
                  ariaLabelPrefix={`${book.title} pages`}
                />
              )}
            </div>

            {book.start_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-desk-muted)' }}>
                <Calendar size={14} />
                <span>
                  Started: {book.start_date}
                  {book.finish_date ? ` · Finished: ${book.finish_date}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Full Reading Surface */}
      <section>
        <div style={{ marginBottom: 12 }}>
          <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
            Book Reflections & Takeaways
          </h2>
        </div>

        <TakeawaySlip
          text={book.notes}
          label="Reading Lessons"
          rating={book.rating}
          status={book.status}
          isDetail={true}
          onWrite={() => onEdit(book)}
        />
      </section>
    </div>
  );
};
