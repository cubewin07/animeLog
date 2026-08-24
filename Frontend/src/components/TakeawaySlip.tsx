import React from 'react';
import { PenLine, Star } from 'lucide-react';

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
  emptyText = 'No lesson captured yet. A title without notes is incomplete.',
  emptyCtaText = 'Write the lesson',
}) => {
  const hasText = text && text.trim().length > 0;

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
    ? '24px 28px'
    : compact
    ? '12px 16px'
    : '16px 20px';

  return (
    <div
      className={`takeaway-slip ${getStatusClass()} ${!hasText ? 'slip-empty' : ''} ${className}`}
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
                fontSize: isDetail ? 22 : compact ? 15 : 17,
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
          {rating !== undefined && rating !== null && (
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
        <div
          className="takeaway-slip-text"
          style={{
            fontSize: isDetail ? '19px' : compact ? '14.5px' : 'var(--type-lesson)',
            lineHeight: isDetail ? 1.7 : 1.6,
          }}
        >
          {text}
        </div>
      ) : (
        <div
          style={{
            padding: compact ? '6px 0 2px 0' : '12px 0 6px 0',
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
            {emptyText}
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
              aria-label={emptyCtaText}
            >
              <PenLine size={13} />
              <span>{emptyCtaText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
