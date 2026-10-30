import React, { useState } from 'react';
import { AnimeSeason, EpisodeNote } from '../types';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface MemoryCueListProps {
  season: AnimeSeason;
  onLogMemory: (season: AnimeSeason) => void;
  onSelectMemory: (note: EpisodeNote) => void;
}

export const MemoryCueList: React.FC<MemoryCueListProps> = ({
  season,
  onLogMemory,
  onSelectMemory,
}) => {
  const [expanded, setExpanded] = useState(false);

  const notes = [...(season.episode_notes || [])].sort(
    (a, b) => a.episode_number - b.episode_number
  );

  const MAX_INITIAL_ROWS = 5;
  const hasOverflow = notes.length > MAX_INITIAL_ROWS;
  const displayedNotes = expanded ? notes : notes.slice(0, MAX_INITIAL_ROWS);

  const getRatingBandClass = (score?: number | null) => {
    if (!score) return 'rating-band-empty';
    if (score >= 9) return 'rating-band-high';
    if (score >= 7) return 'rating-band-mid';
    if (score >= 5) return 'rating-band-normal';
    return 'rating-band-low';
  };

  return (
    <section className="detail-section">
      {/* Section Header */}
      <div className="detail-section-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 className="detail-section-title">Episode memories</h2>
          {notes.length > 0 && (
            <span className="detail-section-count">
              {notes.length} logged
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onLogMemory(season)}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <Plus size={13} />
          <span>Log memory</span>
        </button>
      </div>

      {notes.length > 0 ? (
        <div className="memory-cue-list">
          {displayedNotes.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => onSelectMemory(ep)}
              className="memory-cue-row"
              aria-haspopup="dialog"
              aria-label={`Episode ${ep.episode_number}: ${ep.episode_title || 'Untitled memory'}`}
            >
              {/* Ep number */}
              <span className="memory-cue-ep">{ep.episode_number}</span>

              {/* Title */}
              <span className="memory-cue-title">
                {ep.episode_title || 'Untitled'}
              </span>

              {/* Rating */}
              <span className="memory-cue-rating">
                {ep.rating ? (
                  <span className={getRatingBandClass(ep.rating)}>★ {ep.rating}</span>
                ) : (
                  <span className="rating-band-empty">—</span>
                )}
              </span>

              {/* Paper Pip (Writing exists) */}
              <span className="memory-cue-pip" title="Memory note written" />
            </button>
          ))}

          {hasOverflow && (
            <div style={{ paddingTop: 6, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="btn btn-ghost btn-sm"
                style={{
                  gap: 6,
                  color: 'var(--text-desk-muted)',
                  fontSize: 12,
                }}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>
                    <span>Show fewer memories</span>
                    <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    <span>{notes.length - MAX_INITIAL_ROWS} more memories</span>
                    <ChevronDown size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="detail-section-empty">
          <p className="detail-empty-text">
            No episode memories logged yet for Season {season.season_number}.
          </p>
        </div>
      )}
    </section>
  );
};
