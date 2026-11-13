import React, { useId, useRef, useState } from 'react';
import { Film, Layers, Minus, PlayCircle, Plus, RotateCcw, Sparkles, Tv, X } from 'lucide-react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  FavoriteCharacter,
  Rewatch,
  RewatchTargetType,
} from '../types';
import { useDialog } from '../ui/Sheet/useDialog';
import { localToday } from '../lib/journal/progress';
import { KfButton, NotePaper } from '../ui/keyframe';
import { ImageUploadField } from './ImageUploadField';
import { SmartMetadataSearch } from './SmartMetadataSearch';
import '../features/add-title/AddTitle.css';

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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

const RewatchModalInner: React.FC<
  Omit<RewatchModalProps, 'isOpen'> & { titleId: string }
> = ({
  onClose,
  targetSeries,
  targetSeason,
  targetMovie,
  targetEpisodeNumber,
  editRewatch,
  seriesList = [],
  onSave,
  titleId,
}) => {
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
      label: `${s.title} — Movie: ${m.title}`,
    }))
  );

  const initialType: RewatchTargetType = editRewatch
    ? editRewatch.target_type || (editRewatch.movie ? 'movie' : 'season')
    : targetEpisodeNumber && targetSeason
    ? 'episode'
    : targetMovie
    ? 'movie'
    : targetSeason
    ? 'season'
    : targetSeries
    ? 'series'
    : 'season';

  const [targetType, setTargetType] = useState<RewatchTargetType>(initialType);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(() => {
    if (editRewatch && initialType === 'series') return editRewatch.target_id;
    if (targetSeries) return targetSeries.id;
    return seriesList[0]?.id ?? null;
  });
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(() => {
    if (editRewatch && (initialType === 'season' || initialType === 'episode')) {
      return editRewatch.target_id;
    }
    if (targetSeason) return targetSeason.id;
    return allSeasons[0]?.id ?? null;
  });
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(() => {
    if (editRewatch && initialType === 'movie') return editRewatch.target_id;
    if (targetMovie) return targetMovie.id;
    return allMovies[0]?.id ?? null;
  });
  const [episodeNumber, setEpisodeNumber] = useState<number>(() => {
    if (editRewatch) return editRewatch.episode_number || 1;
    if (targetEpisodeNumber) return targetEpisodeNumber;
    return 1;
  });
  const [episodeTitle, setEpisodeTitle] = useState(editRewatch?.episode_title || '');
  const [rating, setRating] = useState<number | null>(
    editRewatch ? editRewatch.rating || null : 10
  );
  const [startDate, setStartDate] = useState(editRewatch ? editRewatch.start_date || '' : localToday());
  const [finishDate, setFinishDate] = useState(editRewatch ? editRewatch.finish_date || '' : '');
  const [notes, setNotes] = useState(editRewatch?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeSeason = allSeasons.find((s) => s.id === selectedSeasonId);

  const slateLabel = (() => {
    if (editRewatch) {
      return editRewatch.release_title || editRewatch.series_title || 'Rewatch';
    }
    if (targetType === 'series') {
      return seriesList.find((s) => s.id === selectedSeriesId)?.title || 'Series';
    }
    if (targetType === 'movie') {
      return allMovies.find((m) => m.id === selectedMovieId)?.title || 'Movie';
    }
    if (targetType === 'episode') {
      return activeSeason ? `${activeSeason.seriesTitle} · Ep ${episodeNumber}` : `Ep ${episodeNumber}`;
    }
    return activeSeason ? `${activeSeason.seriesTitle} · S${activeSeason.seasonNumber}` : 'Season';
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
      epNum = episodeNumber > 0 ? episodeNumber : 1;
      epTitle = episodeTitle.trim() || null;
    }

    if (!targetId) {
      setErrorMsg('Please select what you rewatched.');
      return;
    }

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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save rewatch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="kf-dialog-header">
        <div className="kf-dialog-header-main">
          <div className="kf-dialog-badge" aria-hidden="true">
            <RotateCcw size={18} />
          </div>
          <div className="kf-dialog-title-wrap">
            <h2 id={titleId} className="kf-dialog-title">
              {editRewatch ? 'Edit Rewatch' : 'Log Rewatch'}
            </h2>
            <p className="kf-dialog-subtitle">Record another pass and how your view evolved</p>
          </div>
        </div>
        <button type="button" className="kf-dialog-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="kf-dialog-form">
        <div className="kf-dialog-body">
          {errorMsg && (
            <div className="kf-form-error" role="alert">
              {errorMsg}
            </div>
          )}

          {!editRewatch && !targetSeason && !targetMovie && (
            <div className="kf-field">
              <span className="kf-label">What did you rewatch?</span>
              <div className="kf-segmented-4" role="group" aria-label="Rewatch target type">
                <button
                  type="button"
                  className={`kf-seg-btn ${targetType === 'series' ? 'is-active' : ''}`}
                  aria-pressed={targetType === 'series'}
                  onClick={() => setTargetType('series')}
                >
                  <Layers size={15} aria-hidden="true" />
                  <span>Series</span>
                </button>
                <button
                  type="button"
                  className={`kf-seg-btn ${targetType === 'season' ? 'is-active' : ''}`}
                  aria-pressed={targetType === 'season'}
                  onClick={() => setTargetType('season')}
                >
                  <Tv size={15} aria-hidden="true" />
                  <span>Season</span>
                </button>
                <button
                  type="button"
                  className={`kf-seg-btn ${targetType === 'movie' ? 'is-active' : ''}`}
                  aria-pressed={targetType === 'movie'}
                  onClick={() => setTargetType('movie')}
                >
                  <Film size={15} aria-hidden="true" />
                  <span>Movie</span>
                </button>
                <button
                  type="button"
                  className={`kf-seg-btn ${targetType === 'episode' ? 'is-active' : ''}`}
                  aria-pressed={targetType === 'episode'}
                  onClick={() => setTargetType('episode')}
                >
                  <PlayCircle size={15} aria-hidden="true" />
                  <span>Episode</span>
                </button>
              </div>
            </div>
          )}

          {!editRewatch && (
            <>
              {targetType === 'series' && (
                <div className="kf-field">
                  <label htmlFor={`${titleId}-series`} className="kf-label">
                    Series
                  </label>
                  <select
                    id={`${titleId}-series`}
                    value={selectedSeriesId ?? ''}
                    onChange={(e) => setSelectedSeriesId(Number(e.target.value))}
                    className="kf-select"
                  >
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(targetType === 'season' || targetType === 'episode') && (
                <div className="kf-field">
                  <label htmlFor={`${titleId}-season`} className="kf-label">
                    Season
                  </label>
                  <select
                    id={`${titleId}-season`}
                    value={selectedSeasonId ?? ''}
                    onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                    disabled={allSeasons.length === 0}
                    className="kf-select"
                  >
                    {allSeasons.length === 0 ? (
                      <option value="">No seasons available</option>
                    ) : (
                      seriesList
                        .filter((s) => (s.seasons?.length ?? 0) > 0)
                        .map((s) => (
                          <optgroup key={s.id} label={s.title}>
                            {(s.seasons || []).map((sea) => (
                              <option key={sea.id} value={sea.id}>
                                Season {sea.season_number}: {sea.title}
                              </option>
                            ))}
                          </optgroup>
                        ))
                    )}
                  </select>
                </div>
              )}

              {targetType === 'movie' && (
                <div className="kf-field">
                  <label htmlFor={`${titleId}-movie`} className="kf-label">
                    Movie
                  </label>
                  <select
                    id={`${titleId}-movie`}
                    value={selectedMovieId ?? ''}
                    onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                    disabled={allMovies.length === 0}
                    className="kf-select"
                  >
                    {allMovies.length === 0 ? (
                      <option value="">No movies available</option>
                    ) : (
                      seriesList
                        .filter((s) => (s.movies?.length ?? 0) > 0)
                        .map((s) => (
                          <optgroup key={s.id} label={s.title}>
                            {(s.movies || []).map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title}
                              </option>
                            ))}
                          </optgroup>
                        ))
                    )}
                  </select>
                </div>
              )}

              {targetType === 'episode' && (
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
                            const max = activeSeason?.totalEpisodes ?? undefined;
                            setEpisodeNumber(max ? Math.min(max, parsed) : parsed);
                          }
                        }}
                        className="kf-stepper-input"
                        aria-label="Episode number"
                      />
                      <button
                        type="button"
                        className="kf-stepper-btn"
                        onClick={() =>
                          setEpisodeNumber((n) => {
                            const max = activeSeason?.totalEpisodes ?? undefined;
                            return max ? Math.min(max, n + 1) : n + 1;
                          })
                        }
                        disabled={Boolean(
                          activeSeason?.totalEpisodes && episodeNumber >= activeSeason.totalEpisodes
                        )}
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
                      value={episodeTitle}
                      onChange={(e) => setEpisodeTitle(e.target.value)}
                      className="kf-input"
                      placeholder="e.g. Frieren vs Draht"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="kf-field">
            <label htmlFor={`${titleId}-note`} className="kf-label">
              Rewatch note
            </label>
            <NotePaper slate={[slateLabel, rating ? `${rating}/10` : ''].filter(Boolean)}>
              <textarea
                id={`${titleId}-note`}
                rows={4}
                placeholder="What new details did you notice on this rewatch? How did your thoughts change?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="kf-paper-textarea"
              />
            </NotePaper>
          </div>

          <div className="kf-grid-2">
            <div className="kf-field">
              <label htmlFor={`${titleId}-start`} className="kf-label">
                Start date
              </label>
              <input
                id={`${titleId}-start`}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="kf-input"
              />
            </div>
            <div className="kf-field">
              <label htmlFor={`${titleId}-finish`} className="kf-label">
                Finish date
              </label>
              <input
                id={`${titleId}-finish`}
                type="date"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
                className="kf-input"
              />
            </div>
          </div>

          <div className="kf-field">
            <div className="kf-label">
              <span>Rewatch rating (1–10)</span>
              {rating !== null && (
                <span className={`kf-rate-readout ${rating >= 9 ? 'is-gold' : ''}`}>
                  {rating}/10
                </span>
              )}
            </div>
            <div className="kf-rating-row" role="group" aria-label="Rewatch rating 1 to 10">
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
        </div>

        <footer className="kf-dialog-footer">
          <div className="kf-dialog-footer-actions">
            <KfButton variant="quiet" onClick={onClose} disabled={submitting}>
              Cancel
            </KfButton>
            <KfButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editRewatch ? 'Update Rewatch' : 'Log Rewatch'}
            </KfButton>
          </div>
        </footer>
      </form>
    </>
  );
};

