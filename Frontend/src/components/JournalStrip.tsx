import React from 'react';
import { JournalStats } from '../types';

interface JournalStripProps {
  stats: JournalStats;
}

export const JournalStrip: React.FC<JournalStripProps> = ({ stats }) => {
  return (
    <div
      className="desk-panel"
      style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px 24px',
        fontSize: 14,
        color: 'var(--text-desk-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <span>
          <strong style={{ color: 'var(--text-desk)', fontWeight: 600 }}>{stats.activeWatching}</strong> watching
        </span>
        <span style={{ color: 'var(--border-desk-medium)' }}>·</span>
        <span>
          <strong style={{ color: 'var(--text-desk)', fontWeight: 600 }}>{stats.activeReading}</strong> reading
        </span>
        <span style={{ color: 'var(--border-desk-medium)' }}>·</span>
        <span>
          <strong style={{ color: 'var(--text-desk)', fontWeight: 600 }}>{stats.totalLessons}</strong> lessons
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
        <span>
          <strong style={{ color: 'var(--text-desk-muted)', fontWeight: 600 }}>{stats.totalCompleted}</strong> completed
        </span>
        <span style={{ color: 'var(--border-desk-medium)' }}>·</span>
        <span>
          <strong style={{ color: 'var(--text-desk-muted)', fontWeight: 600 }}>{stats.rewatchesCount}</strong> rewatches
        </span>
        <span style={{ color: 'var(--border-desk-medium)' }}>·</span>
        <span>
          <strong style={{ color: 'var(--text-desk-muted)', fontWeight: 600 }}>{stats.charactersCount}</strong> characters
        </span>
      </div>
    </div>
  );
};
