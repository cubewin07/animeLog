import React, { useState, useEffect, useRef } from 'react';
import { AnimeSeason, EpisodeNote } from '../types';
import { X, BookmarkCheck, Star, Trash2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { ImageUploadField } from './ImageUploadField';

interface EpisodeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  season: AnimeSeason | null;
  onSaveNote: (data: {
    season: number;
    episode_number: number;
    episode_title?: string | null;
    cover_image?: number | null;
    note: string;
    rating?: number | null;
  }, noteId?: number) => Promise<void>;
  onDeleteNote?: (noteId: number) => Promise<void>;
}

export const EpisodeNoteModal: React.FC<EpisodeNoteModalProps> = ({
  isOpen,
  onClose,
  season,
  onSaveNote,
  onDeleteNote,
}) => {
  const [selectedNote, setSelectedNote] = useState<EpisodeNote | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [episodeTitle, setEpisodeTitle] = useState<string>('');
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setSelectedNote(null);
    setErrorMsg('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !season) return;
    setErrorMsg('');
    if (selectedNote && selectedNote.season !== season.id) {
      setSelectedNote(null);
      return;
    }
    if (selectedNote && selectedNote.season === season.id) {
      setEpisodeNumber(selectedNote.episode_number);
      setEpisodeTitle(selectedNote.episode_title || '');
      setCoverImageId(selectedNote.cover_image ?? null);
      setCoverImageUrl(selectedNote.cover_image_url || selectedNote.image_url || null);
      setRating(selectedNote.rating || null);
      setNote(selectedNote.note);
    } else {
      const existingEps = (season.episode_notes || []).map((n) => n.episode_number);
      let nextEp = 1;
      while (existingEps.includes(nextEp) && (!season.total_episodes || nextEp <= season.total_episodes)) {
        nextEp++;
      }
      setEpisodeNumber(nextEp);
      setEpisodeTitle('');
      setCoverImageId(null);
      setCoverImageUrl(null);
      setRating(10);
      setNote('');
    }
  }, [isOpen, season, selectedNote]);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.95, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  if (!isOpen || !season) return null;

  const notesList = season.episode_notes || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('Please write your takeaway or memory for this episode.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveNote(
        {
          season: season.id,
          episode_number: Number(episodeNumber),
          episode_title: episodeTitle.trim() || null,
          cover_image: coverImageId,
          note: note.trim(),
          rating,
        },
        selectedNote ? selectedNote.id : undefined
      );
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save episode note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!onDeleteNote) return;
    try {
      await onDeleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err: any) {
      setErrorMsg('Failed to delete episode note.');
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="modal-container"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--tungsten-dim)',
                color: 'var(--tungsten)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookmarkCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>Episode Memories</h3>
              <p style={{ fontSize: 12, color: 'var(--text-desk-muted)' }}>
                Season {season.season_number}: {season.title}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Existing notes tabs/pills if any */}
        {notesList.length > 0 && (
          <div
            style={{
              padding: '12px 24px 0 24px',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-desk-subtle)',
              paddingBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedNote === null ? 'var(--border-desk-medium)' : 'var(--border-desk-subtle)',
                backgroundColor: selectedNote === null ? 'var(--desk-surface-high)' : 'var(--desk-surface)',
                color: selectedNote === null ? 'var(--text-desk)' : 'var(--text-desk-muted)',
                cursor: 'pointer',
              }}
            >
              + New Episode Note
            </button>
            {notesList.map((ep) => {
              const isSelected = selectedNote?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedNote(ep)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--border-desk-medium)' : 'var(--border-desk-subtle)',
                    backgroundColor: isSelected ? 'var(--desk-surface-high)' : 'var(--desk-surface)',
                    color: isSelected ? 'var(--text-desk)' : 'var(--text-desk-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ep {ep.episode_number} {ep.rating ? `★${ep.rating}` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMsg && (
            <div className="form-error">
              {errorMsg}
            </div>
          )}

          {/* Episode Number & Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                Episode #
              </label>
              <input
                type="number"
                min="1"
                required
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                className="form-input mono"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                Episode Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. The End of the Journey"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                Rating
              </label>
              <select
                value={rating || ''}
                onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
                className="form-select mono"
                style={{ width: '95px' }}
              >
                <option value="">None</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    ★ {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Episode Note / Takeaway (Primary, large 16px textarea) */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              Episode Memory & Lesson <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              rows={6}
              required
              placeholder="What specifically happened in this episode that made you think or feel deeply?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-textarea"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                lineHeight: 1.6,
                backgroundColor: 'var(--desk)',
                borderColor: 'var(--border-desk-medium)',
              }}
            />
          </div>

          {/* Episode Still */}
          <ImageUploadField
            label="Episode Still / Screenshot"
            imageId={coverImageId}
            imageUrl={coverImageUrl}
            onChange={(id, url) => {
              setCoverImageId(id);
              setCoverImageUrl(url);
            }}
          />

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            {selectedNote && onDeleteNote ? (
              <button
                type="button"
                className="btn-icon danger"
                onClick={() => handleDelete(selectedNote.id)}
                title="Delete this note"
                aria-label="Delete this note"
              >
                <Trash2 size={16} />
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {selectedNote ? 'Update Memory' : 'Save Memory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
