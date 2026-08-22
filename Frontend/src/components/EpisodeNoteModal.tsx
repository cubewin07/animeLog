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
      // Pick next unused episode number
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

  if (!isOpen || !season) return null;

  const notesList = season.episode_notes || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('Note reflection is required.');
      return;
    }

    if (season.total_episodes && episodeNumber > season.total_episodes) {
      setErrorMsg(`Episode number cannot exceed season total (${season.total_episodes}).`);
      return;
    }

    // Check duplicate if creating new
    if (!selectedNote) {
      const isDuplicate = notesList.some((n) => n.episode_number === Number(episodeNumber));
      if (isDuplicate) {
        setErrorMsg(`An episode note already exists for episode ${episodeNumber}. Select it below to edit.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await onSaveNote(
        {
          season: season.id,
          episode_number: Number(episodeNumber),
          episode_title: episodeTitle.trim() || null,
          cover_image: coverImageId,
          note: note.trim(),
          rating,
        },
        selectedNote?.id
      );
      setSelectedNote(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save episode note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!onDeleteNote) return;
    if (!window.confirm('Delete this standout episode memory?')) return;
    try {
      await onDeleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete note.');
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        className="modal-container"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkCheck size={18} color="var(--color-primary)" />
            <div>
              <h3 style={{ fontSize: '16px', color: '#ffffff' }}>
                Episode Standout Notes — {season.title}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Record key memories, philosophies, or moments from standout episodes.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Existing Notes Carousel / List */}
          {notesList.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Recorded Standout Episodes ({notesList.length})
                </span>
                {selectedNote && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => setSelectedNote(null)}
                  >
                    + Write New Note
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {notesList.map((n) => {
                  const isSelected = selectedNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-primary-action)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                        Ep {n.episode_number}
                      </span>
                      {n.rating && (
                        <span style={{ fontSize: '11px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Star size={10} fill="#fbbf24" /> {n.rating}
                        </span>
                      )}
                      {onDeleteNote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fb7185',
                            cursor: 'pointer',
                            padding: '2px',
                            marginLeft: '2px',
                          }}
                          title="Delete note"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(251, 113, 133, 0.15)',
                border: '1px solid rgba(251, 113, 133, 0.3)',
                color: '#fb7185',
                fontSize: '12px',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Episode # <span style={{ color: '#fb7185' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={season.total_episodes || 9999}
                  required
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  disabled={!!selectedNote}
                  className="form-input mono"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Episode Title (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frieren the Slayer"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Score (optional)
                </label>
                <select
                  value={rating || ''}
                  onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
                  className="form-select"
                >
                  <option value="">No score</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      ★ {n} / 10
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Episode Screenshot / Image */}
            <ImageUploadField
              label="Episode Still / Screenshot"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
              }}
            />

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                Memory, Lesson & Takeaway <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="What made this episode standout? What perspective or emotional beat stayed with you?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {selectedNote ? 'Update Episode Note' : 'Save Standout Memory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
