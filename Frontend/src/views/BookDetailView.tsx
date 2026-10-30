import React, { useState } from 'react';
import { Book } from '../types';
import { useJournal } from '../state/JournalContext';
import { Cover, StatusMark, Rating, Stepper, Button, EmptyState, Kbd } from '../ui';
import { formatDate } from '../lib/format';
import { bookApi } from '../api/client';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  PenLine,
  Quote,
  Sparkles,
  Trash2,
} from 'lucide-react';
import './FranchiseDetailView.css';

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
  const { openComposer, addToast, refreshAll } = useJournal();

  // Inline lesson editing state
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonDraft, setLessonDraft] = useState(book.notes || '');
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Sync draft when book changes
  React.useEffect(() => {
    setLessonDraft(book.notes || '');
  }, [book.notes]);

  const coverUrl = book.cover_image_url || (book.cover_image as any)?.image_url;

  const handleSaveInlineLesson = async () => {
    try {
      setIsSavingLesson(true);
      await bookApi.update(book.id, { notes: lessonDraft.trim() });
      setIsEditingLesson(false);
      addToast('Book reflection saved');
      await refreshAll();
    } catch (err: any) {
      addToast(`Error saving lesson: ${err.message}`, 'error');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const currentProgress = book.progress || 0;
  const totalPages = book.total_pages || 0;
  const progressPercent = totalPages > 0 ? Math.min(100, Math.round((currentProgress / totalPages) * 100)) : 0;

  return (
    <div className="lamplight-folio">
      {/* Top back breadcrumb */}
      <div>
        <button
          onClick={onBack}
          className="lamplight-identity-back"
          aria-label="Back to Bookshelf"
        >
          <ArrowLeft size={16} />
          <span>Back to Bookshelf</span>
        </button>
      </div>

      <div className="lamplight-folio-grid">
        {/* Left Column: Book Identity & Progress */}
        <aside className="lamplight-identity-col">
          <div className="lamplight-identity-cover-wrap">
            <Cover
              type="book"
              title={book.title}
              coverUrl={coverUrl}
              size="lg"
            />
          </div>

          <div>
            <h1 className="lamplight-identity-title">{book.title}</h1>
            {book.author && (
              <p className="lamplight-identity-sub" style={{ fontStyle: 'italic', marginTop: 4 }}>
                by {book.author}
              </p>
            )}
          </div>

          <div className="lamplight-identity-meta-row">
            <StatusMark status={book.status} />
            <Rating value={book.rating} max={10} readonly />
          </div>

          {/* Reading Progress */}
          <div style={{ paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="lamplight-release-label">Reading Progress</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {currentProgress} {totalPages > 0 ? `/ ${totalPages} pages` : 'pages'}
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: 'var(--surface-sunken)',
                overflow: 'hidden',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'var(--lamp)',
                  borderRadius: 3,
                  transition: 'width var(--dur-base) var(--ease-smooth)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
              <Stepper
                current={currentProgress}
                total={totalPages}
                onDelta={(d) => onProgressDelta(book.id, d)}
                unit="p"
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => onProgressDelta(book.id, -10)}
                  title="Turn back 10 pages"
                >
                  -10
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  onClick={() => onProgressDelta(book.id, 10)}
                  title="Advance 10 pages"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)' }}>
            <Button
              variant="primary"
              size="sm"
              icon={<PenLine size={14} />}
              onClick={() => {
                openComposer({
                  type: 'book',
                  targetId: book.id,
                  title: book.title,
                  currentNotes: book.notes,
                });
              }}
              style={{ flex: 1 }}
            >
              Write
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(book)}
            >
              Edit
            </Button>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '6px 8px', height: '100%' }}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                aria-label="More book options"
              >
                <MoreVertical size={16} />
              </button>
              {showMoreMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '100%',
                    marginBottom: 4,
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-md)',
                    padding: 4,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 20,
                    minWidth: 140,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--red)',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 'var(--r-sm)',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      setShowMoreMenu(false);
                      onDelete(book.id);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Book</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Accordion */}
          <div style={{ paddingTop: 'var(--s-2)', borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '6px 0',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-3)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>Book Details</span>
              {detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {detailsExpanded && (
              <dl
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text-2)',
                  paddingTop: 8,
                }}
              >
                {book.genres && book.genres.length > 0 && (
                  <div>
                    <dt style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>Genres</dt>
                    <dd style={{ margin: 0, display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {book.genres.map((g: any, i: number) => (
                        <span
                          key={i}
                          style={{
                            padding: '2px 8px',
                            background: 'var(--surface-sunken)',
                            borderRadius: 'var(--r-full)',
                            fontSize: 11,
                          }}
                        >
                          {typeof g === 'string' ? g : g.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {book.start_date && (
                  <div>
                    <dt style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>Started</dt>
                    <dd style={{ margin: 0 }}>{formatDate(book.start_date)}</dd>
                  </div>
                )}
                {book.finish_date && (
                  <div>
                    <dt style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>Finished</dt>
                    <dd style={{ margin: 0 }}>{formatDate(book.finish_date)}</dd>
                  </div>
                )}
                {book.total_pages && (
                  <div>
                    <dt style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>Length</dt>
                    <dd style={{ margin: 0 }}>{book.total_pages} pages</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </aside>

        {/* Right Spread: Reading Journal Folio */}
        <div className="lamplight-spread-col">
          {/* Main Folio Paper */}
          <section className="lamplight-lesson-folio">
            <header className="lamplight-lesson-folio-head">
              <div className="lamplight-lesson-folio-title">
                <Quote size={18} className="lamplight-lesson-folio-icon" />
                <span>Reading Reflection & What Stayed</span>
              </div>
              {!isEditingLesson && (
                <button
                  type="button"
                  className="lamplight-lesson-folio-edit-btn"
                  onClick={() => setIsEditingLesson(true)}
                  aria-label="Edit reflection"
                >
                  <PenLine size={13} />
                  <span>{book.notes ? 'Edit words' : 'Write lesson'}</span>
                </button>
              )}
            </header>

            {isEditingLesson ? (
              <div className="lamplight-lesson-editor">
                <textarea
                  className="lamplight-lesson-textarea"
                  value={lessonDraft}
                  onChange={(e) => setLessonDraft(e.target.value)}
                  placeholder="What idea, phrase, or lesson from this book stayed in your head? Write freely..."
                  rows={8}
                  autoFocus
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveInlineLesson();
                    }
                  }}
                />
                <div className="lamplight-lesson-actions">
                  <span className="lamplight-lesson-hint">
                    Press <Kbd>⌘↵</Kbd> to save
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLessonDraft(book.notes || '');
                        setIsEditingLesson(false);
                      }}
                      disabled={isSavingLesson}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveInlineLesson}
                      loading={isSavingLesson}
                    >
                      Save Reflection
                    </Button>
                  </div>
                </div>
              </div>
            ) : book.notes ? (
              <div className="lamplight-lesson-body">
                {book.notes.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="lamplight-lesson-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Quote size={28} />}
                title="The page is still quiet"
                description="What scene or idea lingered when you closed the cover? Record the passage or lesson so future you can return to it."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<PenLine size={14} />}
                    onClick={() => setIsEditingLesson(true)}
                  >
                    Write what stayed
                  </Button>
                }
              />
            )}
          </section>

          {/* Reading Context & Time Log */}
          {(book.start_date || book.finish_date || book.status === 'COMPLETED') && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)',
                padding: 'var(--s-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--s-4)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--lamp-soft)',
                    color: 'var(--lamp)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    Reading Timeline
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                    {book.start_date && `Started ${formatDate(book.start_date)}`}
                    {book.start_date && book.finish_date && ' · '}
                    {book.finish_date && `Finished ${formatDate(book.finish_date)}`}
                    {!book.start_date && !book.finish_date && 'No dates logged yet.'}
                  </p>
                </div>
              </div>

              {progressPercent === 100 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 'var(--r-full)',
                    background: 'var(--green-soft)',
                    color: 'var(--green)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={14} />
                  <span>Finished cover to cover</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
