import React, { useState, useMemo } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Rewatch } from '../types';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  passNumbers,
  formatFriendlyDate,
  scopeLabel,
  compareRewatchesNewestFirst,
} from '../views/rewatchSpine';

interface ReturnMarksProps {
  series: AnimeSeries;
  selectedReleaseType: 'season' | 'movie';
  selectedRelease: AnimeSeason | AnimeMovie | null;
  allRewatches?: Rewatch[];
  onLogRewatch: (targetType: 'season' | 'movie', target: AnimeSeason | AnimeMovie) => void;
  onSelectRewatch: (rewatch: Rewatch, passNumber: number) => void;
}

export const ReturnMarks: React.FC<ReturnMarksProps> = ({
  series,
  selectedReleaseType,
  selectedRelease,
  allRewatches = [],
  onLogRewatch,
  onSelectRewatch,
}) => {
  const [filterMode, setFilterMode] = useState<'release' | 'all'>('release');
  const [expanded, setExpanded] = useState(false);

  // Compute honest per-target pass numbers across all rewatches
  const passMap = useMemo(() => passNumbers(allRewatches), [allRewatches]);

  // Rewatches belonging to this series/franchise
  const seriesRewatches = useMemo(() => {
    return allRewatches.filter((r) => {
      if (r.target_type === 'series' && r.target_id === series.id) return true;
      if (r.series_id === series.id) return true;
      if (r.target_type === 'season' && series.seasons?.some((s) => s.id === r.target_id)) return true;
      if (r.target_type === 'movie' && series.movies?.some((m) => m.id === r.target_id)) return true;
      if (r.target_type === 'episode' && series.seasons?.some((s) => s.episode_notes?.some((ep) => ep.id === r.target_id))) return true;
      if (r.season && series.seasons?.some((s) => s.id === r.season)) return true;
      if (r.movie && series.movies?.some((m) => m.id === r.movie)) return true;
      return false;
    });
  }, [allRewatches, series]);

  // Rewatches for the selected release
  const releaseRewatches = useMemo(() => {
    if (!selectedRelease) return [];
    return seriesRewatches.filter((r) => {
      if (selectedReleaseType === 'season') {
        const s = selectedRelease as AnimeSeason;
        return (
          (r.target_type === 'season' && r.target_id === s.id) ||
          r.season === s.id ||
          (r.target_type === 'episode' && s.episode_notes?.some((ep) => ep.id === r.target_id))
        );
      } else {
        const m = selectedRelease as AnimeMovie;
        return (
          (r.target_type === 'movie' && r.target_id === m.id) ||
          r.movie === m.id
        );
      }
    });
  }, [seriesRewatches, selectedRelease, selectedReleaseType]);

  const displayedList = filterMode === 'all' ? seriesRewatches : releaseRewatches;
  const sortedList = useMemo(() => {
    return [...displayedList].sort(compareRewatchesNewestFirst);
  }, [displayedList]);

  const MAX_INITIAL = 6;
  const hasOverflow = sortedList.length > MAX_INITIAL;
  const visibleRows = !expanded && hasOverflow ? sortedList.slice(0, 4) : sortedList;

  const hasFranchiseDifference = seriesRewatches.length > releaseRewatches.length;

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
          <h2 className="detail-section-title">Returns</h2>
          {displayedList.length > 0 && (
            <span className="detail-section-count">
              {displayedList.length} {displayedList.length === 1 ? 'pass' : 'passes'}
            </span>
          )}
        </div>

        {selectedRelease && (
          <button
            type="button"
            onClick={() => onLogRewatch(selectedReleaseType, selectedRelease)}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
          >
            <RotateCcw size={13} />
            <span>Log rewatch</span>
          </button>
        )}
      </div>

      {sortedList.length > 0 ? (
        <div className="return-marks-list">
          {visibleRows.map((r) => {
            const passNum = passMap.get(r.id) || 1;
            const dateDisplay = formatFriendlyDate(r.finish_date || r.start_date) || '—';
            const hasNotes = Boolean(r.notes && r.notes.trim().length > 0);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRewatch(r, passNum)}
                className="return-mark-row"
                aria-haspopup="dialog"
                aria-label={`Pass ${passNum} on ${dateDisplay}`}
              >
                {/* Date */}
                <span className="return-mark-date">{dateDisplay}</span>

                {/* Pass Number */}
                <span className="return-mark-pass">Pass {passNum}</span>

                {/* Scope Label (in all franchise view) */}
                {filterMode === 'all' && (
                  <span className="return-mark-scope">{scopeLabel(r)}</span>
                )}

                {/* Rating */}
                <span className="return-mark-rating">
                  {r.rating !== null && r.rating !== undefined ? (
                    <span className={getRatingBandClass(r.rating)}>★ {r.rating}</span>
                  ) : (
                    <span className="rating-band-empty">—</span>
                  )}
                </span>

                {/* Paper Pip (Writing exists) */}
                <span
                  className={`return-mark-pip ${hasNotes ? 'has-notes' : 'no-notes'}`}
                  title={hasNotes ? 'Reflection note written' : 'No reflection note'}
                />
              </button>
            );
          })}

          {/* Row Overflow Button (if > 6 passes) */}
          {hasOverflow && (
            <div style={{ paddingTop: 4, display: 'flex', justifyContent: 'center' }}>
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
                    <span>Show fewer passes</span>
                    <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    <span>{sortedList.length - 4} more passes</span>
                    <ChevronDown size={13} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Franchise Scope Toggle Link */}
          {hasFranchiseDifference && (
            <div style={{ paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setFilterMode(filterMode === 'release' ? 'all' : 'release');
                  setExpanded(false);
                }}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 12,
                  color: 'var(--text-desk-dim)',
                  padding: '2px 6px',
                }}
              >
                {filterMode === 'release'
                  ? `${seriesRewatches.length - releaseRewatches.length} more in this franchise`
                  : 'Show this release only'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="detail-section-empty">
          <p className="detail-empty-text">
            {filterMode === 'release'
              ? 'No rewatch passes recorded for this release yet.'
              : 'No rewatch passes recorded for this franchise yet.'}
          </p>
          {hasFranchiseDifference && filterMode === 'release' && (
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, color: 'var(--text-desk-muted)', marginTop: 4 }}
            >
              View {seriesRewatches.length} franchise passes
            </button>
          )}
        </div>
      )}
    </section>
  );
};
