import React, { useState } from 'react';
import { AnimeSeries, Rewatch, RewatchTargetType } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { RewatchDetailModal } from '../components/RewatchDetailModal';
import { Plus, RotateCcw, Search } from 'lucide-react';
import {
  filterRewatches,
  getSpineLedgerStats,
  passNumbers,
  targetType,
} from './rewatchSpine';

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
  const [selectedRewatch, setSelectedRewatch] = useState<Rewatch | null>(null);

  const trimmedQuery = searchQuery.trim();
  const filtered = filterRewatches(rewatches, selectedTypeFilter, trimmedQuery);
  const ledgerStats = getSpineLedgerStats(rewatches);
  const passMap = passNumbers(rewatches);

  const typeTabs: { id: 'ALL' | RewatchTargetType; label: string; count: number; activeClass: string }[] = [
    {
      id: 'ALL',
      label: 'All',
      count: rewatches.length,
      activeClass: 'active-all',
    },
    {
      id: 'series',
      label: 'Franchises',
      count: rewatches.filter((r) => targetType(r) === 'series').length,
      activeClass: 'active-series',
    },
    {
      id: 'season',
      label: 'Seasons',
      count: rewatches.filter((r) => targetType(r) === 'season').length,
      activeClass: 'active-season',
    },
    {
      id: 'movie',
      label: 'Films',
      count: rewatches.filter((r) => targetType(r) === 'movie').length,
      activeClass: 'active-movie',
    },
    {
      id: 'episode',
      label: 'Episodes',
      count: rewatches.filter((r) => targetType(r) === 'episode').length,
      activeClass: 'active-episode',
    },
  ];

  const getFilterEmptyLabel = () => {
    if (selectedTypeFilter === 'series') return 'franchise';
    if (selectedTypeFilter === 'season') return 'season';
    if (selectedTypeFilter === 'movie') return 'film';
    if (selectedTypeFilter === 'episode') return 'episode';
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 4 }}>
            Rewatches
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-desk-muted)', marginBottom: 8 }}>
            What changed when you came back.
          </p>

          {/* Quiet Mono Ledger */}
          <div className="rewatch-spine-ledger">
            <span>
              {ledgerStats.totalPasses} {ledgerStats.totalPasses === 1 ? 'pass' : 'passes'}
            </span>
            <span className="ledger-sep">·</span>
            <span>
              {ledgerStats.totalTitles} {ledgerStats.totalTitles === 1 ? 'title' : 'titles'}
            </span>
            <span className="ledger-sep">·</span>
            <span>
              {ledgerStats.totalReflections} {ledgerStats.totalReflections === 1 ? 'reflection' : 'reflections'}
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onOpenRewatchModal}>
          <Plus size={15} />
          <span>Log a rewatch</span>
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
              className={`filter-chip ${isActive ? `active ${tab.activeClass}` : ''}`}
              role="tab"
              aria-selected={isActive}
            >
              <span>{tab.label}</span>
              <span className="chip-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search Feedback */}
      {trimmedQuery && (
        <div className="rewatch-search-feedback">
          Showing {filtered.length} {filtered.length === 1 ? 'match' : 'matches'} for &ldquo;{trimmedQuery}&rdquo;
        </div>
      )}

      {/* Content / Empty States */}
      {rewatches.length === 0 ? (
        /* 1. Global Empty Journal */
        <div
          className="desk-card"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            color: 'var(--text-desk-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <RotateCcw size={36} color="var(--graphite)" style={{ marginBottom: 4 }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-desk)', margin: 0 }}>
            No rewatches logged yet
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              color: 'var(--text-desk-muted)',
              fontStyle: 'italic',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            Rewatching is how lessons deepen. Log your second or third passes through franchises, seasons, films, or pivotal episodes to record how your perspective evolved over time.
          </p>
          <button className="btn btn-primary" onClick={onOpenRewatchModal} style={{ marginTop: 8 }}>
            <Plus size={15} />
            <span>Log a rewatch</span>
          </button>
        </div>
      ) : filtered.length === 0 && trimmedQuery ? (
        /* 2. Search Empty State */
        <div
          className="desk-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-desk-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={32} color="var(--graphite)" style={{ marginBottom: 4 }} />
          <h3 style={{ fontSize: 17, color: 'var(--text-desk)', margin: 0 }}>
            No matches found
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-desk-muted)', margin: 0, maxWidth: 420 }}>
            No rewatch passes matched &ldquo;{trimmedQuery}&rdquo;. Try searching for another title, episode, or takeaway keyword.
          </p>
        </div>
      ) : filtered.length === 0 && selectedTypeFilter !== 'ALL' ? (
        /* 3. Filter Empty State */
        <div
          className="desk-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-desk-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <RotateCcw size={32} color="var(--graphite)" style={{ marginBottom: 4 }} />
          <h3 style={{ fontSize: 17, color: 'var(--text-desk)', margin: 0, textTransform: 'capitalize' }}>
            No {getFilterEmptyLabel()} rewatches yet
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-desk-muted)', margin: 0, maxWidth: 420 }}>
            Log a pass to start tracking your returns to this format.
          </p>
          <button className="btn btn-secondary" onClick={onOpenRewatchModal} style={{ marginTop: 6 }}>
            <Plus size={14} />
            <span>Log a rewatch</span>
          </button>
        </div>
      ) : (
        /* Spine List */
        <RewatchTimeline
          rewatches={filtered}
          allRewatches={rewatches}
          selectedRewatchId={selectedRewatch?.id}
          onSelectRewatch={(r) => setSelectedRewatch(r)}
        />
      )}

      {/* Dedicated Return Note Reader Modal */}
      <RewatchDetailModal
        isOpen={selectedRewatch !== null}
        rewatch={selectedRewatch}
        passNumber={selectedRewatch ? passMap.get(selectedRewatch.id) : undefined}
        onClose={() => setSelectedRewatch(null)}
        onEdit={(r) => {
          setSelectedRewatch(null);
          onEdit?.(r);
        }}
        onDelete={(id) => {
          setSelectedRewatch(null);
          onDelete(id);
        }}
        onNavigateSeries={(seriesId) => {
          setSelectedRewatch(null);
          onNavigateSeries?.(seriesId);
        }}
      />
    </div>
  );
};
