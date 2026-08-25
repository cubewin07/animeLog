import React, { useMemo, useState } from 'react';
import { CalendarDays, Clapperboard, FileText, RotateCcw, Star, Tv } from 'lucide-react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Rewatch } from '../types';
import { formatFriendlyDate } from '../views/rewatchSpine';

type ReleaseKind = 'season' | 'movie';
type Release = AnimeSeason | AnimeMovie;

interface ReleaseLedgerProps {
  series: AnimeSeries;
  rewatches: Rewatch[];
  selectedType: ReleaseKind;
  selectedId: number;
  onSelect: (type: ReleaseKind, id: number) => void;
}

const statusLabel = (status: string) => status.replaceAll('_', ' ');

const releaseReturns = (rewatches: Rewatch[], type: ReleaseKind, id: number) =>
  rewatches.filter((rewatch) =>
    type === 'season'
      ? (rewatch.target_type === 'season' && rewatch.target_id === id) || rewatch.season === id || rewatch.season_id === id
      : (rewatch.target_type === 'movie' && rewatch.target_id === id) || rewatch.movie === id || rewatch.movie_id === id
  ).length;

export const ReleaseLedger: React.FC<ReleaseLedgerProps> = ({
  series,
  rewatches,
  selectedType,
  selectedId,
  onSelect,
}) => {
  const [filter, setFilter] = useState<'all' | ReleaseKind>('all');
  const seasons = useMemo(() => [...(series.seasons || [])].sort((a, b) => a.season_number - b.season_number), [series.seasons]);
  const movies = series.movies || [];
  const visibleReleases: Array<{ type: ReleaseKind; release: Release }> = [
    ...(filter !== 'movie' ? seasons.map((release) => ({ type: 'season' as const, release })) : []),
    ...(filter !== 'season' ? movies.map((release) => ({ type: 'movie' as const, release })) : []),
  ];

  return (
    <section className="release-ledger" aria-labelledby="release-ledger-title">
      <header className="release-ledger-header">
        <div>
          <p className="detail-section-kicker">The complete watch record</p>
          <h2 id="release-ledger-title">Release guide</h2>
          <p className="release-ledger-description">Choose an entry to read its lesson, memories, and return history.</p>
        </div>
        <div className="release-ledger-total" aria-label={`${seasons.length + movies.length} releases`}>
          <strong>{seasons.length + movies.length}</strong>
          <span>releases</span>
        </div>
      </header>

      <div className="release-ledger-filters" role="group" aria-label="Filter releases">
        {([
          ['all', 'Everything', seasons.length + movies.length],
          ['season', 'Seasons', seasons.length],
          ['movie', 'Films', movies.length],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            className={`release-ledger-filter ${filter === value ? 'is-active' : ''}`}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      <div className="release-ledger-list">
        {visibleReleases.map(({ type, release }) => {
          const isSeason = type === 'season';
          const season = release as AnimeSeason;
          const movie = release as AnimeMovie;
          const progress = isSeason ? season.progress : movie.progress_minutes;
          const total = isSeason ? season.total_episodes : movie.total_minutes;
          const unit = isSeason ? 'episodes' : 'minutes';
          const selected = selectedType === type && selectedId === release.id;
          const memories = isSeason ? season.episode_notes?.length || 0 : 0;
          const returns = releaseReturns(rewatches, type, release.id);
          const date = formatFriendlyDate(release.finish_date || release.start_date);
          const completion = total ? Math.min(100, Math.round((progress / total) * 100)) : null;
          const heading = isSeason ? `Season ${season.season_number}` : 'Film';
          const title = isSeason && season.title === `Season ${season.season_number}` ? null : release.title;

          return (
            <button
              key={`${type}-${release.id}`}
              type="button"
              className={`release-ledger-row ${selected ? 'is-selected' : ''}`}
              onClick={() => onSelect(type, release.id)}
              aria-pressed={selected}
            >
              <span className={`release-ledger-kind ${isSeason ? 'season' : 'movie'}`}>
                {isSeason ? <Tv size={15} /> : <Clapperboard size={15} />}
                <span>{heading}</span>
              </span>
              <span className="release-ledger-main">
                <strong>{title || heading}</strong>
                <span>
                  <span className={`status-indicator ${release.status.toLowerCase()}`}>{statusLabel(release.status)}</span>
                  <i>·</i><span><CalendarDays size={12} /> {date || 'Date not recorded'}</span>
                </span>
              </span>
              <span className="release-ledger-metrics" aria-label="Release details">
                <span title={`${progress}${total ? ` of ${total}` : ''} ${unit}`}>
                  <b>{total ? `${progress}/${total}` : progress}</b> {unit}
                  {completion !== null && <em style={{ '--completion': `${completion}%` } as React.CSSProperties} />}
                </span>
                <span className={release.rating ? `rating-band-${release.rating >= 9 ? 'high' : release.rating >= 7 ? 'mid' : release.rating >= 5 ? 'normal' : 'low'}` : 'rating-band-empty'}>
                  <Star size={13} fill="currentColor" /> {release.rating ?? '—'}
                </span>
                <span><FileText size={13} /> {memories}</span>
                <span><RotateCcw size={13} /> {returns}</span>
              </span>
              <span className={`release-ledger-lesson ${release.notes?.trim() ? 'has-lesson' : ''}`}>
                {release.notes?.trim() ? 'Lesson captured' : 'No lesson'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
