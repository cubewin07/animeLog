import React from 'react';
import { Anime, Rewatch } from '../types';
import { RewatchTimeline } from '../components/RewatchTimeline';
import { Plus, RotateCcw } from 'lucide-react';

interface RewatchesViewProps {
  rewatches: Rewatch[];
  animeList: Anime[];
  searchQuery: string;
  onDelete: (id: number) => void;
  onOpenRewatchModal: () => void;
}

export const RewatchesView: React.FC<RewatchesViewProps> = ({
  rewatches,
  searchQuery,
  onDelete,
  onOpenRewatchModal,
}) => {
  const filtered = rewatches.filter((r) => {
    return (
      searchQuery.trim() === '' ||
      (r.anime_title && r.anime_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
            First-class rewatch passes. Compare how your mindset and takeaways deepened across time.
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
