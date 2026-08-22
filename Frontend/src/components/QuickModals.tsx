import React, { useEffect, useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, FavoriteCharacter, Rewatch } from '../types';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface RewatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSeason?: AnimeSeason | null;
  targetMovie?: AnimeMovie | null;
  seriesList?: AnimeSeries[];
  onSave: (data: {
    season?: number | null;
    movie?: number | null;
    start_date?: string | null;
    finish_date?: string | null;
    rating?: number | null;
    notes?: string | null;
  }) => Promise<void>;
}

export const RewatchModal: React.FC<RewatchModalProps> = ({
  isOpen,
  onClose,
  targetSeason,
  targetMovie,
  seriesList = [],
  onSave,
}) => {
  const [selectedTargetType, setSelectedTargetType] = useState<'season' | 'movie'>(
    targetMovie ? 'movie' : 'season'
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(
    targetSeason ? targetSeason.id : null
  );
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(
    targetMovie ? targetMovie.id : null
  );

  const [rating, setRating] = useState<number | null>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Flatten all seasons and movies from series list for selection if not preselected
  const allSeasons: { id: number; label: string }[] = [];
  const allMovies: { id: number; label: string }[] = [];
  seriesList.forEach((s) => {
    s.seasons.forEach((sea) => {
      allSeasons.push({ id: sea.id, label: `${s.title} — Season ${sea.season_number}: ${sea.title}` });
    });
    s.movies.forEach((m) => {
      allMovies.push({ id: m.id, label: `${s.title} — Film: ${m.title}` });
    });
  });

  useEffect(() => {
    if (!isOpen) return;
    if (targetSeason) {
      setSelectedTargetType('season');
      setSelectedSeasonId(targetSeason.id);
      setSelectedMovieId(null);
    } else if (targetMovie) {
      setSelectedTargetType('movie');
      setSelectedMovieId(targetMovie.id);
      setSelectedSeasonId(null);
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
    }

    setRating(10);
    setStartDate(new Date().toISOString().split('T')[0]);
    setFinishDate('');
    setNotes('');
  }, [isOpen, targetSeason, targetMovie]);

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

  const targetTitle = targetSeason
    ? targetSeason.title
    : targetMovie
    ? targetMovie.title
    : 'Anime Release';

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
      await onSave({
        season: selectedTargetType === 'season' ? selectedSeasonId : null,
        movie: selectedTargetType === 'movie' ? selectedMovieId : null,
        start_date: startDate || null,
        finish_date: finishDate || null,
        rating,
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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
            <RotateCcw size={18} color="var(--color-secondary)" />
            <h3 style={{ fontSize: '16px', color: '#ffffff' }}>
              Log Rewatch {targetSeason || targetMovie ? `for "${targetTitle}"` : ''}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Target selector if neither is preselected */}
          {!targetSeason && !targetMovie && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Select Release
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Rewatch Rating
            </label>
            <select
              value={rating || ''}
              onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
              className="form-select"
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  ★ {n} / 10
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              How did your perspective change? (Deepened Takeaways)
            </label>
            <textarea
              rows={3}
              placeholder="What new details did you notice on this pass? How did your reflections deepen?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Record Rewatch
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
  onSave: (data: { series: number; name: string; why?: string | null }) => Promise<void>;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  seriesList,
  preselectedSeries,
  onSave,
}) => {
  const [seriesId, setSeriesId] = useState<number>(
    preselectedSeries ? preselectedSeries.id : seriesList[0]?.id || 1
  );
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSeriesId(preselectedSeries ? preselectedSeries.id : seriesList[0]?.id || 1);
    setName('');
    setWhy('');
  }, [isOpen, preselectedSeries, seriesList]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onSave({
        series: seriesId,
        name: name.trim(),
        why: why.trim() || null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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
            <Sparkles size={18} color="var(--color-accent-emerald)" />
            <h3 style={{ fontSize: '16px', color: '#ffffff' }}>Remember a Character</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Character Name <span style={{ color: '#fb7185' }}>*</span>
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Why is this character worth remembering? (Lesson / Ideal)
            </label>
            <textarea
              rows={3}
              placeholder="What actions, philosophies, or moments made them unforgettable?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Save Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
