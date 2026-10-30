import React, { useState } from 'react';
import { AnimeSeries, Rewatch, RewatchTargetType } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { RewatchDetailModal } from '../components/RewatchDetailModal';
import { Button, EmptyState } from '../ui';
import { useJournal } from '../state/JournalContext';
import { Plus, RotateCcw, Search, Sparkles, X } from 'lucide-react';
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
  seriesList,
  searchQuery,
  onEdit,
  onDelete,
  onOpenRewatchModal,
  onNavigateSeries,
}) => {
  const { openComposer } = useJournal();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | RewatchTargetType>('ALL');
  const [selectedRewatch, setSelectedRewatch] = useState<Rewatch | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  const trimmedQuery = localQuery.trim();
  const filtered = filterRewatches(rewatches, selectedTypeFilter, trimmedQuery);
  const ledgerStats = getSpineLedgerStats(rewatches);
  const passMap = passNumbers(rewatches);

  const typeTabs: { id: 'ALL' | RewatchTargetType; label: string; count: number }[] = [
    {
      id: 'ALL',
      label: 'All Passes',
      count: rewatches.length,
    },
    {
      id: 'series',
      label: 'Franchises',
      count: rewatches.filter((r) => targetType(r) === 'series').length,
    },
    {
      id: 'season',
      label: 'Seasons',
      count: rewatches.filter((r) => targetType(r) === 'season').length,
    },
    {
      id: 'movie',
      label: 'Films',
      count: rewatches.filter((r) => targetType(r) === 'movie').length,
    },
    {
      id: 'episode',
      label: 'Episodes',
      count: rewatches.filter((r) => targetType(r) === 'episode').length,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeIn var(--dur-base) var(--ease-smooth)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--lamp)',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            <RotateCcw size={14} />
            <span>Returns & Deepening Lessons</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.2vw, 36px)',
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            How Eyes Change When Returning
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 6, maxWidth: 640, lineHeight: 1.5 }}>
            Rewatching is how lessons deepen. Compare your first pass with later viewings to see how your philosophy and perspective evolved.
          </p>

          {/* Ledger Ribbon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text-3)',
            }}
          >
            <span>{ledgerStats.totalPasses} {ledgerStats.totalPasses === 1 ? 'pass' : 'passes'}</span>
            <span>·</span>
            <span>{ledgerStats.totalTitles} {ledgerStats.totalTitles === 1 ? 'title' : 'titles'}</span>
            <span>·</span>
            <span>{ledgerStats.totalReflections} {ledgerStats.totalReflections === 1 ? 'reflection' : 'reflections'}</span>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={onOpenRewatchModal}
        >
          Log a Return
        </Button>
      </header>

      {/* Target Type Filter Chips & Search Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          paddingBottom: 16,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="tablist" aria-label="Filter rewatches">
          {typeTabs.map((tab) => {
            const isActive = selectedTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                role="tab"
                aria-selected={isActive}
                style={{
                  background: isActive ? 'var(--lamp)' : 'var(--surface)',
                  color: isActive ? 'var(--text-inverse)' : 'var(--text-2)',
                  border: `1px solid ${isActive ? 'var(--lamp)' : 'var(--line)'}`,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-full)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all var(--dur-fast) var(--ease-smooth)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: isActive ? 0.9 : 0.6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(0,0,0,0.18)' : 'var(--surface-sunken)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search return notes & titles…"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 34,
              paddingRight: localQuery ? 32 : 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color var(--dur-fast) var(--ease-smooth)',
            }}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => setLocalQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 2,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content / Empty States */}
      {rewatches.length === 0 ? (
        <EmptyState
          icon={<RotateCcw size={32} />}
          title="No returns logged yet"
          description="Rewatching is how lessons deepen. Log your second or third passes through franchises, seasons, films, or pivotal episodes to record how your perspective evolved over time."
          action={
            <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenRewatchModal}>
              Log first return
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No return passes found"
          description={
            trimmedQuery
              ? `No rewatch passes matched "${trimmedQuery}".`
              : 'No returns logged under this category yet.'
          }
        />
      ) : (
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
