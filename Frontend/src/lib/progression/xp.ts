import type { ActivityEvent, AnimeSeries, Book, FavoriteCharacter, Rewatch } from '../../types';
import { toLocalDateKey } from './streak';
import type { LevelInfo, LevelTier, XpBreakdown } from './types';

export const XP_WEIGHTS = {
  EPISODE_WATCHED: 1,
  EPISODE_NOTE: 5,
  CHARACTER_WHY: 10,
  JOURNAL_NOTE: 15,
  COMPLETION: 20,
} as const;

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, name: 'Newcomer', minXp: 0, nextXp: 50 },
  { level: 2, name: 'Regular', minXp: 50, nextXp: 150 },
  { level: 3, name: 'Binger', minXp: 150, nextXp: 300 },
  { level: 4, name: 'Otaku', minXp: 300, nextXp: 500 },
  { level: 5, name: 'Critic', minXp: 500, nextXp: 800 },
  { level: 6, name: 'Sensei', minXp: 800, nextXp: 1200 },
];

const SENSEI_STEP = 400;

const hasText = (value: string | null | undefined): boolean => Boolean(value?.trim());

export interface XpInput {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
  rewatchList: Rewatch[];
}

/** Calculates XP purely from the current journal state so edits and deletes stay in sync. */
export function computeXpBreakdown({
  seriesList,
  bookList,
  characterList,
  rewatchList,
}: XpInput): XpBreakdown {
  let episodesWatched = 0;
  let episodeNotes = 0;
  let seasonNotes = 0;
  let movieNotes = 0;
  let completedSeasons = 0;
  let completedMovies = 0;

  for (const series of seriesList) {
    for (const season of series.seasons ?? []) {
      episodesWatched += Math.max(0, season.progress || 0);
      episodeNotes += (season.episode_notes ?? []).filter((note) => hasText(note.note)).length;
      if (hasText(season.notes)) seasonNotes += 1;
      if (season.status === 'COMPLETED') completedSeasons += 1;
    }
    for (const movie of series.movies ?? []) {
      if (hasText(movie.notes)) movieNotes += 1;
      if (movie.status === 'COMPLETED') completedMovies += 1;
    }
  }

  let bookNotes = 0;
  let completedBooks = 0;
  for (const book of bookList) {
    if (hasText(book.notes)) bookNotes += 1;
    if (book.status === 'COMPLETED') completedBooks += 1;
  }

  const characterWhys = characterList.filter((char) => hasText(char.why)).length;
  const rewatchNotes = rewatchList.filter((rewatch) => hasText(rewatch.notes)).length;

  const journalNotes = seasonNotes + movieNotes + bookNotes + rewatchNotes;
  const completedCount = completedSeasons + completedMovies + completedBooks;

  const xpFromEpisodes = episodesWatched * XP_WEIGHTS.EPISODE_WATCHED;
  const xpFromEpisodeNotes = episodeNotes * XP_WEIGHTS.EPISODE_NOTE;
  const xpFromCharacterWhys = characterWhys * XP_WEIGHTS.CHARACTER_WHY;
  const xpFromJournalNotes = journalNotes * XP_WEIGHTS.JOURNAL_NOTE;
  const xpFromCompletions = completedCount * XP_WEIGHTS.COMPLETION;

  const total =
    xpFromEpisodes +
    xpFromEpisodeNotes +
    xpFromCharacterWhys +
    xpFromJournalNotes +
    xpFromCompletions;

  return {
    episodesWatched,
    episodeNotes,
    characterWhys,
    seasonNotes,
    movieNotes,
    bookNotes,
    rewatchNotes,
    journalNotes,
    completedSeasons,
    completedMovies,
    completedBooks,
    completedCount,
    xpFromEpisodes,
    xpFromEpisodeNotes,
    xpFromCharacterWhys,
    xpFromJournalNotes,
    xpFromCompletions,
    total,
  };
}

/** Resolves the level tier and progress bar percentages for a given XP total. */
export function resolveLevel(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  const sensei = LEVEL_TIERS[LEVEL_TIERS.length - 1];

  let minXp: number;
  let nextXp: number;
  let level: number;
  let name: string;

  if (safeXp >= sensei.minXp) {
    const rankOffset = Math.floor((safeXp - sensei.minXp) / SENSEI_STEP);
    level = sensei.level;
    name = sensei.name;
    minXp = sensei.minXp + rankOffset * SENSEI_STEP;
    nextXp = minXp + SENSEI_STEP;
  } else {
    const tier = [...LEVEL_TIERS].reverse().find((item) => safeXp >= item.minXp) ?? LEVEL_TIERS[0];
    level = tier.level;
    name = tier.name;
    minXp = tier.minXp;
    nextXp = tier.nextXp;
  }

  const span = Math.max(1, nextXp - minXp);
  const xpIntoLevel = safeXp - minXp;
  const xpToNext = Math.max(0, nextXp - safeXp);
  const progressPct = Math.min(100, Math.max(0, Math.round((xpIntoLevel / span) * 100)));

  return {
    level,
    name,
    xp: safeXp,
    minXp,
    nextXp,
    xpIntoLevel,
    xpToNext,
    progressPct,
  };
}

function eventXpDelta(event: ActivityEvent): number {
  switch (event.kind) {
    case 'EPISODE_PROGRESS':
      return event.delta * XP_WEIGHTS.EPISODE_WATCHED;
    case 'NOTE_WRITTEN':
      return (
        event.delta *
        (event.target_type === 'episode' || event.target_type === 'episode_note'
          ? XP_WEIGHTS.EPISODE_NOTE
          : XP_WEIGHTS.JOURNAL_NOTE)
      );
    case 'CHARACTER_ADDED':
      return event.delta * XP_WEIGHTS.CHARACTER_WHY;
    case 'REWATCH_LOGGED':
      return event.delta * XP_WEIGHTS.JOURNAL_NOTE;
    case 'COMPLETED':
      return event.delta * XP_WEIGHTS.COMPLETION;
    case 'MOVIE_PROGRESS':
    case 'BOOK_PROGRESS':
    default:
      return 0;
  }
}

/** Computes XP earned today from non-backfilled activity events. */
export function computeTodayXp(activityList: ActivityEvent[], now: Date | string = new Date()): number {
  const todayKey = toLocalDateKey(now);
  if (!todayKey) return 0;

  let total = 0;
  const seenNoteOrChar = new Set<string>();
  const completedDeltaByTarget = new Map<string, number>();

  for (const event of activityList) {
    if (event.backfilled) continue;
    if (toLocalDateKey(event.created_at) !== todayKey) continue;

    if (event.kind === 'NOTE_WRITTEN' || event.kind === 'CHARACTER_ADDED') {
      const key = `${event.kind}:${event.target_type}:${event.target_id}`;
      if (seenNoteOrChar.has(key)) continue;
      if (event.delta > 0) {
        seenNoteOrChar.add(key);
        total += eventXpDelta(event);
      }
      continue;
    }

    if (event.kind === 'COMPLETED') {
      const key = `${event.target_type}:${event.target_id}`;
      completedDeltaByTarget.set(key, (completedDeltaByTarget.get(key) ?? 0) + event.delta);
      continue;
    }

    total += eventXpDelta(event);
  }

  for (const netDelta of completedDeltaByTarget.values()) {
    if (netDelta > 0) {
      total += netDelta * XP_WEIGHTS.COMPLETION;
    }
  }

  return Math.max(0, total);
}
