import React, { useState } from 'react';
import { PenLine, Star, ChevronDown, ChevronUp } from 'lucide-react';

interface TakeawaySlipProps {
  text?: string | null;
  label?: string;
  title?: string;
  subTitle?: string;
  rating?: number | null;
  status?: string;
  onWrite?: () => void;
  className?: string;
  isDetail?: boolean;
  compact?: boolean;
  clamped?: boolean;
  onToggleClamp?: () => void;
  emptyText?: string;
  emptyCtaText?: string;
}

export const TakeawaySlip: React.FC<TakeawaySlipProps> = ({
  text,
  label = 'Takeaway',
  title,
  subTitle,
  rating,
  status,
  onWrite,
  className = '',
  isDetail = false,
  compact = false,
  clamped = false,
  onToggleClamp,
  emptyText,
  emptyCtaText,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const hasText = Boolean(text && text.trim().length > 0);

  const defaultEmptyText = isDetail
    ? 'No lesson captured yet.'
    : 'No lesson captured yet. A title without notes is incomplete.';

  const defaultEmptyCtaText = isDetail
    ? 'Write the lesson'
    : 'Write the lesson';

  const resolvedEmptyText = emptyText ?? defaultEmptyText;
  const resolvedEmptyCtaText = emptyCtaText ?? defaultEmptyCtaText;

  const isLessonSheet = isDetail || className.includes('lesson-sheet');

  const getStatusClass = () => {
    if (!status) return 'slip-ballpoint';
    const s = status.toLowerCase();
    if (s === 'watching') return 'slip-watching';
    if (s === 'reading') return 'slip-reading';
    if (s === 'completed') return 'slip-completed';
    if (s === 'plan_to_watch' || s === 'plan_to_read') return 'slip-plan';
    if (s === 'on_hold') return 'slip-hold';
    if (s === 'dropped') return 'slip-dropped';
    return 'slip-ballpoint';
  };

  const getRatingBandClass = (score: number) => {
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const paddingStyle = isDetail
    ? '22px 26px'
    : compact
    ? '12px 16px'
    : '16px 20px';

  // Handle clamping state: if onToggleClamp is provided, parent controls it via `clamped`.
  // Otherwise, use internalExpanded if clamped was initially true.
  const isCurrentlyClamped = onToggleClamp ? clamped : (clamped && !internalExpanded);

  const handleToggle = () => {
    if (onToggleClamp) {
      onToggleClamp();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <div
      className={`takeaway-slip ${getStatusClass()} ${!hasText ? 'slip-empty' : ''} ${isLessonSheet ? 'lesson-sheet' : ''} ${className}`}
      style={{
        padding: paddingStyle,
      }}
    >
      <div className="takeaway-slip-header">
        <div style={{ minWidth: 0 }}>
          <span className="takeaway-slip-label">{label}</span>
          {title && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isDetail ? 20 : compact ? 15 : 17,
                fontWeight: 600,
                color: 'var(--ink)',
                lineHeight: 1.3,
                marginTop: 2,
              }}
            >
              {title}
            </div>
          )}
          {subTitle && (
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--ink-muted)',
                marginTop: 2,
              }}
            >
              {subTitle}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Show rating if provided and not on detail lesson sheet */}
          {!isLessonSheet && rating !== undefined && rating !== null && (
            <div
              className={getRatingBandClass(rating)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Star size={13} fill="currentColor" />
              <span>{rating}/10</span>
            </div>
          )}
          {onWrite && hasText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWrite();
              }}
              className="btn btn-paper"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                fontSize: 12,
              }}
              aria-label={`Edit ${label}`}
            >
              <PenLine size={12} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {hasText ? (
        <div className="takeaway-slip-content">
          <div
            className={`takeaway-slip-text ${isCurrentlyClamped ? 'lesson-sheet-clamped' : ''}`}
            style={{
              fontSize: isLessonSheet ? '17px' : isDetail ? '18px' : compact ? '14.5px' : 'var(--type-lesson)',
              lineHeight: isLessonSheet ? 1.65 : isDetail ? 1.7 : 1.6,
            }}
          >
            {text}
          </div>

          {/* Clamp Toggle for long lessons */}
          {clamped !== undefined && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={handleToggle}
                className="lesson-clamp-toggle-btn"
                aria-expanded={!isCurrentlyClamped}
              >
                {isCurrentlyClamped ? (
                  <>
                    <span>Read full lesson</span>
                    <ChevronDown size={13} />
                  </>
                ) : (
                  <>
                    <span>Show less</span>
                    <ChevronUp size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: compact ? '6px 0 2px 0' : '10px 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: compact ? 14 : 15,
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}
          >
            {resolvedEmptyText}
          </span>
          {onWrite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWrite();
              }}
              className="btn btn-paper"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              aria-label={resolvedEmptyCtaText}
            >
              <PenLine size={13} />
              <span>{resolvedEmptyCtaText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
