import type { AnimeMovie, AnimeSeason, AnimeSeries, Book } from '../../types';

interface StepInput {
  progress: number;
  total: number | null;
  status: string;
  finishDate: string | null;
  activeStatus: string;
  planStatus: string;
}

const localToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * Predicts what the server will do with a progress change, so the screen can update immediately.
 * Matches `_update_release_progress` in Backend/animeLog/views.py. Null means the change is out of range.
 */
function step(input: StepInput, delta: number) {
  const progress = input.progress + delta;
  if (progress < 0 || (input.total !== null && progress > input.total)) return null;

  let { status } = input;
  let finishDate = input.finishDate;

  if (status === input.planStatus && progress > 0) status = input.activeStatus;

  if (input.total !== null && progress >= input.total && status === input.activeStatus) {
    status = 'COMPLETED';
    finishDate = finishDate ?? localToday();
  } else if (delta < 0 && input.total !== null && status === 'COMPLETED') {
    status = input.activeStatus;
    if (finishDate === localToday()) finishDate = null;
  }
  return { progress, status, finishDate };
}

export function nextSeasonState(season: AnimeSeason, delta: number): AnimeSeason | null {
  const next = step(
    {
      progress: season.progress,
      total: season.total_episodes,
      status: season.status,
      finishDate: season.finish_date,
      activeStatus: 'WATCHING',
      planStatus: 'PLAN_TO_WATCH',
    },
    delta
  );
  return next && {
    ...season,
    progress: next.progress,
    status: next.status as AnimeSeason['status'],
    finish_date: next.finishDate,
  };
}

export function nextMovieState(movie: AnimeMovie, delta: number): AnimeMovie | null {
  const next = step(
    {
      progress: movie.progress_minutes,
      total: movie.total_minutes,
      status: movie.status,
      finishDate: movie.finish_date,
      activeStatus: 'WATCHING',
      planStatus: 'PLAN_TO_WATCH',
    },
    delta
  );
  return next && {
    ...movie,
    progress_minutes: next.progress,
    status: next.status as AnimeMovie['status'],
    finish_date: next.finishDate,
  };
}

export function nextBookState(book: Book, delta: number): Book | null {
  const next = step(
    {
      progress: book.progress,
      total: book.total_pages,
      status: book.status,
      finishDate: book.finish_date,
      activeStatus: 'READING',
      planStatus: 'PLAN_TO_READ',
    },
    delta
  );
  return next && {
    ...book,
    progress: next.progress,
    status: next.status as Book['status'],
    finish_date: next.finishDate,
  };
}

export const findSeason = (list: AnimeSeries[], id: number) =>
  list.flatMap((series) => series.seasons ?? []).find((season) => season.id === id);

export const findMovie = (list: AnimeSeries[], id: number) =>
  list.flatMap((series) => series.movies ?? []).find((movie) => movie.id === id);

/** Replaces one season and leaves every other object untouched, so unrelated rows don't re-render. */
export function patchSeason(list: AnimeSeries[], season: AnimeSeason): AnimeSeries[] {
  return list.map((series) =>
    series.seasons?.some((s) => s.id === season.id)
      ? { ...series, seasons: series.seasons.map((s) => (s.id === season.id ? { ...s, ...season } : s)) }
      : series
  );
}

export function patchMovie(list: AnimeSeries[], movie: AnimeMovie): AnimeSeries[] {
  return list.map((series) =>
    series.movies?.some((m) => m.id === movie.id)
      ? { ...series, movies: series.movies.map((m) => (m.id === movie.id ? { ...m, ...movie } : m)) }
      : series
  );
}

export function patchBook(list: Book[], book: Book): Book[] {
  return list.map((b) => (b.id === book.id ? { ...b, ...book } : b));
}
