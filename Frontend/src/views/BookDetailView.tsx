import React from 'react';
import { Book } from '../types';
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
          <div className="detail-poster-wrapper">
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
                <BookOpen size={48} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>No Book Cover</span>
              </div>
            )}
          </div>

          {/* Quick Stats Box */}
          <div className="quick-stats-box">
            {/* Score */}
            <div className="stats-score-row">
              <span className="stats-score-label">SCORE</span>
              <div className="stats-score-val">
                {book.rating ? (
                  <>
                    <span>★ {book.rating}</span>
                    <span className="score-total">/10</span>
                  </>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--text-desk-muted)', fontWeight: 500 }}>
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
                <span className={`status-indicator ${book.status.toLowerCase()}`}>
                  {book.status}
                </span>
              </div>

              {book.status === 'READING' && (
                <div className="stats-meta-row" style={{ alignItems: 'center' }}>
                  <span className="meta-key">Progress</span>
                  <ProgressStepper
                    current={book.progress}
                    total={book.total_pages}
                    unit="p"
                    step={10}
                    onDelta={(d) => onProgressDelta(book.id, d)}
                    ariaLabelPrefix={`${book.title} pages`}
                  />
                </div>
              )}

              {book.total_pages && book.status !== 'READING' && (
                <div className="stats-meta-row">
                  <span className="meta-key">Length</span>
                  <span className="meta-val-mono">{book.total_pages} pages</span>
                </div>
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
              <span>ARCHIVE // BOOK JOURNAL</span>
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

          {/* Core Lesson & Editorial Pull Quote */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="section-title" style={{ color: 'var(--text-desk)', margin: 0 }}>
                Book Reflections & Lessons
              </h2>

              <button
                onClick={() => onEdit(book)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                <PenLine size={12} />
                <span>{book.notes ? 'Edit Lesson' : 'Write Lesson'}</span>
              </button>
            </div>

            {book.notes ? (
              <div className="editorial-pull-quote">
                <p className="editorial-pull-quote-text">“{book.notes}”</p>
                <div className="editorial-pull-quote-footer">
                  <span className="editorial-pull-quote-label">
                    CORE TAKEAWAY // {book.status}
                  </span>
                  {book.rating && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tungsten)' }}>
                      Rating: {book.rating}/10
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="desk-card"
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    color: 'var(--text-desk-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  No reading lesson captured yet. A title without notes is incomplete.
                </span>
                <button
                  onClick={() => onEdit(book)}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                >
                  <PenLine size={13} />
                  <span>Capture Takeaway</span>
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
