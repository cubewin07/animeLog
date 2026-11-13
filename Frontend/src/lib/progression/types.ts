import type {
  ActivityEvent,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Rewatch,
} from '../../types';

export interface XpBreakdown {
  episodesWatched: number;
  episodeNotes: number;
  characterWhys: number;
  seasonNotes: number;
  movieNotes: number;
  bookNotes: number;
  rewatchNotes: number;
  journalNotes: number;
  completedSeasons: number;
  completedMovies: number;
  completedBooks: number;
  completedCount: number;
  xpFromEpisodes: number;
  xpFromEpisodeNotes: number;
  xpFromCharacterWhys: number;
  xpFromJournalNotes: number;
  xpFromCompletions: number;
  total: number;
}

export interface LevelTier {
  level: number;
  name: string;
  minXp: number;
  nextXp: number;
}

export interface LevelInfo extends LevelTier {
  xp: number;
  xpIntoLevel: number;
  xpToNext: number;
  progressPct: number;
}

export interface DailyActivityEntry {
  count: number;
  events: ActivityEvent[];
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  activeDaysLast7: number;
  activeToday: boolean;
  restDaysUsedThisWeek: number;
  thisWeekEpisodes: number;
  dailyMap: Record<string, DailyActivityEntry>;
}

export type AchievementCategory =
  | 'watching'
  | 'journaling'
  | 'curation'
  | 'rewatch'
  | 'characters'
  | 'exploration'
  | 'reading'
  | 'habit';

export interface Achievement {
  id: string;
  name: string;
  detail: string;
  category: AchievementCategory;
  current: number;
  goal: number;
  unlocked: boolean;
  pct: number;
}

export interface ProgressionInput {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
  rewatchList: Rewatch[];
  activityList: ActivityEvent[];
}

export interface ProgressionStats {
  episodesWatched: number;
  thisWeekEpisodes: number;
  todayXp: number;
  notesCount: number;
  completedAnime: number;
  completedBooks: number;
  completedTotal: number;
  rewatchesCount: number;
  charactersCount: number;
}

export interface ProgressionResult {
  xp: XpBreakdown;
  level: LevelInfo;
  streak: StreakSummary;
  achievements: Achievement[];
  nearestAchievement: Achievement | null;
  unlockedCount: number;
  totalAchievements: number;
  stats: ProgressionStats;
}

export interface GamePrefs {
  xp: boolean;
  streak: boolean;
  celebrations: boolean;
}