export const RewatchModal: React.FC<RewatchModalProps> = ({ isOpen, onClose, ...rest }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  const instanceKey = `${rest.editRewatch?.id ?? 'new'}-${rest.targetSeries?.id ?? 's'}-${
    rest.targetSeason?.id ?? 'sea'
  }-${rest.targetMovie?.id ?? 'mov'}-${rest.targetEpisodeNumber ?? 'ep'}`;

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
        className="kf-dialog-panel is-compact"
      >
        <RewatchModalInner key={instanceKey} titleId={titleId} onClose={onClose} {...rest} />
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
  onSave: (
    data: {
      series: number;
      name: string;
      why?: string | null;
      cover_image?: number | null;
      images?: number[];
    },
    characterId?: number
  ) => Promise<void>;
}

const CharacterModalInner: React.FC<
  Omit<CharacterModalProps, 'isOpen'> & { titleId: string }
> = ({ onClose, seriesList, preselectedSeries, editCharacter, onSave, titleId }) => {
  const [seriesId, setSeriesId] = useState<number>(
    editCharacter ? editCharacter.series : preselectedSeries ? preselectedSeries.id : seriesList[0]?.id || 1
  );
  const [name, setName] = useState(editCharacter?.name ?? '');
  const [why, setWhy] = useState(editCharacter?.why ?? '');
  const initialImageId = editCharacter
    ? editCharacter.cover_image ??
      (editCharacter.images && editCharacter.images.length > 0 ? editCharacter.images[0].id : null)
    : null;
  const [imageId, setImageId] = useState<number | null>(initialImageId);
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (!editCharacter) return null;
    return (
      editCharacter.cover_image_url ||
      editCharacter.image_url ||
      (editCharacter.images && editCharacter.images.length > 0 ? editCharacter.images[0].url : null)
    );
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedSeriesTitle = seriesList.find((s) => s.id === seriesId)?.title ?? 'Series';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Character name is required.');
      return;
    }
    try {
      setSubmitting(true);
      const existingImageIds = (editCharacter?.images ?? []).map((img) => img.id);
      const nextImageIds =
        imageId !== null
          ? Array.from(new Set([...existingImageIds, imageId]))
          : initialImageId !== null
            ? existingImageIds.filter((id) => id !== initialImageId)
            : existingImageIds;
      await onSave(
        {
          series: seriesId,
          name: name.trim(),
          why: why.trim() || null,
          cover_image: imageId,
          images: nextImageIds,
        },
        editCharacter?.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save character.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="kf-dialog-header">
        <div className="kf-dialog-header-main">
          <div className="kf-dialog-badge" aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <div className="kf-dialog-title-wrap">
            <h2 id={titleId} className="kf-dialog-title">
              {editCharacter ? `Edit: ${editCharacter.name}` : 'Add Character'}
            </h2>
            <p className="kf-dialog-subtitle">Collect a character and remember why they mattered</p>
          </div>
        </div>
        <button type="button" className="kf-dialog-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="kf-dialog-form">
        <div className="kf-dialog-body">
          {errorMsg && (
            <div className="kf-form-error" role="alert">
              {errorMsg}
            </div>
          )}

          {!editCharacter && (
            <SmartMetadataSearch
              type="character"
              onSelectCharacter={(char, importedImage) => {
                setName(char.name);
                if (char.about && !why) {
                  setWhy(char.about.slice(0, 240));
                }
                if (importedImage) {
                  setImageId(importedImage.id);
                  setImageUrl(importedImage.url);
                }
              }}
            />
          )}

          <div className="kf-field">
            <label htmlFor={`${titleId}-series`} className="kf-label">
              Series
            </label>
            <select
              id={`${titleId}-series`}
              value={seriesId}
              onChange={(e) => setSeriesId(Number(e.target.value))}
              className="kf-select"
            >
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="kf-field">
            <label htmlFor={`${titleId}-name`} className="kf-label">
              <span>
                Character name <span className="kf-req">*</span>
              </span>
            </label>
            <input
              id={`${titleId}-name`}
              type="text"
              required
              placeholder="e.g. Himmel, Erwin Smith, Kurisu Makise..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="kf-input"
            />
          </div>

          <div className="kf-field">
            <label htmlFor={`${titleId}-why`} className="kf-label">
              Character note
            </label>
            <NotePaper slate={[selectedSeriesTitle, name.trim() || 'Character'].filter(Boolean)}>
              <textarea
                id={`${titleId}-why`}
                rows={5}
                placeholder="What moments or choices made this character memorable to you?"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                className="kf-paper-textarea"
              />
            </NotePaper>
          </div>

          <ImageUploadField
            label="Character portrait"
            imageId={imageId}
            imageUrl={imageUrl}
            onChange={(id, url) => {
              setImageId(id);
              setImageUrl(url);
            }}
          />
        </div>

        <footer className="kf-dialog-footer">
          <div className="kf-dialog-footer-actions">
            <KfButton variant="quiet" onClick={onClose} disabled={submitting}>
              Cancel
            </KfButton>
            <KfButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : editCharacter ? 'Save Changes' : 'Save Character'}
            </KfButton>
          </div>
        </footer>
      </form>
    </>
  );
};

export const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, ...rest }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  const instanceKey = `${rest.editCharacter?.id ?? 'new'}-${rest.preselectedSeries?.id ?? 'none'}`;

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
        className="kf-dialog-panel is-compact"
      >
        <CharacterModalInner key={instanceKey} titleId={titleId} onClose={onClose} {...rest} />
      </div>
    </div>
  );
};
