import React, { useRef } from 'react';
import { Rewatch } from '../types';
import { RotateCcw, Calendar, Trash2, PenLine, Tv, Film, Layers, PlayCircle } from 'lucide-react';
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
        <RotateCcw size={36} color="var(--graphite)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 6 }}>
          No Rewatches Logged Yet
        </h3>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic', maxWidth: 480, margin: '0 auto' }}>
          Rewatching is how lessons deepen. Log your second or third passes through franchises, seasons, films, or pivotal episodes to record how your perspective evolved over time.
        </p>
      </div>
    );
  }

  const getTargetIcon = (r: Rewatch) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    if (tType === 'series') return <Layers size={15} color="var(--graphite)" />;
    if (tType === 'movie') return <Film size={15} color="var(--graphite)" />;
    if (tType === 'episode') return <PlayCircle size={15} color="var(--graphite)" />;
    return <Tv size={15} color="var(--graphite)" />;
  };

  const getTargetBadge = (r: Rewatch) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    if (tType === 'series') return 'Franchise Pass';
    if (tType === 'movie') return 'Film Pass';
    if (tType === 'episode') return r.episode_number ? `Episode ${r.episode_number} Pass` : 'Episode Pass';
    return 'TV Season Pass';
  };

  const getDisplayHeading = (r: Rewatch) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    if (tType === 'series') {
      return r.series_title || r.release_title || 'Franchise Rewatch';
    }
    if (r.series_title && r.release_title && r.series_title !== r.release_title) {
      return `${r.series_title} — ${r.release_title}`;
    }
    return r.release_title || r.series_title || 'Rewatch Target';
  };

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                {getTargetIcon(r)}
                <h3 style={{ fontSize: 18, color: 'var(--text-desk)', fontWeight: 600 }}>
                  {getDisplayHeading(r)}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-desk-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'var(--desk)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: '1px solid var(--border-desk-subtle)',
                  }}
                >
                  {getTargetBadge(r)}
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
                <div
                  className={`rating-mono ${
                    r.rating >= 9
                      ? 'rating-band-high'
                      : r.rating >= 7
                      ? 'rating-band-mid'
                      : r.rating >= 5
                      ? 'rating-band-normal'
                      : 'rating-band-low'
                  }`}
                >
                  <span>★ {r.rating}</span>
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
                className="btn-icon danger"
                onClick={() => onDelete(r.id)}
                title="Delete rewatch entry"
                aria-label="Delete rewatch entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Deepened Takeaway Note on Desk Card */}
          {r.notes && (
            <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-desk-subtle)' }}>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: 'var(--text-desk)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                "{r.notes}"
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
