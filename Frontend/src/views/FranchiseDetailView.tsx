import React, { useState } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, FavoriteCharacter, Rewatch } from '../types';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { ProgressStepper } from '../components/ProgressStepper';
import {
  ArrowLeft,
  Tv,
  Film,
  Plus,
  PenLine,
  Trash2,
  BookOpen,
  Sparkles,
  RotateCcw,
  Calendar,
  Star,
} from 'lucide-react';

interface FranchiseDetailViewProps {
  series: AnimeSeries;
  allRewatches?: Rewatch[];
  onBack: () => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason: (series: AnimeSeries) => void;
  onAddMovie: (series: AnimeSeries) => void;
  onEditSeason: (season: AnimeSeason) => void;
  onDeleteSeason: (id: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onEditMovie: (movie: AnimeMovie) => void;
  onDeleteMovie: (id: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onOpenEpisodeNotes: (season: AnimeSeason) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddCharacter: (series: AnimeSeries) => void;
}

export const FranchiseDetailView: React.FC<FranchiseDetailViewProps> = ({
  series,
  allRewatches = [],
  onBack,
  onEditSeries,
  onDeleteSeries,
  onAddSeason,
  onAddMovie,
  onEditSeason,
  onDeleteSeason,
  onSeasonProgressDelta,
  onEditMovie,
  onDeleteMovie,
  onMovieProgressDelta,
  onOpenEpisodeNotes,
  onAddRewatchSeason,
  onAddRewatchMovie,
  onAddCharacter,
}) => {
  // Select active season/movie by default or first available
  const defaultSeason = series.seasons?.find((s) => s.status === 'WATCHING') || series.seasons?.[0];
  const [selectedType, setSelectedType] = useState<'season' | 'movie'>('season');
  const [selectedId, setSelectedId] = useState<number>(defaultSeason?.id || series.movies?.[0]?.id || 0);

  const currentSeason = series.seasons?.find((s) => s.id === selectedId);
  const currentMovie = series.movies?.find((m) => m.id === selectedId);

  // If user selected movie or there are no seasons
  const activeRelease =
    selectedType === 'season'
      ? currentSeason || series.seasons?.[0]
      : currentMovie || series.movies?.[0];

  const coverUrl =
    (activeRelease as any)?.cover_image_url ||
    ((activeRelease as any)?.cover_image as any)?.image_url ||
    series.cover_image_url ||
    (series.cover_image as any)?.image_url;

  // Franchise characters
  const franchiseCharacters = series.favorite_characters || [];

  // Rewatches for this series
  const seriesRewatches = allRewatches.filter(
    (r) =>
      series.seasons?.some((s) => s.id === r.season) ||
      series.movies?.some((m) => m.id === r.movie)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            fontSize: 14,
            color: 'var(--text-desk-muted)',
          }}
          aria-label="Back to anime journal"
        >
          <ArrowLeft size={16} />
          <span>Back to Anime Journal</span>
        </button>
      </div>

      {/* Top Banner: Still + Title & Release Selector */}
      <section
        className="desk-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 32,
          alignItems: 'start',
          padding: 28,
        }}
      >
        {/* Poster Still */}
        <div>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={series.title}
              className="still-poster-detail"
              width={240}
              height={360}
              loading="lazy"
            />
          ) : (
            <div
              className="still-poster-detail"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--graphite)',
              }}
            >
              <Tv size={48} />
            </div>
          )}
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
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
              <h1 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 8 }}>
                {series.title}
              </h1>

              {/* Genres and Studios */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {series.genres?.map((g) => (
                  <span key={g.id} className="genre-tag">
                    {g.name}
                  </span>
                ))}
                {series.studios?.map((st) => (
                  <span key={st.id} className="studio-tag">
                    {st.name}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onEditSeries(series)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: 13 }}
                aria-label={`Edit ${series.title}`}
              >
                <PenLine size={13} />
                <span>Edit Franchise</span>
              </button>
              <button
                onClick={() => onDeleteSeries(series.id)}
                className="btn-icon danger"
                title="Delete franchise"
                aria-label={`Delete ${series.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Release Switcher List */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-desk-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Releases in Franchise
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {series.seasons?.map((s) => {
                const isSelected = selectedType === 'season' && selectedId === s.id;
                const isWatching = s.status === 'WATCHING';
                return (
                  <button
                    key={`tab-s-${s.id}`}
                    onClick={() => {
                      setSelectedType('season');
                      setSelectedId(s.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected
                        ? isWatching
                          ? 'var(--tungsten-dim)'
                          : 'var(--desk-surface-high)'
                        : 'var(--desk-surface)',
                      border: '1px solid',
                      borderColor: isSelected
                        ? isWatching
                          ? 'var(--tungsten)'
                          : 'var(--border-desk-medium)'
                        : 'var(--border-desk-subtle)',
                      color: isSelected
                        ? isWatching
                          ? 'var(--tungsten)'
                          : 'var(--text-desk)'
                        : 'var(--text-desk-muted)',
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Tv size={14} />
                    <span>Season {s.season_number}: {s.title}</span>
                    {s.rating && (
                      <span style={{ fontSize: 12, opacity: 0.85 }}>★{s.rating}</span>
                    )}
                  </button>
                );
              })}

              {series.movies?.map((m) => {
                const isSelected = selectedType === 'movie' && selectedId === m.id;
                const isWatching = m.status === 'WATCHING';
                return (
                  <button
                    key={`tab-m-${m.id}`}
                    onClick={() => {
                      setSelectedType('movie');
                      setSelectedId(m.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected
                        ? isWatching
                          ? 'var(--tungsten-dim)'
                          : 'var(--desk-surface-high)'
                        : 'var(--desk-surface)',
                      border: '1px solid',
                      borderColor: isSelected
                        ? isWatching
                          ? 'var(--tungsten)'
                          : 'var(--border-desk-medium)'
                        : 'var(--border-desk-subtle)',
                      color: isSelected
                        ? isWatching
                          ? 'var(--tungsten)'
                          : 'var(--text-desk)'
                        : 'var(--text-desk-muted)',
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Film size={14} />
                    <span>Film: {m.title}</span>
                    {m.rating && (
                      <span style={{ fontSize: 12, opacity: 0.85 }}>★{m.rating}</span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => onAddSeason(series)}
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '6px 12px' }}
              >
                <Plus size={13} />
                <span>Add Season</span>
              </button>
              <button
                onClick={() => onAddMovie(series)}
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '6px 12px' }}
              >
                <Plus size={13} />
                <span>Add Movie</span>
              </button>
            </div>
          </div>

          {/* Active Release Controls */}
          {activeRelease && (
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'var(--desk-surface)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span className={`status-indicator ${activeRelease.status?.toLowerCase()}`}>
                  {activeRelease.status}
                </span>

                {activeRelease.rating && (
                  <div className="rating-mono">
                    <span>{activeRelease.rating}</span>
                    <span className="rating-mono-sub">/10</span>
                  </div>
                )}

                {selectedType === 'season' && (
                  <ProgressStepper
                    current={(activeRelease as AnimeSeason).progress || 0}
                    total={(activeRelease as AnimeSeason).total_episodes}
                    unit="eps"
                    onDelta={(d) => onSeasonProgressDelta(activeRelease.id, d)}
                    ariaLabelPrefix={`${series.title} S${(activeRelease as AnimeSeason).season_number}`}
                  />
                )}

                {selectedType === 'movie' && (
                  <ProgressStepper
                    current={(activeRelease as AnimeMovie).progress_minutes || 0}
                    total={(activeRelease as AnimeMovie).total_minutes}
                    unit="mins"
                    step={10}
                    onDelta={(d) => onMovieProgressDelta(activeRelease.id, d)}
                    ariaLabelPrefix={`${(activeRelease as AnimeMovie).title}`}
                  />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => {
                    if (selectedType === 'season') {
                      onEditSeason(activeRelease as AnimeSeason);
                    } else {
                      onEditMovie(activeRelease as AnimeMovie);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 13 }}
                >
                  <PenLine size={13} />
                  <span>Edit Release</span>
                </button>
                {selectedType === 'season' && (
                  <button
                    onClick={() => onOpenEpisodeNotes(activeRelease as AnimeSeason)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    <Plus size={13} />
                    <span>Log Episode Note</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Primary Reading Column: Release Takeaway Slip */}
      {activeRelease && (
        <section>
          <div style={{ marginBottom: 12 }}>
            <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
              {selectedType === 'season'
                ? `Season ${(activeRelease as AnimeSeason).season_number} Reflection`
                : 'Film Reflection'}
            </h2>
          </div>

          <TakeawaySlip
            text={activeRelease.notes}
            label="Main Takeaway & Lessons"
            rating={activeRelease.rating}
            status={activeRelease.status}
            isDetail={true}
            onWrite={() => {
              if (selectedType === 'season') {
                onEditSeason(activeRelease as AnimeSeason);
              } else {
                onEditMovie(activeRelease as AnimeMovie);
              }
            }}
          />
        </section>
      )}

      {/* Episode Memories Section */}
      {selectedType === 'season' && activeRelease && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
                Episode Memories
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-desk-muted)' }}>
                Specific takeaways and thoughts per episode.
              </p>
            </div>

            <button
              onClick={() => onOpenEpisodeNotes(activeRelease as AnimeSeason)}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              <Plus size={14} />
              <span>Add Episode Memory</span>
            </button>
          </div>

          {(activeRelease as AnimeSeason).episode_notes &&
          (activeRelease as AnimeSeason).episode_notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(activeRelease as AnimeSeason).episode_notes.map((ep) => (
                <div key={ep.id} className="desk-card" style={{ padding: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--tungsten)',
                      }}
                    >
                      Episode {ep.episode_number}
                      {ep.episode_title ? `: ${ep.episode_title}` : ''}
                    </span>
                    {ep.rating && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          color: 'var(--text-desk)',
                        }}
                      >
                        ★ {ep.rating}/10
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: 'var(--text-desk)',
                    }}
                  >
                    {ep.note}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="desk-card"
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                color: 'var(--text-desk-muted)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15 }}>
                No episode notes captured yet for this season.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Characters in Franchise */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
              Memorable Characters
            </h2>
          </div>
          <button
            onClick={() => onAddCharacter(series)}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            <Plus size={14} />
            <span>Add Character</span>
          </button>
        </div>

        {franchiseCharacters.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {franchiseCharacters.map((char) => {
              const charImg =
                char.images && char.images.length > 0
                  ? (char.images[0] as any).image_url || (char.images[0] as any).url
                  : null;
              return (
                <div
                  key={char.id}
                  className="desk-card"
                  style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'start' }}
                >
                  {charImg ? (
                    <img
                      src={charImg}
                      alt={char.name}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid var(--border-desk-medium)',
                      }}
                      width={50}
                      height={50}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: 'var(--desk-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--graphite)',
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={20} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: 16, color: 'var(--text-desk)', marginBottom: 4 }}>
                      {char.name}
                    </h4>
                    {char.why && (
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 15,
                          color: 'var(--text-desk-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {char.why}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="desk-card"
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              color: 'var(--text-desk-muted)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15 }}>
              No favorite characters saved from this series yet.
            </p>
          </div>
        )}
      </section>

      {/* Rewatches in Franchise */}
      {seriesRewatches.length > 0 && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
              Rewatch History
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {seriesRewatches.map((r) => (
              <div key={r.id} className="desk-card" style={{ padding: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RotateCcw size={14} color="var(--tungsten)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-desk)' }}>
                      Rewatched {r.start_date || 'Pass'}
                    </span>
                  </div>
                  {r.rating && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--tungsten)' }}>
                      ★ {r.rating}/10
                    </span>
                  )}
                </div>
                {r.notes && (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: 'var(--text-desk)',
                    }}
                  >
                    {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
