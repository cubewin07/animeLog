import { Rewatch, RewatchTargetType } from '../types';

/**
 * Normalizes target_type with legacy fallback.
 */
export function targetType(r: Rewatch): RewatchTargetType {
  if (r.target_type) return r.target_type;
  if (r.movie) return 'movie';
  return 'season';
}

/**
 * Returns a stable target key to group passes for the same item.
 * - series: series:<target_id>
 * - season: season:<target_id>
 * - movie: movie:<target_id>
 * - episode: episode:<season_id>:<episode_number>
 */
export function targetKey(r: Rewatch): string {
  const type = targetType(r);
  if (type === 'series') {
    const id = r.series_id ?? r.target_id;
    return `series:${id}`;
  }
  if (type === 'season') {
    const id = r.season_id ?? (r.target_type === 'season' ? r.target_id : r.season ?? r.target_id);
    return `season:${id}`;
  }
  if (type === 'movie') {
    const id = r.movie_id ?? (r.target_type === 'movie' ? r.target_id : r.movie ?? r.target_id);
    return `movie:${id}`;
  }
  if (type === 'episode') {
    const sId = r.season_id ?? r.target_id;
    const epNum = r.episode_number ?? '';
    return `episode:${sId}:${epNum}`;
  }
  return `target:${r.target_id}`;
}

/**
 * Returns sort date key (prefers finish_date, else start_date).
 */
export function sortKey(r: Rewatch): string | null {
  return r.finish_date || r.start_date || null;
}

/**
 * Global newest-first comparator:
 * 1. Dated items before undated items
 * 2. Newest date first (descending string compare)
 * 3. Tie-breaker: higher ID first (-id)
 * 4. Undated items sorted by higher ID first (-id)
 */
export function compareRewatchesNewestFirst(a: Rewatch, b: Rewatch): number {
  const dateA = sortKey(a);
  const dateB = sortKey(b);

  if (dateA && dateB) {
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return b.id - a.id;
  }
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  return b.id - a.id;
}

/**
 * Calculates per-target chronological pass numbers (1-indexed).
 * Oldest dated pass = Pass 1.
 */
export function passNumbers(allRewatches: Rewatch[]): Map<number, number> {
  const map = new Map<number, number>();
  const groups = new Map<string, Rewatch[]>();

  for (const r of allRewatches) {
    const key = targetKey(r);
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }

  groups.forEach((items) => {
    // Sort oldest first for pass numbering
    const sorted = [...items].sort((a, b) => {
      const dateA = sortKey(a);
      const dateB = sortKey(b);

      if (dateA && dateB) {
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return a.id - b.id;
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      return a.id - b.id;
    });

    sorted.forEach((r, idx) => {
      map.set(r.id, idx + 1);
    });
  });

  return map;
}

/**
 * Returns a Set of rewatch IDs that represent the latest dated pass for their respective target.
 * Undated passes are never marked latest.
 */
export function latestIds(allRewatches: Rewatch[]): Set<number> {
  const latestSet = new Set<number>();
  const groups = new Map<string, Rewatch[]>();

  for (const r of allRewatches) {
    const key = targetKey(r);
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }

  groups.forEach((items) => {
    const dated = items.filter((r) => sortKey(r) !== null);
    if (dated.length === 0) return;

    // Find newest dated pass
    dated.sort(compareRewatchesNewestFirst);
    latestSet.add(dated[0].id);
  });

  return latestSet;
}

export interface YearGroup {
  year: string;
  isUndated: boolean;
  items: Rewatch[];
}

/**
 * Groups sorted rewatches by calendar year of their sortKey.
 * Groups are ordered newest year first, with 'Date not recorded' last.
 */
export function groupByYear(rewatches: Rewatch[]): YearGroup[] {
  const sorted = [...rewatches].sort(compareRewatchesNewestFirst);
  const yearMap = new Map<string, Rewatch[]>();
  const undated: Rewatch[] = [];

  for (const r of sorted) {
    const date = sortKey(r);
    if (!date) {
      undated.push(r);
      continue;
    }

    const year = date.slice(0, 4);
    const list = yearMap.get(year) || [];
    list.push(r);
    yearMap.set(year, list);
  }

  // Sort years descending
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b.localeCompare(a));

  const result: YearGroup[] = sortedYears.map((year) => ({
    year,
    isUndated: false,
    items: yearMap.get(year) || [],
  }));

  if (undated.length > 0) {
    result.push({
      year: 'Date not recorded',
      isUndated: true,
      items: undated,
    });
  }

  return result;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDateParts(dateStr: string): { day: string; month: string; year: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  const [, y, m, d] = match;
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || m;
  const dayNum = parseInt(d, 10).toString().padStart(2, '0');
  return { day: dayNum, month: monthName, year: y };
}

/**
 * Formats date for the return spine row: "14 Aug" or "14 Aug 2026" or "—".
 */
export function formatSpineDate(r: Rewatch, includeYear = false): string {
  const dateStr = sortKey(r);
  if (!dateStr) return '—';
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;
  return includeYear ? `${parts.day} ${parts.month} ${parts.year}` : `${parts.day} ${parts.month}`;
}

/**
 * Formats friendly date: "14 Aug 2026".
 */
export function formatFriendlyDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;
  return `${parts.day} ${parts.month} ${parts.year}`;
}

