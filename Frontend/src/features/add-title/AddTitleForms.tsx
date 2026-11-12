import React, { useId, useState } from 'react';
import {
  Bookmark,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CirclePause,
  CircleSlash,
  Film,
  BookOpen,
  Minus,
  Play,
  Plus,
  Search,
} from 'lucide-react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  AnimeStatus,
  Book,
  BookStatus,
  Genre,
  Studio,
} from '../../types';
import { ExternalAnimeLookupResult, ExternalBookLookupResult } from '../../api/client';
import { ImageUploadField } from '../../components/ImageUploadField';
import { SmartMetadataSearch } from '../../components/SmartMetadataSearch';
import { KfButton, NotePaper } from '../../ui/keyframe';

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const QUICK_SEASONS = [1, 2, 3, 4, 5, 6] as const;

type StatusTone = 'active' | 'completed' | 'plan' | 'hold' | 'dropped';

interface StatusOption {
  value: string;
  label: string;
  tone: StatusTone;
  Icon: typeof Play;
}

const ANIME_STATUSES: StatusOption[] = [
  { value: 'WATCHING', label: 'Watching', tone: 'active', Icon: Play },
  { value: 'COMPLETED', label: 'Completed', tone: 'completed', Icon: CheckCircle2 },
  { value: 'PLAN_TO_WATCH', label: 'Plan to watch', tone: 'plan', Icon: Bookmark },
  { value: 'ON_HOLD', label: 'On hold', tone: 'hold', Icon: CirclePause },
  { value: 'DROPPED', label: 'Dropped', tone: 'dropped', Icon: CircleSlash },
];

const BOOK_STATUSES: StatusOption[] = [
  { value: 'READING', label: 'Reading', tone: 'active', Icon: Play },
  { value: 'COMPLETED', label: 'Completed', tone: 'completed', Icon: CheckCircle2 },
  { value: 'PLAN_TO_READ', label: 'Plan to read', tone: 'plan', Icon: Bookmark },
  { value: 'ON_HOLD', label: 'On hold', tone: 'hold', Icon: CirclePause },
  { value: 'DROPPED', label: 'Dropped', tone: 'dropped', Icon: CircleSlash },
];

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function toRoman(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result || String(num);
}

function matchByName<T extends { id: number; name: string }>(pool: T[], names: string[] | undefined): number[] {
  if (!names || names.length === 0) return [];
  const lower = new Set(names.map((n) => n.toLowerCase()));
  return pool.filter((item) => lower.has(item.name.toLowerCase())).map((item) => item.id);
}

