import React from 'react';
import { AnimeSeries, Rewatch } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { Plus, RotateCcw } from 'lucide-react';

interface RewatchesViewProps {
  rewatches: Rewatch[];
  seriesList: AnimeSeries[];
  searchQuery: string;
  onDelete: (id: number) => void;
  onOpenRewatchModal: () => void;
}

export const RewatchesView: React.FC<RewatchesViewProps> = ({
  rewatches,
  seriesList,
  searchQuery,
  onDelete,
  onOpenRewatchModal,
}) => {
  const filtered = rewatches.filter((r) => {
    return (
      searchQuery.trim() === '' ||
      (r.release_title && r.release_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', color: '#ffffff' }}>Rewatches Journal</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            First-class rewatch passes across seasons and films. Compare how your mindset deepened over time.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenRewatchModal}>
          <Plus size={16} /> Log Rewatch
        </button>
      </div>

      <RewatchTimeline rewatches={filtered} onDelete={onDelete} />
    </div>
  );
};
