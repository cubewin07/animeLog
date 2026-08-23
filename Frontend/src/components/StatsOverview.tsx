import React from 'react';
import { JournalStats } from '../types';
import { JournalStrip } from './JournalStrip';

interface StatsOverviewProps {
  stats: JournalStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return <JournalStrip stats={stats} />;
};

export { JournalStrip };
