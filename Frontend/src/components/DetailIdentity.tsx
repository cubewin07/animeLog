import React, { useState, useRef, useEffect } from 'react';
import { AnimeStatus, BookStatus } from '../types';
import { ProgressStepper } from './ProgressStepper';
import {
  Tv,
  BookOpen,
  PenLine,
  MoreVertical,
} from 'lucide-react';

export interface MoreMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DetailIdentityProps {
  type: 'anime' | 'book';
  title: string;
  coverUrl?: string | null;
  status: AnimeStatus | BookStatus;
  rating?: number | null;
  author?: string | null; // For books
  releaseLabel?: string; // e.g. "Season 1" or "Film" or "Book"

  // Progress
  progress: number;
  totalUnits?: number | null;
  unitLabel: string; // "eps" | "pages" | "mins"
  onProgressDelta?: (delta: number) => void;
  progressStep?: number;
  progressTone?: 'watching' | 'reading';
  ariaLabelPrefix?: string;

  // Actions
  onEditRelease: () => void;
  moreMenuItems?: MoreMenuItem[];
}

export const DetailIdentity: React.FC<DetailIdentityProps> = ({
  type,
  title,
  coverUrl,
  status,
  rating,
  author,
  releaseLabel,
  progress,
  totalUnits,
  unitLabel,
  onProgressDelta,
  progressStep = 1,
  progressTone = type === 'book' ? 'reading' : 'watching',
  ariaLabelPrefix,
  onEditRelease,
  moreMenuItems = [],
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreMenuOpen]);

  const getRatingBandClass = (score?: number | null) => {
    if (!score) return 'rating-band-empty';
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const statusLower = status.toLowerCase();
  const isWatchingOrReading = status === 'WATCHING' || status === 'READING';
  const isPlan = status === 'PLAN_TO_WATCH' || status === 'PLAN_TO_READ';
  const shouldShowProgressCount = !isPlan || progress > 0;


  return (
    <div className="detail-identity">
      {/* Modest Still Poster on Desk */}
      <div className={`detail-identity-poster poster-edge-${statusLower}`}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="detail-identity-poster-img"
            loading="eager"
          />
        ) : (
          <div className="detail-identity-poster-placeholder">
            {type === 'book' ? (
              <BookOpen size={28} color="var(--graphite)" />
            ) : (
              <Tv size={28} color="var(--graphite)" />
            )}
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {type === 'book' ? 'No cover' : 'No still'}
            </span>
          </div>
        )}
      </div>

      {/* Main Info Block */}
      <div className="detail-identity-body">
        {/* Title */}
        <h1 className="detail-identity-title">{title}</h1>

        {/* Book Author (if present) */}
        {type === 'book' && author && (
          <div className="detail-identity-author">by {author}</div>
        )}

        {/* Fact Line: format/release · status · score · progress */}
        <div className="detail-identity-facts">
          {releaseLabel && (
            <span className="detail-fact-release">{releaseLabel}</span>
          )}

          <span className={`status-indicator ${statusLower}`}>
            {status}
          </span>

          <span className="detail-fact-score">
            {rating ? (
              <span className={getRatingBandClass(rating)}>
                ★ {rating} <span style={{ color: 'var(--text-desk-muted)', fontSize: 12 }}>/10</span>
              </span>
            ) : (
              <span className="rating-band-empty">—</span>
            )}
          </span>

          {/* Progress: Stepper if active; Count if completed/progressed; Omitted if planned with 0 progress */}
          {isWatchingOrReading && onProgressDelta ? (
            <div className="detail-fact-stepper">
              <ProgressStepper
                current={progress}
                total={totalUnits}
                unit={unitLabel}
                step={progressStep}
                tone={progressTone}
                onDelta={onProgressDelta}
                ariaLabelPrefix={ariaLabelPrefix || title}
              />
            </div>
          ) : shouldShowProgressCount ? (
            <span className="detail-fact-progress-mono">
              {totalUnits ? `${progress > 0 && progress !== totalUnits ? `${progress} / ` : ''}${totalUnits} ${unitLabel}` : `${progress} ${unitLabel}`}
            </span>
          ) : null}
        </div>


        {/* Action Controls: Edit Release & More Menu */}
        <div className="detail-identity-actions">
          <button
            type="button"
            onClick={onEditRelease}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
            aria-label={type === 'book' ? 'Edit Book Details' : 'Edit Selected Release'}
          >
            <PenLine size={13} />
            <span>{type === 'book' ? 'Edit Book' : 'Edit Release'}</span>
          </button>

          {moreMenuItems.length > 0 && (
            <div className="more-menu-container" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="btn btn-ghost btn-sm"
                style={{
                  gap: 4,
                  border: '1px solid var(--border-desk-subtle)',
                  padding: '5px 8px',
                }}
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
                aria-label="More actions"
              >
                <MoreVertical size={14} />
                <span>More</span>
              </button>

              {moreMenuOpen && (
                <div className="more-menu-dropdown" role="menu">
                  {moreMenuItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        item.onClick();
                      }}
                      className={`more-menu-item ${item.danger ? 'danger' : ''}`}
                      role="menuitem"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
