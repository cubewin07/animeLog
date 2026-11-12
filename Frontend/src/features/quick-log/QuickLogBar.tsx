import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PenLine, RotateCcw, X } from 'lucide-react';
import { bookApi, episodeNoteApi, movieApi, seasonApi } from '../../api/client';
import { composeFinalNote, resolveExistingNote } from '../../composer/noteTarget';
import { QuickLogPrompt, useJournalActions, useJournalData, useJournalUI } from '../../state/JournalContext';
import './QuickLog.css';

const AUTO_DISMISS_MS = 9000;
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function formatPromptCopy(prompt: QuickLogPrompt): { kicker: string; heading: string } {
  if (prompt.kind === 'season') {
    const deltaTag = prompt.delta > 1 ? ` (+${prompt.delta})` : '';
    return {
      kicker: `${prompt.title} · ${prompt.subtitle}`,
      heading: `Ep ${prompt.stepNumber}${deltaTag} — how was it?`,
    };
  }
  if (prompt.kind === 'movie') {
    return {
      kicker: `${prompt.subtitle} · ${prompt.stepNumber} min total`,
      heading: `${prompt.title} · +${prompt.delta} min`,
    };
  }
  return {
    kicker: `${prompt.subtitle} · Page ${prompt.stepNumber}`,
    heading: `${prompt.title} · +${prompt.delta} pages`,
  };
}

