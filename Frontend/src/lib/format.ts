/**
 * Formatting utilities for dates, episode counts, page progress, and notes.
 */

export function formatDate(dateStr?: string | number | null): string {
  if (!dateStr) return 'Undated';
  try {
    const d = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateParts(dateStr?: string | null): { month: string; day: string; year: string } {
  if (!dateStr) return { month: '—', day: '—', year: 'Undated' };
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return { month: '—', day: '—', year: dateStr };
    return {
      month: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d),
      day: new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(d),
      year: new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(d),
    };
  } catch {
    return { month: '—', day: '—', year: dateStr };
  }
}

export function formatProgress(current: number, total?: number | null, unit = 'eps'): string {
  if (total) {
    return `${current} / ${total} ${unit}`;
  }
  return `${current} ${unit}`;
}

export function truncateText(text: string, maxLength = 160): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
