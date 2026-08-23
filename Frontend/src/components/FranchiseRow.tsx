import React from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import { TakeawaySlip } from './TakeawaySlip';
import { ProgressStepper } from './ProgressStepper';
import { Tv, Film, MoreHorizontal, PenLine, Plus, Trash2, ArrowRight } from 'lucide-react';

interface FranchiseRowProps {
  series: AnimeSeries;
  onOpenDetail?: (seriesId: number) => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason: (series: AnimeSeries) => void;
  onAddMovie: (series: AnimeSeries) => void;
  onEditSeason: (season: AnimeSeason) => void;
  onEditMovie: (movie: AnimeMovie) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
}

export const FranchiseRow: React.FC<FranchiseRowProps> = ({
  series,
  onOpenDetail,
  onEditSeries,
  onDeleteSeries,
  onAddSeason,
  onAddMovie,
  onEditSeason,
  onEditMovie,
  onSeasonProgressDelta,
  onMovieProgressDelta,
}) => {
  // Find primary release to highlight (active watching first, then latest season/movie)
  const watchingSeason = series.seasons?.find((s) => s.status === 'WATCHING');
  const watchingMovie = series.movies?.find((m) => m.status === 'WATCHING');
  const primarySeason = watchingSeason || series.seasons?.[0];
  const primaryMovie = watchingMovie || series.movies?.[0];

  const highlightedRelease = watchingSeason
    ? { type: 'season' as const, data: watchingSeason }
    : watchingMovie
    ? { type: 'movie' as const, data: watchingMovie }
    : primarySeason
    ? { type: 'season' as const, data: primarySeason }
    : primaryMovie
    ? { type: 'movie' as const, data: primaryMovie }
    : null;

  const coverUrl =
    (highlightedRelease?.data as any)?.cover_image_url ||
    ((highlightedRelease?.data as any)?.cover_image as any)?.image_url ||
    series.cover_image_url ||
    (series.cover_image as any)?.image_url;

  const totalSeasons = series.seasons?.length || 0;
  const totalMovies = series.movies?.length || 0;

  return (
    <article
      className="desk-card"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 24,
        alignItems: 'start',
        padding: 24,
      }}
    >
      {/* Poster Thumbnail */}
      <div
        onClick={() => onOpenDetail && onOpenDetail(series.id)}
        style={{ cursor: onOpenDetail ? 'pointer' : 'default' }}
        title={`Open ${series.title}`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={series.title}
            className="still-poster-list"
            width={96}
            height={144}
            loading="lazy"
          />
        ) : (
          <div
            className="still-poster-list"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--graphite)',
            }}
          >
            <Tv size={32} />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {/* Title, Genres & Top Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              onClick={() => onOpenDetail && onOpenDetail(series.id)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--text-desk)',
                cursor: onOpenDetail ? 'pointer' : 'default',
                lineHeight: 1.3,
                marginBottom: 6,
              }}
            >
              {series.title}
            </h3>

            {/* Subtitle / Releases meta line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-desk-muted)' }}>
              <span>
                {totalSeasons} {totalSeasons === 1 ? 'season' : 'seasons'}
                {totalMovies > 0 ? ` · ${totalMovies} ${totalMovies === 1 ? 'movie' : 'movies'}` : ''}
              </span>

              {series.genres && series.genres.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {series.genres.slice(0, 3).map((g) => (
                    <span key={g.id} className="genre-tag">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Dock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {onOpenDetail && (
              <button
                onClick={() => onOpenDetail(series.id)}
                className="btn btn-secondary"
                style={{ padding: '5px 12px', fontSize: 13 }}
                aria-label={`Open journal for ${series.title}`}
              >
                <span>Read journal</span>
                <ArrowRight size={13} />
              </button>
            )}
            <button
              onClick={() => onEditSeries(series)}
              className="btn-icon"
              title="Edit franchise details"
              aria-label={`Edit ${series.title}`}
            >
              <PenLine size={14} />
            </button>
            <button
              onClick={() => onDeleteSeries(series.id)}
              className="btn-icon"
              title="Delete franchise"
              aria-label={`Delete ${series.title}`}
              style={{ color: '#c47676' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Highlighted Release Detail & Stepper */}
        {highlightedRelease && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                paddingTop: 6,
                borderTop: '1px solid var(--border-desk-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-desk)',
                  }}
                >
                  {highlightedRelease.type === 'season'
                    ? `Season ${(highlightedRelease.data as AnimeSeason).season_number}: ${(highlightedRelease.data as AnimeSeason).title}`
                    : `Film: ${(highlightedRelease.data as AnimeMovie).title}`}
                </span>
                <span className={`status-indicator ${highlightedRelease.data.status?.toLowerCase()}`}>
                  {highlightedRelease.data.status}
                </span>
              </div>

              {highlightedRelease.data.status === 'WATCHING' && (
                <div>
                  {highlightedRelease.type === 'season' ? (
                    <ProgressStepper
                      current={(highlightedRelease.data as AnimeSeason).progress || 0}
                      total={(highlightedRelease.data as AnimeSeason).total_episodes}
                      unit="eps"
                      onDelta={(d) => onSeasonProgressDelta(highlightedRelease.data.id, d)}
                      ariaLabelPrefix={`${series.title} S${(highlightedRelease.data as AnimeSeason).season_number}`}
                    />
                  ) : (
                    <ProgressStepper
                      current={(highlightedRelease.data as AnimeMovie).progress_minutes || 0}
                      total={(highlightedRelease.data as AnimeMovie).total_minutes}
                      unit="mins"
                      step={10}
                      onDelta={(d) => onMovieProgressDelta(highlightedRelease.data.id, d)}
                      ariaLabelPrefix={`${(highlightedRelease.data as AnimeMovie).title}`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Takeaway Slip */}
            <TakeawaySlip
              text={highlightedRelease.data.notes}
              label={
                highlightedRelease.type === 'season'
                  ? `Season ${(highlightedRelease.data as AnimeSeason).season_number} Lesson`
                  : 'Film Takeaway'
              }
              rating={highlightedRelease.data.rating}
              status={highlightedRelease.data.status}
              onWrite={() => {
                if (highlightedRelease.type === 'season') {
                  onEditSeason(highlightedRelease.data as AnimeSeason);
                } else {
                  onEditMovie(highlightedRelease.data as AnimeMovie);
                }
              }}
            />
          </div>
        )}

        {/* Releases switcher / Add button if more releases exist */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {series.seasons?.map((s) => (
              <span
                key={`s-${s.id}`}
                onClick={() => onEditSeason(s)}
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: s.id === highlightedRelease?.data.id ? 'var(--tungsten)' : 'var(--text-desk-muted)',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--desk-surface)',
                  border: '1px solid var(--border-desk-subtle)',
                }}
              >
                S{s.season_number} {s.status === 'COMPLETED' ? '✓' : ''}
              </span>
            ))}
            {series.movies?.map((m) => (
              <span
                key={`m-${m.id}`}
                onClick={() => onEditMovie(m)}
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: m.id === highlightedRelease?.data.id ? 'var(--tungsten)' : 'var(--text-desk-muted)',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--desk-surface)',
                  border: '1px solid var(--border-desk-subtle)',
                }}
              >
                Film: {m.title}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => onAddSeason(series)}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '3px 8px' }}
            >
              <Plus size={12} />
              <span>Add Season</span>
            </button>
            <button
              onClick={() => onAddMovie(series)}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '3px 8px' }}
            >
              <Plus size={12} />
              <span>Add Movie</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