export const QuickLogBar: React.FC = () => {
  const { seriesList, bookList, characterList } = useJournalData();
  const { quickLogPrompt, composerOpen, finalePrompt } = useJournalUI();
  const {
    dismissQuickLog,
    openComposer,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
    refreshAll,
    addToast,
  } = useJournalActions();

  const isVisible = Boolean(quickLogPrompt && !composerOpen && !finalePrompt);

  const [noteText, setNoteText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barRef = useRef<HTMLElement>(null);
  const prevTargetRef = useRef<string | null>(null);

  const targetIdentity = quickLogPrompt
    ? `${quickLogPrompt.kind}-${quickLogPrompt.targetId}-${quickLogPrompt.stepNumber}`
    : null;

  useEffect(() => {
    if (!quickLogPrompt || !targetIdentity) {
      prevTargetRef.current = null;
      setNoteText('');
      setRating(null);
      setSavedRating(null);
      setHasInteracted(false);
      setIsFocusedWithin(false);
      return;
    }

    const baseKey = `${quickLogPrompt.kind}-${quickLogPrompt.targetId}`;
    const prevBaseKey = prevTargetRef.current?.split('-').slice(0, 2).join('-') ?? null;

    if (prevBaseKey !== baseKey) {
      setNoteText('');
      setRating(quickLogPrompt.existingRating ?? null);
      setSavedRating(quickLogPrompt.existingRating ?? null);
      setHasInteracted(false);
    } else if (!hasInteracted) {
      setRating(quickLogPrompt.existingRating ?? null);
      setSavedRating(quickLogPrompt.existingRating ?? null);
    }

    prevTargetRef.current = targetIdentity;
  }, [quickLogPrompt, targetIdentity, hasInteracted]);

  const resolvedExisting = useMemo(() => {
    if (!quickLogPrompt) return { text: null as string | null, episodeNoteId: undefined as number | undefined };
    return resolveExistingNote(
      { targetKind: quickLogPrompt.kind, id: quickLogPrompt.targetId },
      quickLogPrompt.kind === 'season' ? 'episode' : 'lesson',
      quickLogPrompt.stepNumber,
      { seriesList, bookList, characterList }
    );
  }, [quickLogPrompt, seriesList, bookList, characterList]);

  const existingPreview = resolvedExisting.text?.trim() || quickLogPrompt?.existingNote?.trim() || null;

  // Pause auto-dismiss whenever focus is inside the card or the user typed/selected anything
  const shouldPauseTimer =
    !isVisible || isFocusedWithin || hasInteracted || noteText.trim().length > 0 || isSubmitting;

  useEffect(() => {
    if (shouldPauseTimer || !quickLogPrompt) return;
    const timer = window.setTimeout(() => {
      dismissQuickLog();
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [shouldPauseTimer, quickLogPrompt, dismissQuickLog]);

  if (!isVisible || !quickLogPrompt) return null;

  const copy = formatPromptCopy(quickLogPrompt);

  const handleSelectRating = async (score: number) => {
    const nextRating = rating === score ? null : score;
    setRating(nextRating);
    setHasInteracted(true);

    try {
      if (quickLogPrompt.kind === 'season') {
        await seasonApi.update(quickLogPrompt.targetId, { rating: nextRating });
      } else if (quickLogPrompt.kind === 'movie') {
        await movieApi.update(quickLogPrompt.targetId, { rating: nextRating });
      } else {
        await bookApi.update(quickLogPrompt.targetId, { rating: nextRating });
      }
      setSavedRating(nextRating);
      refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save rating';
      addToast(`Couldn't save rating: ${msg}`, 'error');
    }
  };

  const handleUndo = () => {
    if (quickLogPrompt.kind === 'season') {
      handleSeasonProgressDelta(quickLogPrompt.targetId, -quickLogPrompt.delta);
    } else if (quickLogPrompt.kind === 'movie') {
      handleMovieProgressDelta(quickLogPrompt.targetId, -quickLogPrompt.delta);
    } else {
      handleBookProgressDelta(quickLogPrompt.targetId, -quickLogPrompt.delta);
    }
    dismissQuickLog();
  };

  const handleOpenFullNote = () => {
    openComposer({
      targetKind: quickLogPrompt.kind,
      id: quickLogPrompt.targetId,
      title: quickLogPrompt.title,
      context: quickLogPrompt.subtitle,
      defaultKind: quickLogPrompt.kind === 'season' ? 'episode' : 'lesson',
      episodeNumber: quickLogPrompt.kind === 'season' ? quickLogPrompt.stepNumber : undefined,
      initialNote: noteText.trim() ? noteText : undefined,
      initialRating: rating,
    });
    dismissQuickLog();
  };

  const handleSave = async () => {
    const trimmed = noteText.trim();
    const ratingChanged = rating !== savedRating;
    if (!trimmed && !ratingChanged) {
      dismissQuickLog();
      return;
    }

    try {
      setIsSubmitting(true);
      const todayStr = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      if (quickLogPrompt.kind === 'season') {
        if (trimmed) {
          const finalNote = composeFinalNote({
            newText: trimmed,
            existingText: existingPreview,
            editEntireNote: false,
            dateLabel: todayStr,
          });
          if (resolvedExisting.episodeNoteId) {
            await episodeNoteApi.update(resolvedExisting.episodeNoteId, {
              note: finalNote,
              ...(rating !== null ? { rating } : {}),
            });
          } else {
            await episodeNoteApi.create({
              season: quickLogPrompt.targetId,
              episode_number: quickLogPrompt.stepNumber,
              note: finalNote,
              ...(rating !== null ? { rating } : {}),
            });
          }
        }
        if (ratingChanged) {
          await seasonApi.update(quickLogPrompt.targetId, { rating });
        }
        addToast(
          trimmed ? `Episode ${quickLogPrompt.stepNumber} note saved` : 'Rating saved'
        );
      } else if (quickLogPrompt.kind === 'movie') {
        const finalNote = trimmed
          ? composeFinalNote({
              newText: trimmed,
              existingText: existingPreview,
              editEntireNote: false,
              dateLabel: todayStr,
            })
          : undefined;
        await movieApi.update(quickLogPrompt.targetId, {
          ...(finalNote !== undefined ? { notes: finalNote } : {}),
          ...(ratingChanged ? { rating } : {}),
        });
        addToast(trimmed ? 'Movie note saved' : 'Rating saved');
      } else {
        const finalNote = trimmed
          ? composeFinalNote({
              newText: trimmed,
              existingText: existingPreview,
              editEntireNote: false,
              dateLabel: todayStr,
            })
          : undefined;
        await bookApi.update(quickLogPrompt.targetId, {
          ...(finalNote !== undefined ? { notes: finalNote } : {}),
          ...(ratingChanged ? { rating } : {}),
        });
        addToast(trimmed ? 'Book note saved' : 'Rating saved');
      }

      refreshAll();
      dismissQuickLog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      addToast(`Error saving: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      ref={barRef}
      className="kf-quickbar"
      role="region"
      aria-label="Quick log"
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(e) => {
        if (!barRef.current?.contains(e.relatedTarget as Node | null)) {
          setIsFocusedWithin(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          dismissQuickLog();
        }
      }}
    >
      <div className="kf-quickbar-head">
        <div className="kf-quickbar-titles">
          <span className="kf-quickbar-kicker">{copy.kicker}</span>
          <h4 className="kf-quickbar-heading">{copy.heading}</h4>
        </div>
        <button
          type="button"
          className="kf-quickbar-close"
          onClick={dismissQuickLog}
          aria-label="Dismiss quick log"
        >
          <X size={16} />
        </button>
      </div>

      <div className="kf-quick-rating" role="group" aria-label="Quick rating 1 to 10">
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
              onClick={() => handleSelectRating(n)}
            >
              {n}
            </button>
          );
        })}
      </div>

      {existingPreview && (
        <p className="kf-quickbar-existing">
          Existing note preserved — anything you add appends below it.
        </p>
      )}

      <input
        type="text"
        className="kf-quickbar-input"
        placeholder="One-line note (optional)…"
        aria-label="One-line note"
        value={noteText}
        onChange={(e) => {
          setNoteText(e.target.value);
          setHasInteracted(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && noteText.trim()) {
            e.preventDefault();
            handleSave();
          }
        }}
      />

      <div className="kf-quickbar-actions">
        <div className="kf-quickbar-actions-left">
          <button
            type="button"
            className="kf-quickbar-btn is-undo"
            onClick={handleUndo}
            disabled={isSubmitting}
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="kf-quickbar-btn is-full"
            onClick={handleOpenFullNote}
            disabled={isSubmitting}
          >
            <PenLine size={13} aria-hidden="true" />
            <span>Full note</span>
          </button>
        </div>

        <div className="kf-quickbar-actions-right">
          <button
            type="button"
            className="kf-quickbar-btn is-save"
            onClick={handleSave}
            disabled={isSubmitting || (!noteText.trim() && rating === savedRating)}
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </aside>
  );
};
