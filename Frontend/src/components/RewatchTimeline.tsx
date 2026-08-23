import React, { useRef } from 'react';
import { Rewatch } from '../types';
import { TakeawaySlip } from './TakeawaySlip';
import { RotateCcw, Calendar, Trash2, PenLine, Tv, Film } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface RewatchTimelineProps {
  rewatches: Rewatch[];
  onEdit?: (rewatch: Rewatch) => void;
  onDelete: (id: number) => void;
}

export const RewatchTimeline: React.FC<RewatchTimelineProps> = ({ rewatches, onEdit, onDelete }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !listRef.current) return;

      const items = listRef.current.querySelectorAll('.desk-card');
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.04,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: listRef, dependencies: [rewatches.length] }
  );

  if (rewatches.length === 0) {
    return (
      <div
        className="desk-card"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-desk-muted)',
        }}
      >
        <RotateCcw size={36} color="var(--tungsten)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 6 }}>
          No Rewatches Logged Yet
        </h3>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic', maxWidth: 480, margin: '0 auto' }}>
          Rewatching is how lessons deepen. Log your second or third passes through anime seasons or movies to record how your perspective evolved over time.
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {rewatches.map((r) => (
        <div
          key={r.id}
          className="desk-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: 20,
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {r.movie ? <Film size={15} color="var(--tungsten)" /> : <Tv size={15} color="var(--tungsten)" />}
                <h3 style={{ fontSize: 18, color: 'var(--text-desk)', fontWeight: 600 }}>
                  {r.release_title || 'Rewatch Target'}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-desk-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {r.movie ? 'Film Pass' : 'TV Season Pass'}
                </span>
              </div>

              {(r.start_date || r.finish_date) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: 'var(--text-desk-muted)',
                  }}
                >
                  <Calendar size={13} />
                  <span>
                    {r.start_date || 'Started'} → {r.finish_date || 'Finished'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {r.rating && (
                <div className="rating-mono">
                  <span>{r.rating}</span>
                  <span className="rating-mono-sub">/10</span>
                </div>
              )}
              {onEdit && (
                <button
                  className="btn-icon"
                  onClick={() => onEdit(r)}
                  title="Edit rewatch reflection"
                  aria-label="Edit rewatch reflection"
                >
                  <PenLine size={14} />
                </button>
              )}
              <button
                className="btn-icon"
                onClick={() => onDelete(r.id)}
                title="Delete rewatch entry"
                aria-label="Delete rewatch entry"
                style={{ color: '#c47676' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Deepened Takeaway Slip */}
          <TakeawaySlip
            text={r.notes}
            label="Deepened Lessons & Evolved Mindset"
            rating={r.rating}
            status="COMPLETED"
            onWrite={onEdit ? () => onEdit(r) : undefined}
          />
        </div>
      ))}
    </div>
  );
};
