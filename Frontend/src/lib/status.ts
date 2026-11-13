import { AnimeStatus, BookStatus } from '../types';

export interface StatusMeta {
  label: string;
  dotColor: string;
  tone: 'watching' | 'reading' | 'completed' | 'plan' | 'hold' | 'dropped';
}

export const STATUS_META: Record<AnimeStatus | BookStatus, StatusMeta> = {
  WATCHING: {
    label: 'Watching',
    dotColor: 'var(--kf-brand)',
    tone: 'watching',
  },
  READING: {
    label: 'Reading',
    dotColor: 'var(--kf-brand)',
    tone: 'reading',
  },
  COMPLETED: {
    label: 'Completed',
    dotColor: 'var(--kf-completed)',
    tone: 'completed',
  },
  PLAN_TO_WATCH: {
    label: 'Plan to watch',
    dotColor: 'var(--kf-plan)',
    tone: 'plan',
  },
  PLAN_TO_READ: {
    label: 'Plan to read',
    dotColor: 'var(--kf-plan)',
    tone: 'plan',
  },
  ON_HOLD: {
    label: 'On hold',
    dotColor: 'var(--kf-hold)',
    tone: 'hold',
  },
  DROPPED: {
    label: 'Dropped',
    dotColor: 'var(--kf-dropped)',
    tone: 'dropped',
  },
};

export function getStatusMeta(status: AnimeStatus | BookStatus | string | undefined | null): StatusMeta {
  if (!status) {
    return {
      label: 'Unknown',
      dotColor: 'var(--kf-text-2)',
      tone: 'plan',
    };
  }
  return STATUS_META[status as AnimeStatus | BookStatus] || {
    label: status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
    dotColor: 'var(--kf-text-2)',
    tone: 'plan',
  };
}

