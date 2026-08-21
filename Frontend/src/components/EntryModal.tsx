import React, { useState, useEffect, useRef } from 'react';
import { Anime, AnimeStatus, Book, BookStatus, Genre, Studio } from '../types';
import { X, Film, BookOpen, Lightbulb } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAnime: (data: Omit<Anime, 'id' | 'created_at'>, id?: number) => void;
  onSaveBook: (data: Omit<Book, 'id' | 'created_at'>, id?: number) => void;
  editItem?: Anime | Book | null;
  defaultType?: 'anime' | 'book';
  genres: Genre[];
  studios: Studio[];
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSaveAnime,
  onSaveBook,
  editItem,
  defaultType = 'anime',
  genres,
  studios,
}) => {
  const isEditing = !!editItem;
  const initialType = editItem ? ('total_pages' in editItem ? 'book' : 'anime') : defaultType;

  const [entryType, setEntryType] = useState<'anime' | 'book'>(initialType);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<string>('WATCHING');
  const [rating, setRating] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedStudioIds, setSelectedStudioIds] = useState<number[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setStatus(editItem.status || 'WATCHING');
      setRating(editItem.rating || null);
      setProgress(editItem.progress || 0);
      setStartDate(editItem.start_date || '');
      setFinishDate(editItem.finish_date || '');
      setNotes(editItem.notes || '');
      setSelectedGenreIds(editItem.genres ? editItem.genres.map((g) => g.id) : []);

      if ('total_pages' in editItem) {
        setEntryType('book');
        setAuthor(editItem.author || '');
        setTotalCount(editItem.total_pages ?? '');
      } else {
        setEntryType('anime');
        setTotalCount(editItem.total_episodes ?? '');
        setSelectedStudioIds(editItem.studios ? editItem.studios.map((s) => s.id) : []);
      }
    } else {
      setEntryType(defaultType);
      setTitle('');
      setAuthor('');
      setStatus(defaultType === 'anime' ? 'WATCHING' : 'READING');
      setRating(null);
      setProgress(0);
      setTotalCount('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
      setSelectedGenreIds([]);
      setSelectedStudioIds([]);
    }
  }, [editItem, defaultType, isOpen]);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;

      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.94, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: EASING.spring }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  if (!isOpen) return null;

  const handleToggleGenre = (id: number) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleToggleStudio = (id: number) => {
    setSelectedStudioIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const chosenGenres = genres.filter((g) => selectedGenreIds.includes(g.id));
    const chosenStudios = studios.filter((s) => selectedStudioIds.includes(s.id));

    if (entryType === 'anime') {
      onSaveAnime(
        {
          title: title.trim(),
          status: status as AnimeStatus,
          rating,
          progress: Number(progress) || 0,
          total_episodes: totalCount !== '' ? Number(totalCount) : null,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          genres: chosenGenres,
          studios: chosenStudios,
        },
        editItem?.id
      );
    } else {
      onSaveBook(
        {
          title: title.trim(),
          author: author.trim() || null,
          status: status as BookStatus,
          rating,
          progress: Number(progress) || 0,
          total_pages: totalCount !== '' ? Number(totalCount) : null,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          genres: chosenGenres,
        },
        editItem?.id
      );
    }
    onClose();
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {entryType === 'anime' ? <Film size={18} /> : <BookOpen size={18} />}
            </div>
            <h2 style={{ fontSize: '18px', color: '#ffffff' }}>
              {isEditing ? `Edit ${entryType === 'anime' ? 'Anime' : 'Book'}` : 'Log New Journey'}
            </h2>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Media Type Selector (When not editing) */}
          {!isEditing && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${entryType === 'anime' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setEntryType('anime');
                  setStatus('WATCHING');
                }}
              >
                <Film size={16} /> Anime Entry
              </button>
              <button
                type="button"
                className={`btn ${entryType === 'book' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setEntryType('book');
                  setStatus('READING');
                }}
              >
                <BookOpen size={16} /> Book Entry
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              Title <span style={{ color: '#fb7185' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder={entryType === 'anime' ? 'e.g. Frieren, Steins;Gate...' : 'e.g. Dune, Meditations...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Author (if Book) */}
          {entryType === 'book' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Author
              </label>
              <input
                type="text"
                placeholder="e.g. Frank Herbert"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {/* Status & Rating */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Status
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                {entryType === 'anime' ? (
                  <>
                    <option value="WATCHING">Watching</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PLAN_TO_WATCH">Plan to Watch</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DROPPED">Dropped</option>
                  </>
                ) : (
                  <>
                    <option value="READING">Reading</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PLAN_TO_READ">Plan to Read</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DROPPED">Dropped</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Rating (1 - 10)
              </label>
              <select
                value={rating !== null ? rating : ''}
                onChange={(e) => setRating(e.target.value === '' ? null : Number(e.target.value))}
                className="form-select"
              >
                <option value="">No rating (unrated)</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    ★ {n} / 10
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress & Total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                {entryType === 'anime' ? 'Episodes Watched' : 'Pages Read'}
              </label>
              <input
                type="number"
                min="0"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="form-input mono"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                {entryType === 'anime' ? 'Total Episodes' : 'Total Pages'} (optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 24 or 350"
                value={totalCount}
                onChange={(e) => setTotalCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="form-input mono"
              />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Finish Date
              </label>
              <input
                type="date"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              Genres
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {genres.map((g) => {
                const isSelected = selectedGenreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleToggleGenre(g.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--color-primary-action)' : 'var(--border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Studios (for Anime) */}
          {entryType === 'anime' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                Animation Studio
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {studios.map((s) => {
                  const isSelected = selectedStudioIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleToggleStudio(s.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-secondary)' : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(196, 193, 251, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? 'var(--color-secondary)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lessons & Notes (Highlighted) */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lightbulb size={16} color="var(--color-primary)" />
              <label style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                Lessons, Memories & Key Takeaways
              </label>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              The core of your journal. What perspective or feeling did you gain from this journey?
            </p>
            <textarea
              rows={4}
              placeholder="Write your reflections, favorite quotes, or what this story taught you..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px',
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Log to Journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
