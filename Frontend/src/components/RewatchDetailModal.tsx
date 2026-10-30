import React, { useRef, useEffect } from 'react';
import { Rewatch } from '../types';
import {
  X,
  PenLine,
  Trash2,
  ArrowUpRight,
  RotateCcw,
  Star,
  Layers,
  Tv,
  Film,
  PlayCircle,
  Calendar,
  Quote,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { formatModalDates, targetType } from '../views/rewatchSpine';

interface RewatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewatch: Rewatch | null;
  passNumber?: number;
  onEdit?: (rewatch: Rewatch) => void;
  onDelete?: (id: number) => void;
  onNavigateSeries?: (seriesId: number) => void;
}

export const RewatchDetailModal: React.FC<RewatchDetailModalProps> = ({
  isOpen,
  onClose,
  rewatch,
  passNumber,
  onEdit,
  onDelete,
  onNavigateSeries,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.96, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !rewatch) return null;

  const tType = targetType(rewatch);
  const seriesId = rewatch.series_id || (tType === 'series' ? rewatch.target_id : null);
  const hasNotes = Boolean(rewatch.notes && rewatch.notes.trim().length > 0);

  const getTargetIcon = () => {
    if (tType === 'series') return <Layers size={14} />;
    if (tType === 'movie') return <Film size={14} />;
    if (tType === 'episode') return <PlayCircle size={14} />;
    return <Tv size={14} />;
  };

  const getTargetTypeName = () => {
    if (tType === 'series') return 'Franchise';
    if (tType === 'movie') return 'Film';
    if (tType === 'episode') {
      return rewatch.episode_number ? `Episode ${rewatch.episode_number}` : 'Episode';
    }
    return 'TV Season';
  };

  const getTargetBadgeColorClass = () => {
    if (tType === 'series') return 'rewatch-chip-series';
    if (tType === 'movie') return 'rewatch-chip-movie';
    if (tType === 'episode') return 'rewatch-chip-episode';
    return 'rewatch-chip-season';
  };

  const getRatingBandClass = (score: number) => {
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  const mainHeading =
    tType === 'movie'
      ? rewatch.release_title || rewatch.series_title || 'Film Rewatch'
      : rewatch.series_title || rewatch.release_title || 'Rewatch Entry';

  const subHeading =
    tType === 'movie'
      ? rewatch.series_title && rewatch.series_title !== mainHeading
        ? rewatch.series_title
        : null
      : rewatch.release_title && rewatch.release_title !== mainHeading
      ? rewatch.release_title
      : null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewatch-detail-title"
      style={{ zIndex: 1000 }}
    >
      <div
        ref={modalRef}
        className="modal-container rewatch-detail-modal-container"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--desk-surface)',
                color: 'var(--tungsten)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={15} />
            </div>
            <h3 style={{ fontSize: 16, color: 'var(--text-desk)', margin: 0, fontWeight: 600 }}>
              Return note
            </h3>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Identity & Scope Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className={`rewatch-type-badge ${getTargetBadgeColorClass()}`}>
                {getTargetIcon()}
                <span>{getTargetTypeName()}</span>
              </span>

              {passNumber && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--tungsten)',
                    backgroundColor: 'var(--tungsten-dim)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(201, 149, 74, 0.3)',
                  }}
                >
                  Pass {passNumber}
                </span>
              )}
            </div>

            <div>
              <h2
                id="rewatch-detail-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'var(--text-desk)',
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {mainHeading}
              </h2>
              {subHeading && (
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text-desk-muted)',
                    marginTop: 4,
                  }}
                >
                  {subHeading}
                </div>
              )}
            </div>

            {/* Meta Row: Dates & Rating */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 8,
                borderTop: '1px solid var(--border-desk-subtle)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-desk-muted)',
                }}
              >
                <Calendar size={13} color="var(--graphite)" />
                <span>{formatModalDates(rewatch)}</span>
              </div>

              {rewatch.rating !== null && rewatch.rating !== undefined && (
                <div
                  className={getRatingBandClass(rewatch.rating)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Star size={13} fill="currentColor" />
                  <span>{rewatch.rating}/10</span>
                </div>
              )}
            </div>
          </div>

          {/* New Harmonized Return Reflection Note Plate */}
          <div className={`rewatch-reflection-plate target-${tType}`}>
            <div className="rewatch-reflection-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Quote size={14} className="reflection-icon" />
                <span className="reflection-label">RETURN REFLECTION</span>
              </div>

              {onEdit && hasNotes && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onClose();
                    onEdit(rewatch);
                  }}
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    gap: 5,
                    color: 'var(--text-desk-muted)',
                  }}
                >
                  <PenLine size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {hasNotes ? (
              <div className="rewatch-reflection-body">
                <p className="rewatch-reflection-text">{rewatch.notes}</p>
              </div>
            ) : (
              <div className="rewatch-reflection-empty">
                <p className="reflection-empty-text">
                  No reflection recorded for this pass. What perspective changed when you returned to this story?
                </p>
                {onEdit && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onEdit(rewatch);
                    }}
                    style={{ gap: 6, marginTop: 4 }}
                  >
                    <PenLine size={13} />
                    <span>Write reflection</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-desk-subtle)',
            backgroundColor: 'var(--desk-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          }}
        >
          <div>
            {seriesId && onNavigateSeries && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateSeries(seriesId);
                }}
                style={{
                  gap: 6,
                  color: 'var(--tungsten)',
                }}
              >
                <span>View franchise</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div>
            {onDelete && (
              <button
                type="button"
                className="btn btn-ghost danger btn-sm"
                onClick={() => {
                  onClose();
                  onDelete(rewatch.id);
                }}
                style={{ gap: 6 }}
              >
                <Trash2 size={14} />
                <span>Delete pass</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
