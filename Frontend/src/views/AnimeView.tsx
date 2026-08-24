import React, { useState, useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries } from '../types';
import { FranchiseCard } from '../components/FranchiseCard';
import { Plus, BookMarked } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface AnimeViewProps {
  seriesList: AnimeSeries[];
  searchQuery: string;
  onOpenDetail?: (seriesId: number) => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason?: (series: AnimeSeries) => void;
  onAddMovie?: (series: AnimeSeries) => void;
  onEditSeason?: (season: AnimeSeason) => void;
  onDeleteSeason?: (id: number) => void;
  onSeasonProgressDelta?: (id: number, delta: number) => void;
  onEditMovie?: (movie: AnimeMovie) => void;
  onDeleteMovie?: (id: number) => void;
  onMovieProgressDelta?: (id: number, delta: number) => void;
  onOpenEpisodeNotes?: (season: AnimeSeason) => void;
  onAddRewatchSeason?: (season: AnimeSeason) => void;
  onAddRewatchMovie?: (movie: AnimeMovie) => void;
  onAddCharacter?: (series: AnimeSeries) => void;
  onOpenNewFranchiseModal: () => void;
}

export const AnimeView: React.FC<AnimeViewProps> = ({
  seriesList,
  searchQuery,
  onOpenDetail,
  onEditSeries,
  onDeleteSeries,
  onOpenNewFranchiseModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
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
      const cards = contentAreaRef.current.querySelectorAll('.anime-card, .desk-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: contentAreaRef, dependencies: [selectedStatus, filtered.length, searchQuery] }
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
            Franchise gallery, season logs, and watch progress at a glance.
          </p>
        </div>

        <button onClick={onOpenNewFranchiseModal} className="btn btn-primary">
          <Plus size={15} />
          <span>Log Franchise</span>
        </button>
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

      {/* Content Area: Gallery Grid */}
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
        ) : (
          <div className="anime-grid">
            {filtered.map((series) => (
              <FranchiseCard
                key={series.id}
                series={series}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
