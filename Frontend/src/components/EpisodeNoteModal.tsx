import React, { useId, useRef, useState } from 'react';
import { BookmarkCheck, Minus, Plus, Trash2, X } from 'lucide-react';
import { AnimeSeason, EpisodeNote } from '../types';
import { useDialog } from '../ui/Sheet/useDialog';
import { KfButton, NotePaper } from '../ui/keyframe';
import { ImageUploadField } from './ImageUploadField';
import '../features/add-title/AddTitle.css';

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface EpisodeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  season: AnimeSeason | null;
  initialNote?: EpisodeNote | null;
  onSaveNote: (
    data: {
      season: number;
      episode_number: number;
      episode_title?: string | null;
      cover_image?: number | null;
      note: string;
      rating?: number | null;
    },
    noteId?: number
  ) => Promise<void>;
  onDeleteNote?: (noteId: number) => Promise<void>;
}

function findNextEpisodeNumber(season: AnimeSeason): number {
  const existingEps = (season.episode_notes || []).map((n) => n.episode_number);
  let nextEp = 1;
  while (
    existingEps.includes(nextEp) &&
    (!season.total_episodes || nextEp <= season.total_episodes)
  ) {
    nextEp++;
  }
  return nextEp;
}

const EpisodeNoteForm: React.FC<{
  season: AnimeSeason;
  selectedNote: EpisodeNote | null;
  onSelectNote: (note: EpisodeNote | null) => void;
  onSaveNote: EpisodeNoteModalProps['onSaveNote'];
  onDeleteNote?: EpisodeNoteModalProps['onDeleteNote'];
  onClose: () => void;
  titleId: string;
}> = ({
  season,
  selectedNote,
  onSelectNote,
  onSaveNote,
  onDeleteNote,
  onClose,
  titleId,
}) => {
  const [episodeNumber, setEpisodeNumber] = useState<number>(() =>
    selectedNote ? selectedNote.episode_number : findNextEpisodeNumber(season)
  );
  const [episodeTitle, setEpisodeTitle] = useState<string>(
    selectedNote?.episode_title || ''
  );
  const [coverImageId, setCoverImageId] = useState<number | null>(
    selectedNote?.cover_image ?? null
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    selectedNote?.cover_image_url || selectedNote?.image_url || null
  );
  const [rating, setRating] = useState<number | null>(
    selectedNote ? selectedNote.rating ?? null : 10
  );
  const [note, setNote] = useState<string>(selectedNote?.note ?? '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!note.trim()) {
      setErrorMsg('Please write your note for this episode.');
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
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save episode note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!onDeleteNote) return;
    setErrorMsg('');
    try {
      setSubmitting(true);
      await onDeleteNote(noteId);
      if (selectedNote?.id === noteId) {
        onSelectNote(null);
      }
    } catch {
      setErrorMsg('Failed to delete episode note.');
    } finally {
      setSubmitting(false);
    }
  };

  const maxEp = season.total_episodes ?? undefined;

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="kf-grid-ep">
          <div className="kf-field">
            <span className="kf-label">Episode #</span>
            <div className="kf-stepper">
              <button
                type="button"
                className="kf-stepper-btn"
                onClick={() => setEpisodeNumber((n) => Math.max(1, n - 1))}
                disabled={episodeNumber <= 1}
                aria-label="Decrease episode number"
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={episodeNumber}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value.trim(), 10);
                  if (!isNaN(parsed) && parsed >= 1) {
                    setEpisodeNumber(maxEp ? Math.min(maxEp, parsed) : parsed);
                  }
                }}
                className="kf-stepper-input"
                aria-label="Episode number"
              />
              <button
                type="button"
                className="kf-stepper-btn"
                onClick={() =>
                  setEpisodeNumber((n) => (maxEp ? Math.min(maxEp, n + 1) : n + 1))
                }
                disabled={Boolean(maxEp && episodeNumber >= maxEp)}
                aria-label="Increase episode number"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="kf-field">
            <label htmlFor={`${titleId}-ep-title`} className="kf-label">
              Episode title (optional)
            </label>
            <input
              id={`${titleId}-ep-title`}
              type="text"
              placeholder="e.g. The End of the Journey"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
              className="kf-input"
            />
          </div>
        </div>

        <div className="kf-field">
          <label htmlFor={`${titleId}-note`} className="kf-label">
            <span>
              Episode note <span className="kf-req">*</span>
            </span>
          </label>
          <NotePaper
            slate={[
              `Season ${season.season_number}`,
              `Ep ${episodeNumber}`,
              rating ? `${rating}/10` : '',
            ].filter(Boolean)}
          >
            <textarea
              id={`${titleId}-note`}
              rows={5}
              required
              placeholder="What happened in this episode that you want to remember?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="kf-paper-textarea"
            />
          </NotePaper>
        </div>

        <div className="kf-field">
          <div className="kf-label">
            <span>Rating (1–10)</span>
            {rating !== null && (
              <span className={`kf-rate-readout ${rating >= 9 ? 'is-gold' : ''}`}>
                {rating}/10
              </span>
            )}
          </div>
          <div className="kf-rating-row" role="group" aria-label="Episode rating 1 to 10">
            {RATINGS.map((n) => {
              const active = rating === n;
              const isGold = n >= 9;
              return (
                <button
                  key={n}
                  type="button"
                  className={`kf-rate-pill ${active ? 'is-active' : ''} ${
                    isGold ? 'is-gold' : ''
                  }`}
                  aria-pressed={active}
                  aria-label={`Rate ${n} out of 10`}
                  onClick={() => setRating(active ? null : n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <ImageUploadField
          label="Episode still / screenshot"
          imageId={coverImageId}
          imageUrl={coverImageUrl}
          onChange={(id, url) => {
            setCoverImageId(id);
            setCoverImageUrl(url);
          }}
        />
      </div>

      <footer className="kf-dialog-footer">
        {selectedNote && onDeleteNote && (
          <KfButton
            variant="danger"
            icon={<Trash2 size={15} />}
            onClick={() => handleDelete(selectedNote.id)}
            disabled={submitting}
            aria-label="Delete this note"
          >
            Delete
          </KfButton>
        )}
        <div className="kf-dialog-footer-actions">
          <KfButton variant="quiet" onClick={onClose} disabled={submitting}>
            Cancel
          </KfButton>
          <KfButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving…' : selectedNote ? 'Update Note' : 'Save Note'}
          </KfButton>
        </div>
      </footer>
    </form>
  );
};

const EpisodeNoteModalInner: React.FC<{
  season: AnimeSeason;
  initialNote?: EpisodeNote | null;
  onSaveNote: EpisodeNoteModalProps['onSaveNote'];
  onDeleteNote?: EpisodeNoteModalProps['onDeleteNote'];
  onClose: () => void;
  titleId: string;
}> = ({ season, initialNote, onSaveNote, onDeleteNote, onClose, titleId }) => {
  const validInitial =
    initialNote && initialNote.season === season.id ? initialNote : null;
  const [selectedNote, setSelectedNote] = useState<EpisodeNote | null>(validInitial);
  const notesList = season.episode_notes || [];

  return (
    <>
      <header className="kf-dialog-header">
        <div className="kf-dialog-header-main">
          <div className="kf-dialog-badge" aria-hidden="true">
            <BookmarkCheck size={18} />
          </div>
          <div className="kf-dialog-title-wrap">
            <h2 id={titleId} className="kf-dialog-title">
              Episode Notes
            </h2>
            <p className="kf-dialog-subtitle">
              Season {season.season_number}: {season.title}
            </p>
          </div>
        </div>
        <button type="button" className="kf-dialog-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </header>

      {notesList.length > 0 && (
        <div className="kf-ep-pills" role="tablist" aria-label="Episode notes in this season">
          <button
            type="button"
            role="tab"
            aria-selected={selectedNote === null}
            className={`kf-chip ${selectedNote === null ? 'is-selected' : ''}`}
            onClick={() => setSelectedNote(null)}
          >
            + New Episode Note
          </button>
          {notesList.map((ep) => {
            const isSelected = selectedNote?.id === ep.id;
            const isGold = Boolean(ep.rating && ep.rating >= 9);
            return (
              <button
                key={ep.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`kf-chip ${isSelected ? 'is-selected' : ''} ${
                  isGold ? 'is-gold' : ''
                }`}
                onClick={() => setSelectedNote(ep)}
              >
                Ep {ep.episode_number}
                {ep.rating ? ` ★${ep.rating}` : ''}
              </button>
            );
          })}
        </div>
      )}

      <EpisodeNoteForm
        key={`${season.id}-${selectedNote?.id ?? 'new'}`}
        season={season}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        onSaveNote={onSaveNote}
        onDeleteNote={onDeleteNote}
        onClose={onClose}
        titleId={titleId}
      />
    </>
  );
};

export const EpisodeNoteModal: React.FC<EpisodeNoteModalProps> = ({
  isOpen,
  onClose,
  season,
  initialNote,
  onSaveNote,
  onDeleteNote,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  if (!isOpen || !season) return null;

  const instanceKey = `${season.id}-${initialNote?.id ?? 'new'}`;

  return (
    <div
      className="kf-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="kf-dialog-panel"
      >
        <EpisodeNoteModalInner
          key={instanceKey}
          season={season}
          initialNote={initialNote}
          onSaveNote={onSaveNote}
          onDeleteNote={onDeleteNote}
          onClose={onClose}
          titleId={titleId}
        />
      </div>
    </div>
  );
};