const StatusPills: React.FC<{
  kind: 'anime' | 'book';
  value: string;
  onChange: (next: string) => void;
}> = ({ kind, value, onChange }) => {
  const options = kind === 'book' ? BOOK_STATUSES : ANIME_STATUSES;
  return (
    <div className="kf-field">
      <span className="kf-label">Status</span>
      <div className="kf-status-pills" role="group" aria-label="Status">
        {options.map(({ value: optVal, label, tone, Icon }) => {
          const active = value === optVal;
          return (
            <button
              key={optVal}
              type="button"
              className={`kf-status-pill tone-${tone} ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange(optVal)}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const RatingPills: React.FC<{
  value: number | null;
  onChange: (next: number | null) => void;
}> = ({ value, onChange }) => (
  <div className="kf-field">
    <div className="kf-label">
      <span>Rating (optional)</span>
      {value !== null && (
        <span className={`kf-rate-readout ${value >= 9 ? 'is-gold' : ''}`}>{value}/10</span>
      )}
    </div>
    <div className="kf-rating-row" role="group" aria-label="Rating 1 to 10">
      {RATINGS.map((n) => {
        const active = value === n;
        const isGold = n >= 9;
        return (
          <button
            key={n}
            type="button"
            className={`kf-rate-pill ${active ? 'is-active' : ''} ${isGold ? 'is-gold' : ''}`}
            aria-pressed={active}
            aria-label={`Rate ${n} out of 10`}
            onClick={() => onChange(active ? null : n)}
          >
            {n}
          </button>
        );
      })}
    </div>
  </div>
);

const ProgressField: React.FC<{
  current: number;
  total: number | '';
  onCurrentChange: (next: number) => void;
  onTotalChange: (next: number | '') => void;
  unitLabel: string;
  unitShort: string;
  allowPlusTen?: boolean;
}> = ({ current, total, onCurrentChange, onTotalChange, unitLabel, unitShort, allowPlusTen }) => {
  const totalNum = total === '' ? null : Number(total);
  const clampedCurrent = Math.max(0, current || 0);

  const setClamped = (val: number) => {
    const next = Math.max(0, val);
    onCurrentChange(totalNum !== null ? Math.min(totalNum, next) : next);
  };

  return (
    <div className="kf-field">
      <span className="kf-label">{unitLabel}</span>
      <div className="kf-progress-card">
        <div className="kf-progress-controls">
          <div className="kf-stepper">
            <button
              type="button"
              className="kf-stepper-btn"
              onClick={() => setClamped(clampedCurrent - 1)}
              disabled={clampedCurrent <= 0}
              aria-label={`Decrease ${unitShort}`}
            >
              <Minus size={14} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={clampedCurrent}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') return onCurrentChange(0);
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed)) setClamped(parsed);
              }}
              className="kf-stepper-input"
              aria-label={`Current ${unitLabel}`}
            />
            <button
              type="button"
              className="kf-stepper-btn"
              onClick={() => setClamped(clampedCurrent + 1)}
              disabled={totalNum !== null && clampedCurrent >= totalNum}
              aria-label={`Increase ${unitShort}`}
            >
              <Plus size={14} />
            </button>
          </div>

          <span className="kf-progress-of">of</span>

          <label className="kf-progress-total-wrap">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={total}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') return onTotalChange('');
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed) && parsed >= 1) {
                  onTotalChange(parsed);
                  if (clampedCurrent > parsed) onCurrentChange(parsed);
                }
              }}
              placeholder="Total"
              className="kf-progress-total-input"
              aria-label={`Total ${unitLabel}`}
            />
            <span className="kf-progress-unit">{unitShort}</span>
          </label>

          <div className="kf-progress-quick">
            <button
              type="button"
              className="kf-mini-btn"
              onClick={() => setClamped(clampedCurrent + 1)}
              disabled={totalNum !== null && clampedCurrent >= totalNum}
            >
              +1
            </button>
            {allowPlusTen && (
              <button
                type="button"
                className="kf-mini-btn"
                onClick={() => setClamped(clampedCurrent + 10)}
                disabled={totalNum !== null && clampedCurrent >= totalNum}
              >
                +10
              </button>
            )}
            {totalNum !== null && totalNum > 0 && clampedCurrent < totalNum && (
              <button
                type="button"
                className="kf-mini-btn"
                onClick={() => onCurrentChange(totalNum)}
              >
                <CheckCheck size={13} aria-hidden="true" />
                <span>All</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SeasonNumberField: React.FC<{
  value: number;
  onChange: (next: number) => void;
}> = ({ value, onChange }) => {
  const current = Math.max(1, value || 1);
  return (
    <div className="kf-field">
      <div className="kf-label">
        <span>Season number</span>
        <span className="kf-label-hint">Season {toRoman(current)}</span>
      </div>
      <div className="kf-season-row">
        <div className="kf-season-chips" role="radiogroup" aria-label="Quick season number">
          {QUICK_SEASONS.map((num) => {
            const active = current === num;
            return (
              <button
                key={num}
                type="button"
                role="radio"
                aria-checked={active}
                className={`kf-season-chip ${active ? 'is-active' : ''}`}
                onClick={() => onChange(num)}
              >
                S{num}
              </button>
            );
          })}
        </div>
        <div className="kf-stepper">
          <button
            type="button"
            className="kf-stepper-btn"
            onClick={() => onChange(Math.max(1, current - 1))}
            disabled={current <= 1}
            aria-label="Previous season number"
          >
            <Minus size={14} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={current}
            onChange={(e) => {
              const parsed = parseInt(e.target.value.trim(), 10);
              if (!isNaN(parsed) && parsed >= 1) onChange(Math.min(99, parsed));
            }}
            className="kf-stepper-input"
            aria-label="Season number"
          />
          <button
            type="button"
            className="kf-stepper-btn"
            onClick={() => onChange(Math.min(99, current + 1))}
            disabled={current >= 99}
            aria-label="Next season number"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TagChipSelector: React.FC<{
  label: string;
  items: Array<{ id: number; name: string }>;
  selectedIds: number[];
  onToggle: (id: number) => void;
}> = ({ label, items, selectedIds, onToggle }) => {
  if (items.length === 0) return null;
  return (
    <div className="kf-field">
      <span className="kf-label">{label}</span>
      <div className="kf-chip-grid">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`kf-chip ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onToggle(item.id)}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FormFooter: React.FC<{
  onClose: () => void;
  submitting: boolean;
  submitLabel: string;
  disableSubmit?: boolean;
}> = ({ onClose, submitting, submitLabel, disableSubmit }) => (
  <footer className="kf-dialog-footer">
    <div className="kf-dialog-footer-actions">
      <KfButton variant="quiet" onClick={onClose} disabled={submitting}>
        Cancel
      </KfButton>
      <KfButton type="submit" variant="primary" disabled={submitting || disableSubmit}>
        {submitting ? 'Saving…' : submitLabel}
      </KfButton>
    </div>
  </footer>
);

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// ---------------------------------------------------------------------------
// 1. SeriesCreateForm (Search-first fast flow < 15 seconds)
// ---------------------------------------------------------------------------
export interface SeriesCreateFormProps {
  genres: Genre[];
  studios: Studio[];
  onSaveSeries: (data: any) => Promise<void>;
  onClose: () => void;
}

export const SeriesCreateForm: React.FC<SeriesCreateFormProps> = ({
  genres,
  studios,
  onSaveSeries,
  onClose,
}) => {
  const titleId = useId();
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [matchedFromSearch, setMatchedFromSearch] = useState(false);

  const [title, setTitle] = useState('');
  const [japaneseTitle, setJapaneseTitle] = useState('');
  const [romajiTitle, setRomajiTitle] = useState('');
  const [seasonTitle, setSeasonTitle] = useState('Season 1');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [status, setStatus] = useState<AnimeStatus>('WATCHING');
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState<number | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(todayIso);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedStudioIds, setSelectedStudioIds] = useState<number[]>([]);
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [remotePreviewUrl, setRemotePreviewUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectAnime = (
    item: ExternalAnimeLookupResult,
    importedImage?: { id: number; url: string } | null
  ) => {
    setTitle(item.title);
    setJapaneseTitle(item.japanese_title || '');
    setRomajiTitle(item.romaji_title || '');
    if (item.total_episodes) setTotalCount(item.total_episodes);
    if (importedImage) {
      setCoverImageId(importedImage.id);
      setCoverImageUrl(importedImage.url);
      setRemotePreviewUrl(importedImage.url);
    } else {
      setRemotePreviewUrl(item.cover_url || null);
    }
    const matchedGenres = matchByName(genres, item.genres);
    if (matchedGenres.length > 0) setSelectedGenreIds(matchedGenres);
    const matchedStudios = matchByName(studios, item.studios);
    if (matchedStudios.length > 0) setSelectedStudioIds(matchedStudios);
    setMatchedFromSearch(true);
    setStep('details');
  };

  const handleStatusChange = (next: string) => {
    const nextStatus = next as AnimeStatus;
    setStatus(nextStatus);
    if (nextStatus === 'COMPLETED' && progress === 0 && totalCount !== '' && Number(totalCount) > 0) {
      setProgress(Number(totalCount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Series title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveSeries({
        title: title.trim(),
        japanese_title: japaneseTitle.trim() || null,
        romaji_title: romajiTitle.trim() || null,
        cover_image: coverImageId,
        genres: selectedGenreIds,
        initial_season: {
          title: seasonTitle.trim() || `Season ${seasonNumber}`,
          season_number: Number(seasonNumber) || 1,
          status,
          progress: Number(progress) || 0,
          total_episodes: totalCount !== '' ? Number(totalCount) : null,
          rating,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          studios: selectedStudioIds,
        },
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving anime series.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'search') {
    return (
      <div className="kf-dialog-form">
        <div className="kf-dialog-body is-search-step">
          <div className="kf-search-hero">
            <div>
              <h3 className="kf-search-hero-title">Find an anime</h3>
              <p className="kf-search-hero-hint">
                Search MyAnimeList to fill in title, cover art, genres, studios, and episode count.
              </p>
            </div>
            <SmartMetadataSearch type="anime" onSelectAnime={handleSelectAnime} />
            <div className="kf-manual-bar">
              <span className="kf-manual-hint">Offline or adding something custom?</span>
              <KfButton
                variant="secondary"
                onClick={() => {
                  setMatchedFromSearch(false);
                  setStep('details');
                }}
              >
                Or fill in manually
              </KfButton>
            </div>
          </div>
        </div>
        <footer className="kf-dialog-footer">
          <div className="kf-dialog-footer-actions">
            <KfButton variant="quiet" onClick={onClose}>
              Cancel
            </KfButton>
          </div>
        </footer>
      </div>
    );
  }

  const showRatingProminent = status === 'WATCHING' || status === 'COMPLETED' || rating !== null;
  const previewCover = coverImageUrl || remotePreviewUrl;

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Match preview or quick switch back to search */}
        <div className="kf-match-preview">
          <div className="kf-match-cover">
            {previewCover ? <img src={previewCover} alt="" /> : <Film size={20} aria-hidden="true" />}
          </div>
          <div className="kf-match-meta">
            <span className="kf-match-name">{title.trim() || 'New anime series'}</span>
            <span className="kf-match-sub">
              {matchedFromSearch
                ? [
                    japaneseTitle || romajiTitle,
                    totalCount ? `${totalCount} episodes` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Matched from MyAnimeList'
                : 'Manual entry'}
            </span>
          </div>
          <KfButton
            variant="quiet"
            icon={<Search size={14} />}
            onClick={() => setStep('search')}
          >
            Search again
          </KfButton>
        </div>

        <div className="kf-field">
          <label htmlFor={`${titleId}-title`} className="kf-label">
            <span>
              Series title <span className="kf-req">*</span>
            </span>
          </label>
          <input
            id={`${titleId}-title`}
            type="text"
            required
            autoFocus={!matchedFromSearch}
            placeholder="e.g. Frieren: Beyond Journey's End"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kf-input"
          />
        </div>

        <StatusPills kind="anime" value={status} onChange={handleStatusChange} />

        <ProgressField
          current={progress}
          total={totalCount}
          onCurrentChange={setProgress}
          onTotalChange={setTotalCount}
          unitLabel="Episodes"
          unitShort="eps"
        />

        {showRatingProminent && <RatingPills value={rating} onChange={setRating} />}

        <details className="kf-more-details">
          <summary className="kf-more-summary">
            <span>More details (season, note, genres, studios, dates, cover)</span>
            <ChevronDown size={16} className="kf-more-chevron" aria-hidden="true" />
          </summary>
          <div className="kf-more-body">
            {!showRatingProminent && <RatingPills value={rating} onChange={setRating} />}

            <SeasonNumberField value={seasonNumber} onChange={setSeasonNumber} />

            <div className="kf-field">
              <label htmlFor={`${titleId}-season-title`} className="kf-label">
                Season title
              </label>
              <input
                id={`${titleId}-season-title`}
                type="text"
                placeholder="Season 1"
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                className="kf-input"
              />
            </div>

            <div className="kf-grid-2">
              <div className="kf-field">
                <label htmlFor={`${titleId}-romaji`} className="kf-label">
                  Romaji name
                </label>
                <input
                  id={`${titleId}-romaji`}
                  type="text"
                  placeholder="e.g. Sousou no Frieren"
                  value={romajiTitle}
                  onChange={(e) => setRomajiTitle(e.target.value)}
                  className="kf-input"
                />
              </div>
              <div className="kf-field">
                <label htmlFor={`${titleId}-jp`} className="kf-label">
                  Japanese title
                </label>
                <input
                  id={`${titleId}-jp`}
                  type="text"
                  placeholder="e.g. 葬送のフリーレン"
                  value={japaneseTitle}
                  onChange={(e) => setJapaneseTitle(e.target.value)}
                  className="kf-input"
                />
              </div>
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
              <label htmlFor={`${titleId}-note`} className="kf-label">
                Season note
              </label>
              <NotePaper
                slate={[
                  title.trim() || 'New Anime',
                  `Season ${seasonNumber}`,
                  rating ? `${rating}/10` : '',
                ].filter(Boolean)}
              >
                <textarea
                  id={`${titleId}-note`}
                  rows={4}
                  placeholder="Write the thoughts, scenes, or ideas you want to remember…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="kf-paper-textarea"
                />
              </NotePaper>
            </div>

            <TagChipSelector
              label="Genres"
              items={genres}
              selectedIds={selectedGenreIds}
              onToggle={(id) => setSelectedGenreIds((prev) => toggleId(prev, id))}
            />

            <TagChipSelector
              label="Animation studios"
              items={studios}
              selectedIds={selectedStudioIds}
              onToggle={(id) => setSelectedStudioIds((prev) => toggleId(prev, id))}
            />

            <ImageUploadField
              label="Series cover"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
                if (url) setRemotePreviewUrl(url);
              }}
            />
          </div>
        </details>
      </div>

      <FormFooter onClose={onClose} submitting={submitting} submitLabel="Save Title" />
    </form>
  );
};

// ---------------------------------------------------------------------------
// 2. BookCreateForm (Search-first fast flow < 15 seconds)
// ---------------------------------------------------------------------------
export interface BookCreateFormProps {
  genres: Genre[];
  onSaveBook: (data: any) => Promise<void>;
  onClose: () => void;
}

export const BookCreateForm: React.FC<BookCreateFormProps> = ({
  genres,
  onSaveBook,
  onClose,
}) => {
  const titleId = useId();
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [matchedFromSearch, setMatchedFromSearch] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('READING');
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState<number | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(todayIso);
  const [finishDate, setFinishDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [remotePreviewUrl, setRemotePreviewUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectBook = (
    item: ExternalBookLookupResult,
    importedImage?: { id: number; url: string } | null
  ) => {
    setTitle(item.title);
    setAuthor(item.author || '');
    if (item.total_pages) setTotalCount(item.total_pages);
    if (importedImage) {
      setCoverImageId(importedImage.id);
      setCoverImageUrl(importedImage.url);
      setRemotePreviewUrl(importedImage.url);
    } else {
      setRemotePreviewUrl(item.cover_url || null);
    }
    const matchedGenres = matchByName(genres, item.genres);
    if (matchedGenres.length > 0) setSelectedGenreIds(matchedGenres);
    setMatchedFromSearch(true);
    setStep('details');
  };

  const handleStatusChange = (next: string) => {
    const nextStatus = next as BookStatus;
    setStatus(nextStatus);
    if (nextStatus === 'COMPLETED' && progress === 0 && totalCount !== '' && Number(totalCount) > 0) {
      setProgress(Number(totalCount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Book title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveBook({
        title: title.trim(),
        author: author.trim() || null,
        cover_image: coverImageId,
        status,
        rating,
        progress: Number(progress) || 0,
        total_pages: totalCount !== '' ? Number(totalCount) : null,
        start_date: startDate || null,
        finish_date: finishDate || null,
        notes: notes.trim() || null,
        genres: selectedGenreIds,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving book.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'search') {
    return (
      <div className="kf-dialog-form">
        <div className="kf-dialog-body is-search-step">
          <div className="kf-search-hero">
            <div>
              <h3 className="kf-search-hero-title">Find a book</h3>
              <p className="kf-search-hero-hint">
                Search OpenLibrary to fill in title, author, cover art, and page count.
              </p>
            </div>
            <SmartMetadataSearch type="book" onSelectBook={handleSelectBook} />
            <div className="kf-manual-bar">
              <span className="kf-manual-hint">Not finding it or offline?</span>
              <KfButton
                variant="secondary"
                onClick={() => {
                  setMatchedFromSearch(false);
                  setStep('details');
                }}
              >
                Or fill in manually
              </KfButton>
            </div>
          </div>
        </div>
        <footer className="kf-dialog-footer">
          <div className="kf-dialog-footer-actions">
            <KfButton variant="quiet" onClick={onClose}>
              Cancel
            </KfButton>
          </div>
        </footer>
      </div>
    );
  }

  const showRatingProminent = status === 'READING' || status === 'COMPLETED' || rating !== null;
  const previewCover = coverImageUrl || remotePreviewUrl;

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="kf-match-preview">
          <div className="kf-match-cover">
            {previewCover ? <img src={previewCover} alt="" /> : <BookOpen size={20} aria-hidden="true" />}
          </div>
          <div className="kf-match-meta">
            <span className="kf-match-name">{title.trim() || 'New book'}</span>
            <span className="kf-match-sub">
              {matchedFromSearch
                ? [author, totalCount ? `${totalCount} pages` : null].filter(Boolean).join(' · ') ||
                  'Matched from OpenLibrary'
                : 'Manual entry'}
            </span>
          </div>
          <KfButton
            variant="quiet"
            icon={<Search size={14} />}
            onClick={() => setStep('search')}
          >
            Search again
          </KfButton>
        </div>

        <div className="kf-grid-2">
          <div className="kf-field">
            <label htmlFor={`${titleId}-title`} className="kf-label">
              <span>
                Book title <span className="kf-req">*</span>
              </span>
            </label>
            <input
              id={`${titleId}-title`}
              type="text"
              required
              autoFocus={!matchedFromSearch}
              placeholder="e.g. Dune"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="kf-input"
            />
          </div>

          <div className="kf-field">
            <label htmlFor={`${titleId}-author`} className="kf-label">
              Author
            </label>
            <input
              id={`${titleId}-author`}
              type="text"
              placeholder="e.g. Frank Herbert"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="kf-input"
            />
          </div>
        </div>

        <StatusPills kind="book" value={status} onChange={handleStatusChange} />

        <ProgressField
          current={progress}
          total={totalCount}
          onCurrentChange={setProgress}
          onTotalChange={setTotalCount}
          unitLabel="Pages"
          unitShort="p"
          allowPlusTen
        />

        {showRatingProminent && <RatingPills value={rating} onChange={setRating} />}

        <details className="kf-more-details">
          <summary className="kf-more-summary">
            <span>More details (note, genres, dates, cover)</span>
            <ChevronDown size={16} className="kf-more-chevron" aria-hidden="true" />
          </summary>
          <div className="kf-more-body">
            {!showRatingProminent && <RatingPills value={rating} onChange={setRating} />}

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
              <label htmlFor={`${titleId}-note`} className="kf-label">
                Book note
              </label>
              <NotePaper
                slate={[title.trim() || 'New Book', author.trim(), rating ? `${rating}/10` : ''].filter(Boolean)}
              >
                <textarea
                  id={`${titleId}-note`}
                  rows={4}
                  placeholder="Write the thoughts, passages, or ideas you want to remember…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="kf-paper-textarea"
                />
              </NotePaper>
            </div>

            <TagChipSelector
              label="Genres"
              items={genres}
              selectedIds={selectedGenreIds}
              onToggle={(id) => setSelectedGenreIds((prev) => toggleId(prev, id))}
            />

            <ImageUploadField
              label="Book cover"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
                if (url) setRemotePreviewUrl(url);
              }}
            />
          </div>
        </details>
      </div>

      <FormFooter onClose={onClose} submitting={submitting} submitLabel="Save Title" />
    </form>
  );
};

// ---------------------------------------------------------------------------
// 3. SeasonForm (Add or Edit Season)
// ---------------------------------------------------------------------------
export interface SeasonFormProps {
  editSeason?: AnimeSeason | null;
  targetSeries?: AnimeSeries | null;
  seriesList: AnimeSeries[];
  studios: Studio[];
  onSaveSeason: (data: any, id?: number) => Promise<void>;
  onClose: () => void;
}

export const SeasonForm: React.FC<SeasonFormProps> = ({
  editSeason,
  targetSeries,
  seriesList,
  studios,
  onSaveSeason,
  onClose,
}) => {
  const titleId = useId();
  const isEditing = Boolean(editSeason);

  const [seriesId, setSeriesId] = useState<number>(
    editSeason?.series ?? targetSeries?.id ?? seriesList[0]?.id ?? 1
  );
  const [title, setTitle] = useState(editSeason?.title ?? '');
  const [seasonNumber, setSeasonNumber] = useState(editSeason?.season_number ?? 1);
  const [status, setStatus] = useState<string>(editSeason?.status ?? 'WATCHING');
  const [progress, setProgress] = useState<number>(editSeason?.progress ?? 0);
  const [totalCount, setTotalCount] = useState<number | ''>(editSeason?.total_episodes ?? '');
  const [rating, setRating] = useState<number | null>(editSeason?.rating ?? null);
  const [startDate, setStartDate] = useState(editSeason?.start_date ?? (isEditing ? '' : todayIso()));
  const [finishDate, setFinishDate] = useState(editSeason?.finish_date ?? '');
  const [notes, setNotes] = useState(editSeason?.notes ?? '');
  const [selectedStudioIds, setSelectedStudioIds] = useState<number[]>(
    editSeason?.studios ? editSeason.studios.map((s) => s.id) : []
  );
  const [coverImageId, setCoverImageId] = useState<number | null>(editSeason?.cover_image ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    editSeason?.cover_image_url || editSeason?.image_url || null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Season title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveSeason(
        {
          series: seriesId,
          title: title.trim(),
          season_number: Number(seasonNumber) || 1,
          cover_image: coverImageId,
          status,
          progress: Number(progress) || 0,
          total_episodes: totalCount !== '' ? Number(totalCount) : null,
          rating,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          studios: selectedStudioIds,
        },
        editSeason?.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving season.');
    } finally {
      setSubmitting(false);
    }
  };

  const seriesName = seriesList.find((s) => s.id === seriesId)?.title ?? 'Anime';

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        {!isEditing && (
          <SmartMetadataSearch
            type="anime"
            onSelectAnime={(item, importedImage) => {
              setTitle(item.title);
              if (item.total_episodes) setTotalCount(item.total_episodes);
              if (importedImage) {
                setCoverImageId(importedImage.id);
                setCoverImageUrl(importedImage.url);
              }
              const matchedStudios = matchByName(studios, item.studios);
              if (matchedStudios.length > 0) setSelectedStudioIds(matchedStudios);
            }}
          />
        )}

        {!isEditing && (
          <div className="kf-field">
            <label htmlFor={`${titleId}-series`} className="kf-label">
              <span>
                Series <span className="kf-req">*</span>
              </span>
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
        )}

        <div className="kf-field">
          <label htmlFor={`${titleId}-title`} className="kf-label">
            <span>
              Season title <span className="kf-req">*</span>
            </span>
          </label>
          <input
            id={`${titleId}-title`}
            type="text"
            required
            placeholder="e.g. Season 2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kf-input"
          />
        </div>

        <SeasonNumberField value={seasonNumber} onChange={setSeasonNumber} />

        <StatusPills kind="anime" value={status} onChange={setStatus} />

        <ProgressField
          current={progress}
          total={totalCount}
          onCurrentChange={setProgress}
          onTotalChange={setTotalCount}
          unitLabel="Episodes"
          unitShort="eps"
        />

        <RatingPills value={rating} onChange={setRating} />

        <div className="kf-field">
          <label htmlFor={`${titleId}-note`} className="kf-label">
            Season note
          </label>
          <NotePaper
            slate={[seriesName, `Season ${seasonNumber}`, rating ? `${rating}/10` : ''].filter(Boolean)}
          >
            <textarea
              id={`${titleId}-note`}
              rows={5}
              placeholder="Write the thoughts, scenes, or ideas you want to remember…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="kf-paper-textarea"
            />
          </NotePaper>
        </div>

        <details className="kf-more-details" open={isEditing}>
          <summary className="kf-more-summary">
            <span>More details (dates, studios, cover)</span>
            <ChevronDown size={16} className="kf-more-chevron" aria-hidden="true" />
          </summary>
          <div className="kf-more-body">
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

            <TagChipSelector
              label="Animation studios"
              items={studios}
              selectedIds={selectedStudioIds}
              onToggle={(id) => setSelectedStudioIds((prev) => toggleId(prev, id))}
            />

            <ImageUploadField
              label="Season poster"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
              }}
            />
          </div>
        </details>
      </div>

      <FormFooter
        onClose={onClose}
        submitting={submitting}
        submitLabel={isEditing ? 'Save Changes' : 'Add Season'}
      />
    </form>
  );
};

// ---------------------------------------------------------------------------
// 4. MovieForm (Add or Edit Movie)
// ---------------------------------------------------------------------------
export interface MovieFormProps {
  editMovie?: AnimeMovie | null;
  targetSeries?: AnimeSeries | null;
  seriesList: AnimeSeries[];
  studios: Studio[];
  onSaveMovie: (data: any, id?: number) => Promise<void>;
  onClose: () => void;
}

export const MovieForm: React.FC<MovieFormProps> = ({
  editMovie,
  targetSeries,
  seriesList,
  studios,
  onSaveMovie,
  onClose,
}) => {
  const titleId = useId();
  const isEditing = Boolean(editMovie);

  const [seriesId, setSeriesId] = useState<number>(
    editMovie?.series ?? targetSeries?.id ?? seriesList[0]?.id ?? 1
  );
  const [title, setTitle] = useState(editMovie?.title ?? '');
  const [status, setStatus] = useState<string>(editMovie?.status ?? 'WATCHING');
  const [progress, setProgress] = useState<number>(editMovie?.progress_minutes ?? 0);
  const [totalCount, setTotalCount] = useState<number | ''>(editMovie?.total_minutes ?? '');
  const [rating, setRating] = useState<number | null>(editMovie?.rating ?? null);
  const [startDate, setStartDate] = useState(editMovie?.start_date ?? (isEditing ? '' : todayIso()));
  const [finishDate, setFinishDate] = useState(editMovie?.finish_date ?? '');
  const [notes, setNotes] = useState(editMovie?.notes ?? '');
  const [selectedStudioIds, setSelectedStudioIds] = useState<number[]>(
    editMovie?.studios ? editMovie.studios.map((s) => s.id) : []
  );
  const [coverImageId, setCoverImageId] = useState<number | null>(editMovie?.cover_image ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    editMovie?.cover_image_url || editMovie?.image_url || null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Movie title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveMovie(
        {
          series: seriesId,
          title: title.trim(),
          cover_image: coverImageId,
          status,
          progress_minutes: Number(progress) || 0,
          total_minutes: totalCount !== '' ? Number(totalCount) : null,
          rating,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          studios: selectedStudioIds,
        },
        editMovie?.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving movie.');
    } finally {
      setSubmitting(false);
    }
  };

  const seriesName = seriesList.find((s) => s.id === seriesId)?.title ?? 'Movie';

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        {!isEditing && (
          <SmartMetadataSearch
            type="anime"
            onSelectAnime={(item, importedImage) => {
              setTitle(item.title);
              if (item.total_minutes) setTotalCount(item.total_minutes);
              if (importedImage) {
                setCoverImageId(importedImage.id);
                setCoverImageUrl(importedImage.url);
              }
              const matchedStudios = matchByName(studios, item.studios);
              if (matchedStudios.length > 0) setSelectedStudioIds(matchedStudios);
            }}
          />
        )}

        {!isEditing && (
          <div className="kf-field">
            <label htmlFor={`${titleId}-series`} className="kf-label">
              <span>
                Series <span className="kf-req">*</span>
              </span>
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
        )}

        <div className="kf-field">
          <label htmlFor={`${titleId}-title`} className="kf-label">
            <span>
              Movie title <span className="kf-req">*</span>
            </span>
          </label>
          <input
            id={`${titleId}-title`}
            type="text"
            required
            placeholder="e.g. Mugen Train"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kf-input"
          />
        </div>

        <StatusPills kind="anime" value={status} onChange={setStatus} />

        <ProgressField
          current={progress}
          total={totalCount}
          onCurrentChange={setProgress}
          onTotalChange={setTotalCount}
          unitLabel="Runtime (minutes)"
          unitShort="min"
        />

        <RatingPills value={rating} onChange={setRating} />

        <div className="kf-field">
          <label htmlFor={`${titleId}-note`} className="kf-label">
            Movie note
          </label>
          <NotePaper
            slate={[seriesName, title.trim() || 'Movie', rating ? `${rating}/10` : ''].filter(Boolean)}
          >
            <textarea
              id={`${titleId}-note`}
              rows={5}
              placeholder="Write the thoughts, scenes, or ideas you want to remember…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="kf-paper-textarea"
            />
          </NotePaper>
        </div>

        <details className="kf-more-details" open={isEditing}>
          <summary className="kf-more-summary">
            <span>More details (dates, studios, cover)</span>
            <ChevronDown size={16} className="kf-more-chevron" aria-hidden="true" />
          </summary>
          <div className="kf-more-body">
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

            <TagChipSelector
              label="Animation studios"
              items={studios}
              selectedIds={selectedStudioIds}
              onToggle={(id) => setSelectedStudioIds((prev) => toggleId(prev, id))}
            />

            <ImageUploadField
              label="Movie poster"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
              }}
            />
          </div>
        </details>
      </div>

      <FormFooter
        onClose={onClose}
        submitting={submitting}
        submitLabel={isEditing ? 'Save Changes' : 'Add Movie'}
      />
    </form>
  );
};

// ---------------------------------------------------------------------------
// 5. SeriesEditForm (Edit Series Metadata)
// ---------------------------------------------------------------------------
export interface SeriesEditFormProps {
  series: AnimeSeries;
  genres: Genre[];
  onSaveSeries: (data: any, id?: number) => Promise<void>;
  onClose: () => void;
}

export const SeriesEditForm: React.FC<SeriesEditFormProps> = ({
  series,
  genres,
  onSaveSeries,
  onClose,
}) => {
  const titleId = useId();
  const [title, setTitle] = useState(series.title || '');
  const [romajiTitle, setRomajiTitle] = useState(series.romaji_title || '');
  const [japaneseTitle, setJapaneseTitle] = useState(series.japanese_title || '');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(
    series.genres ? series.genres.map((g) => g.id) : []
  );
  const [coverImageId, setCoverImageId] = useState<number | null>(series.cover_image ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    series.cover_image_url || series.image_url || null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Series title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveSeries(
        {
          title: title.trim(),
          japanese_title: japaneseTitle.trim() || null,
          romaji_title: romajiTitle.trim() || null,
          cover_image: coverImageId,
          genres: selectedGenreIds,
        },
        series.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating series.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="kf-field">
          <label htmlFor={`${titleId}-title`} className="kf-label">
            <span>
              Series title <span className="kf-req">*</span>
            </span>
          </label>
          <input
            id={`${titleId}-title`}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kf-input"
          />
        </div>

        <div className="kf-grid-2">
          <div className="kf-field">
            <label htmlFor={`${titleId}-romaji`} className="kf-label">
              Romaji name
            </label>
            <input
              id={`${titleId}-romaji`}
              type="text"
              placeholder="e.g. Kimetsu no Yaiba"
              value={romajiTitle}
              onChange={(e) => setRomajiTitle(e.target.value)}
              className="kf-input"
            />
          </div>
          <div className="kf-field">
            <label htmlFor={`${titleId}-jp`} className="kf-label">
              Japanese title
            </label>
            <input
              id={`${titleId}-jp`}
              type="text"
              placeholder="e.g. 鬼滅の刃"
              value={japaneseTitle}
              onChange={(e) => setJapaneseTitle(e.target.value)}
              className="kf-input"
            />
          </div>
        </div>

        <TagChipSelector
          label="Genres"
          items={genres}
          selectedIds={selectedGenreIds}
          onToggle={(id) => setSelectedGenreIds((prev) => toggleId(prev, id))}
        />

        <ImageUploadField
          label="Series cover"
          imageId={coverImageId}
          imageUrl={coverImageUrl}
          onChange={(id, url) => {
            setCoverImageId(id);
            setCoverImageUrl(url);
          }}
        />
      </div>

      <FormFooter onClose={onClose} submitting={submitting} submitLabel="Save Changes" />
    </form>
  );
};

// ---------------------------------------------------------------------------
// 6. BookEditForm (Edit Book)
// ---------------------------------------------------------------------------
export interface BookEditFormProps {
  book: Book;
  genres: Genre[];
  onSaveBook: (data: any, id?: number) => Promise<void>;
  onClose: () => void;
}

export const BookEditForm: React.FC<BookEditFormProps> = ({
  book,
  genres,
  onSaveBook,
  onClose,
}) => {
  const titleId = useId();
  const [title, setTitle] = useState(book.title || '');
  const [author, setAuthor] = useState(book.author || '');
  const [status, setStatus] = useState<string>(book.status || 'READING');
  const [progress, setProgress] = useState<number>(book.progress || 0);
  const [totalCount, setTotalCount] = useState<number | ''>(book.total_pages ?? '');
  const [rating, setRating] = useState<number | null>(book.rating ?? null);
  const [startDate, setStartDate] = useState(book.start_date || '');
  const [finishDate, setFinishDate] = useState(book.finish_date || '');
  const [notes, setNotes] = useState(book.notes || '');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(
    book.genres ? book.genres.map((g) => g.id) : []
  );
  const [coverImageId, setCoverImageId] = useState<number | null>(book.cover_image ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    book.cover_image_url || book.image_url || null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Book title is required.');
      return;
    }
    try {
      setSubmitting(true);
      await onSaveBook(
        {
          title: title.trim(),
          author: author.trim() || null,
          cover_image: coverImageId,
          status: status as BookStatus,
          rating,
          progress: Number(progress) || 0,
          total_pages: totalCount !== '' ? Number(totalCount) : null,
          start_date: startDate || null,
          finish_date: finishDate || null,
          notes: notes.trim() || null,
          genres: selectedGenreIds,
        },
        book.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating book.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kf-dialog-form">
      <div className="kf-dialog-body">
        {errorMsg && (
          <div className="kf-form-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="kf-grid-2">
          <div className="kf-field">
            <label htmlFor={`${titleId}-title`} className="kf-label">
              <span>
                Book title <span className="kf-req">*</span>
              </span>
            </label>
            <input
              id={`${titleId}-title`}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="kf-input"
            />
          </div>

          <div className="kf-field">
            <label htmlFor={`${titleId}-author`} className="kf-label">
              Author
            </label>
            <input
              id={`${titleId}-author`}
              type="text"
              placeholder="e.g. Frank Herbert"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="kf-input"
            />
          </div>
        </div>

        <StatusPills kind="book" value={status} onChange={setStatus} />

        <ProgressField
          current={progress}
          total={totalCount}
          onCurrentChange={setProgress}
          onTotalChange={setTotalCount}
          unitLabel="Pages"
          unitShort="p"
          allowPlusTen
        />

        <RatingPills value={rating} onChange={setRating} />

        <div className="kf-field">
          <label htmlFor={`${titleId}-note`} className="kf-label">
            Book note
          </label>
          <NotePaper
            slate={[title.trim() || 'Book', author.trim(), rating ? `${rating}/10` : ''].filter(Boolean)}
          >
            <textarea
              id={`${titleId}-note`}
              rows={5}
              placeholder="Write the thoughts, passages, or ideas you want to remember…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="kf-paper-textarea"
            />
          </NotePaper>
        </div>

        <details className="kf-more-details" open>
          <summary className="kf-more-summary">
            <span>More details (dates, genres, cover)</span>
            <ChevronDown size={16} className="kf-more-chevron" aria-hidden="true" />
          </summary>
          <div className="kf-more-body">
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

            <TagChipSelector
              label="Genres"
              items={genres}
              selectedIds={selectedGenreIds}
              onToggle={(id) => setSelectedGenreIds((prev) => toggleId(prev, id))}
            />

            <ImageUploadField
              label="Book cover"
              imageId={coverImageId}
              imageUrl={coverImageUrl}
              onChange={(id, url) => {
                setCoverImageId(id);
                setCoverImageUrl(url);
              }}
            />
          </div>
        </details>
      </div>

      <FormFooter onClose={onClose} submitting={submitting} submitLabel="Save Changes" />
    </form>
  );
};
