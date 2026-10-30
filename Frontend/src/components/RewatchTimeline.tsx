import React, { useRef } from 'react';
import { Rewatch } from '../types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { Quote } from 'lucide-react';
import {
  displayTitle,
  formatSpineDate,
  groupByYear,
  passNumbers,
  scopeLabel,
  targetType,
} from '../views/rewatchSpine';

interface RewatchTimelineProps {
  rewatches: Rewatch[];
  allRewatches?: Rewatch[];
  selectedRewatchId?: number | null;
  onSelectRewatch?: (rewatch: Rewatch) => void;
}

export const RewatchTimeline: React.FC<RewatchTimelineProps> = ({
  rewatches,
  allRewatches,
  selectedRewatchId,
  onSelectRewatch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const passMap = passNumbers(allRewatches?.length ? allRewatches : rewatches);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll('.rewatch-timeline-item'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: EASING.smooth, clearProps: 'transform,opacity' }
      );
    },
    { scope: containerRef, dependencies: [rewatches.length] }
  );

  return (
    <div ref={containerRef} className="rewatch-timeline">
      {groupByYear(rewatches).map((group) => (
        <section key={group.year} className="rewatch-timeline-group" aria-labelledby={`rewatch-year-${group.year}`}>
          <h3 id={`rewatch-year-${group.year}`} className="rewatch-timeline-year">{group.year}</h3>
          <div className="rewatch-timeline-items">
            {group.items.map((rewatch) => {
              const title = displayTitle(rewatch);
              const passNumber = passMap.get(rewatch.id) ?? 1;
              const type = targetType(rewatch);
              const hasNotes = Boolean(rewatch.notes?.trim());

              return (
                <button
                  key={rewatch.id}
                  type="button"
                  className={`rewatch-timeline-item target-${type} ${selectedRewatchId === rewatch.id ? 'selected' : ''}`}
                  aria-haspopup="dialog"
                  aria-expanded={selectedRewatchId === rewatch.id}
                  aria-label={`Rewatch of ${title}, ${scopeLabel(rewatch)}, Pass ${passNumber}`}
                  onClick={() => onSelectRewatch?.(rewatch)}
                >
                  <span className="rewatch-timeline-rail" aria-hidden="true">
                    <span className="rewatch-timeline-node" />
                  </span>
                  <span className="rewatch-timeline-card">
                    <span className="rewatch-timeline-card-header">
                      <span>
                        <span className="rewatch-timeline-date">{formatSpineDate(rewatch, true)}</span>
                        <span className="rewatch-timeline-title">{title}</span>
                      </span>
                      <span className="rewatch-timeline-score">{rewatch.rating == null ? '—' : `${rewatch.rating}/10`}</span>
                    </span>
                    <span className="rewatch-timeline-meta">
                      <span className="rewatch-timeline-scope">{scopeLabel(rewatch)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Pass {passNumber}</span>
                    </span>
                    {hasNotes && (
                      <span
                        className="rewatch-timeline-reflection"
                        style={{
                          display: 'block',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--paper-ink)',
                          padding: '10px 14px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          fontStyle: 'normal',
                          marginTop: 10,
                        }}
                      >
                        <span style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <Quote size={13} style={{ color: 'var(--lamp)', flexShrink: 0, marginTop: 2, opacity: 0.8 }} />
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13.5, lineHeight: 1.5, textAlign: 'left' }}>
                            {rewatch.notes}
                          </span>
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export const RewatchSpine = RewatchTimeline;
