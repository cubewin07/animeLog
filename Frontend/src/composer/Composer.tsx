import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJournal } from '../state/JournalContext';
import { TargetPicker, ChosenTarget } from './TargetPicker';
import { Sheet, Button, Paper, Rating, Kbd } from '../ui';
import { saveDraft, loadDraft, clearDraft } from './drafts';
import {
  seasonApi,
  movieApi,
  bookApi,
  episodeNoteApi,
  characterApi,
  rewatchApi,
} from '../api/client';
import { formatDate } from '../lib/format';
import { Check, Clock, History, PenLine } from 'lucide-react';
import './Composer.css';

export interface ComposerProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ReflectionKind = 'lesson' | 'episode' | 'return' | 'why';

export const Composer: React.FC<ComposerProps> = ({ isOpen, onClose }) => {
  const {
    composerInitialTarget,
    refreshAll,
    addToast,
    openNewFranchiseModal,
  } = useJournal();

  const [target, setTarget] = useState<ChosenTarget | null>(null);
  const [kind, setKind] = useState<ReflectionKind>('lesson');
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [editEntireNote, setEditEntireNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Initialize target when opened
  useEffect(() => {
    if (isOpen) {
      if (composerInitialTarget) {
        setTarget({
          targetKind: composerInitialTarget.targetKind,
          id: composerInitialTarget.id,
          title: composerInitialTarget.title,
          context: composerInitialTarget.context,
          defaultKind: composerInitialTarget.defaultKind || 'lesson',
          episodeNumber: composerInitialTarget.episodeNumber,
        });
        setKind(composerInitialTarget.defaultKind || 'lesson');
        if (composerInitialTarget.episodeNumber) {
          setEpisodeNumber(composerInitialTarget.episodeNumber);
        }
      }
    }
  }, [isOpen, composerInitialTarget]);

  // Load existing draft if available
  useEffect(() => {
    if (target) {
      const draft = loadDraft(`${target.targetKind}-${target.id}`, kind);
      if (draft) {
        setNote(draft.note);
        if (draft.rating) setRating(draft.rating);
        if (draft.episodeNumber) setEpisodeNumber(draft.episodeNumber);
      } else {
        setNote('');
      }
    }
  }, [target, kind]);

  // Debounced draft autosave
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
        updatedAt: Date.now(),
      });
      setDraftSavedTime('Draft saved');
      setTimeout(() => setDraftSavedTime(null), 2500);
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [note, rating, episodeNumber, target, kind]);

  // Available kinds based on target type
  const availableKinds = React.useMemo(() => {
    if (!target) return [];
    if (target.targetKind === 'season') {
      return [
        { id: 'lesson', label: 'Season Lesson' },
        { id: 'episode', label: 'Episode Memory' },
        { id: 'return', label: 'Return Pass' },
      ];
    }
    if (target.targetKind === 'movie') {
      return [
        { id: 'lesson', label: 'Film Takeaway' },
        { id: 'return', label: 'Return Pass' },
      ];
    }
    if (target.targetKind === 'book') {
      return [{ id: 'lesson', label: 'Book Lesson' }];
    }
    if (target.targetKind === 'character') {
      return [{ id: 'why', label: 'Why They Matter' }];
    }
    return [];
  }, [target]);

  const handleSave = async () => {
    if (!target || !note.trim()) {
      addToast('Please write your reflection before saving.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const todayStr = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());

      // Prepare final note (append if previous note existed and not in overwrite mode)
      let finalNote = note.trim();
      if (
        !editEntireNote &&
        target.existingNotes?.trim() &&
        kind === 'lesson' &&
        !finalNote.includes(target.existingNotes.trim())
      ) {
        finalNote = `${target.existingNotes.trim()}\n\n— ${todayStr}\n${finalNote}`;
      }

      if (target.targetKind === 'season') {
        if (kind === 'lesson') {
          await seasonApi.update(target.id, {
            notes: finalNote,
            ...(rating ? { rating } : {}),
          });
          addToast('Season reflection saved');
        } else if (kind === 'episode') {
          await episodeNoteApi.create({
            season: target.id,
            episode_number: episodeNumber,
            note: finalNote,
            ...(rating ? { rating } : {}),
          });
          addToast(`Episode ${episodeNumber} memory recorded`);
        } else if (kind === 'return') {
          await rewatchApi.create({
            target_type: 'season',
            target_id: target.id,
            notes: finalNote,
            ...(rating ? { rating } : {}),
            start_date: new Date().toISOString().split('T')[0],
          });
          addToast('Return pass recorded');
        }
      } else if (target.targetKind === 'movie') {
        if (kind === 'lesson') {
          await movieApi.update(target.id, {
            notes: finalNote,
            ...(rating ? { rating } : {}),
          });
          addToast('Film reflection saved');
        } else if (kind === 'return') {
          await rewatchApi.create({
            target_type: 'movie',
            target_id: target.id,
            notes: finalNote,
            ...(rating ? { rating } : {}),
            start_date: new Date().toISOString().split('T')[0],
          });
          addToast('Return pass recorded');
        }
      } else if (target.targetKind === 'book') {
        await bookApi.update(target.id, {
          notes: finalNote,
          ...(rating ? { rating } : {}),
        });
        addToast('Book reflection saved');
      } else if (target.targetKind === 'character') {
        await characterApi.update(target.id, {
          why: finalNote,
        });
        addToast('Character reflection saved');
      }

      clearDraft(`${target.targetKind}-${target.id}`, kind);
      await refreshAll();
      onClose();
    } catch (err: any) {
      console.error('Error saving reflection:', err);
      addToast(`Error saving: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut ⌘↵ to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PenLine size={18} color="var(--lamp)" />
          <span>Write Reflection</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="lamplight-composer-draft-status">
            {draftSavedTime && (
              <>
                <Check size={12} color="var(--lamp)" />
                <span>{draftSavedTime}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSubmitting}
              disabled={!target || !note.trim()}
            >
              <span>Save Reflection</span>
              <Kbd>⌘↵</Kbd>
            </Button>
          </div>
        </div>
      }
    >
      <div className="lamplight-composer-form" onKeyDown={handleKeyDown}>
        {/* Step 1: Target Title */}
        <div className="lamplight-composer-field">
          <label className="lamplight-composer-label">Reflecting on</label>
          <TargetPicker
            value={target}
            onChange={(selected) => {
              setTarget(selected);
              if (selected.defaultKind) setKind(selected.defaultKind as ReflectionKind);
            }}
            onOpenNewCatalog={() => {
              onClose();
              openNewFranchiseModal();
            }}
          />
        </div>

        {/* Step 2: Kind Selection */}
        {availableKinds.length > 1 && (
          <div className="lamplight-composer-field">
            <label className="lamplight-composer-label">Reflection Type</label>
            <div className="lamplight-composer-kinds">
              {availableKinds.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`lamplight-kind-pill ${kind === k.id ? 'is-active' : ''}`}
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
          <div className="lamplight-composer-field">
            <label className="lamplight-composer-label">
              Episode Number {target?.totalEpisodes ? `(1 – ${target.totalEpisodes})` : ''}
            </label>
            <input
              type="number"
              min={1}
              max={target?.totalEpisodes || 9999}
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: 120,
                height: 38,
                padding: '0 12px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--line-strong)',
                borderRadius: 'var(--r-md)',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Previous notes excerpt (if appending) */}
        {target?.existingNotes && kind === 'lesson' && !editEntireNote && (
          <div className="lamplight-composer-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="lamplight-composer-label">Previous notes on this title</label>
              <button
                type="button"
                onClick={() => {
                  setEditEntireNote(true);
                  setNote(target.existingNotes || '');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lamp)',
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Edit full original note
              </button>
            </div>
            <div className="lamplight-composer-prev-note">
              “{target.existingNotes}”
            </div>
          </div>
        )}

        {/* Step 3: Reflection Paper Textarea */}
        <div className="lamplight-composer-field">
          <label className="lamplight-composer-label">
            {kind === 'episode'
              ? `What stayed with you in Episode ${episodeNumber}?`
              : kind === 'why'
              ? 'Why did this character matter to you?'
              : kind === 'return'
              ? 'What changed or deepened upon returning?'
              : 'What idea or lesson stayed with you?'}
          </label>

          <Paper
            editable
            value={note}
            onChange={(val) => setNote(val)}
            placeholder="Record the philosophical insight, emotional memory, or takeaway that stayed after the credits…"
          />
        </div>

        {/* Step 4: Optional Rating */}
        <div className="lamplight-composer-field">
          <label className="lamplight-composer-label">Rating (Optional score 1–10)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Rating
              score={rating}
              interactive
              onChange={(newScore) => setRating(newScore)}
            />
            {rating && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--lamp)' }}>
                {rating}/10
              </span>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
};

