import React from 'react';
import { AnimeSeries, Rewatch } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { Plus } from 'lucide-react';

interface RewatchesViewProps {
  rewatches: Rewatch[];
  seriesList?: AnimeSeries[];
  searchQuery: string;
  onEdit?: (rewatch: Rewatch) => void;
  onDelete: (id: number) => void;
  onOpenRewatchModal: () => void;
}

export const RewatchesView: React.FC<RewatchesViewProps> = ({
  rewatches,
  searchQuery,
  onEdit,
  onDelete,
  onOpenRewatchModal,
}) => {
  const q = searchQuery.toLowerCase().trim();
  const filtered = rewatches.filter((r) => {
    return (
      q === '' ||
      (r.release_title && r.release_title.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
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

      <RewatchTimeline rewatches={filtered} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};
