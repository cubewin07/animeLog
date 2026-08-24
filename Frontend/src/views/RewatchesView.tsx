import React, { useState } from 'react';
import { AnimeSeries, Rewatch, RewatchTargetType } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { Plus } from 'lucide-react';

interface RewatchesViewProps {
  rewatches: Rewatch[];
  seriesList?: AnimeSeries[];
  searchQuery: string;
  onEdit?: (rewatch: Rewatch) => void;
  onDelete: (id: number) => void;
  onOpenRewatchModal: () => void;
  onNavigateSeries?: (seriesId: number) => void;
}

export const RewatchesView: React.FC<RewatchesViewProps> = ({
  rewatches,
  searchQuery,
  onEdit,
  onDelete,
  onOpenRewatchModal,
  onNavigateSeries,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | RewatchTargetType>('ALL');
  const q = searchQuery.toLowerCase().trim();

  const typeTabs: { id: 'ALL' | RewatchTargetType; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Passes', count: rewatches.length },
    {
      id: 'season',
      label: 'Seasons',
      count: rewatches.filter((r) => (r.target_type || (r.movie ? 'movie' : 'season')) === 'season').length,
    },
    {
      id: 'movie',
      label: 'Films',
      count: rewatches.filter((r) => (r.target_type || (r.movie ? 'movie' : 'season')) === 'movie').length,
    },
    {
      id: 'episode',
      label: 'Episodes',
      count: rewatches.filter((r) => (r.target_type || (r.movie ? 'movie' : 'season')) === 'episode').length,
    },
    {
      id: 'series',
      label: 'Franchises',
      count: rewatches.filter((r) => (r.target_type || (r.movie ? 'movie' : 'season')) === 'series').length,
    },
  ];

  const filtered = rewatches.filter((r) => {
    const tType = r.target_type || (r.movie ? 'movie' : 'season');
    const matchesType = selectedTypeFilter === 'ALL' || tType === selectedTypeFilter;

    const matchesSearch =
      q === '' ||
      (r.release_title && r.release_title.toLowerCase().includes(q)) ||
      (r.series_title && r.series_title.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
            Rewatches Journal
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-desk-muted)' }}>
            First-class rewatch passes across seasons and films. Compare how your mindset deepened over time.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenRewatchModal}>
          <Plus size={15} />
          <span>Log Rewatch</span>
        </button>
      </div>

      {/* Target Type Filter Chips */}
      <div className="filter-chip-row" role="tablist" aria-label="Filter rewatches by target type">
        {typeTabs.map((tab) => {
          const isActive = selectedTypeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id)}
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

      <RewatchTimeline
        rewatches={filtered}
        onEdit={onEdit}
        onDelete={onDelete}
        onNavigateSeries={onNavigateSeries}
      />
    </div>
  );
};
