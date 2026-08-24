import React from 'react';
import { Book } from '../types';
import { ProgressStepper } from '../components/ProgressStepper';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { ArrowLeft, BookOpen, PenLine, Trash2 } from 'lucide-react';

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

  const getRatingBandClass = (score?: number | null) => {
    if (!score) return 'rating-band-empty';
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const statusLower = book.status.toLowerCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Top Breadcrumb */}
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

      {/* 2-Column Split Layout */}
      <div className="detail-split-layout">
        {/* Left Column: Cover + Quick Stats */}
        <aside className="detail-sidebar">
          <div className={`detail-poster-wrapper poster-edge-${statusLower}`}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="detail-poster-img"
                width={360}
                height={500}
                loading="eager"
              />
            ) : (
              <div className="detail-poster-placeholder">
                <BookOpen size={48} color="var(--graphite)" />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>No Book Cover</span>
              </div>
            )}
          </div>

          {/* Quick Stats Box */}
          <div className="quick-stats-box">
            {/* Score with Rating Band */}
            <div className="stats-score-row">
              <span className="stats-score-label">SCORE</span>
              <div className="stats-score-val">
                {book.rating ? (
                  <>
                    <span className={getRatingBandClass(book.rating)}>★ {book.rating}</span>
                    <span className="score-total">/10</span>
                  </>
                ) : (
                  <span className="rating-band-empty" style={{ fontSize: 14, fontWeight: 500 }}>
                    Unrated
                  </span>
                )}
              </div>
            </div>

            <div className="stats-divider" />

            {/* Meta Rows */}
            <div className="stats-meta-list">
              {book.author && (
                <div className="stats-meta-row">
                  <span className="meta-key">Author</span>
                  <span className="meta-val">{book.author}</span>
                </div>
              )}

              <div className="stats-meta-row">
                <span className="meta-key">Format</span>
                <span className="meta-val">Literature / Book</span>
              </div>

              <div className="stats-meta-row">
                <span className="meta-key">Status</span>
                <span className={`status-indicator ${statusLower}`}>
                  {book.status}
                </span>
              </div>

              {/* Progress Stepper only shown when READING */}
              {book.status === 'READING' ? (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  <ProgressStepper
                    current={book.progress}
                    total={book.total_pages}
                    unit="p"
                    step={10}
                    tone="reading"
                    onDelta={(d) => onProgressDelta(book.id, d)}
                    ariaLabelPrefix={`${book.title} pages`}
                  />
                </div>
              ) : (
                book.total_pages && (
                  <div className="stats-meta-row">
                    <span className="meta-key">Length</span>
                    <span className="meta-val-mono">{book.total_pages} pages</span>
                  </div>
                )
              )}

              {book.start_date && (
                <div className="stats-meta-row">
                  <span className="meta-key">Started</span>
                  <span className="meta-val-mono">{book.start_date}</span>
                </div>
              )}

              {book.finish_date && (
                <div className="stats-meta-row">
                  <span className="meta-key">Finished</span>
                  <span className="meta-val-mono">{book.finish_date}</span>
                </div>
              )}
            </div>

            <div className="stats-divider" />

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onEdit(book)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 12, padding: '7px 10px', justifyContent: 'center' }}
                aria-label="Edit Book Details"
              >
                <PenLine size={13} />
                <span>Edit Book</span>
              </button>

              <button
                onClick={() => onDelete(book.id)}
                className="btn-icon danger"
                title="Delete Book"
                aria-label="Delete Book"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Literary Content */}
        <main className="detail-main-content">
          <div>
            <div className="detail-eyebrow">
              <span className={`status-indicator ${statusLower}`} style={{ fontSize: 12 }}>
                Book Journal · {book.status}
              </span>
            </div>

            <h1 className="detail-main-title">{book.title}</h1>

            {book.author && (
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  color: 'var(--text-desk-muted)',
                  fontStyle: 'italic',
                  marginBottom: 10,
                }}
              >
                by {book.author}
              </div>
            )}

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

          {/* Core Takeaway Slip on Cream Paper */}
          <section className="detail-section-takeaway">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="section-title" style={{ color: 'var(--text-desk)', margin: 0, fontSize: 20 }}>
                Book Reflections & Lessons
              </h2>
            </div>

            <TakeawaySlip
              isDetail
              status={book.status}
              text={book.notes}
              label="Book Takeaway"
              rating={book.rating}
              onWrite={() => onEdit(book)}
              emptyText="No reading lesson captured yet. A title without notes is incomplete."
              emptyCtaText="Capture Takeaway"
            />
          </section>
        </main>
      </div>
    </div>
  );
};
