import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, PenLine, X } from 'lucide-react';
import {
  bookApi,
  characterApi,
  episodeNoteApi,
  movieApi,
  rewatchApi,
  seasonApi,
} from '../api/client';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { localToday } from '../lib/journal/progress';
import { KfButton, NotePaper } from '../ui/keyframe';
import { useDialog } from '../ui/Sheet/useDialog';
import { clearDraft, loadDraft, saveDraft } from './drafts';
import { composeFinalNote, normalizeKind, NoteKind, resolveExistingNote } from './noteTarget';
import { ChosenTarget, TargetPicker } from './TargetPicker';
import type { AnimeSeries, Book } from '../types';
import './Composer.css';

export interface ComposerProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ReflectionKind = NoteKind;

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function resolveExistingRating(
  target: ChosenTarget,
  kind: ReflectionKind,
  episodeNumber: number,
  lists: { seriesList: AnimeSeries[]; bookList: Book[] }
): number | null {
  if (target.targetKind === 'season') {
    const season = lists.seriesList.flatMap((s) => s.seasons ?? []).find((s) => s.id === target.id);
    if (kind === 'lesson') return season?.rating ?? null;
    if (kind === 'episode') {
      return season?.episode_notes?.find((n) => n.episode_number === episodeNumber)?.rating ?? null;
    }
    return null;
  }
  if (target.targetKind === 'movie' && kind === 'lesson') {
    const movie = lists.seriesList.flatMap((s) => s.movies ?? []).find((m) => m.id === target.id);
    return movie?.rating ?? null;
  }
  if (target.targetKind === 'book') {
    return lists.bookList.find((b) => b.id === target.id)?.rating ?? null;
  }
  return null;
}

