import type {
  ActivityEvent,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  Genre,
  Rewatch,
  Studio,
} from '../../types';
import { toLocalDateKey } from '../../lib/progression';
import { getCharacterCoverUrl, getCharacterImageCount, getCharacterTier } from '../characters/characterUtils';
import type { DailyActivityEntry } from '../../lib/progression';
import type { CardTier } from '../../ui/keyframe';
import type { JournalReflection } from '../../state/useReflections';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/;
const SEASON_NAME_RE = /\b(winter|spring|summer|fall|autumn)\b/i;

const TIER_RANK: Record<CardTier, number> = {
  sketch: 0,
  inked: 1,
  color: 2,
  foil: 3,
};

type SeasonWithOptionalMeta = AnimeSeason & {
  season_aired?: string | null;
  aired?: string | null;
};

export type CalendarSeasonName = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface ActivityCalendarDay {
  dateKey: string;
  label: string;
  tooltip: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface ActivityCalendarWeek {
  weekStartKey: string;
  monthLabel: string | null;
  days: ActivityCalendarDay[];
}

export interface RankedCountItem {
  id: number;
  name: string;
  count: number;
}

export interface RatingSpreadBucket {
  score: number;
  count: number;
}

export interface SeasonalBreakdownItem {
  season: CalendarSeasonName;
  count: number;
  titles: string[];
}

export interface HallOfFameItem {
  id: string;
  kind: 'anime' | 'book';
  title: string;
  subtitle?: string;
  coverUrl: string | null;
  href: string;
  rating: 10;
  note: string | null;
}

export interface TopCharacterItem {
  character: FavoriteCharacter;
  tier: CardTier;
  imageCount: number;
  coverUrl: string | null;
  seriesTitle: string;
  href: string;
}

export interface LibraryAnalyticsInput {
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList: FavoriteCharacter[];
  rewatchList: Rewatch[];
  activityList: ActivityEvent[];
}

export interface LibraryAnalytics {
  totalEpisodes: number;
  estimatedHours: number;
  completedAnime: number;
  completedBooks: number;
  completedTotal: number;
  seriesCount: number;
  booksCount: number;
  charactersCount: number;
  rewatchesCount: number;
  notesCount: number;
  topGenres: RankedCountItem[];
  topStudios: RankedCountItem[];
  ratingSpread: RatingSpreadBucket[];
  seasonalBreakdown: SeasonalBreakdownItem[];
  hallOfFame: HallOfFameItem[];
  topCharacters: TopCharacterItem[];
  availableRecapYears: number[];
}

export interface YearRecapInput extends LibraryAnalyticsInput {
  reflections: JournalReflection[];
}

export interface RecapTopTitle {
  id: string;
  kind: 'anime' | 'book';
  title: string;
  subtitle?: string;
  coverUrl: string | null;
  href: string;
  rating: number | null;
  note: string | null;
}

export interface YearRecap {
  year: number;
  hours: number;
  episodes: number;
  movies: number;
  books: number;
  notesCount: number;
  titlesTouched: number;
  topTitle: RecapTopTitle | null;
  topGenre: RankedCountItem | null;
  topStudio: RankedCountItem | null;
  mostWrittenCharacter: TopCharacterItem | null;
  bestNote: JournalReflection | null;
  bestNoteIsFallback: boolean;
  isFullColorUnlocked: boolean;
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function parseDatePartsLocal(value: Date | string | null | undefined): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = DATE_ONLY_RE.exec(trimmed);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }
  const key = toLocalDateKey(value);
  if (!key) return null;
  const match = DATE_ONLY_RE.exec(key);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function extractYear(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const parts = parseDatePartsLocal(value);
  if (parts && parts.year >= 1900 && parts.year <= 2100) return parts.year;
  if (typeof value === 'string') {
    const match = YEAR_RE.exec(value);
    if (match) return Number(match[1]);
  }
  return null;
}

function formatKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function intensityForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function formatDayLabel(date: Date): string {
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function formatTooltip(label: string, count: number): string {
  if (count <= 0) return `${label} · No activity`;
  return `${label} · ${count} ${count === 1 ? 'activity' : 'activities'}`;
}

/**
 * Builds a Sunday–Saturday calendar matrix covering the last `weeks` weeks up to `now`.
 */
export function buildActivityCalendar(
  dailyMap: Record<string, DailyActivityEntry>,
  weeks = 26,
  now: Date | string = new Date(),
): ActivityCalendarWeek[] {
  const safeWeeks = Math.max(1, Math.floor(weeks));
  const nowParts = parseDatePartsLocal(now) ?? parseDatePartsLocal(new Date())!;
  const today = new Date(nowParts.year, nowParts.month - 1, nowParts.day);
  const todayKey = formatKeyFromDate(today);

  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() - today.getDay());

  const startSunday = new Date(currentWeekSunday);
  startSunday.setDate(currentWeekSunday.getDate() - (safeWeeks - 1) * 7);

  const columns: ActivityCalendarWeek[] = [];

  for (let w = 0; w < safeWeeks; w += 1) {
    const weekStart = new Date(startSunday);
    weekStart.setDate(startSunday.getDate() + w * 7);
    const weekStartKey = formatKeyFromDate(weekStart);

    const days: ActivityCalendarDay[] = [];
    let firstOfMonth: Date | null = null;

    for (let d = 0; d < 7; d += 1) {
      const cellDate = new Date(weekStart);
      cellDate.setDate(weekStart.getDate() + d);
      const dateKey = formatKeyFromDate(cellDate);
      const isFuture = cellDate.getTime() > today.getTime();
      const isToday = dateKey === todayKey;
      const count = isFuture ? 0 : Math.max(0, dailyMap[dateKey]?.count ?? 0);
      const label = formatDayLabel(cellDate);

      if (!isFuture && cellDate.getDate() === 1 && !firstOfMonth) {
        firstOfMonth = cellDate;
      }

      days.push({
        dateKey,
        label,
        tooltip: isFuture ? `${label} · Upcoming` : formatTooltip(label, count),
        count,
        intensity: intensityForCount(count),
        dayOfWeek: d,
        isToday,
        isFuture,
      });
    }

    let monthLabel: string | null = null;
    if (firstOfMonth) {
      monthLabel = MONTH_SHORT[firstOfMonth.getMonth()];
    } else if (w === 0) {
      // Avoid crowding week 0 label when week 1 immediately starts a new month
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(weekStart.getDate() + 7);
      const nextWeekHasFirst = Array.from({ length: 7 }, (_, idx) => {
        const probe = new Date(nextWeekStart);
        probe.setDate(nextWeekStart.getDate() + idx);
        return probe.getDate() === 1;
      }).some(Boolean);
      if (!nextWeekHasFirst) {
        monthLabel = MONTH_SHORT[weekStart.getMonth()];
      }
    }

    columns.push({
      weekStartKey,
      monthLabel,
      days,
    });
  }

  return columns;
}

function resolveCoverUrl(
  primary?: { cover_image_url?: string | null; image_url?: string | null } | null,
  fallback?: { cover_image_url?: string | null; image_url?: string | null } | null,
): string | null {
  return (
    primary?.cover_image_url?.trim() ||
    primary?.image_url?.trim() ||
    fallback?.cover_image_url?.trim() ||
    fallback?.image_url?.trim() ||
    null
  );
}

function monthToCalendarSeason(month: number): CalendarSeasonName | null {
  if (month >= 1 && month <= 3) return 'Winter';
  if (month >= 4 && month <= 6) return 'Spring';
  if (month >= 7 && month <= 9) return 'Summer';
  if (month >= 10 && month <= 12) return 'Fall';
  return null;
}

function parseCalendarSeasonFromText(raw: string | null | undefined): CalendarSeasonName | null {
  if (!raw) return null;
  const match = SEASON_NAME_RE.exec(raw);
  if (!match) return null;
  const word = match[1].toLowerCase();
  if (word === 'winter') return 'Winter';
  if (word === 'spring') return 'Spring';
  if (word === 'summer') return 'Summer';
  if (word === 'fall' || word === 'autumn') return 'Fall';
  return null;
}

function inferAnimeSeasonQuarter(season: SeasonWithOptionalMeta): CalendarSeasonName | null {
  const fromAired =
    parseCalendarSeasonFromText(season.season_aired) ?? parseCalendarSeasonFromText(season.aired);
  if (fromAired) return fromAired;

  if (season.status !== 'COMPLETED' && !season.finish_date) return null;
  const parts = parseDatePartsLocal(season.finish_date) ?? parseDatePartsLocal(season.start_date);
  return parts ? monthToCalendarSeason(parts.month) : null;
}

function inferReleaseFinishedQuarter(release: {
  status: string;
  finish_date: string | null;
  start_date: string | null;
}): CalendarSeasonName | null {
  if (release.status !== 'COMPLETED' && !release.finish_date) return null;
  const parts = parseDatePartsLocal(release.finish_date) ?? parseDatePartsLocal(release.start_date);
  return parts ? monthToCalendarSeason(parts.month) : null;
}

function tallyNamedItems<T extends { id: number; name: string }>(
  groups: Iterable<T[]>,
  limit = 6,
): RankedCountItem[] {
  const map = new Map<string, RankedCountItem>();

  for (const group of groups) {
    const seenInGroup = new Set<string>();
    for (const item of group) {
      const name = item.name.trim();
      const key = name.toLowerCase() || String(item.id);
      if (!key || seenInGroup.has(key)) continue;
      seenInGroup.add(key);

      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { id: item.id, name: name || `#${item.id}`, count: 1 });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function collectSeriesStudios(series: AnimeSeries): Studio[] {
  const all: Studio[] = [...(series.studios ?? [])];
  for (const season of series.seasons ?? []) all.push(...(season.studios ?? []));
  for (const movie of series.movies ?? []) all.push(...(movie.studios ?? []));
  return all;
}

function sortTopCharacters(
  characterList: FavoriteCharacter[],
  seriesTitleMap: Map<number, string>,
): TopCharacterItem[] {
  return [...characterList]
    .map((character) => {
      const tier = getCharacterTier(character);
      const imageCount = getCharacterImageCount(character);
      const coverUrl = getCharacterCoverUrl(character);
      const seriesTitle = character.series_title || seriesTitleMap.get(character.series) || '';
      return {
        character,
        tier,
        imageCount,
        coverUrl,
        seriesTitle,
        href: `/characters/${character.id}`,
      };
    })
    .sort((a, b) => {
      const tierDiff = TIER_RANK[b.tier] - TIER_RANK[a.tier];
      if (tierDiff !== 0) return tierDiff;
      const imgDiff = b.imageCount - a.imageCount;
      if (imgDiff !== 0) return imgDiff;
      const whyDiff = (b.character.why?.trim().length ?? 0) - (a.character.why?.trim().length ?? 0);
      if (whyDiff !== 0) return whyDiff;
      return a.character.name.localeCompare(b.character.name) || a.character.id - b.character.id;
    });
}

/**
 * Computes full-library statistics, top genres/studios, rating spread, seasonal breakdown,
 * Hall of Fame, sorted top characters, and available recap years.
 */
export function computeLibraryAnalytics(
  input: LibraryAnalyticsInput,
  now: Date | string = new Date(),
): LibraryAnalytics {
  const { seriesList, bookList, characterList, rewatchList, activityList } = input;

  let totalEpisodes = 0;
  let totalMovieMinutes = 0;
  let completedAnime = 0;
  let completedBooks = 0;
  let notesCount = 0;

  const ratingCounts = new Map<number, number>();
  for (let score = 1; score <= 10; score += 1) {
    ratingCounts.set(score, 0);
  }

  const recordRating = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return;
    const rounded = Math.round(rating);
    if (rounded >= 1 && rounded <= 10) {
      ratingCounts.set(rounded, (ratingCounts.get(rounded) ?? 0) + 1);
    }
  };

  const seasonalMap: Record<CalendarSeasonName, string[]> = {
    Winter: [],
    Spring: [],
    Summer: [],
    Fall: [],
  };

  const hallOfFame: HallOfFameItem[] = [];
  const yearSet = new Set<number>();
  const nowParts = parseDatePartsLocal(now);
  yearSet.add(nowParts?.year ?? new Date().getFullYear());

  const addYearFromDate = (dateVal: string | null | undefined) => {
    const yr = extractYear(dateVal);
    if (yr !== null) yearSet.add(yr);
  };

  const genreGroups: Genre[][] = [];
  const studioGroups: Studio[][] = [];
  const seriesTitleMap = new Map<number, string>();

  for (const series of seriesList) {
    seriesTitleMap.set(series.id, series.title);
    if (series.genres?.length) genreGroups.push(series.genres);
    const studios = collectSeriesStudios(series);
    if (studios.length) studioGroups.push(studios);

    const releaseCount = (series.seasons?.length ?? 0) + (series.movies?.length ?? 0);

    for (const season of series.seasons ?? []) {
      const progress = Math.max(0, season.progress || 0);
      totalEpisodes += progress;
      if (season.status === 'COMPLETED') completedAnime += 1;
      if (hasText(season.notes)) notesCount += 1;
      for (const ep of season.episode_notes ?? []) {
        if (hasText(ep.note)) notesCount += 1;
        addYearFromDate(ep.created_at);
      }
      recordRating(season.rating);
      addYearFromDate(season.finish_date);
      addYearFromDate(season.start_date);

      const quarter = inferAnimeSeasonQuarter(season as SeasonWithOptionalMeta);
      if (quarter) {
        const label =
          releaseCount > 1 && season.title && season.title !== series.title
            ? `${series.title} (${season.title})`
            : series.title;
        seasonalMap[quarter].push(label);
      }

      if (season.rating === 10) {
        hallOfFame.push({
          id: `season-${season.id}`,
          kind: 'anime',
          title: series.title,
          subtitle:
            releaseCount > 1
              ? season.title || `Season ${season.season_number}`
              : undefined,
          coverUrl: resolveCoverUrl(season, series),
          href: `/anime/${series.id}?release=season-${season.id}`,
          rating: 10,
          note: season.notes?.trim() ? season.notes.trim() : null,
        });
      }
    }

    for (const movie of series.movies ?? []) {
      totalMovieMinutes += Math.max(0, movie.progress_minutes || 0);
      if (movie.status === 'COMPLETED') completedAnime += 1;
      if (hasText(movie.notes)) notesCount += 1;
      recordRating(movie.rating);
      addYearFromDate(movie.finish_date);
      addYearFromDate(movie.start_date);

      const quarter = inferReleaseFinishedQuarter(movie);
      if (quarter) {
        seasonalMap[quarter].push(
          movie.title && movie.title !== series.title ? `${series.title} · ${movie.title}` : series.title,
        );
      }

      if (movie.rating === 10) {
        hallOfFame.push({
          id: `movie-${movie.id}`,
          kind: 'anime',
          title: series.title,
          subtitle: movie.title || 'Movie',
          coverUrl: resolveCoverUrl(movie, series),
          href: `/anime/${series.id}?release=movie-${movie.id}`,
          rating: 10,
          note: movie.notes?.trim() ? movie.notes.trim() : null,
        });
      }
    }
  }

  for (const book of bookList) {
    if (book.genres?.length) genreGroups.push(book.genres);
    if (book.status === 'COMPLETED') completedBooks += 1;
    if (hasText(book.notes)) notesCount += 1;
    recordRating(book.rating);
    addYearFromDate(book.finish_date);
    addYearFromDate(book.start_date);

    const quarter = inferReleaseFinishedQuarter(book);
    if (quarter) {
      seasonalMap[quarter].push(book.title);
    }

    if (book.rating === 10) {
      hallOfFame.push({
        id: `book-${book.id}`,
        kind: 'book',
        title: book.title,
        subtitle: book.author || 'Book',
        coverUrl: resolveCoverUrl(book),
        href: `/books/${book.id}`,
        rating: 10,
        note: book.notes?.trim() ? book.notes.trim() : null,
      });
    }
  }

  for (const char of characterList) {
    if (hasText(char.why)) notesCount += 1;
  }

  for (const rewatch of rewatchList) {
    if (hasText(rewatch.notes)) notesCount += 1;
    addYearFromDate(rewatch.finish_date);
    addYearFromDate(rewatch.start_date);
  }

  for (const event of activityList) {
    addYearFromDate(event.created_at);
  }

  const estimatedHours = Math.round((totalEpisodes * 0.4 + totalMovieMinutes / 60) * 10) / 10;

  const ratingSpread: RatingSpreadBucket[] = Array.from({ length: 10 }, (_, idx) => {
    const score = idx + 1;
    return { score, count: ratingCounts.get(score) ?? 0 };
  });

  const seasonalOrder: CalendarSeasonName[] = ['Winter', 'Spring', 'Summer', 'Fall'];
  const seasonalBreakdown: SeasonalBreakdownItem[] = seasonalOrder.map((season) => ({
    season,
    count: seasonalMap[season].length,
    titles: seasonalMap[season],
  }));

  const availableRecapYears = Array.from(yearSet).sort((a, b) => b - a);

  return {
    totalEpisodes,
    estimatedHours,
    completedAnime,
    completedBooks,
    completedTotal: completedAnime + completedBooks,
    seriesCount: seriesList.length,
    booksCount: bookList.length,
    charactersCount: characterList.length,
    rewatchesCount: rewatchList.length,
    notesCount,
    topGenres: tallyNamedItems(genreGroups, 6),
    topStudios: tallyNamedItems(studioGroups, 6),
    ratingSpread,
    seasonalBreakdown,
    hallOfFame,
    topCharacters: sortTopCharacters(characterList, seriesTitleMap),
    availableRecapYears,
  };
}

function getReflectionYear(reflection: JournalReflection): number | null {
  const fromStr = extractYear(reflection.dateStr);
  if (fromStr !== null) return fromStr;
  if (reflection.timestamp > 0) {
    const yr = new Date(reflection.timestamp).getFullYear();
    return Number.isFinite(yr) ? yr : null;
  }
  return null;
}

function pickBestNote(candidates: JournalReflection[]): JournalReflection | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const aScore = (a.rating ?? 0) * 40 + Math.min(400, a.note.trim().length);
    const bScore = (b.rating ?? 0) * 40 + Math.min(400, b.note.trim().length);
    if (bScore !== aScore) return bScore - aScore;
    if (b.note.trim().length !== a.note.trim().length) {
      return b.note.trim().length - a.note.trim().length;
    }
    return b.timestamp - a.timestamp;
  })[0];
}

