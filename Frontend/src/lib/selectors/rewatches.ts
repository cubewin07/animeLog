import type { Rewatch } from '../../types';

export type ReleaseRef = { type: 'season' | 'movie'; id: number; seriesId: number };

/**
 * Rewatches belonging to one release, plus rewatches of the whole series.
 * Season and movie IDs come from separate tables, so the ID alone never identifies a release.
 */
export function rewatchesForRelease(rewatches: Rewatch[], release: ReleaseRef): Rewatch[] {
  return rewatches.filter((r) => {
    if (r.target_type === 'series') return r.series_id === release.seriesId;
    return release.type === 'season' ? r.season_id === release.id : r.movie_id === release.id;
  });
}