export const Composer: React.FC<ComposerProps> = ({ isOpen, onClose }) => {
  const { seriesList, bookList, characterList } = useJournalData();
  const { composerInitialTarget } = useJournalUI();
  const { refreshAll, addToast, openNewFranchiseModal } = useJournalActions();

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  const [target, setTarget] = useState<ChosenTarget | null>(null);
  const [kind, setKind] = useState<ReflectionKind>('lesson');
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [ratingEdited, setRatingEdited] = useState(false);
  const [editEntireNote, setEditEntireNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  const listsRef = useRef({ seriesList, bookList });
  useEffect(() => {
    listsRef.current = { seriesList, bookList };
  }, [seriesList, bookList]);

  // Holds one-time initial text/rating passed from QuickLogBar so draft loading doesn't clear it
  const pendingSeedRef = useRef<{
    targetKey: string;
    kind: ReflectionKind;
    episodeNumber?: number;
    note?: string;
    rating?: number | null;
  } | null>(null);

  // Initialize target when opened
  useEffect(() => {
    if (!isOpen) return;
    setEditEntireNote(false);
    setRatingEdited(false);
    setDraftSavedTime(null);

    if (composerInitialTarget) {
      const normalized = normalizeKind(
        composerInitialTarget.targetKind,
        composerInitialTarget.defaultKind
      );
      const initialEp = composerInitialTarget.episodeNumber ?? 1;
      if (
        composerInitialTarget.initialNote !== undefined ||
        composerInitialTarget.initialRating !== undefined
      ) {
        pendingSeedRef.current = {
          targetKey: `${composerInitialTarget.targetKind}-${composerInitialTarget.id}`,
          kind: normalized,
          episodeNumber: normalized === 'episode' ? initialEp : undefined,
          note: composerInitialTarget.initialNote,
          rating: composerInitialTarget.initialRating,
        };
      } else {
        pendingSeedRef.current = null;
      }

      setTarget({
        targetKind: composerInitialTarget.targetKind,
        id: composerInitialTarget.id,
        title: composerInitialTarget.title,
        context: composerInitialTarget.context,
        defaultKind: composerInitialTarget.defaultKind,
        episodeNumber: composerInitialTarget.episodeNumber,
      });
      setKind(normalized);
      setEpisodeNumber(initialEp);
      setNote(composerInitialTarget.initialNote ?? '');
      setRating(composerInitialTarget.initialRating ?? null);
    } else {
      pendingSeedRef.current = null;
      setTarget(null);
      setKind('lesson');
      setEpisodeNumber(1);
      setNote('');
      setRating(null);
    }
  }, [isOpen, composerInitialTarget]);

  // Always read the saved note from live data, however the Composer was opened
  const existing = useMemo(
    () =>
      target
        ? resolveExistingNote(target, kind, episodeNumber, { seriesList, bookList, characterList })
        : { text: null },
    [target, kind, episodeNumber, seriesList, bookList, characterList]
  );
  const existingText = existing.text?.trim() ? existing.text : null;

  const activeEpisode = kind === 'episode' ? episodeNumber : undefined;

  // Load existing draft if available
  useEffect(() => {
    if (!isOpen || !target) return;
    const targetKey = `${target.targetKind}-${target.id}`;
    const seed = pendingSeedRef.current;
    const savedRating = resolveExistingRating(
      target,
      kind,
      activeEpisode ?? 1,
      listsRef.current
    );

    if (
      seed &&
      seed.targetKey === targetKey &&
      seed.kind === kind &&
      (kind !== 'episode' || seed.episodeNumber === activeEpisode)
    ) {
      pendingSeedRef.current = null;
      if (seed.note !== undefined) {
        setNote(seed.note);
        setRating(seed.rating !== undefined ? (seed.rating ?? null) : savedRating);
        setRatingEdited(false);
        setEditEntireNote(false);
        return;
      }
    }

    const draft = loadDraft(targetKey, kind, activeEpisode);
    if (draft) {
      setNote(draft.note);
      const nextRating =
        seed?.rating !== undefined
          ? (seed.rating ?? null)
          : draft.rating !== undefined
            ? (draft.rating ?? null)
            : savedRating;
      setRating(nextRating);
      setRatingEdited(draft.rating !== undefined && nextRating !== savedRating);
      setEditEntireNote(Boolean(draft.editEntireNote));
    } else {
      setNote('');
      setRating(seed?.rating !== undefined ? (seed.rating ?? null) : savedRating);
      setRatingEdited(false);
      setEditEntireNote(false);
    }
  }, [isOpen, target, kind, activeEpisode]);

  // Debounced draft autosave
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!target || !note.trim()) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft({
        targetKey: `${target.targetKind}-${target.id}`,
        kind,
        episodeNumber: kind === 'episode' ? episodeNumber : undefined,
        note,
        rating,
        editEntireNote,
        updatedAt: Date.now(),
      });
      setDraftSavedTime('Draft saved');
      if (draftBadgeTimeoutRef.current) clearTimeout(draftBadgeTimeoutRef.current);
      draftBadgeTimeoutRef.current = setTimeout(() => setDraftSavedTime(null), 2500);
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (draftBadgeTimeoutRef.current) clearTimeout(draftBadgeTimeoutRef.current);
    };
  }, [note, rating, episodeNumber, target, kind, editEntireNote]);

  // Available kinds based on target type
  const availableKinds = useMemo(() => {
    if (!target) return [];
    if (target.targetKind === 'season') {
      return [
        { id: 'lesson', label: 'Season Note' },
        { id: 'episode', label: 'Episode Note' },
        { id: 'return', label: 'Rewatch Note' },
      ];
    }
    if (target.targetKind === 'movie') {
      return [
        { id: 'lesson', label: 'Movie Note' },
        { id: 'return', label: 'Rewatch Note' },
      ];
    }
    if (target.targetKind === 'book') {
      return [{ id: 'lesson', label: 'Book Note' }];
    }
    if (target.targetKind === 'character') {
      return [{ id: 'why', label: 'Character Note' }];
    }
    return [];
  }, [target]);

  const handleSave = async () => {
    if (!target || !note.trim()) {
      addToast('Please write your note before saving.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const todayStr = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      const finalNote = composeFinalNote({
        newText: note,
        existingText,
        editEntireNote,
        dateLabel: todayStr,
      });

      const ratingPayload = ratingEdited || rating !== null ? { rating } : {};

      if (target.targetKind === 'season') {
        if (kind === 'lesson') {
          await seasonApi.update(target.id, {
            notes: finalNote,
            ...ratingPayload,
          });
          addToast('Season note saved');
        } else if (kind === 'episode') {
          if (existing.episodeNoteId) {
            await episodeNoteApi.update(existing.episodeNoteId, {
              note: finalNote,
              ...ratingPayload,
            });
          } else {
            await episodeNoteApi.create({
              season: target.id,
              episode_number: episodeNumber,
              note: finalNote,
              ...ratingPayload,
            });
          }
          addToast(`Episode ${episodeNumber} note saved`);
        } else if (kind === 'return') {
          await rewatchApi.create({
            target_type: 'season',
            target_id: target.id,
            notes: finalNote,
            ...ratingPayload,
            start_date: localToday(),
          });
          addToast('Rewatch note saved');
        } else {
          throw new Error('This note type is not available for a season.');
        }
      } else if (target.targetKind === 'movie') {
        if (kind === 'lesson') {
          await movieApi.update(target.id, {
            notes: finalNote,
            ...ratingPayload,
          });
          addToast('Movie note saved');
        } else if (kind === 'return') {
          await rewatchApi.create({
            target_type: 'movie',
            target_id: target.id,
            notes: finalNote,
            ...ratingPayload,
            start_date: localToday(),
          });
          addToast('Rewatch note saved');
        } else {
          throw new Error('This note type is not available for a movie.');
        }
      } else if (target.targetKind === 'book') {
        await bookApi.update(target.id, {
          notes: finalNote,
          ...ratingPayload,
        });
        addToast('Book note saved');
      } else if (target.targetKind === 'character') {
        await characterApi.update(target.id, {
          why: finalNote,
        });
        addToast('Character note saved');
      } else {
        throw new Error('This note type is not available for that title.');
      }

      clearDraft(`${target.targetKind}-${target.id}`, kind, activeEpisode);
      await refreshAll();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error saving note:', err);
      addToast(`Error saving: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut ⌘↵ / Ctrl+↵ to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  const slateContext = target
    ? kind === 'episode'
      ? `Ep ${episodeNumber}`
      : kind === 'return'
      ? 'Rewatch'
      : target.context || null
    : 'Pick a title';

  const slateFacts = [
    target?.title || 'Keyframe Note',
    slateContext,
    rating ? `${rating}/10` : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div
      className="kf-composer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="kf-composer-panel"
        onKeyDown={handleKeyDown}
      >
        <header className="kf-composer-header">
          <h2 id={titleId} className="kf-composer-title">
            <PenLine size={18} color="var(--kf-brand)" aria-hidden="true" />
            <span>Write Note</span>
          </h2>
          <button
            type="button"
            className="kf-composer-close"
            onClick={onClose}
            aria-label="Close composer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="kf-composer-body">
          <div className="kf-composer-form">
            {/* Step 1: Target Title */}
            <div className="kf-composer-field">
              <label className="kf-composer-label">Writing about</label>
              <TargetPicker
                value={target}
                onChange={(selected) => {
                  pendingSeedRef.current = null;
                  setTarget(selected);
                  setKind(normalizeKind(selected.targetKind, selected.defaultKind));
                  setEpisodeNumber(selected.episodeNumber ?? 1);
                }}
                onOpenNewCatalog={() => {
                  onClose();
                  openNewFranchiseModal();
                }}
              />
            </div>

            {/* Step 2: Kind Selection */}
            {availableKinds.length > 1 && (
              <div className="kf-composer-field">
                <span className="kf-composer-label">Note Type</span>
                <div className="kf-composer-kinds" role="group" aria-label="Note Type">
                  {availableKinds.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      className={`kf-kind-pill ${kind === k.id ? 'is-active' : ''}`}
                      aria-pressed={kind === k.id}
                      onClick={() => setKind(k.id as ReflectionKind)}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Number Picker (if kind === episode) */}
            {kind === 'episode' && (
              <div className="kf-composer-field">
                <label htmlFor={`${titleId}-ep`} className="kf-composer-label">
                  Episode Number {existing.totalEpisodes ? `(1 – ${existing.totalEpisodes})` : ''}
                </label>
                <input
                  id={`${titleId}-ep`}
                  type="number"
                  min={1}
                  max={existing.totalEpisodes || 9999}
                  value={episodeNumber}
                  onChange={(e) => {
                    const nextEpisode = Math.max(1, parseInt(e.target.value, 10) || 1);
                    if (target && kind === 'episode' && nextEpisode !== episodeNumber && note.trim()) {
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      saveDraft({
                        targetKey: `${target.targetKind}-${target.id}`,
                        kind,
                        episodeNumber,
                        note,
                        rating,
                        editEntireNote,
                        updatedAt: Date.now(),
                      });
                    }
                    setEpisodeNumber(nextEpisode);
                    if (editEntireNote) {
                      setEditEntireNote(false);
                      setNote('');
                    }
                  }}
                  className="kf-composer-ep-input"
                />
              </div>
            )}

            {/* Existing note preview & mode toggle */}
            {existingText && (
              <div className="kf-composer-field">
                <div className="kf-composer-label-row">
                  <span className="kf-composer-label">
                    {editEntireNote ? 'Editing full note' : 'Saved on this note'}
                  </span>
                  {!editEntireNote ? (
                    <button
                      type="button"
                      className="kf-composer-mode-btn"
                      onClick={() => {
                        setEditEntireNote(true);
                        setNote(existingText);
                      }}
                    >
                      Edit full note
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="kf-composer-mode-btn"
                      onClick={() => {
                        setEditEntireNote(false);
                        setNote('');
                      }}
                    >
                      Add to note instead
                    </button>
                  )}
                </div>

                {!editEntireNote && (
                  <div className="kf-composer-prev-note" aria-label="Saved on this note">
                    {existingText}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Keyframe NotePaper Textarea */}
            <div className="kf-composer-field">
              <label htmlFor={`${titleId}-note`} className="kf-composer-label">
                {kind === 'episode'
                  ? `Episode ${episodeNumber} Note`
                  : kind === 'why'
                  ? 'Character Note'
                  : kind === 'return'
                  ? 'Rewatch Note'
                  : editEntireNote
                  ? 'Full Note'
                  : existingText
                  ? 'Add to note'
                  : 'Your Note'}
              </label>

              <NotePaper slate={slateFacts}>
                <textarea
                  id={`${titleId}-note`}
                  className="kf-composer-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write the thoughts, scenes, or ideas you want to remember…"
                />
              </NotePaper>
            </div>

            {/* Step 4: Optional Rating (not shown for character notes which have no rating) */}
            {target?.targetKind !== 'character' && (
              <div className="kf-composer-field">
                <div className="kf-composer-label-row">
                  <span className="kf-composer-label">Rating (Optional 1–10)</span>
                  {rating !== null && (
                    <span className={`kf-composer-rate-readout ${rating >= 9 ? 'is-gold' : ''}`}>
                      {rating}/10
                    </span>
                  )}
                </div>
                <div className="kf-composer-rating-row" role="group" aria-label="Rating 1 to 10">
                  {RATINGS.map((n) => {
                    const isActive = rating === n;
                    const isGold = n >= 9;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`kf-composer-rate-pill ${isActive ? 'is-active' : ''} ${isGold ? 'is-gold' : ''}`}
                        aria-pressed={isActive}
                        aria-label={`Rate ${n} out of 10`}
                        onClick={() => {
                          setRating(isActive ? null : n);
                          setRatingEdited(true);
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="kf-composer-footer">
          <div className="kf-composer-draft-status" aria-live="polite">
            {draftSavedTime && (
              <>
                <Check size={13} aria-hidden="true" />
                <span>{draftSavedTime}</span>
              </>
            )}
          </div>
          <div className="kf-composer-footer-actions">
            <KfButton variant="quiet" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </KfButton>
            <KfButton
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting || !target || !note.trim()}
            >
              <span>{isSubmitting ? 'Saving…' : 'Save Note'}</span>
              <kbd className="kf-composer-kbd">⌘↵</kbd>
            </KfButton>
          </div>
        </footer>
      </div>
    </div>
  );
};
