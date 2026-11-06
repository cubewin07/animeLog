import type { AnimeSeries, AnimeStatus } from '../../types';

/**
 * One status for a whole series, derived from its seasons and movies.
 * Library filters and their counts must both use this so they always agree.
 */
export function overallSeriesStatus(series: Pick<AnimeSeries, 'seasons' | 'movies'>): AnimeStatus {
  const statuses = [...(series.seasons ?? []), ...(series.movies ?? [])].map((r) => r.status);
  if (statuses.length === 0) return 'PLAN_TO_WATCH';
  if (statuses.includes('WATCHING')) return 'WATCHING';
  if (statuses.includes('ON_HOLD')) return 'ON_HOLD';
  if (statuses.includes('PLAN_TO_WATCH')) return 'PLAN_TO_WATCH';
  if (statuses.includes('COMPLETED')) return 'COMPLETED';
  return 'DROPPED';
}
