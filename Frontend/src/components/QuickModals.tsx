import React, { useEffect, useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, FavoriteCharacter, Rewatch } from '../types';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { ImageUploadField } from './ImageUploadField';

interface RewatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSeason?: AnimeSeason | null;
  targetMovie?: AnimeMovie | null;
  editRewatch?: Rewatch | null;
  seriesList?: AnimeSeries[];
  onSave: (data: {
    season?: number | null;
    movie?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    rating?: number | null;
    notes?: string | null;
  }, rewatchId?: number) => Promise<void>;
}

export const RewatchModal: React.FC<RewatchModalProps> = ({
  isOpen,
  onClose,
  targetSeason,
  targetMovie,
  editRewatch,
  seriesList = [],
  onSave,
}) => {
  const [selectedTargetType, setSelectedTargetType] = useState<'season' | 'movie'>(
    targetMovie || editRewatch?.movie ? 'movie' : 'season'
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(
    targetSeason ? targetSeason.id : editRewatch?.season || null
  );
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(
    targetMovie ? targetMovie.id : editRewatch?.movie || null
  );

  const [rating, setRating] = useState<number | null>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const allSeasons: { id: number; label: string }[] = [];
  const allMovies: { id: number; label: string }[] = [];
  seriesList.forEach((s) => {
    s.seasons?.forEach((sea) => {
      allSeasons.push({ id: sea.id, label: `${s.title} — Season ${sea.season_number}: ${sea.title}` });
    });
    s.movies?.forEach((m) => {
      allMovies.push({ id: m.id, label: `${s.title} — Film: ${m.title}` });
    });
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editRewatch) {
      setSelectedTargetType(editRewatch.movie ? 'movie' : 'season');
      setSelectedSeasonId(editRewatch.season || null);
      setSelectedMovieId(editRewatch.movie || null);
      setRating(editRewatch.rating || null);
      setStartDate(editRewatch.start_date || '');
      setFinishDate(editRewatch.finish_date || '');
      setNotes(editRewatch.notes || '');
    } else if (targetSeason) {
      setSelectedTargetType('season');
      setSelectedSeasonId(targetSeason.id);
      setSelectedMovieId(null);
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else if (targetMovie) {
      setSelectedTargetType('movie');
      setSelectedMovieId(targetMovie.id);
      setSelectedSeasonId(null);
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else {
      if (allSeasons.length > 0) {
        setSelectedTargetType('season');
        setSelectedSeasonId(allSeasons[0].id);
        setSelectedMovieId(null);
      } else if (allMovies.length > 0) {
        setSelectedTargetType('movie');
        setSelectedMovieId(allMovies[0].id);
        setSelectedSeasonId(null);
      }
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    }
  }, [isOpen, targetSeason, targetMovie, editRewatch]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (selectedTargetType === 'season' && selectedSeasonId === null) ||
      (selectedTargetType === 'movie' && selectedMovieId === null)
    ) {
      return;
    }
    try {
      setSubmitting(true);
      await onSave(
        {
          season: selectedTargetType === 'season' ? selectedSeasonId : null,
          movie: selectedTargetType === 'movie' ? selectedMovieId : null,
          start_date: startDate || null,
          finish_date: finishDate || null,
          rating,
          notes: notes.trim() || null,
        },
        editRewatch?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
                backgroundColor: 'var(--desk-surface)',
                color: 'var(--text-desk)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={18} />
            </div>
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>
              {editRewatch ? 'Edit Rewatch Reflection' : 'Log Rewatch Pass'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target selector if neither is preselected */}
          {!targetSeason && !targetMovie && !editRewatch && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
                Select Anime Release
              </label>
              <select
                value={
                  selectedTargetType === 'season'
                    ? `season:${selectedSeasonId ?? ''}`
                    : `movie:${selectedMovieId ?? ''}`
                }
                onChange={(e) => {
                  const [targetType, id] = e.target.value.split(':');
                  const targetId = Number(id);
                  if (targetType === 'season') {
                    setSelectedTargetType('season');
                    setSelectedSeasonId(targetId);
                    setSelectedMovieId(null);
                  } else {
                    setSelectedTargetType('movie');
                    setSelectedMovieId(targetId);
                    setSelectedSeasonId(null);
                  }
                }}
                className="form-select"
                disabled={allSeasons.length === 0 && allMovies.length === 0}
              >
                {allSeasons.length > 0 && (
                  <optgroup label="TV Seasons">
                    {allSeasons.map((season) => (
                      <option key={season.id} value={`season:${season.id}`}>
                        {season.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {allMovies.length > 0 && (
                  <optgroup label="Films">
                    {allMovies.map((movie) => (
                      <option key={movie.id} value={`movie:${movie.id}`}>
                        {movie.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Deepened Notes First (Prominent, 16px font) */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              How did your perspective change? (Deepened Lessons)
            </label>
            <textarea
              rows={6}
              placeholder="What new details did you notice on this rewatch? How did your thoughts or emotions evolve compared to your first pass?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
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
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
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

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
              Rewatch Rating
            </label>
            <select
              value={rating || ''}
              onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
              className="form-select mono"
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  ★ {n} / 10
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {editRewatch ? 'Update Reflection' : 'Record Rewatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesList: AnimeSeries[];
  preselectedSeries?: AnimeSeries | null;
  editCharacter?: FavoriteCharacter | null;
  onSave: (data: { series: number; name: string; why?: string | null; images?: number[] }, characterId?: number) => Promise<void>;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  seriesList,
  preselectedSeries,
  editCharacter,
  onSave,
}) => {
  const [seriesId, setSeriesId] = useState<number>(
    editCharacter ? editCharacter.series : preselectedSeries ? preselectedSeries.id : seriesList[0]?.id || 1
  );
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [imageId, setImageId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editCharacter) {
      setSeriesId(editCharacter.series);
      setName(editCharacter.name);
      setWhy(editCharacter.why || '');
      const firstImg = editCharacter.images && editCharacter.images.length > 0 ? editCharacter.images[0] : null;
      setImageId(firstImg ? firstImg.id : null);
      setImageUrl(firstImg ? (firstImg as any).image_url || (firstImg as any).url : null);
    } else {
      setSeriesId(preselectedSeries ? preselectedSeries.id : seriesList[0]?.id || 1);
      setName('');
      setWhy('');
      setImageId(null);
      setImageUrl(null);
    }
  }, [isOpen, preselectedSeries, seriesList, editCharacter]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onSave(
        {
          series: seriesId,
          name: name.trim(),
          why: why.trim() || null,
          images: imageId ? [imageId] : [],
        },
        editCharacter?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
                backgroundColor: 'var(--desk-surface)',
                color: 'var(--text-desk)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>
              {editCharacter ? `Edit: ${editCharacter.name}` : 'Remember a Character'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              Associated Franchise
            </label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(Number(e.target.value))}
              className="form-select"
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              Character Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Himmel, Erwin Smith, Kurisu Makise..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Why Worth Remembering (Prominent, 16px font) */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              Why is this character worth remembering? (Lesson / Ideal)
            </label>
            <textarea
              rows={6}
              placeholder="What actions, philosophies, or moments made them unforgettable to you?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
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

          <ImageUploadField
            label="Character Portrait / Avatar"
            imageId={imageId}
            imageUrl={imageUrl}
            onChange={(id, url) => {
              setImageId(id);
              setImageUrl(url);
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {editCharacter ? 'Save Changes' : 'Save Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
