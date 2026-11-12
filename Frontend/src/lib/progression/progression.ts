import { computeAchievements } from './achievements';
import { computeStreak } from './streak';
import type {
  Achievement,
  GamePrefs,
  ProgressionInput,
  ProgressionResult,
} from './types';
import { computeTodayXp, computeXpBreakdown, resolveLevel } from './xp';

const GAME_PREFS_KEY = 'animelog_game_prefs_v1';

export const DEFAULT_GAME_PREFS: GamePrefs = {
  xp: true,
  streak: true,
  celebrations: true,
};

function pickNearestAchievement(achievements: Achievement[]): Achievement | null {
  const locked = achievements.filter((item) => !item.unlocked);
  if (locked.length === 0) return null;

  return [...locked].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    return a.goal - a.current - (b.goal - b.current);
  })[0];
}

/** Computes the full progression snapshot (XP, level, streak, achievements, and summary stats). */
export function computeProgression(
  input: ProgressionInput,
  now: Date | string = new Date()
): ProgressionResult {
  const xp = computeXpBreakdown(input);
  const level = resolveLevel(xp.total);
  const streak = computeStreak(input.activityList, now);
  const achievements = computeAchievements({
    ...input,
    activityEvents: input.activityList,
    streak,
  });

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const nearestAchievement = pickNearestAchievement(achievements);
  const todayXp = computeTodayXp(input.activityList, now);

  return {
    xp,
    level,
    streak,
    achievements,
    nearestAchievement,
    unlockedCount,
    totalAchievements: achievements.length,
    stats: {
      episodesWatched: xp.episodesWatched,
      thisWeekEpisodes: streak.thisWeekEpisodes,
      todayXp,
      notesCount: xp.episodeNotes + xp.characterWhys + xp.journalNotes,
      completedAnime: xp.completedSeasons + xp.completedMovies,
      completedBooks: xp.completedBooks,
      completedTotal: xp.completedCount,
      rewatchesCount: input.rewatchList.length,
      charactersCount: input.characterList.length,
    },
  };
}

/** Reads progression UI toggles from localStorage, falling back to all enabled. */
export function getGamePrefs(): GamePrefs {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_GAME_PREFS };
    const raw = localStorage.getItem(GAME_PREFS_KEY);
    if (!raw) return { ...DEFAULT_GAME_PREFS };
    const parsed = JSON.parse(raw) as Partial<GamePrefs>;
    return {
      xp: typeof parsed.xp === 'boolean' ? parsed.xp : DEFAULT_GAME_PREFS.xp,
      streak: typeof parsed.streak === 'boolean' ? parsed.streak : DEFAULT_GAME_PREFS.streak,
      celebrations:
        typeof parsed.celebrations === 'boolean'
          ? parsed.celebrations
          : DEFAULT_GAME_PREFS.celebrations,
    };
  } catch {
    return { ...DEFAULT_GAME_PREFS };
  }
}

/** Persists progression UI toggles to localStorage and returns the saved preferences. */
export function saveGamePrefs(prefs: Partial<GamePrefs>): GamePrefs {
  const current = getGamePrefs();
  const next: GamePrefs = {
    xp: typeof prefs.xp === 'boolean' ? prefs.xp : current.xp,
    streak: typeof prefs.streak === 'boolean' ? prefs.streak : current.streak,
    celebrations:
      typeof prefs.celebrations === 'boolean' ? prefs.celebrations : current.celebrations,
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GAME_PREFS_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota / privacy mode failures
  }
  return next;
}
