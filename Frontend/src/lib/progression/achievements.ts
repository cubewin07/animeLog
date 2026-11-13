import type {
  ActivityEvent,
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Rewatch,
} from '../../types';
import type { Achievement, AchievementCategory, StreakSummary } from './types';

export interface AchievementsInput {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
  rewatchList: Rewatch[];
  activityEvents?: ActivityEvent[];
  streak: StreakSummary;
}

const hasText = (value: string | null | undefined): boolean => Boolean(value?.trim());

function buildAchievement(
  id: string,
  name: string,
  detail: string,
  category: AchievementCategory,
  current: number,
  goal: number,
  unlockedOverride?: boolean
): Achievement {
  const safeGoal = Math.max(1, goal);
  const safeCurrent = Math.max(0, current);
  const unlocked = unlockedOverride ?? safeCurrent >= safeGoal;
  const pct = unlocked
    ? 100
    : Math.min(99, Math.round((Math.min(safeCurrent, safeGoal) / safeGoal) * 100));

  return {
    id,
    name,
    detail,
    category,
    current: safeCurrent,
    goal: safeGoal,
    unlocked,
    pct,
  };
}

function getEveryEpisodeStats(seasons: AnimeSeason[]): {
  unlocked: boolean;
  current: number;
  goal: number;
} {
  let bestNoted = 0;
  let bestGoal = 1;
  let bestRatio = -1;
  let unlocked = false;

  for (const season of seasons) {
    const total = season.total_episodes;
    if (total === null || total < 1) continue;

    const notedEpisodes = new Set<number>();
    for (const entry of season.episode_notes ?? []) {
      if (hasText(entry.note) && entry.episode_number >= 1 && entry.episode_number <= total) {
        notedEpisodes.add(entry.episode_number);
      }
    }

    const notedCount = notedEpisodes.size;
    if (notedCount >= total) {
      return { unlocked: true, current: total, goal: total };
    }

    const ratio = notedCount / total;
    if (ratio > bestRatio || (ratio === bestRatio && total < bestGoal)) {
      bestRatio = ratio;
      bestNoted = notedCount;
      bestGoal = total;
    }
  }

  return { unlocked, current: bestNoted, goal: bestGoal };
}

function getChangedMyMindCount(
  rewatchList: Rewatch[],
  seasonsById: Map<number, AnimeSeason>,
  moviesById: Map<number, AnimeMovie>
): number {
  let count = 0;

  for (const rewatch of rewatchList) {
    if (rewatch.rating === null || rewatch.rating === undefined) continue;

    const seasonId =
      rewatch.season_id ??
      rewatch.season ??
      (rewatch.target_type === 'season' ? rewatch.target_id : null);
    const movieId =
      rewatch.movie_id ??
      rewatch.movie ??
      (rewatch.target_type === 'movie' ? rewatch.target_id : null);

    let originalRating: number | null = null;
    if (seasonId !== null && seasonId !== undefined) {
      const season = seasonsById.get(seasonId);
      if (rewatch.target_type === 'episode' && rewatch.episode_number != null && season) {
        const epNote = (season.episode_notes ?? []).find(
          (note) => note.episode_number === rewatch.episode_number && note.rating !== null
        );
        originalRating = epNote?.rating ?? season.rating ?? null;
      } else {
        originalRating = season?.rating ?? null;
      }
    } else if (movieId !== null && movieId !== undefined) {
      originalRating = moviesById.get(movieId)?.rating ?? null;
    }

    if (originalRating !== null && Math.abs(rewatch.rating - originalRating) >= 2) {
      count += 1;
    }
  }

  return count;
}

