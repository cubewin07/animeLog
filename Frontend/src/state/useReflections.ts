import { useMemo } from 'react';
import { useJournalData } from './JournalContext';

export type ReflectionKind = 'season' | 'film' | 'episode' | 'rewatch' | 'book' | 'character';

export interface JournalReflection {
  id: string;
  kind: ReflectionKind;
  targetKind: 'series' | 'season' | 'movie' | 'book' | 'character';
  targetId: number;
  seriesId?: number;
  title: string;
  context: string;
  note: string;
  rating?: number | null;
  episodeNumber?: number;
  timestamp: number;
  dateStr?: string | null;
}

function safeTimestamp(value?: string | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function useReflections(): {
  reflections: JournalReflection[];
  totalCount: number;
} {
  const { seriesList, bookList, characterList, rewatchList, activityList } = useJournalData();

  const reflections = useMemo(() => {
    const list: JournalReflection[] = [];
    const seriesCreatedAtById = new Map<number, string>();
    const charActivityDateById = new Map<number, string>();

    for (const series of seriesList) {
      if (series.created_at) seriesCreatedAtById.set(series.id, series.created_at);
    }

    for (const event of activityList) {
      if (event.kind === 'CHARACTER_ADDED' && event.target_type === 'character' && event.delta > 0) {
        if (!charActivityDateById.has(event.target_id) && event.created_at) {
          charActivityDateById.set(event.target_id, event.created_at);
        }
      }
    }

    // 1. Anime Series Seasons, Films & Episode Notes
    seriesList.forEach((series) => {
      // Seasons
      series.seasons?.forEach((season) => {
        const seasonTime = safeTimestamp(season.created_at);
        if (season.notes?.trim()) {
          list.push({
            id: `season-${season.id}`,
            kind: 'season',
            targetKind: 'season',
            targetId: season.id,
            seriesId: series.id,
            title: series.title,
            context: `Season ${season.season_number} · ${season.title}`,
            note: season.notes,
            rating: season.rating,
            timestamp: seasonTime,
            dateStr: season.finish_date || season.start_date || season.created_at,
          });
        }

        // Episode Notes
        season.episode_notes?.forEach((ep) => {
          if (ep.note?.trim()) {
            const epTime = safeTimestamp(ep.created_at);
            list.push({
              id: `ep-${ep.id}`,
              kind: 'episode',
              targetKind: 'season',
              targetId: season.id,
              seriesId: series.id,
              title: series.title,
              context: `S${season.season_number} · Ep ${ep.episode_number}${ep.episode_title ? ` (${ep.episode_title})` : ''}`,
              note: ep.note,
              rating: ep.rating,
              episodeNumber: ep.episode_number,
              timestamp: epTime > 0 ? epTime : seasonTime,
              dateStr: ep.created_at,
            });
          }
        });

        // Season Rewatches
        season.rewatches?.forEach((rewatch) => {
          if (rewatch.notes?.trim()) {
            const dateStr = rewatch.finish_date || rewatch.start_date;
            list.push({
              id: `rewatch-${rewatch.id}`,
              kind: 'rewatch',
              targetKind: 'season',
              targetId: season.id,
              seriesId: series.id,
              title: series.title,
              context: `Rewatch · ${season.title}`,
              note: rewatch.notes,
              rating: rewatch.rating,
              timestamp: safeTimestamp(dateStr),
              dateStr,
            });
          }
        });
      });

      // Movies
      series.movies?.forEach((movie) => {
        const movieTime = safeTimestamp(movie.created_at);
        if (movie.notes?.trim()) {
          list.push({
            id: `movie-${movie.id}`,
            kind: 'film',
            targetKind: 'movie',
            targetId: movie.id,
            seriesId: series.id,
            title: series.title,
            context: `Movie · ${movie.title}`,
            note: movie.notes,
            rating: movie.rating,
            timestamp: movieTime,
            dateStr: movie.finish_date || movie.start_date || movie.created_at,
          });
        }
      });
    });

    // 2. Books
    bookList.forEach((book) => {
      const bookTime = safeTimestamp(book.created_at);
      if (book.notes?.trim()) {
        list.push({
          id: `book-${book.id}`,
          kind: 'book',
          targetKind: 'book',
          targetId: book.id,
          title: book.title,
          context: book.author ? `by ${book.author}` : 'Book',
          note: book.notes,
          rating: book.rating,
          timestamp: bookTime,
          dateStr: book.finish_date || book.start_date || book.created_at,
        });
      }
    });

    // 3. Characters
    characterList.forEach((char) => {
      if (char.why?.trim()) {
        const charDate = charActivityDateById.get(char.id);
        const fallbackDate = charDate ?? seriesCreatedAtById.get(char.series) ?? null;
        list.push({
          id: `char-${char.id}`,
          kind: 'character',
          targetKind: 'character',
          targetId: char.id,
          seriesId: char.series,
          title: char.name,
          context: char.series_title ? `Character · ${char.series_title}` : 'Character note',
          note: char.why,
          timestamp: safeTimestamp(fallbackDate),
          dateStr: charDate ?? undefined,
        });
      }
    });

    // 4. Standalone Rewatches
    rewatchList.forEach((rewatch) => {
      if (rewatch.notes?.trim() && !list.some((r) => r.id === `rewatch-${rewatch.id}`)) {
        const resolvedTargetKind: JournalReflection['targetKind'] =
          rewatch.target_type === 'series'
            ? 'series'
            : rewatch.target_type === 'movie' || rewatch.movie_id
              ? 'movie'
              : 'season';
        const resolvedTargetId =
          resolvedTargetKind === 'series'
            ? (rewatch.series_id ?? rewatch.target_id)
            : resolvedTargetKind === 'movie'
              ? (rewatch.movie_id ?? rewatch.target_id)
              : (rewatch.season_id ?? rewatch.target_id);
        const dateStr = rewatch.finish_date || rewatch.start_date;

        list.push({
          id: `rewatch-${rewatch.id}`,
          kind: 'rewatch',
          targetKind: resolvedTargetKind,
          targetId: resolvedTargetId,
          seriesId:
            rewatch.series_id ??
            (resolvedTargetKind === 'series' ? resolvedTargetId : undefined),
          title: rewatch.series_title || rewatch.release_title || 'A remembered title',
          context: `Rewatch · ${rewatch.release_title || ''}`,
          note: rewatch.notes,
          rating: rewatch.rating,
          episodeNumber: rewatch.episode_number ?? undefined,
          timestamp: safeTimestamp(dateStr),
          dateStr,
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [seriesList, bookList, characterList, rewatchList, activityList]);

  return {
    reflections,
    totalCount: reflections.length,
  };
}

