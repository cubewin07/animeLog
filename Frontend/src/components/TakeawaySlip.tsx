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
}) => {
  const hasText = text && text.trim().length > 0;
  const isCompleted = status === 'COMPLETED';

  return (
    <div
      className={`takeaway-slip ${isCompleted ? 'slip-completed' : ''} ${!hasText ? 'slip-empty' : ''} ${className}`}
      style={{
        padding: isDetail ? '24px 28px' : '16px 20px',
      }}
    >
      <div className="takeaway-slip-header">
        <div style={{ minWidth: 0 }}>
          <span className="takeaway-slip-label">{label}</span>
          {title && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isDetail ? 22 : 17,
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              <Star size={13} fill="currentColor" color="var(--ink)" />
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
            fontSize: isDetail ? '19px' : 'var(--type-lesson)',
            lineHeight: isDetail ? 1.7 : 1.6,
          }}
        >
          {text}
        </div>
      ) : (
        <div
          style={{
            padding: '12px 0 6px 0',
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
              fontSize: 15,
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}
          >
            No lesson captured yet. A title without notes is incomplete.
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
              aria-label="Write the lesson"
            >
              <PenLine size={13} />
              <span>Write the lesson</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
