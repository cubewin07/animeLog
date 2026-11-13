import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Minus,
  MoreHorizontal,
  PenLine,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import { formatDate } from '../../lib/format';
import { CoverArt, KfButton, NotePaper, ScoreTag, StatusTag } from '../../ui/keyframe';
import {
  bookCoverUrl,
  bookProgressPercent,
  bookRemainingPages,
  bookYear,
  clampedBookDelta,
  type BookWithOptionalMeta,
} from './booksUtils';
import '../../styles/keyframe.css';
import './Books.css';

export const BookDetailPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { loading, bookList } = useJournalData();
  const {
    handleBookProgressDelta,
    openComposer,
    openEditBookModal,
    handleDeleteBook,
  } = useJournalActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const numericId = Number(bookId);
  const book = useMemo(
    () =>
      Number.isInteger(numericId) && numericId > 0
        ? (bookList.find((b) => b.id === numericId) as BookWithOptionalMeta | undefined)
        : undefined,
    [bookList, numericId],
  );

  // Close Manage menu on outside pointerdown or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const coverUrl = book ? bookCoverUrl(book) : null;
  const {
    accent: titleAccent,
    onImageReady,
    onCorsBlocked,
  } = useCoverAccent(book?.title ?? '', coverUrl);

  const backdropUrl = coverUrl ? cloudinaryThumbUrl(coverUrl, 'card') ?? coverUrl : null;
  const showBackdrop = Boolean(backdropUrl && failedBackdropUrl !== backdropUrl);

  if (loading && !book) {
    return (
      <div className="kf kf-book" aria-busy="true" aria-label="Loading book">
        <div className="kf-books-skeleton" style={{ aspectRatio: 'auto', minHeight: 240 }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="kf kf-book">
        <div className="kf-book-not-found">
          <div className="kf-books-empty-icon">
            <BookOpen size={24} aria-hidden="true" />
          </div>
          <h1>Book not found</h1>
          <p>This book isn’t in your journal, or it may have been removed.</p>
          <Link viewTransition to="/books" className="kf-book-back-btn">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to Books</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentPages = Math.max(0, book.progress || 0);
  const totalPages = book.total_pages && book.total_pages > 0 ? book.total_pages : null;
  const pct = bookProgressPercent(book);
  const remaining = bookRemainingPages(book);

  const stepPlus10 = clampedBookDelta(book, 10);
  const stepPlus1 = clampedBookDelta(book, 1);
  const stepMinus10 = clampedBookDelta(book, -10);

  const hasNote = Boolean(book.notes?.trim());
  const finishYear = book.finish_date ? bookYear(book) : null;
  const metaYear = book.year ?? book.published_year ?? null;

  const noteSlate = [
    'Book',
    book.author ? `by ${book.author}` : '',
    book.rating ? `Rated ${book.rating}/10` : '',
    finishYear ? String(finishYear) : '',
  ].filter(Boolean);

  const handleOpenNoteComposer = () => {
    openComposer({
      targetKind: 'book',
      id: book.id,
      title: book.title,
      context: book.author || undefined,
      defaultKind: 'lesson',
    });
  };

  return (
    <div
      className="kf kf-book"
      style={{ '--title-accent': titleAccent } as React.CSSProperties}
    >
      {/* 1. Keyframe Hero */}
      <header className="kf-book-hero">
        <div className="kf-book-hero-media" aria-hidden="true">
          {showBackdrop && backdropUrl && (
            <img
              key={backdropUrl}
              src={backdropUrl}
              alt=""
              loading="eager"
              decoding="async"
              className="kf-book-hero-backdrop-img"
              onError={() => setFailedBackdropUrl(backdropUrl)}
            />
          )}
        </div>

        <div className="kf-book-hero-top">
          <Link viewTransition to="/books" className="kf-book-back">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Books</span>
          </Link>

          <div className="kf-book-menu-wrap" ref={menuWrapRef}>
            <button
              ref={menuTriggerRef}
              type="button"
              className="kf-btn is-secondary is-md kf-book-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Manage book"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="kf-book-menu-popover" role="menu" aria-label="Manage book">
                <button
                  type="button"
                  role="menuitem"
                  className="kf-book-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    openEditBookModal(book);
                  }}
                >
                  <Pencil size={14} aria-hidden="true" />
                  <span>Edit Book</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="kf-book-menu-item is-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    handleDeleteBook(book.id);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Delete Book</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="kf-book-hero-inner">
          <div className="kf-book-hero-cover">
            <CoverArt
              title={book.title}
              imageUrl={coverUrl}
              accent={titleAccent}
              variant="poster"
              size="hero"
              fetchPriority="high"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>

          <div className="kf-book-hero-copy">
            <div className="kf-book-hero-badges">
              <StatusTag status={book.status} />
              <ScoreTag score={book.rating} />
            </div>

            <h1 className="kf-book-hero-heading">{book.title}</h1>

            {book.author && <p className="kf-book-hero-author">by {book.author}</p>}

            <div className="kf-book-hero-progress-wrap">
              <div className="kf-book-hero-progress-meta">
                <p className="kf-book-hero-progress">
                  <strong>{currentPages}</strong>
                  {totalPages ? ` of ${totalPages} pages` : ' pages read'}
                </p>
                {totalPages && (
                  <span className="kf-book-hero-progress-sub">
                    {pct}% ·{' '}
                    {remaining === 0
                      ? 'Finished'
                      : `${remaining} ${remaining === 1 ? 'page' : 'pages'} left`}
                  </span>
                )}
              </div>

              <div
                className="kf-book-hero-bar"
                role="progressbar"
                aria-valuenow={currentPages}
                aria-valuemin={0}
                aria-valuemax={totalPages ?? Math.max(1, currentPages)}
                aria-label={`${book.title} reading progress`}
              >
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="kf-book-hero-actions">
              <div className="kf-book-step-group">
                <KfButton
                  variant="secondary"
                  size="lg"
                  className="kf-book-step-minus"
                  icon={<Minus size={15} />}
                  disabled={stepMinus10 === 0}
                  aria-label="Go back 10 pages"
                  onClick={() => handleBookProgressDelta(book.id, stepMinus10)}
                >
                  −10 pages
                </KfButton>

                <KfButton
                  variant="primary"
                  size="lg"
                  icon={<Plus size={17} />}
                  disabled={stepPlus10 === 0}
                  onClick={() => handleBookProgressDelta(book.id, stepPlus10)}
                >
                  +10 pages
                </KfButton>

                <KfButton
                  variant="secondary"
                  size="lg"
                  icon={<Plus size={15} />}
                  disabled={stepPlus1 === 0}
                  onClick={() => handleBookProgressDelta(book.id, stepPlus1)}
                >
                  +1 page
                </KfButton>
              </div>

              <KfButton
                variant="secondary"
                size="lg"
                icon={<PenLine size={16} />}
                onClick={handleOpenNoteComposer}
              >
                Note
              </KfButton>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content: Reading Note on NotePaper + Details Panel */}
      <div className="kf-book-content">
        <section className="kf-book-note-col" aria-labelledby="kf-book-note-heading">
          <div className="kf-book-section-head">
            <div>
              <h2 id="kf-book-note-heading">Reading Note</h2>
              <p className="kf-book-section-sub">
                Adding to your note keeps everything you wrote before.
              </p>
            </div>
            <KfButton
              variant={hasNote ? 'secondary' : 'primary'}
              icon={<PenLine size={15} />}
              onClick={handleOpenNoteComposer}
            >
              {hasNote ? 'Add to note' : 'Write note'}
            </KfButton>
          </div>

          <NotePaper slate={noteSlate}>
            {hasNote && book.notes ? (
              <p>{book.notes}</p>
            ) : (
              <p className="kf-book-empty-paper">
                No note written yet. What scene, idea, or line stayed with you?
              </p>
            )}
          </NotePaper>
        </section>

        <aside className="kf-book-details-col" aria-label="Book details">
          <div className="kf-book-details-card">
            <h3>Details</h3>

            <dl className="kf-book-dl">
              {book.author && (
                <div className="kf-book-dl-row">
                  <dt>Author</dt>
                  <dd>{book.author}</dd>
                </div>
              )}

              <div className="kf-book-dl-row">
                <dt>Started</dt>
                <dd>{formatDate(book.start_date)}</dd>
              </div>

              <div className="kf-book-dl-row">
                <dt>Finished</dt>
                <dd>{formatDate(book.finish_date)}</dd>
              </div>

              {totalPages && (
                <div className="kf-book-dl-row">
                  <dt>Length</dt>
                  <dd>{totalPages} pages</dd>
                </div>
              )}

              {metaYear && (
                <div className="kf-book-dl-row">
                  <dt>Year</dt>
                  <dd>{metaYear}</dd>
                </div>
              )}

              {book.publisher && (
                <div className="kf-book-dl-row">
                  <dt>Publisher</dt>
                  <dd>{book.publisher}</dd>
                </div>
              )}

              {book.isbn && (
                <div className="kf-book-dl-row">
                  <dt>ISBN</dt>
                  <dd>{book.isbn}</dd>
                </div>
              )}
            </dl>

            {book.genres && book.genres.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 'var(--kf-2)' }}>Genres</h3>
                <div className="kf-book-chips">
                  {book.genres.map((genre) => (
                    <span key={genre.id} className="kf-book-chip">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 3. Mobile (<= 768px) Sticky Thumb-Reach Bar */}
      <div className="kf-book-sticky-bar" role="region" aria-label="Quick reading actions">
        <KfButton
          variant="secondary"
          className="kf-book-sticky-minus"
          disabled={stepMinus10 === 0}
          aria-label="Go back 10 pages"
          onClick={() => handleBookProgressDelta(book.id, stepMinus10)}
        >
          −10p
        </KfButton>

        <KfButton
          variant="primary"
          className="kf-book-sticky-step"
          icon={<Plus size={17} />}
          disabled={stepPlus10 === 0}
          onClick={() => handleBookProgressDelta(book.id, stepPlus10)}
        >
          +10 Pages
        </KfButton>

        <KfButton
          variant="secondary"
          className="kf-book-sticky-note"
          icon={<PenLine size={16} />}
          onClick={handleOpenNoteComposer}
        >
          Note
        </KfButton>
      </div>
    </div>
  );
};
