import { useMemo } from 'react';
import { useJournal } from './JournalContext';
import { AnimeSeries, Book, FavoriteCharacter, Rewatch } from '../types';

export type ReflectionKind = 'season' | 'film' | 'episode' | 'rewatch' | 'book' | 'character';

export interface JournalReflection {
  id: string;
  kind: ReflectionKind;
  targetKind: 'season' | 'movie' | 'book' | 'character';
  targetId: number;
  seriesId?: number;
  title: string;
  context: string;
  note: string;
  rating?: number | null;
  timestamp: number;
  dateStr?: string | null;
}

export function useReflections(): {
  reflections: JournalReflection[];
  totalCount: number;
} {
  const { seriesList, bookList, characterList, rewatchList } = useJournal();

  const reflections = useMemo(() => {
    const list: JournalReflection[] = [];

    // 1. Anime Series Seasons, Films & Episode Notes
    seriesList.forEach((series) => {
      // Seasons
      series.seasons?.forEach((season) => {
        const seasonTime = season.created_at ? new Date(season.created_at).getTime() : 0;
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
              timestamp: ep.created_at ? new Date(ep.created_at).getTime() : seasonTime,
              dateStr: ep.created_at,
            });
          }
        });

        // Season Rewatches
        season.rewatches?.forEach((rewatch) => {
          if (rewatch.notes?.trim()) {
            list.push({
              id: `rewatch-${rewatch.id}`,
              kind: 'rewatch',
              targetKind: 'season',
              targetId: season.id,
              seriesId: series.id,
              title: series.title,
              context: `Return to ${season.title}`,
              note: rewatch.notes,
              rating: rewatch.rating,
              timestamp: rewatch.finish_date ? new Date(rewatch.finish_date).getTime() : 0,
              dateStr: rewatch.finish_date || rewatch.start_date,
            });
          }
        });
      });

      // Movies
      series.movies?.forEach((movie) => {
        const movieTime = movie.created_at ? new Date(movie.created_at).getTime() : 0;
        if (movie.notes?.trim()) {
          list.push({
            id: `movie-${movie.id}`,
            kind: 'film',
            targetKind: 'movie',
            targetId: movie.id,
            seriesId: series.id,
            title: series.title,
            context: `Film · ${movie.title}`,
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
      const bookTime = book.created_at ? new Date(book.created_at).getTime() : 0;
      if (book.notes?.trim()) {
        list.push({
          id: `book-${book.id}`,
          kind: 'book',
          targetKind: 'book',
          targetId: book.id,
          title: book.title,
          context: book.author ? `by ${book.author}` : 'Book journal',
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
        list.push({
          id: `char-${char.id}`,
          kind: 'character',
          targetKind: 'character',
          targetId: char.id,
          seriesId: char.series,
          title: char.name,
          context: char.series_title ? `Character · ${char.series_title}` : 'Character note',
          note: char.why,
          timestamp: 0,
        });
      }
    });

    // 4. Standalone Rewatches
    rewatchList.forEach((rewatch) => {
      if (rewatch.notes?.trim() && !list.some((r) => r.id === `rewatch-${rewatch.id}`)) {
        list.push({
          id: `rewatch-${rewatch.id}`,
          kind: 'rewatch',
          targetKind: rewatch.movie_id ? 'movie' : 'season',
          targetId: (rewatch.season_id || rewatch.movie_id || rewatch.target_id) as number,
          title: rewatch.series_title || rewatch.release_title || 'A remembered title',
          context: `Return pass · ${rewatch.release_title || ''}`,
          note: rewatch.notes,
          rating: rewatch.rating,
          timestamp: rewatch.finish_date ? new Date(rewatch.finish_date).getTime() : 0,
          dateStr: rewatch.finish_date || rewatch.start_date,
        });
      }
    });

    // Sort newest first
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [seriesList, bookList, characterList, rewatchList]);

  return {
    reflections,
    totalCount: reflections.length,
  };
}
