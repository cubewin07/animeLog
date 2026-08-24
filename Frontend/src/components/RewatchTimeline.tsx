import React, { useRef } from 'react';
import { Rewatch } from '../types';
import { TakeawaySlip } from './TakeawaySlip';
import { RotateCcw, Calendar, Trash2, PenLine, Tv, Film, Layers, PlayCircle, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface RewatchTimelineProps {
  rewatches: Rewatch[];
  onEdit?: (rewatch: Rewatch) => void;
  onDelete: (id: number) => void;
  onNavigateSeries?: (seriesId: number) => void;
}

export const RewatchTimeline: React.FC<RewatchTimelineProps> = ({
  rewatches,
  onEdit,
  onDelete,
  onNavigateSeries,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !listRef.current) return;

      const items = listRef.current.querySelectorAll('.rewatch-timeline-item');
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
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            color: 'var(--text-desk-muted)',
            fontStyle: 'italic',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          Rewatching is how lessons deepen. Log your second or third passes through franchises, seasons, films, or pivotal episodes to record how your perspective evolved over time.
        </p>
      </div>
    );
  }

  const getTargetIcon = (r: Rewatch) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    if (tType === 'series') return <Layers size={15} color="var(--tungsten)" />;
    if (tType === 'movie') return <Film size={15} color="var(--night-text)" />;
    if (tType === 'episode') return <PlayCircle size={15} color="var(--ember)" />;
    return <Tv size={15} color="var(--tungsten)" />;
  };

  const getTargetBadge = (r: Rewatch) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    if (tType === 'series') return 'Franchise Pass';
    if (tType === 'movie') return 'Film Pass';
    if (tType === 'episode') return r.episode_number ? `Ep ${r.episode_number} Pass` : 'Episode Pass';
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
      {rewatches.map((r) => {
        const seriesId = r.series_id || (r.target_type === 'series' ? r.target_id : null);
        const heading = getDisplayHeading(r);
        const dateString =
          r.start_date && r.finish_date
            ? `${r.start_date} → ${r.finish_date}`
            : r.start_date || r.finish_date || undefined;

        return (
          <div
            key={r.id}
            className="rewatch-timeline-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Top Info Bar on Desk */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {getTargetIcon(r)}
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-desk-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: 'var(--desk-surface)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      border: '1px solid var(--border-desk-subtle)',
                    }}
                  >
                    {getTargetBadge(r)}
                  </span>
                </div>

                {seriesId && onNavigateSeries && (
                  <button
                    onClick={() => onNavigateSeries(seriesId)}
                    className="btn btn-ghost"
                    style={{
                      padding: '2px 8px',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--tungsten)',
                    }}
                    title="View Franchise Details"
                  >
                    <span>View Franchise</span>
                    <ArrowUpRight size={12} />
                  </button>
                )}

                {dateString && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-desk-dim)',
                    }}
                  >
                    <Calendar size={12} />
                    <span>{dateString}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {onEdit && (
                  <button
                    className="btn-icon"
                    onClick={() => onEdit(r)}
                    title="Edit rewatch reflection"
                    aria-label={`Edit rewatch reflection for ${heading}`}
                  >
                    <PenLine size={13} />
                  </button>
                )}
                <button
                  className="btn-icon danger"
                  onClick={() => onDelete(r.id)}
                  title="Delete rewatch entry"
                  aria-label={`Delete rewatch entry for ${heading}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Authentic Takeaway Slip sitting on the desk */}
            <TakeawaySlip
              status="COMPLETED"
              title={heading}
              label={getTargetBadge(r)}
              subTitle={dateString ? `Logged: ${dateString}` : undefined}
              text={r.notes}
              rating={r.rating}
              emptyText="Rewatch logged without perspective notes."
              onWrite={onEdit ? () => onEdit(r) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};
