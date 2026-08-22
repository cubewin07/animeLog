import React, { useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { SeriesTableView } from '../components/SeriesTableView';
import { Plus, Film, LayoutGrid, List } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface AnimeViewProps {
  seriesList: AnimeSeries[];
  searchQuery: string;
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const filterTabs: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Franchises', count: seriesList.length },
    {
      id: 'WATCHING',
      label: 'Watching',
      count: seriesList.filter((s) =>
        s.seasons.some((sea) => sea.status === 'WATCHING') ||
        s.movies.some((m) => m.status === 'WATCHING')
      ).length,
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: seriesList.filter((s) =>
        s.seasons.some((sea) => sea.status === 'COMPLETED') ||
        s.movies.some((m) => m.status === 'COMPLETED')
      ).length,
    },
    {
      id: 'PLAN_TO_WATCH',
      label: 'Plan to Watch',
      count: seriesList.filter((s) =>
        s.seasons.some((sea) => sea.status === 'PLAN_TO_WATCH') ||
        s.movies.some((m) => m.status === 'PLAN_TO_WATCH')
      ).length,
    },
    {
      id: 'ON_HOLD',
      label: 'On Hold',
      count: seriesList.filter((s) =>
        s.seasons.some((sea) => sea.status === 'ON_HOLD') ||
        s.movies.some((m) => m.status === 'ON_HOLD')
      ).length,
    },
    {
      id: 'DROPPED',
      label: 'Dropped',
      count: seriesList.filter((s) =>
        s.seasons.some((sea) => sea.status === 'DROPPED') ||
        s.movies.some((m) => m.status === 'DROPPED')
      ).length,
    },
  ];

  const filtered = seriesList.filter((series) => {
    const matchesStatus =
      selectedStatus === 'ALL' ||
      series.seasons.some((sea) => sea.status === selectedStatus) ||
      series.movies.some((m) => m.status === selectedStatus);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      series.title.toLowerCase().includes(q) ||
      series.seasons.some(
        (sea) =>
          sea.title.toLowerCase().includes(q) ||
          (sea.notes && sea.notes.toLowerCase().includes(q)) ||
          sea.studios.some((st) => st.name.toLowerCase().includes(q)) ||
          (sea.episode_notes &&
            sea.episode_notes.some(
              (ep) =>
                ep.note.toLowerCase().includes(q) ||
                (ep.episode_title && ep.episode_title.toLowerCase().includes(q))
            ))
      ) ||
      series.movies.some(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.notes && m.notes.toLowerCase().includes(q)) ||
          m.studios.some((st) => st.name.toLowerCase().includes(q))
      ) ||
      series.genres.some((g) => g.name.toLowerCase().includes(q)) ||
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
      const cards = contentAreaRef.current.querySelectorAll('.anime-grid-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 16, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: contentAreaRef, dependencies: [selectedStatus, viewMode, filtered.length, searchQuery] }
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Anime Franchises & Journal
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-primary)',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 600,
              }}
            >
              ARCHIVE
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Franchise hierarchy keeping series memories separate from TV-season and film progress.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(10, 24, 40, 0.9)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'table' ? 'var(--color-primary-action)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: viewMode === 'table' ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
              }}
              title="Editorial Series Table View"
            >
              <List size={15} /> Series Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--color-primary-action)' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: viewMode === 'cards' ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
              }}
              title="Interactive Cards View"
            >
              <LayoutGrid size={15} /> Cards View
            </button>
          </div>

          <button className="btn btn-primary" onClick={onOpenNewFranchiseModal} style={{ padding: '8px 18px' }}>
            <Plus size={16} /> Log Franchise
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary-action)' : 'var(--border-subtle)',
                background: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(12, 26, 44, 0.7)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  background: isActive ? 'var(--color-primary-action)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Table or Cards */}
      <div ref={contentAreaRef}>
        {filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: '56px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'rgba(11, 24, 40, 0.65)',
            }}
          >
            <Film size={40} color="var(--color-primary)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '8px' }}>
              No Anime Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              {searchQuery
                ? `No entries match "${searchQuery}". Try refining your search query.`
                : 'There are no anime franchises under this status filter yet.'}
            </p>
            <button className="btn btn-secondary" onClick={onOpenNewFranchiseModal}>
              <Plus size={15} /> Log Your First Franchise
            </button>
          </div>
        ) : viewMode === 'table' ? (
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
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: '24px',
            }}
          >
            {filtered.map((series) => (
              <div key={series.id} className="anime-grid-card">
                <AnimeCard
                  series={series}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
