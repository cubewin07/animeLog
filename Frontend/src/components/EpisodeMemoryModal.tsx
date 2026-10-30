import React, { useRef, useEffect } from 'react';
import { AnimeSeason, EpisodeNote } from '../types';
import {
  X,
  PenLine,
  Trash2,
  BookmarkCheck,
  Star,
  RotateCcw,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface EpisodeMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  season: AnimeSeason | null;
  note: EpisodeNote | null;
  onEdit: (season: AnimeSeason, note: EpisodeNote) => void;
  onDelete?: (noteId: number) => Promise<void>;
  onAddRewatchEpisode?: (season: AnimeSeason, episodeNumber: number) => void;
}

export const EpisodeMemoryModal: React.FC<EpisodeMemoryModalProps> = ({
  isOpen,
  onClose,
  season,
  note,
  onEdit,
  onDelete,
  onAddRewatchEpisode,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.96, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !season || !note) return null;

  const getRatingBandClass = (score: number) => {
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const getStatusClass = () => {
    if (!season.status) return 'slip-ballpoint';
    const s = season.status.toLowerCase();
    if (s === 'watching') return 'slip-watching';
    if (s === 'completed') return 'slip-completed';
    if (s === 'plan_to_watch') return 'slip-plan';
    if (s === 'on_hold') return 'slip-hold';
    if (s === 'dropped') return 'slip-dropped';
    return 'slip-ballpoint';
  };

  const stillUrl = note.cover_image_url || note.image_url;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="episode-memory-title"
      style={{ zIndex: 1000 }}
    >
      <div
        ref={modalRef}
        className="modal-container episode-memory-modal-container"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--tungsten-dim)',
                color: 'var(--tungsten)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookmarkCheck size={15} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, color: 'var(--text-desk)', margin: 0, fontWeight: 600 }}>
                Episode memory
              </h3>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Identity Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--tungsten)',
                  backgroundColor: 'var(--tungsten-dim)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(201, 149, 74, 0.3)',
                }}
              >
                Episode {note.episode_number}
              </span>

              {note.rating !== null && note.rating !== undefined && (
                <div
                  className={getRatingBandClass(note.rating)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Star size={13} fill="currentColor" />
                  <span>{note.rating}/10</span>
                </div>
              )}
            </div>

            <div>
              <h2
                id="episode-memory-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--text-desk)',
                  margin: '4px 0 0 0',
                  lineHeight: 1.25,
                }}
              >
                {note.episode_title || `Episode ${note.episode_number}`}
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-desk-muted)',
                  marginTop: 2,
                }}
              >
                Season {season.season_number}: {season.title}
              </div>
            </div>
          </div>

          {/* Episode Screenshot / Still (if present) */}
          {stillUrl && (
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                maxHeight: '260px',
                border: '1px solid var(--border-desk-subtle)',
                backgroundColor: 'var(--still-well)',
              }}
            >
              <img
                src={stillUrl}
                alt={note.episode_title || `Episode ${note.episode_number} still`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Episode Lesson on Paper */}
          <div
            className={`takeaway-slip ${getStatusClass()}`}
            style={{
              padding: '20px 24px',
            }}
          >
            <div className="takeaway-slip-header">
              <span className="takeaway-slip-label">EPISODE LESSON</span>
              {onEdit && (
                <button
                  type="button"
                  className="btn btn-paper"
                  onClick={() => {
                    onClose();
                    onEdit(season, note);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    fontSize: 12,
                  }}
                  aria-label="Edit memory"
                >
                  <PenLine size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div
              className="takeaway-slip-text"
              style={{
                fontSize: '16.5px',
                lineHeight: 1.65,
                marginTop: 4,
              }}
            >
              {note.note}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-desk-subtle)',
            backgroundColor: 'var(--desk-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onEdit(season, note);
              }}
              style={{ gap: 6 }}
            >
              <PenLine size={13} />
              <span>Edit memory</span>
            </button>

            {onAddRewatchEpisode && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose();
                  onAddRewatchEpisode(season, note.episode_number);
                }}
                style={{ gap: 6, color: 'var(--text-desk-muted)' }}
              >
                <RotateCcw size={13} />
                <span>Log rewatch of Ep {note.episode_number}</span>
              </button>
            )}
          </div>

          <div>
            {onDelete && (
              <button
                type="button"
                className="btn btn-ghost danger btn-sm"
                onClick={async () => {
                  onClose();
                  await onDelete(note.id);
                }}
                style={{ gap: 6 }}
                aria-label="Delete this memory"
              >
                <Trash2 size={13} />
                <span>Delete memory</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
