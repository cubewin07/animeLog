import React, { useEffect, useState, useRef } from 'react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
  RewatchTargetType,
} from '../types';
import { X, RotateCcw, Tv, Film, Layers, PlayCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { ImageUploadField } from './ImageUploadField';

interface RewatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSeries?: AnimeSeries | null;
  targetSeason?: AnimeSeason | null;
  targetMovie?: AnimeMovie | null;
  targetEpisodeNumber?: number | null;
  editRewatch?: Rewatch | null;
  seriesList?: AnimeSeries[];
  onSave: (
    data: {
      target_type: RewatchTargetType;
      target_id: number;
      episode_number?: number | null;
      episode_title?: string | null;
      start_date?: string | null;
      finish_date?: string | null;
      rating?: number | null;
      notes?: string | null;
    },
    rewatchId?: number
  ) => Promise<void>;
}

export const RewatchModal: React.FC<RewatchModalProps> = ({
  isOpen,
  onClose,
  targetSeries,
  targetSeason,
  targetMovie,
  targetEpisodeNumber,
  editRewatch,
  seriesList = [],
  onSave,
}) => {
  const [targetType, setTargetType] = useState<RewatchTargetType>('season');
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>(1);
  const [episodeTitle, setEpisodeTitle] = useState('');

  const [rating, setRating] = useState<number | null>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // All seasons and movies flattened for quick lookups
  const allSeasons = seriesList.flatMap((s) =>
    (s.seasons || []).map((sea) => ({
      id: sea.id,
      seriesId: s.id,
      seriesTitle: s.title,
      seasonNumber: sea.season_number,
      title: sea.title,
      totalEpisodes: sea.total_episodes,
      label: `${s.title} — Season ${sea.season_number}: ${sea.title}`,
    }))
  );

  const allMovies = seriesList.flatMap((s) =>
    (s.movies || []).map((m) => ({
      id: m.id,
      seriesId: s.id,
      seriesTitle: s.title,
      title: m.title,
      label: `${s.title} — Film: ${m.title}`,
    }))
  );

  const activeSeason = allSeasons.find((s) => s.id === selectedSeasonId);

  useEffect(() => {
    if (!isOpen) return;

    if (editRewatch) {
      const tType = editRewatch.target_type || (editRewatch.movie ? 'movie' : 'season');
      setTargetType(tType);

      if (tType === 'series') {
        setSelectedSeriesId(editRewatch.target_id);
      } else if (tType === 'season' || tType === 'episode') {
        setSelectedSeasonId(editRewatch.target_id);
        setEpisodeNumber(editRewatch.episode_number || 1);
        setEpisodeTitle(editRewatch.episode_title || '');
      } else if (tType === 'movie') {
        setSelectedMovieId(editRewatch.target_id);
      }

      setRating(editRewatch.rating || null);
      setStartDate(editRewatch.start_date || '');
      setFinishDate(editRewatch.finish_date || '');
      setNotes(editRewatch.notes || '');
    } else if (targetEpisodeNumber && targetSeason) {
      setTargetType('episode');
      setSelectedSeasonId(targetSeason.id);
      setEpisodeNumber(targetEpisodeNumber);
      setEpisodeTitle('');
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else if (targetMovie) {
      setTargetType('movie');
      setSelectedMovieId(targetMovie.id);
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else if (targetSeason) {
      setTargetType('season');
      setSelectedSeasonId(targetSeason.id);
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else if (targetSeries) {
      setTargetType('series');
      setSelectedSeriesId(targetSeries.id);
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    } else {
      if (seriesList.length > 0) {
        setSelectedSeriesId(seriesList[0].id);
      }
      if (allSeasons.length > 0) {
        setSelectedSeasonId(allSeasons[0].id);
      }
      if (allMovies.length > 0) {
        setSelectedMovieId(allMovies[0].id);
      }
      setEpisodeNumber(1);
      setEpisodeTitle('');
      setRating(10);
      setStartDate(new Date().toISOString().split('T')[0]);
      setFinishDate('');
      setNotes('');
    }
  }, [isOpen, targetSeries, targetSeason, targetMovie, targetEpisodeNumber, editRewatch, seriesList]);

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
    let targetId: number | null = null;
    let epNum: number | null = null;
    let epTitle: string | null = null;

    if (targetType === 'series') {
      targetId = selectedSeriesId;
    } else if (targetType === 'season') {
      targetId = selectedSeasonId;
    } else if (targetType === 'movie') {
      targetId = selectedMovieId;
    } else if (targetType === 'episode') {
      targetId = selectedSeasonId;
      epNum = typeof episodeNumber === 'number' && episodeNumber > 0 ? episodeNumber : 1;
      epTitle = episodeTitle.trim() || null;
    }

    if (!targetId) return;

    try {
      setSubmitting(true);
      await onSave(
        {
          target_type: targetType,
          target_id: targetId,
          episode_number: epNum,
          episode_title: epTitle,
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
      <div ref={modalRef} className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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
          {/* Target Type Selector */}
          {!editRewatch && !targetSeason && !targetMovie && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 8, fontWeight: 600 }}>
                What did you rewatch?
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  backgroundColor: 'var(--desk)',
                  padding: 4,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-desk-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTargetType('series')}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    fontSize: 12,
                    borderRadius: 4,
                    backgroundColor: targetType === 'series' ? 'var(--card-bg)' : 'transparent',
                    boxShadow: targetType === 'series' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: targetType === 'series' ? 600 : 400,
                  }}
                >
                  <Layers size={15} />
                  <span>Franchise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('season')}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    fontSize: 12,
                    borderRadius: 4,
                    backgroundColor: targetType === 'season' ? 'var(--card-bg)' : 'transparent',
                    boxShadow: targetType === 'season' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: targetType === 'season' ? 600 : 400,
                  }}
                >
                  <Tv size={15} />
                  <span>Season</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('movie')}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    fontSize: 12,
                    borderRadius: 4,
                    backgroundColor: targetType === 'movie' ? 'var(--card-bg)' : 'transparent',
                    boxShadow: targetType === 'movie' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: targetType === 'movie' ? 600 : 400,
                  }}
                >
                  <Film size={15} />
                  <span>Film</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('episode')}
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    fontSize: 12,
                    borderRadius: 4,
                    backgroundColor: targetType === 'episode' ? 'var(--card-bg)' : 'transparent',
                    boxShadow: targetType === 'episode' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: targetType === 'episode' ? 600 : 400,
                  }}
                >
                  <PlayCircle size={15} />
                  <span>Episode</span>
                </button>
              </div>
            </div>
          )}

          {/* Unified Single Target Dropdown */}
          {!editRewatch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {targetType === 'series' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                    Select Franchise
                  </label>
                  <select
                    value={selectedSeriesId || ''}
                    onChange={(e) => setSelectedSeriesId(Number(e.target.value))}
                    className="form-select"
                  >
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'season' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                    Select TV Season
                  </label>
                  <select
                    value={selectedSeasonId || ''}
                    onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                    className="form-select"
                    disabled={allSeasons.length === 0}
                  >
                    {seriesList.map((s) => {
                      const seasons = s.seasons || [];
                      if (seasons.length === 0) return null;
                      return (
                        <optgroup key={s.id} label={s.title}>
                          {seasons.map((sea) => (
                            <option key={sea.id} value={sea.id}>
                              Season {sea.season_number}: {sea.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              )}

              {targetType === 'movie' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                    Select Film
                  </label>
                  <select
                    value={selectedMovieId || ''}
                    onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                    className="form-select"
                    disabled={allMovies.length === 0}
                  >
                    {seriesList.map((s) => {
                      const movies = s.movies || [];
                      if (movies.length === 0) return null;
                      return (
                        <optgroup key={s.id} label={s.title}>
                          {movies.map((m) => (
                            <option key={m.id} value={m.id}>
                              Film: {m.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              )}

              {targetType === 'episode' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                      Select Season
                    </label>
                    <select
                      value={selectedSeasonId || ''}
                      onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                      className="form-select"
                      disabled={allSeasons.length === 0}
                    >
                      {seriesList.map((s) => {
                        const seasons = s.seasons || [];
                        if (seasons.length === 0) return null;
                        return (
                          <optgroup key={s.id} label={s.title}>
                            {seasons.map((sea) => (
                              <option key={sea.id} value={sea.id}>
                                Season {sea.season_number}: {sea.title}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4, fontWeight: 600 }}>
                        Episode #
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={activeSeason?.totalEpisodes || undefined}
                        value={episodeNumber}
                        onChange={(e) => setEpisodeNumber(e.target.value ? Number(e.target.value) : '')}
                        className="form-input mono"
                        placeholder="1"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-desk-muted)', marginBottom: 4 }}>
                        Episode Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={episodeTitle}
                        onChange={(e) => setEpisodeTitle(e.target.value)}
                        className="form-input"
                        placeholder="e.g. Frieren vs Draht"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Deepened Notes First */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-desk-muted)', marginBottom: 6, fontWeight: 600 }}>
              How did your perspective change? (Deepened Lessons & Memories)
            </label>
            <textarea
              rows={5}
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