/**
 * Formats full dates for detail modal:
 * "Started 12 May 2025 · Finished 14 May 2025"
 */
export function formatModalDates(r: Rewatch): string {
  const start = formatFriendlyDate(r.start_date);
  const finish = formatFriendlyDate(r.finish_date);

  if (start && finish) {
    return `Started ${start} · Finished ${finish}`;
  }
  if (start) {
    return `Started ${start}`;
  }
  if (finish) {
    return `Finished ${finish}`;
  }
  return 'Date not recorded';
}

/**
 * Primary display title for a rewatch row.
 */
export function displayTitle(r: Rewatch): string {
  const type = targetType(r);
  if (type === 'movie') {
    return r.release_title || r.series_title || 'Film Rewatch';
  }
  if (r.series_title) {
    return r.series_title;
  }
  return r.release_title || 'Rewatch Entry';
}

/**
 * Short scope label for the spine row: "Franchise" / "Season 1" / "Film" / "Ep 10".
 */
export function scopeLabel(r: Rewatch): string {
  const type = targetType(r);
  if (type === 'series') return 'Franchise';
  if (type === 'movie') return 'Film';
  if (type === 'episode') {
    return r.episode_number ? `Ep ${r.episode_number}` : 'Episode';
  }
  // Season
  if (r.release_title && r.series_title && r.release_title !== r.series_title) {
    return r.release_title;
  }
  return 'Season';
}

/**
 * Detailed scope line for modal: "Season · Pass 2", "Anime Film · Pass 1", etc.
 */
export function modalScopeBadge(r: Rewatch, passNum?: number): string {
  const type = targetType(r);
  let typeName = 'Franchise';
  if (type === 'season') typeName = 'Season';
  else if (type === 'movie') typeName = 'Film';
  else if (type === 'episode') {
    typeName = r.episode_number ? `Episode ${r.episode_number}` : 'Episode';
  }

  const passStr = passNum ? `Pass ${passNum}` : undefined;
  return passStr ? `${typeName} · ${passStr}` : typeName;
}

/**
 * Quiet ledger metrics: passes, distinct titles, reflections with non-blank notes.
 */
export function getSpineLedgerStats(rewatches: Rewatch[]): {
  totalPasses: number;
  totalTitles: number;
  totalReflections: number;
} {
  const totalPasses = rewatches.length;
  const uniqueTitles = new Set<string>();
  let totalReflections = 0;

  for (const r of rewatches) {
    const key = targetKey(r);
    uniqueTitles.add(key);
    if (r.notes && r.notes.trim().length > 0) {
      totalReflections += 1;
    }
  }

  return {
    totalPasses,
    totalTitles: uniqueTitles.size,
    totalReflections,
  };
}

/**
 * Search & filter helper for rewatches.
 */
export function filterRewatches(
  rewatches: Rewatch[],
  selectedType: 'ALL' | RewatchTargetType,
  searchQuery: string
): Rewatch[] {
  const q = searchQuery.toLowerCase().trim();

  return rewatches.filter((r) => {
    const tType = targetType(r);
    const matchesType = selectedType === 'ALL' || tType === selectedType;
    if (!matchesType) return false;

    if (!q) return true;

    const relTitle = (r.release_title || '').toLowerCase();
    const serTitle = (r.series_title || '').toLowerCase();
    const epTitle = (r.episode_title || '').toLowerCase();
    const notesText = (r.notes || '').toLowerCase();

    // Type label matching
    let typeKeyword = '';
    if (tType === 'series') typeKeyword = 'franchise series';
    else if (tType === 'season') typeKeyword = 'season tv';
    else if (tType === 'movie') typeKeyword = 'film movie cinema';
    else if (tType === 'episode') typeKeyword = `episode ep ${r.episode_number ?? ''}`;

    return (
      relTitle.includes(q) ||
      serTitle.includes(q) ||
      epTitle.includes(q) ||
      notesText.includes(q) ||
      typeKeyword.includes(q)
    );
  });
}