function getMaxStudioCount(seriesList: AnimeSeries[]): number {
  const counts = new Map<string, number>();

  for (const series of seriesList) {
    const studioKeys = new Set<string>();
    const addStudios = (studios?: { id: number; name: string }[]) => {
      for (const studio of studios ?? []) {
        const key = studio.name.trim().toLowerCase() || String(studio.id);
        if (key) studioKeys.add(key);
      }
    };

    addStudios(series.studios);
    for (const season of series.seasons ?? []) addStudios(season.studios);
    for (const movie of series.movies ?? []) addStudios(movie.studios);

    for (const key of studioKeys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let maxCount = 0;
  for (const count of counts.values()) {
    if (count > maxCount) maxCount = count;
  }
  return maxCount;
}

/** Computes all 20 journal progression achievements from the current library and streak. */
export function computeAchievements(input: AchievementsInput): Achievement[] {
  const { seriesList, bookList, characterList, rewatchList, streak } = input;

  const seasons: AnimeSeason[] = [];
  const movies: AnimeMovie[] = [];
  const seasonsById = new Map<number, AnimeSeason>();
  const moviesById = new Map<number, AnimeMovie>();

  let totalEpisodesWatched = 0;
  let episodeNotesCount = 0;
  let releaseNotesCount = 0;
  let hasCompletedCour = false;
  let maxSeasonProgress = 0;
  let hasCompletedAnimeWithNote = false;
  const uniqueGenres = new Set<string>();

  for (const series of seriesList) {
    for (const genre of series.genres ?? []) {
      const key = genre.name.trim().toLowerCase() || String(genre.id);
      if (key) uniqueGenres.add(key);
    }

    for (const season of series.seasons ?? []) {
      seasons.push(season);
      seasonsById.set(season.id, season);
      const progress = Math.max(0, season.progress || 0);
      totalEpisodesWatched += progress;
      if (progress > maxSeasonProgress) maxSeasonProgress = progress;

      episodeNotesCount += (season.episode_notes ?? []).filter((n) => hasText(n.note)).length;
      if (hasText(season.notes)) releaseNotesCount += 1;

      if (season.status === 'COMPLETED') {
        if (Math.max(progress, season.total_episodes ?? 0) >= 12) {
          hasCompletedCour = true;
        }
        if (hasText(season.notes)) {
          hasCompletedAnimeWithNote = true;
        }
      }
    }

    for (const movie of series.movies ?? []) {
      movies.push(movie);
      moviesById.set(movie.id, movie);
      if (hasText(movie.notes)) releaseNotesCount += 1;
      if (movie.status === 'COMPLETED' && hasText(movie.notes)) {
        hasCompletedAnimeWithNote = true;
      }
    }
  }

  let bookNotesCount = 0;
  let completedBooksCount = 0;
  let hasCompletedBookWithNote = false;

  for (const book of bookList) {
    for (const genre of book.genres ?? []) {
      const key = genre.name.trim().toLowerCase() || String(genre.id);
      if (key) uniqueGenres.add(key);
    }
    if (hasText(book.notes)) bookNotesCount += 1;
    if (book.status === 'COMPLETED') {
      completedBooksCount += 1;
      if (hasText(book.notes)) hasCompletedBookWithNote = true;
    }
  }

  const charWhyCount = characterList.filter((c) => hasText(c.why)).length;
  const rewatchNotesCount = rewatchList.filter((r) => hasText(r.notes)).length;
  const totalNotes =
    episodeNotesCount + releaseNotesCount + bookNotesCount + charWhyCount + rewatchNotesCount;

  const everyEpisodeStats = getEveryEpisodeStats(seasons);

  const masterpieceCount =
    seasons.filter((s) => s.rating === 10).length +
    movies.filter((m) => m.rating === 10).length +
    bookList.filter((b) => b.rating === 10).length +
    rewatchList.filter((r) => r.rating === 10).length;

  const highPraiseCount =
    seasons.filter((s) => s.rating !== null && s.rating >= 9).length +
    movies.filter((m) => m.rating !== null && m.rating >= 9).length +
    bookList.filter((b) => b.rating !== null && b.rating >= 9).length;

  const changedMindCount = getChangedMyMindCount(rewatchList, seasonsById, moviesById);

  const foilCount = characterList.filter((c) => {
    const hasPortrait = Boolean(c.cover_image || c.cover_image_url || c.image_url);
    const hasWhy = hasText(c.why);
    const imageCount = c.images?.length ?? 0;
    return hasPortrait && hasWhy && imageCount >= 3;
  }).length;

  const maxStudioCount = getMaxStudioCount(seriesList);
  const crossMediaProgress = (hasCompletedAnimeWithNote ? 1 : 0) + (hasCompletedBookWithNote ? 1 : 0);
  const bestStreak = Math.max(streak.currentStreak, streak.longestStreak);

  return [
    buildAchievement(
      'first-step',
      'First Step',
      'Watch your first episode.',
      'watching',
      totalEpisodesWatched,
      1
    ),
    buildAchievement(
      'first-cour',
      'First Cour',
      'Finish a season of 12 or more episodes.',
      'watching',
      hasCompletedCour ? 12 : Math.min(11, maxSeasonProgress),
      12,
      hasCompletedCour
    ),
    buildAchievement(
      'long-runner',
      'Long Runner',
      'Watch 100 episodes across your journal.',
      'watching',
      totalEpisodesWatched,
      100
    ),
    buildAchievement(
      'century-club',
      'Century Club',
      'Watch 250 episodes across your journal.',
      'watching',
      totalEpisodesWatched,
      250
    ),
    buildAchievement(
      'first-note',
      'First Note',
      'Write your first journal note or character why.',
      'journaling',
      totalNotes,
      1
    ),
    buildAchievement(
      'ink-on-paper',
      'Ink on Paper',
      'Write 10 journal notes across anime, books, rewatches, or characters.',
      'journaling',
      totalNotes,
      10
    ),
    buildAchievement(
      'archivist',
      'Archivist',
      'Write 25 journal notes across your library.',
      'journaling',
      totalNotes,
      25
    ),
    buildAchievement(
      'every-episode-counts',
      'Every Episode Counts',
      'Leave a note on every episode of a season.',
      'journaling',
      everyEpisodeStats.current,
      everyEpisodeStats.goal,
      everyEpisodeStats.unlocked
    ),
    buildAchievement(
      'masterpiece',
      'Masterpiece',
      'Give a 10/10 rating to something that stayed with you.',
      'curation',
      masterpieceCount,
      1
    ),
    buildAchievement(
      'high-praise',
      'High Praise',
      'Rate 3 or more titles at 9 or higher.',
      'curation',
      highPraiseCount,
      3
    ),
    buildAchievement(
      'changed-my-mind',
      'Changed My Mind',
      'Log a rewatch rated 2+ points away from your original rating.',
      'rewatch',
      changedMindCount,
      1
    ),
    buildAchievement(
      'second-pass',
      'Second Pass',
      'Log your first rewatch.',
      'rewatch',
      rewatchList.length,
      1
    ),
    buildAchievement(
      'deepening-lessons',
      'Deepening Lessons',
      'Log 5 rewatches with written reflections.',
      'rewatch',
      rewatchNotesCount,
      5
    ),
    buildAchievement(
      'character-keeper',
      'Character Keeper',
      'Save a favorite character with why they matter to you.',
      'characters',
      charWhyCount,
      1
    ),
    buildAchievement(
      'foil-collector',
      'Foil Collector',
      'Upgrade a character card to Foil (portrait, why, and 3+ images).',
      'characters',
      foilCount,
      1
    ),
    buildAchievement(
      'studio-loyalist',
      'Studio Loyalist',
      'Log 3 or more anime titles from the same studio.',
      'exploration',
      maxStudioCount,
      3
    ),
    buildAchievement(
      'genre-explorer',
      'Genre Explorer',
      'Explore 5 or more distinct genres across anime and books.',
      'exploration',
      uniqueGenres.size,
      5
    ),
    buildAchievement(
      'bookworm',
      'Bookworm',
      'Finish your first book.',
      'reading',
      completedBooksCount,
      1
    ),
    buildAchievement(
      'cross-media-reader',
      'Cross-Media Reader',
      'Complete both an anime and a book with written notes.',
      'reading',
      crossMediaProgress,
      2
    ),
    buildAchievement(
      'steady-habit',
      'Steady Habit',
      'Build a 7-day journal streak.',
      'habit',
      bestStreak,
      7
    ),
  ];
}
