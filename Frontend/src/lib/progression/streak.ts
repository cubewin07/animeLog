import type { ActivityEvent } from '../../types';
import type { DailyActivityEntry, StreakSummary } from './types';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converts a Date or ISO/date string into a local YYYY-MM-DD key. */
export function toLocalDateKey(input: Date | string): string | null {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (DATE_ONLY_RE.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatLocalDate(parsed);
  }
  if (Number.isNaN(input.getTime())) return null;
  return formatLocalDate(input);
}

function dateKeyToDayNum(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function isEpisodeProgressEvent(event: ActivityEvent): boolean {
  return event.kind === 'EPISODE_PROGRESS';
}

interface RunState {
  longestStreak: number;
  runLength: number;
  runSinceLastRest: number;
  lastRestDayNum: number;
}

/**
 * Walks sorted distinct active day numbers and computes streak runs while forgiving
 * at most one rest day per rolling 7-day window (i.e. any two rest days >= 7 days apart).
 */
function measureRuns(sortedDayNums: number[]): RunState {
  if (sortedDayNums.length === 0) {
    return {
      longestStreak: 0,
      runLength: 0,
      runSinceLastRest: 0,
      lastRestDayNum: -Infinity,
    };
  }

  let runLength = 1;
  let runSinceLastRest = 1;
  let lastRestDayNum = -Infinity;
  let longestStreak = 1;

  for (let i = 1; i < sortedDayNums.length; i += 1) {
    const gap = sortedDayNums[i] - sortedDayNums[i - 1];
    if (gap === 1) {
      runLength += 1;
      runSinceLastRest += 1;
    } else if (gap === 2) {
      const restDay = sortedDayNums[i - 1] + 1;
      if (restDay - lastRestDayNum >= 7) {
        runLength += 1;
      } else {
        runLength = runSinceLastRest + 1;
      }
      lastRestDayNum = restDay;
      runSinceLastRest = 1;
    } else {
      runLength = 1;
      runSinceLastRest = 1;
      lastRestDayNum = -Infinity;
    }

    if (runLength > longestStreak) {
      longestStreak = runLength;
    }
  }

  return {
    longestStreak,
    runLength,
    runSinceLastRest,
    lastRestDayNum,
  };
}

/**
 * Computes streak metrics, weekly episode count, and daily heatmap map from activity events.
 * Negative undo deltas and backfilled migration events do not count toward streaks.
 */
export function computeStreak(
  activityEvents: ActivityEvent[],
  now: Date | string = new Date()
): StreakSummary {
  const todayKey = toLocalDateKey(now) ?? formatLocalDate(new Date());
  const todayNum = dateKeyToDayNum(todayKey);

  const dailyMap: Record<string, DailyActivityEntry> = {};
  const streakDaySet = new Set<number>();
  let thisWeekEpisodes = 0;

  for (const event of activityEvents) {
    const dateKey = toLocalDateKey(event.created_at);
    if (!dateKey) continue;

    if (event.delta > 0) {
      const existing = dailyMap[dateKey];
      if (existing) {
        existing.count += 1;
        existing.events.push(event);
      } else {
        dailyMap[dateKey] = { count: 1, events: [event] };
      }

      if (!event.backfilled) {
        streakDaySet.add(dateKeyToDayNum(dateKey));
      }
    }

    if (!event.backfilled && isEpisodeProgressEvent(event)) {
      const dayNum = dateKeyToDayNum(dateKey);
      if (dayNum >= todayNum - 6 && dayNum <= todayNum) {
        thisWeekEpisodes += event.delta;
      }
    }
  }

  thisWeekEpisodes = Math.max(0, thisWeekEpisodes);

  const allStreakDays = Array.from(streakDaySet).sort((a, b) => a - b);
  const allRuns = measureRuns(allStreakDays);

  const daysUpToToday = allStreakDays.filter((day) => day <= todayNum);
  const activeToday = streakDaySet.has(todayNum);

  let currentStreak = 0;
  if (daysUpToToday.length > 0) {
    const currentRuns = measureRuns(daysUpToToday);
    const lastActiveNum = daysUpToToday[daysUpToToday.length - 1];
    const gapToToday = todayNum - lastActiveNum;

    if (gapToToday === 0 || gapToToday === 1) {
      currentStreak = currentRuns.runLength;
    } else if (gapToToday === 2) {
      const yesterdayNum = todayNum - 1;
      currentStreak =
        yesterdayNum - currentRuns.lastRestDayNum >= 7
          ? currentRuns.runLength
          : currentRuns.runSinceLastRest;
    } else {
      currentStreak = 0;
    }
  }

  let activeDaysLast7 = 0;
  for (let day = todayNum - 6; day <= todayNum; day += 1) {
    if (streakDaySet.has(day)) activeDaysLast7 += 1;
  }

  let restDaysUsedThisWeek = 0;
  if (daysUpToToday.length > 0) {
    const firstActive = daysUpToToday[0];
    const windowStart = Math.max(firstActive, todayNum - 6);
    const windowEnd = activeToday ? todayNum : todayNum - 1;
    for (let day = windowStart; day <= windowEnd; day += 1) {
      if (!streakDaySet.has(day)) restDaysUsedThisWeek += 1;
    }
  }

  return {
    currentStreak,
    longestStreak: allRuns.longestStreak,
    activeDaysLast7,
    activeToday,
    restDaysUsedThisWeek,
    thisWeekEpisodes,
    dailyMap,
  };
}
