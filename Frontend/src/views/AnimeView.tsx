import React, { useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import { FranchiseRow } from '../components/FranchiseRow';
import { SeriesTableView } from '../components/SeriesTableView';
import { Plus, BookMarked, LayoutList, Table as TableIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface AnimeViewProps {
  seriesList: AnimeSeries[];
  searchQuery: string;
  onOpenDetail?: (seriesId: number) => void;
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
  onOpenNewFranchiseModal: () => void;
}

export const AnimeView: React.FC<AnimeViewProps> = ({
  seriesList,
  searchQuery,
  onOpenDetail,
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
  onOpenNewFranchiseModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'journal' | 'table'>('journal');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const filterTabs: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Franchises', count: seriesList.length },
    {
      id: 'WATCHING',
      label: 'Watching',
      count: seriesList.filter((s) =>
        s.seasons?.some((sea) => sea.status === 'WATCHING') ||
        s.movies?.some((m) => m.status === 'WATCHING')
      ).length,
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: seriesList.filter((s) =>
        s.seasons?.some((sea) => sea.status === 'COMPLETED') ||
        s.movies?.some((m) => m.status === 'COMPLETED')
      ).length,
    },
    {
      id: 'PLAN_TO_WATCH',
      label: 'Plan to Watch',
      count: seriesList.filter((s) =>
        s.seasons?.some((sea) => sea.status === 'PLAN_TO_WATCH') ||
        s.movies?.some((m) => m.status === 'PLAN_TO_WATCH')
      ).length,
    },
    {
      id: 'ON_HOLD',
      label: 'On Hold',
      count: seriesList.filter((s) =>
        s.seasons?.some((sea) => sea.status === 'ON_HOLD') ||
        s.movies?.some((m) => m.status === 'ON_HOLD')
      ).length,
    },
    {
      id: 'DROPPED',
      label: 'Dropped',
      count: seriesList.filter((s) =>
        s.seasons?.some((sea) => sea.status === 'DROPPED') ||
        s.movies?.some((m) => m.status === 'DROPPED')
      ).length,
    },
  ];

  const filtered = seriesList.filter((series) => {
    const matchesStatus =
      selectedStatus === 'ALL' ||
      series.seasons?.some((sea) => sea.status === selectedStatus) ||
      series.movies?.some((m) => m.status === selectedStatus);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      series.title.toLowerCase().includes(q) ||
      series.seasons?.some(
        (sea) =>
          sea.title?.toLowerCase().includes(q) ||
          (sea.notes && sea.notes.toLowerCase().includes(q)) ||
          sea.studios?.some((st) => st.name.toLowerCase().includes(q)) ||
          (sea.episode_notes &&
            sea.episode_notes.some(
              (ep) =>
                ep.note?.toLowerCase().includes(q) ||
                (ep.episode_title && ep.episode_title.toLowerCase().includes(q))
            ))
      ) ||
      series.movies?.some(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          (m.notes && m.notes.toLowerCase().includes(q)) ||
          m.studios?.some((st) => st.name.toLowerCase().includes(q))
      ) ||
      series.genres?.some((g) => g.name.toLowerCase().includes(q)) ||
      (series.studios && series.studios.some((st) => st.name.toLowerCase().includes(q))) ||
      (series.favorite_characters &&
        series.favorite_characters.some(
          (c) => c.name.toLowerCase().includes(q) || (c.why && c.why.toLowerCase().includes(q))
        ));

    return matchesStatus && matchesSearch;
  });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentAreaRef.current) return;
      const rows = contentAreaRef.current.querySelectorAll('.desk-card');
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
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
    { scope: contentAreaRef, dependencies: [selectedStatus, viewMode, filtered.length, searchQuery] }
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Controls Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 4 }}>
            Anime Journal
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-desk-muted)' }}>
            Franchise records, season reflections, film takeaways, and episode memories.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--desk-surface)',
              padding: 3,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-desk-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('journal')}
              className="btn-icon"
              style={{
                backgroundColor: viewMode === 'journal' ? 'var(--desk-raised)' : 'transparent',
                color: viewMode === 'journal' ? 'var(--tungsten)' : 'var(--text-desk-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                width: 'auto',
                height: 'auto',
              }}
              title="Journal view"
              aria-label="Switch to journal view"
            >
              <LayoutList size={14} />
              <span>Journal</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="btn-icon"
              style={{
                backgroundColor: viewMode === 'table' ? 'var(--desk-raised)' : 'transparent',
                color: viewMode === 'table' ? 'var(--tungsten)' : 'var(--text-desk-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                width: 'auto',
                height: 'auto',
              }}
              title="Compact table view"
              aria-label="Switch to compact table view"
            >
              <TableIcon size={14} />
              <span>Compact</span>
            </button>
          </div>

          <button onClick={onOpenNewFranchiseModal} className="btn btn-primary">
            <Plus size={15} />
            <span>Log Franchise</span>
          </button>
        </div>
      </div>

      <div className="filter-chip-row" role="tablist" aria-label="Filter by status">
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
            >
              <span>{tab.label}</span>
              <span className="chip-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area: Journal List vs Table */}
      <div ref={contentAreaRef}>
        {filtered.length === 0 ? (
          <div
            className="desk-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <BookMarked size={36} color="var(--graphite)" />
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>No anime entries found</h3>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic', maxWidth: 460 }}>
              {searchQuery
                ? `No entries match "${searchQuery}". Try a different keyword.`
                : 'No franchises match this filter status. Begin logging your anime memories.'}
            </p>
            {!searchQuery && (
              <button onClick={onOpenNewFranchiseModal} className="btn btn-primary" style={{ marginTop: 8 }}>
                <Plus size={15} />
                <span>Log first franchise</span>
              </button>
            )}
          </div>
        ) : viewMode === 'journal' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filtered.map((series) => (
              <FranchiseRow
                key={series.id}
                series={series}
                onOpenDetail={onOpenDetail}
                onEditSeries={onEditSeries}
                onDeleteSeries={onDeleteSeries}
                onAddSeason={onAddSeason}
                onAddMovie={onAddMovie}
                onEditSeason={onEditSeason}
                onEditMovie={onEditMovie}
                onSeasonProgressDelta={onSeasonProgressDelta}
                onMovieProgressDelta={onMovieProgressDelta}
              />
            ))}
          </div>
        ) : (
          <SeriesTableView
            seriesList={filtered}
            onEditSeries={onEditSeries}
            onDeleteSeries={onDeleteSeries}
            onAddSeason={onAddSeason}
            onAddMovie={onAddMovie}
            onEditSeason={onEditSeason}
            onDeleteSeason={onDeleteSeason}
            onSeasonProgressDelta={onSeasonProgressDelta}
            onEditMovie={onEditMovie}
            onDeleteMovie={onDeleteMovie}
            onMovieProgressDelta={onMovieProgressDelta}
            onOpenEpisodeNotes={onOpenEpisodeNotes}
            onAddRewatchSeason={onAddRewatchSeason}
            onAddRewatchMovie={onAddRewatchMovie}
            onAddCharacter={onAddCharacter}
          />
        )}
      </div>
    </div>
  );
};
