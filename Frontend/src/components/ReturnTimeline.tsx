import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, RotateCcw, Star } from 'lucide-react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Rewatch } from '../types';
import {
  compareRewatchesNewestFirst,
  formatFriendlyDate,
  passNumbers,
  scopeLabel,
  targetType,
} from '../views/rewatchSpine';

interface ReturnTimelineProps {
  series: AnimeSeries;
  selectedReleaseType: 'season' | 'movie';
  selectedRelease: AnimeSeason | AnimeMovie | null;
  allRewatches: Rewatch[];
  onLogRewatch: (targetType: 'season' | 'movie', target: AnimeSeason | AnimeMovie) => void;
  onSelectRewatch: (rewatch: Rewatch, passNumber: number) => void;
}

export const ReturnTimeline: React.FC<ReturnTimelineProps> = ({
  series,
  selectedReleaseType,
  selectedRelease,
  allRewatches,
  onLogRewatch,
  onSelectRewatch,
}) => {
  const [scope, setScope] = useState<'release' | 'franchise'>('release');
  const [expanded, setExpanded] = useState(false);
  const passMap = useMemo(() => passNumbers(allRewatches), [allRewatches]);
  const franchiseReturns = useMemo(() => allRewatches.filter((rewatch) => {
    if (rewatch.series_id === series.id || (rewatch.target_type === 'series' && rewatch.target_id === series.id)) return true;
    const matchesSeason = series.seasons.some((season) =>
      (rewatch.target_type === 'season' && rewatch.target_id === season.id) || rewatch.season === season.id || rewatch.season_id === season.id
    );
    const matchesMovie = series.movies.some((movie) =>
      (rewatch.target_type === 'movie' && rewatch.target_id === movie.id) || rewatch.movie === movie.id || rewatch.movie_id === movie.id
    );
    return matchesSeason || matchesMovie;
  }), [allRewatches, series]);
  const releaseReturns = useMemo(() => {
    if (!selectedRelease) return [];
    return franchiseReturns.filter((rewatch) => selectedReleaseType === 'season'
      ? (rewatch.target_type === 'season' && rewatch.target_id === selectedRelease.id) || rewatch.season === selectedRelease.id || rewatch.season_id === selectedRelease.id
      : (rewatch.target_type === 'movie' && rewatch.target_id === selectedRelease.id) || rewatch.movie === selectedRelease.id || rewatch.movie_id === selectedRelease.id);
  }, [franchiseReturns, selectedRelease, selectedReleaseType]);
  const returns = (scope === 'franchise' ? franchiseReturns : releaseReturns).sort(compareRewatchesNewestFirst);
  const visibleReturns = expanded ? returns : returns.slice(0, 4);
  const selectedLabel = selectedReleaseType === 'season'
    ? `Season ${(selectedRelease as AnimeSeason | null)?.season_number ?? ''}`
    : selectedRelease?.title || 'Film';

  return (
    <section className="return-timeline-section" aria-labelledby="return-timeline-title">
      <header className="return-timeline-header">
        <div>
          <p className="detail-section-kicker">A record of what changed</p>
          <h2 id="return-timeline-title">Returns over time</h2>
          <p>Each pass stays anchored to the moment you came back.</p>
        </div>
        {selectedRelease && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onLogRewatch(selectedReleaseType, selectedRelease)}>
            <RotateCcw size={14} /> Log a return
          </button>
        )}
      </header>

      {franchiseReturns.length > releaseReturns.length && (
        <div className="return-timeline-tabs" role="group" aria-label="Return scope">
          <button type="button" className={scope === 'release' ? 'is-active' : ''} onClick={() => { setScope('release'); setExpanded(false); }} aria-pressed={scope === 'release'}>
            {selectedLabel} <span>{releaseReturns.length}</span>
          </button>
          <button type="button" className={scope === 'franchise' ? 'is-active' : ''} onClick={() => { setScope('franchise'); setExpanded(false); }} aria-pressed={scope === 'franchise'}>
            Whole series <span>{franchiseReturns.length}</span>
          </button>
        </div>
      )}

      {returns.length ? (
        <ol className="return-timeline">
          {visibleReturns.map((rewatch) => {
            const pass = passMap.get(rewatch.id) ?? 1;
            const type = targetType(rewatch);
            const scoreClass = rewatch.rating ? `rating-band-${rewatch.rating >= 9 ? 'high' : rewatch.rating >= 7 ? 'mid' : rewatch.rating >= 5 ? 'normal' : 'low'}` : 'rating-band-empty';
            return (
              <li key={rewatch.id} className={`return-timeline-entry target-${type}`}>
                <span className="return-timeline-node" aria-hidden="true" />
                <button type="button" onClick={() => onSelectRewatch(rewatch, pass)} aria-haspopup="dialog">
                  <span className="return-timeline-date"><CalendarDays size={13} /> {formatFriendlyDate(rewatch.finish_date || rewatch.start_date) || 'Date not recorded'}</span>
                  <span className="return-timeline-body">
                    <span className="return-timeline-heading"><strong>Pass {pass}</strong><span>{scopeLabel(rewatch)}</span></span>
                    {rewatch.notes?.trim() ? <q>{rewatch.notes}</q> : <em>No reflection written for this pass.</em>}
                  </span>
                  <span className={`return-timeline-rating ${scoreClass}`}><Star size={13} fill="currentColor" /> {rewatch.rating ?? '—'}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="return-timeline-empty">
          <RotateCcw size={18} />
          <span>No returns logged for {scope === 'release' ? selectedLabel : 'this series'} yet.</span>
        </div>
      )}

      {returns.length > 4 && (
        <button type="button" className="return-timeline-more" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {expanded ? <><ChevronUp size={15} /> Show the recent passes</> : <><ChevronDown size={15} /> Reveal {returns.length - 4} earlier {returns.length - 4 === 1 ? 'pass' : 'passes'}</>}
        </button>
      )}
    </section>
  );
};