function releaseBelongsToYear(
  release: {
    start_date: string | null;
    finish_date: string | null;
    created_at: string;
    status: string;
    notes: string | null;
  },
  year: number,
  hasActivityInYear: boolean,
  hasEpisodeNotesInYear = false,
): boolean {
  if (hasActivityInYear || hasEpisodeNotesInYear) return true;
  const finishYear = extractYear(release.finish_date);
  const startYear = extractYear(release.start_date);
  if (finishYear === year || startYear === year) return true;
  if (finishYear === null && startYear === null) {
    return extractYear(release.created_at) === year;
  }
  return false;
}

/**
 * Aggregates watching, reading, writing, top title, taste, character spotlight, and best note
 * for a single calendar year.
 */
export function computeYearRecap(year: number, input: YearRecapInput): YearRecap {
  const { seriesList, bookList, characterList, rewatchList, activityList, reflections } = input;

  const seasonEpisodeActivity = new Map<number, number>();
  const movieMinutesActivity = new Map<number, number>();
  const activeSeasonIds = new Set<number>();
  const activeMovieIds = new Set<number>();
  const activeBookIds = new Set<number>();
  const completedMovieIds = new Set<number>();
  const completedBookIds = new Set<number>();
  const characterAddedIds = new Set<number>();
  let orphanedEpisodeActivity = 0;

  const knownSeasonIds = new Set<number>();
  for (const s of seriesList) {
    for (const sea of s.seasons ?? []) knownSeasonIds.add(sea.id);
  }

  for (const event of activityList) {
    if (extractYear(event.created_at) !== year) continue;

    if (event.target_type === 'season') {
      if (event.delta > 0) activeSeasonIds.add(event.target_id);
      if (event.kind === 'EPISODE_PROGRESS') {
        if (knownSeasonIds.has(event.target_id)) {
          seasonEpisodeActivity.set(
            event.target_id,
            (seasonEpisodeActivity.get(event.target_id) ?? 0) + event.delta,
          );
        } else {
          orphanedEpisodeActivity += event.delta;
        }
      }
    } else if (event.target_type === 'movie') {
      if (event.delta > 0) activeMovieIds.add(event.target_id);
      if (event.kind === 'MOVIE_PROGRESS') {
        movieMinutesActivity.set(
          event.target_id,
          (movieMinutesActivity.get(event.target_id) ?? 0) + event.delta,
        );
      } else if (event.kind === 'COMPLETED' && event.delta > 0) {
        completedMovieIds.add(event.target_id);
      }
    } else if (event.target_type === 'book') {
      if (event.delta > 0) activeBookIds.add(event.target_id);
      if (event.kind === 'COMPLETED' && event.delta > 0) {
        completedBookIds.add(event.target_id);
      }
    } else if (event.target_type === 'character' && event.kind === 'CHARACTER_ADDED' && event.delta > 0) {
      characterAddedIds.add(event.target_id);
    }
  }

  let episodes = Math.max(0, orphanedEpisodeActivity);
  let movies = 0;
  let movieMinutes = 0;
  let books = 0;
  let titlesTouched = 0;

  const yearGenreGroups: Genre[][] = [];
  const yearStudioGroups: Studio[][] = [];
  const seriesActivityScore = new Map<number, number>();
  const seriesTitleMap = new Map<number, string>();

  interface RankedTitleCandidate extends RecapTopTitle {
    scoreRank: number;
  }

  const titleCandidates: RankedTitleCandidate[] = [];

  for (const series of seriesList) {
    seriesTitleMap.set(series.id, series.title);
    let seriesTouched = false;
    let seriesScore = 0;

    for (const season of series.seasons ?? []) {
      const epNotesInYear = (season.episode_notes ?? []).filter(
        (n) => hasText(n.note) && extractYear(n.created_at) === year,
      );
      const activityEps = Math.max(0, seasonEpisodeActivity.get(season.id) ?? 0);
      const hasActivity = activeSeasonIds.has(season.id) || activityEps > 0;
      const inYear = releaseBelongsToYear(season, year, hasActivity, epNotesInYear.length > 0);
      if (!inYear) continue;

      seriesTouched = true;
      const epsForSeason =
        activityEps > 0
          ? activityEps
          : extractYear(season.finish_date) === year ||
              (extractYear(season.finish_date) === null &&
                (extractYear(season.start_date) === year ||
                  (extractYear(season.start_date) === null && extractYear(season.created_at) === year)))
            ? Math.max(0, season.progress || 0)
            : 0;

      episodes += epsForSeason;
      seriesScore += epsForSeason + epNotesInYear.length * 3 + (hasText(season.notes) ? 5 : 0);

      const rating = season.rating ?? 0;
      const noteText = season.notes?.trim() ? season.notes.trim() : null;
      const isCompletedInYear =
        season.status === 'COMPLETED' &&
        (extractYear(season.finish_date) === year || hasActivity || extractYear(season.start_date) === year);

      const scoreRank =
        rating * 100 +
        (noteText ? 40 + Math.min(80, noteText.length) : 0) +
        (isCompletedInYear ? 25 : 0) +
        epsForSeason;

      titleCandidates.push({
        id: `season-${season.id}`,
        kind: 'anime',
        title: series.title,
        subtitle:
          (series.seasons?.length ?? 0) + (series.movies?.length ?? 0) > 1
            ? season.title || `Season ${season.season_number}`
            : undefined,
        coverUrl: resolveCoverUrl(season, series),
        href: `/anime/${series.id}?release=season-${season.id}`,
        rating: season.rating,
        note: noteText,
        scoreRank,
      });
    }

    for (const movie of series.movies ?? []) {
      const hasActivity = activeMovieIds.has(movie.id) || completedMovieIds.has(movie.id);
      const inYear = releaseBelongsToYear(movie, year, hasActivity);
      if (!inYear) continue;

      seriesTouched = true;
      const finishYr = extractYear(movie.finish_date);
      const startYr = extractYear(movie.start_date);
      const createdYr = extractYear(movie.created_at);
      const completedInYear =
        completedMovieIds.has(movie.id) ||
        (movie.status === 'COMPLETED' &&
          (finishYr === year || (finishYr === null && (startYr === year || (startYr === null && createdYr === year)))));

      if (completedInYear) {
        movies += 1;
      }

      const activityMins = Math.max(0, movieMinutesActivity.get(movie.id) ?? 0);
      const minsForMovie =
        activityMins > 0
          ? activityMins
          : finishYr === year || (finishYr === null && (startYr === year || (startYr === null && createdYr === year)))
            ? Math.max(0, movie.progress_minutes || 0)
            : 0;
      movieMinutes += minsForMovie;
      seriesScore += (completedInYear ? 8 : 3) + (hasText(movie.notes) ? 5 : 0);

      const rating = movie.rating ?? 0;
      const noteText = movie.notes?.trim() ? movie.notes.trim() : null;
      const scoreRank =
        rating * 100 +
        (noteText ? 40 + Math.min(80, noteText.length) : 0) +
        (completedInYear ? 25 : 0);

      titleCandidates.push({
        id: `movie-${movie.id}`,
        kind: 'anime',
        title: series.title,
        subtitle: movie.title || 'Movie',
        coverUrl: resolveCoverUrl(movie, series),
        href: `/anime/${series.id}?release=movie-${movie.id}`,
        rating: movie.rating,
        note: noteText,
        scoreRank,
      });
    }

    // Rewatches tied to this series in `year` also touch the series
    for (const rewatch of rewatchList) {
      if (rewatch.series_id !== series.id) continue;
      const rYear = extractYear(rewatch.finish_date) ?? extractYear(rewatch.start_date);
      if (rYear === year) {
        seriesTouched = true;
        seriesScore += 6 + (hasText(rewatch.notes) ? 5 : 0);
      }
    }

    if (seriesTouched) {
      titlesTouched += 1;
      seriesActivityScore.set(series.id, seriesScore);
      if (series.genres?.length) yearGenreGroups.push(series.genres);
      const studios = collectSeriesStudios(series);
      if (studios.length) yearStudioGroups.push(studios);
    }
  }

  for (const book of bookList) {
    const hasActivity = activeBookIds.has(book.id) || completedBookIds.has(book.id);
    if (!releaseBelongsToYear(book, year, hasActivity)) continue;

    titlesTouched += 1;
    if (book.genres?.length) yearGenreGroups.push(book.genres);

    const finishYr = extractYear(book.finish_date);
    const startYr = extractYear(book.start_date);
    const createdYr = extractYear(book.created_at);
    const completedInYear =
      completedBookIds.has(book.id) ||
      (book.status === 'COMPLETED' &&
        (finishYr === year || (finishYr === null && (startYr === year || (startYr === null && createdYr === year)))));
    if (completedInYear) {
      books += 1;
    }

    const rating = book.rating ?? 0;
    const noteText = book.notes?.trim() ? book.notes.trim() : null;
    const scoreRank =
      rating * 100 +
      (noteText ? 40 + Math.min(80, noteText.length) : 0) +
      (completedInYear ? 25 : 0);

    titleCandidates.push({
      id: `book-${book.id}`,
      kind: 'book',
      title: book.title,
      subtitle: book.author || 'Book',
      coverUrl: resolveCoverUrl(book),
      href: `/books/${book.id}`,
      rating: book.rating,
      note: noteText,
      scoreRank,
    });
  }

  const yearReflections = reflections.filter((r) => hasText(r.note) && getReflectionYear(r) === year);
  const noteWrittenEvents = activityList.filter(
    (e) =>
      extractYear(e.created_at) === year &&
      (e.kind === 'NOTE_WRITTEN' || e.kind === 'REWATCH_LOGGED') &&
      e.delta > 0,
  ).length;
  const notesCount = Math.max(yearReflections.length, noteWrittenEvents);

  const bestYearNote = pickBestNote(yearReflections);
  const fallbackNote = bestYearNote ? null : pickBestNote(reflections.filter((r) => hasText(r.note)));
  const bestNote = bestYearNote ?? fallbackNote;
  const bestNoteIsFallback = Boolean(!bestYearNote && fallbackNote);

  const sortedTitles = [...titleCandidates].sort((a, b) => b.scoreRank - a.scoreRank);
  const topTitleRaw = sortedTitles[0] ?? null;
  const topTitle: RecapTopTitle | null = topTitleRaw
    ? {
        id: topTitleRaw.id,
        kind: topTitleRaw.kind,
        title: topTitleRaw.title,
        subtitle: topTitleRaw.subtitle,
        coverUrl: topTitleRaw.coverUrl,
        href: topTitleRaw.href,
        rating: topTitleRaw.rating,
        note: topTitleRaw.note,
      }
    : null;

  const yearCharacters = characterList.filter(
    (c) => seriesActivityScore.has(c.series) || characterAddedIds.has(c.id),
  );
  const mostWrittenCharacter =
    yearCharacters.length > 0
      ? [...yearCharacters]
          .map((character) => ({
            character,
            tier: getCharacterTier(character),
            imageCount: getCharacterImageCount(character),
            coverUrl: getCharacterCoverUrl(character),
            seriesTitle: character.series_title || seriesTitleMap.get(character.series) || '',
            href: `/characters/${character.id}`,
          }))
          .sort((a, b) => {
            const actDiff =
              (seriesActivityScore.get(b.character.series) ?? 0) -
              (seriesActivityScore.get(a.character.series) ?? 0);
            if (actDiff !== 0) return actDiff;
            const whyDiff =
              (b.character.why?.trim().length ?? 0) - (a.character.why?.trim().length ?? 0);
            if (whyDiff !== 0) return whyDiff;
            const imgDiff = b.imageCount - a.imageCount;
            if (imgDiff !== 0) return imgDiff;
            return TIER_RANK[b.tier] - TIER_RANK[a.tier];
          })[0]
      : null;

  const topGenre = tallyNamedItems(yearGenreGroups, 1)[0] ?? null;
  const topStudio = tallyNamedItems(yearStudioGroups, 1)[0] ?? null;
  const hours = Math.round((episodes * 0.4 + movieMinutes / 60) * 10) / 10;
  const isFullColorUnlocked =
    episodes + movies + books + notesCount >= 5 || titlesTouched >= 2;

  return {
    year,
    hours,
    episodes,
    movies,
    books,
    notesCount,
    titlesTouched,
    topTitle,
    topGenre,
    topStudio,
    mostWrittenCharacter,
    bestNote,
    bestNoteIsFallback,
    isFullColorUnlocked,
  };
}
