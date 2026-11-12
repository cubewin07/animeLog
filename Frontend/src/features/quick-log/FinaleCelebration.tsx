import React, { useEffect, useId, useRef, useState } from 'react';
import { Award, Check, Download, Sparkles, X } from 'lucide-react';
import { bookApi, movieApi, seasonApi } from '../../api/client';
import { composeFinalNote } from '../../composer/noteTarget';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { getGamePrefs, XP_WEIGHTS } from '../../lib/progression';
import { useJournalActions, useJournalUI } from '../../state/JournalContext';
import { CoverArt, KfButton, NotePaper } from '../../ui/keyframe';
import { downloadQuoteCard } from '../../utils/cardGenerator';
import './QuickLog.css';

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const COMPLETION_BADGE = {
  season: 'Season complete!',
  movie: 'Movie finished!',
  book: 'Book finished!',
} as const;

export const FinaleCelebration: React.FC = () => {
  const { finalePrompt } = useJournalUI();
  const { dismissFinale, refreshAll, addToast } = useJournalActions();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTitle = finalePrompt?.title ?? '';
  const activeCover = finalePrompt?.coverUrl ?? null;
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(activeTitle, activeCover);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (finalePrompt) {
      setRating(finalePrompt.currentRating ?? null);
      setNote('');
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal();
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
    return undefined;
  }, [finalePrompt]);

  if (!finalePrompt) {
    return <dialog ref={dialogRef} className="kf-finale-dialog" aria-hidden="true" />;
  }

  const gamePrefs = getGamePrefs();
  const existingNote = finalePrompt.existingNote?.trim() || null;
  const hasTypedNote = note.trim().length > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    dismissFinale();
  };

  const handleShareCard = () => {
    const cardText = note.trim() || existingNote;
    if (!cardText) {
      addToast('Write what stayed with you first to create a share card.', 'info');
      textareaRef.current?.focus();
      return;
    }
    downloadQuoteCard({
      title: finalePrompt.title,
      context: finalePrompt.subtitle,
      note: cardText,
      rating,
    });
    addToast('Reflection card downloaded');
  };

  const handleSaveAndClose = async () => {
    const trimmed = note.trim();
    const ratingChanged = rating !== (finalePrompt.currentRating ?? null);
    if (!trimmed && !ratingChanged) {
      dismissFinale();
      return;
    }

    try {
      setIsSubmitting(true);
      const todayStr = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      const finalNote = trimmed
        ? composeFinalNote({
            newText: trimmed,
            existingText: existingNote,
            editEntireNote: false,
            dateLabel: todayStr,
          })
        : undefined;

      const payload = {
        ...(finalNote !== undefined ? { notes: finalNote } : {}),
        ...(ratingChanged ? { rating } : {}),
      };

      if (finalePrompt.kind === 'season') {
        await seasonApi.update(finalePrompt.targetId, payload);
      } else if (finalePrompt.kind === 'movie') {
        await movieApi.update(finalePrompt.targetId, payload);
      } else {
        await bookApi.update(finalePrompt.targetId, payload);
      }

      refreshAll();
      addToast('Saved to your journal');
      dismissFinale();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      addToast(`Error saving finale note: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slateFacts = [
    finalePrompt.title,
    finalePrompt.subtitle,
    rating ? `${rating}/10` : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <dialog
      ref={dialogRef}
      className="kf-finale-dialog"
      aria-labelledby={titleId}
      style={{ '--title-accent': accent } as React.CSSProperties}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose();
        }
      }}
    >
      <div className="kf-finale-hero">
        {finalePrompt.coverUrl && (
          <div
            className="kf-finale-backdrop-art"
            style={{ backgroundImage: `url(${finalePrompt.coverUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="kf-finale-backdrop-scrim" aria-hidden="true" />

        <button
          type="button"
          className="kf-finale-close"
          onClick={handleClose}
          aria-label="Close finale celebration"
        >
          <X size={18} />
        </button>

        <div className="kf-finale-hero-inner">
          <div className="kf-finale-cover">
            <CoverArt
              title={finalePrompt.title}
              imageUrl={finalePrompt.coverUrl}
              accent={accent}
              size="hero"
              fetchPriority="high"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>

          <div className="kf-finale-meta">
            <span className="kf-finale-badge">
              <Check size={13} aria-hidden="true" />
              {COMPLETION_BADGE[finalePrompt.kind]}
            </span>

            <h2 id={titleId} className="kf-finale-title">
              {finalePrompt.title}
            </h2>
            <p className="kf-finale-subtitle">{finalePrompt.subtitle}</p>

            {gamePrefs.xp && (
              <div className="kf-finale-xp-row" aria-label="XP earned">
                <span className="kf-finale-xp-chip">
                  <Award size={13} aria-hidden="true" />
                  +{XP_WEIGHTS.COMPLETION} XP completion
                </span>
                <span className={`kf-finale-xp-chip ${hasTypedNote ? '' : 'is-pending'}`}>
                  <Sparkles size={13} aria-hidden="true" />
                  +{XP_WEIGHTS.JOURNAL_NOTE} XP note
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="kf-finale-body">
        <div className="kf-finale-section">
          <div className="kf-finale-label-row">
            <span className="kf-finale-label">Final Rating</span>
            {rating !== null && (
              <span className={`kf-finale-score-readout ${rating >= 9 ? 'is-gold' : ''}`}>
                {rating}/10
              </span>
            )}
          </div>
          <div className="kf-quick-rating" role="group" aria-label="Final rating 1 to 10">
            {RATINGS.map((n) => {
              const isActive = rating === n;
              const isGold = n >= 9;
              return (
                <button
                  key={n}
                  type="button"
                  className={`kf-rate-pill ${isActive ? 'is-active' : ''} ${isGold ? 'is-gold' : ''}`}
                  aria-pressed={isActive}
                  aria-label={`Rate ${n} out of 10`}
                  onClick={() => setRating(isActive ? null : n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="kf-finale-section">
          <label htmlFor={`${titleId}-note`} className="kf-finale-label">
            What stayed with you?
          </label>

          {existingNote && (
            <div className="kf-finale-existing" aria-label="Already saved note">
              {existingNote}
            </div>
          )}

          <NotePaper slate={slateFacts}>
            <textarea
              id={`${titleId}-note`}
              ref={textareaRef}
              className="kf-finale-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                existingNote
                  ? 'Add your final thoughts (your previous note stays intact above)…'
                  : 'Write the scene, feeling, or lesson you want to keep…'
              }
            />
          </NotePaper>
        </div>
      </div>

      <footer className="kf-finale-footer">
        <KfButton
          variant="secondary"
          icon={<Download size={15} />}
          onClick={handleShareCard}
          disabled={isSubmitting}
        >
          Share card
        </KfButton>

        <div className="kf-finale-footer-right">
          <KfButton variant="quiet" onClick={handleClose} disabled={isSubmitting}>
            Skip
          </KfButton>
          <KfButton
            variant="primary"
            onClick={handleSaveAndClose}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save & Close'}
          </KfButton>
        </div>
      </footer>
    </dialog>
  );
};
