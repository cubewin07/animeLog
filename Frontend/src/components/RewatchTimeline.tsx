import React from 'react';
import { Rewatch } from '../types';
import { RotateCcw, Star, Calendar, Trash2, Film, Quote } from 'lucide-react';

interface RewatchTimelineProps {
  rewatches: Rewatch[];
  onDelete: (id: number) => void;
}

export const RewatchTimeline: React.FC<RewatchTimelineProps> = ({ rewatches, onDelete }) => {
  if (rewatches.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <RotateCcw size={32} color="var(--color-secondary)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '4px' }}>
          No Rewatches Logged Yet
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
          Rewatching is how lessons deepen. Log your second or third passes through anime to record how your perspective evolved.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {rewatches.map((r) => (
        <div
          key={r.id}
          className="glass-card"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderLeft: '4px solid var(--color-secondary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Film size={16} color="var(--color-secondary)" />
                <h3 style={{ fontSize: '17px', color: '#ffffff' }}>{r.anime_title}</h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(196, 193, 251, 0.15)',
                    color: 'var(--color-secondary)',
                    fontWeight: 600,
                  }}
                >
                  REWATCH PASS
                </span>
              </div>

              {(r.start_date || r.finish_date) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  <Calendar size={13} />
                  <span>
                    {r.start_date || 'Started'} → {r.finish_date || 'Finished'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {r.rating && (
                <div className="rating-pill">
                  <Star size={13} fill="#fbbf24" color="#fbbf24" />
                  <span>{r.rating}/10</span>
                </div>
              )}
              <button
                className="btn-icon"
                onClick={() => onDelete(r.id)}
                title="Delete rewatch entry"
                style={{ color: '#fb7185' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {r.notes && (
            <div
              style={{
                background: 'rgba(13, 28, 45, 0.85)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Quote size={13} color="var(--color-secondary)" />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: 'var(--color-secondary)',
                  }}
                >
                  Deepened Takeaways & Perspective
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#d4e4fa', lineHeight: '1.6', fontStyle: 'italic' }}>
                "{r.notes}"
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
