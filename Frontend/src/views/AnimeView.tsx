import React, { useState, useRef } from 'react';
import { Anime } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { SeriesTableView } from '../components/SeriesTableView';
import { Plus, Film, LayoutGrid, List } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface AnimeViewProps {
  animeList: Anime[];
  searchQuery: string;
  onEdit: (anime: Anime) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
  onAddRewatch: (anime: Anime) => void;
  onAddCharacter: (anime: Anime) => void;
  onOpenNewModal: () => void;
}

export const AnimeView: React.FC<AnimeViewProps> = ({
  animeList,
  searchQuery,
  onEdit,
  onDelete,
  onProgressDelta,
  onAddRewatch,
  onAddCharacter,
  onOpenNewModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const filterTabs: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Series', count: animeList.length },
    {
      id: 'WATCHING',
      label: 'Watching',
      count: animeList.filter((a) => a.status === 'WATCHING').length,
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: animeList.filter((a) => a.status === 'COMPLETED').length,
    },
    {
      id: 'PLAN_TO_WATCH',
      label: 'Plan to Watch',
      count: animeList.filter((a) => a.status === 'PLAN_TO_WATCH').length,
    },
    {
      id: 'ON_HOLD',
      label: 'On Hold',
      count: animeList.filter((a) => a.status === 'ON_HOLD').length,
    },
    {
      id: 'DROPPED',
      label: 'Dropped',
      count: animeList.filter((a) => a.status === 'DROPPED').length,
    },
  ];

  const filtered = animeList.filter((anime) => {
    const matchesStatus = selectedStatus === 'ALL' || anime.status === selectedStatus;
    const matchesSearch =
      searchQuery.trim() === '' ||
      anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (anime.notes && anime.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (anime.studios && anime.studios.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (anime.genres && anime.genres.some((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesStatus && matchesSearch;
  });

  // Stagger cards or content when filter/viewMode changes
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
    <div ref={containerRef}>
      {/* Header & Controls Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', color: '#ffffff' }}>Anime Series & Journal</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            High-clarity overview of all series, seasons, episode progress, and lessons.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(18, 33, 49, 0.9)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'table' ? 'var(--color-primary-action)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="High-Clarity Series Table"
            >
              <List size={14} /> Series Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--color-primary-action)' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Journal Cards View"
            >
              <LayoutGrid size={14} /> Journal Cards
            </button>
          </div>

          <button className="btn btn-primary" onClick={onOpenNewModal}>
            <Plus size={16} /> Log Series
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
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
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary-action)' : 'var(--border-subtle)',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(18, 33, 49, 0.6)',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  background: isActive ? 'var(--color-primary-action)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '10px',
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
            style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <Film size={36} color="var(--color-primary)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '17px', color: '#ffffff', marginBottom: '6px' }}>
              No Anime Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 16px' }}>
              {searchQuery
                ? `No entries match "${searchQuery}". Try refining your search query.`
                : 'There are no series under this status filter yet.'}
            </p>
            <button className="btn btn-secondary" onClick={onOpenNewModal}>
              <Plus size={15} /> Log Your First Series
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <SeriesTableView
            animeList={filtered}
            onEdit={onEdit}
            onDelete={onDelete}
            onProgressDelta={onProgressDelta}
            onAddRewatch={onAddRewatch}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((anime) => (
              <div key={anime.id} className="anime-grid-card">
                <AnimeCard
                  anime={anime}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onProgressDelta={onProgressDelta}
                  onAddRewatch={onAddRewatch}
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
