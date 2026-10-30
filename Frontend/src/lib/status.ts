import { AnimeStatus, BookStatus } from '../types';

export interface StatusMeta {
  label: string;
  dotColor: string;
  tone: 'watching' | 'reading' | 'completed' | 'plan' | 'hold' | 'dropped';
}

export const STATUS_META: Record<AnimeStatus | BookStatus, StatusMeta> = {
  WATCHING: {
    label: 'Watching',
    dotColor: 'var(--status-watching-color)',
    tone: 'watching',
  },
  READING: {
    label: 'Reading',
    dotColor: 'var(--status-reading-color)',
    tone: 'reading',
  },
  COMPLETED: {
    label: 'Finished',
    dotColor: 'var(--status-completed-color)',
    tone: 'completed',
  },
  PLAN_TO_WATCH: {
    label: 'Up next',
    dotColor: 'var(--status-plan-color)',
    tone: 'plan',
  },
  PLAN_TO_READ: {
    label: 'Up next',
    dotColor: 'var(--status-plan-color)',
    tone: 'plan',
  },
  ON_HOLD: {
    label: 'Paused',
    dotColor: 'var(--status-hold-color)',
    tone: 'hold',
  },
  DROPPED: {
    label: 'Set aside',
    dotColor: 'var(--status-dropped-color)',
    tone: 'dropped',
  },
};

export function getStatusMeta(status: AnimeStatus | BookStatus | string | undefined | null): StatusMeta {
  if (!status) {
    return {
      label: 'Unknown',
      dotColor: 'var(--text-3)',
      tone: 'plan',
    };
  }
  return STATUS_META[status as AnimeStatus | BookStatus] || {
    label: status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
    dotColor: 'var(--text-3)',
    tone: 'plan',
  };
}
