import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Film,
  Flame,
  Flower2,
  Leaf,
  PenLine,
  Settings,
  Snowflake,
  Sparkles,
  Sun,
  Trophy,
  Tv,
  Users,
} from 'lucide-react';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { computeProgression, getGamePrefs } from '../../lib/progression';
import type { GamePrefs } from '../../lib/progression';
import { CoverArt, KfButton, KfCharacterCard, ScoreTag } from '../../ui/keyframe';
import {
  buildActivityCalendar,
  computeLibraryAnalytics,
  type ActivityCalendarDay,
  type CalendarSeasonName,
} from './meStats';
import '../../styles/keyframe.css';
import './MePage.css';

type AchievementFilter = 'all' | 'unlocked' | 'locked';

const SEASON_META: Record<
  CalendarSeasonName,
  { label: string; months: string; Icon: typeof Snowflake }
> = {
  Winter: { label: 'Winter', months: 'Jan – Mar', Icon: Snowflake },
  Spring: { label: 'Spring', months: 'Apr – Jun', Icon: Flower2 },
  Summer: { label: 'Summer', months: 'Jul – Sep', Icon: Sun },
  Fall: { label: 'Fall', months: 'Oct – Dec', Icon: Leaf },
};

const WEEKDAY_LABELS: Array<{ row: number; label: string }> = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' },
];

export const MePage: React.FC = () => {
  const {
    loading,
    loadFailed,
    seriesList,
    bookList,
    characterList,
    rewatchList,
    activityList,
  } = useJournalData();
  const { retryLoad } = useJournalActions();

  const [prefs, setPrefs] = useState<GamePrefs>(() => getGamePrefs());
  const [calWeeksCount, setCalWeeksCount] = useState<26 | 52>(26);
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>('all');
  const [selectedDay, setSelectedDay] = useState<ActivityCalendarDay | null>(null);

  useEffect(() => {
    const syncPrefs = () => setPrefs(getGamePrefs());
    window.addEventListener('focus', syncPrefs);
    window.addEventListener('storage', syncPrefs);
    return () => {
      window.removeEventListener('focus', syncPrefs);
      window.removeEventListener('storage', syncPrefs);
    };
  }, []);

  const progression = useMemo(
    () =>
      computeProgression({
        seriesList,
        bookList,
        characterList,
        rewatchList,
        activityList,
      }),
    [seriesList, bookList, characterList, rewatchList, activityList],
  );

  const analytics = useMemo(
    () =>
      computeLibraryAnalytics({
        seriesList,
        bookList,
        characterList,
        rewatchList,
        activityList,
      }),
    [seriesList, bookList, characterList, rewatchList, activityList],
  );

  const calendarWeeks = useMemo(
    () => buildActivityCalendar(progression.streak.dailyMap, calWeeksCount),
    [progression.streak.dailyMap, calWeeksCount],
  );

  const latestYear = analytics.availableRecapYears[0] ?? new Date().getFullYear();

  const filteredAchievements = useMemo(() => {
    if (achievementFilter === 'unlocked') {
      return progression.achievements.filter((a) => a.unlocked);
    }
    if (achievementFilter === 'locked') {
      return progression.achievements.filter((a) => !a.unlocked);
    }
    return progression.achievements;
  }, [progression.achievements, achievementFilter]);

  const activeDayPreview = useMemo(() => {
    if (selectedDay) return selectedDay;
    for (let w = calendarWeeks.length - 1; w >= 0; w -= 1) {
      const todayCell = calendarWeeks[w].days.find((d) => d.isToday);
      if (todayCell) return todayCell;
    }
    return null;
  }, [calendarWeeks, selectedDay]);

  const maxGenreCount = Math.max(1, ...analytics.topGenres.map((g) => g.count));
  const maxStudioCount = Math.max(1, ...analytics.topStudios.map((s) => s.count));
  const maxRatingCount = Math.max(1, ...analytics.ratingSpread.map((r) => r.count));
  const totalRatedCount = analytics.ratingSpread.reduce((sum, r) => sum + r.count, 0);

  const hasAnyData =
    seriesList.length > 0 || bookList.length > 0 || characterList.length > 0 || activityList.length > 0;

  if (loading && !hasAnyData) {
    return (
      <div className="kf kf-me" aria-busy="true" aria-label="Loading profile stats">
        <div className="kf-me-skeleton-header" />
        <div className="kf-me-top-grid">
          <div className="kf-me-skeleton-card" />
          <div className="kf-me-skeleton-card" />
          <div className="kf-me-skeleton-card" />
        </div>
        <div className="kf-me-skeleton-wide" />
      </div>
    );
  }

  if (loadFailed && !hasAnyData) {
    return (
      <div className="kf kf-me">
        <div className="kf-me-error" role="alert">
          <AlertCircle size={26} aria-hidden="true" />
          <h2>Couldn’t load your profile</h2>
          <p>Check that the backend server is running, then try again.</p>
          <KfButton variant="primary" onClick={retryLoad}>
            Retry
          </KfButton>
        </div>
      </div>
    );
  }

  const levelSpan = Math.max(1, progression.level.nextXp - progression.level.minXp);
  const unlockedCount = progression.unlockedCount;
  const totalAchievements = progression.totalAchievements;
  const lockedCount = totalAchievements - unlockedCount;

  const xpChips = [
    {
      label: 'Episodes',
      count: progression.xp.episodesWatched,
      xp: progression.xp.xpFromEpisodes,
    },
    {
      label: 'Episode notes',
      count: progression.xp.episodeNotes,
      xp: progression.xp.xpFromEpisodeNotes,
    },
    {
      label: 'Character whys',
      count: progression.xp.characterWhys,
      xp: progression.xp.xpFromCharacterWhys,
    },
    {
      label: 'Journal notes',
      count: progression.xp.journalNotes,
      xp: progression.xp.xpFromJournalNotes,
    },
    {
      label: 'Completions',
      count: progression.xp.completedCount,
      xp: progression.xp.xpFromCompletions,
    },
  ];

  const topCharacters = analytics.topCharacters.slice(0, 8);

  return (
    <div className="kf kf-me">
      <header className="kf-me-header">
        <div className="kf-me-title-block">
          <h1>Me</h1>
          <p>Your journal momentum, milestones, watching habits, and all-time favorites.</p>
        </div>
        <Link viewTransition to="/settings" className="kf-me-settings-link">
          <Settings size={15} aria-hidden="true" />
          <span>Customize toggles</span>
        </Link>
      </header>

      {/* Top Row: Level & XP, Streak, Yearly Recap CTA */}
      <section className="kf-me-top-grid" aria-label="Progression and yearly recap">
        {prefs.xp && (
          <article className="kf-me-card is-xp">
            <div className="kf-me-card-top">
              <span className="kf-me-badge is-gold">
                <Sparkles size={13} aria-hidden="true" />
                <span>
                  Lv. {progression.level.level} · {progression.level.name}
                </span>
              </span>
              <span className="kf-me-today-pill">+{progression.stats.todayXp} XP today</span>
            </div>

            <div className="kf-me-xp-readout">
              <strong>{progression.xp.total.toLocaleString()} XP</strong>
              <span>
                {progression.level.xpIntoLevel} / {levelSpan} · {progression.level.xpToNext} to next
              </span>
            </div>

            <div
              className="kf-me-xp-track"
              role="progressbar"
              aria-valuenow={progression.level.progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level ${progression.level.level} progress`}
            >
              <span style={{ width: `${progression.level.progressPct}%` }} />
            </div>

            <ul className="kf-me-xp-chips" aria-label="XP breakdown">
              {xpChips.map((chip) => (
                <li key={chip.label} className="kf-me-xp-chip">
                  <span>{chip.label}</span>
                  <strong>{chip.xp} XP</strong>
                </li>
              ))}
            </ul>
          </article>
        )}

        {prefs.streak && (
          <article className="kf-me-card is-streak">
            <div className="kf-me-card-top">
              <span className="kf-me-badge is-jade">
                <Flame size={13} aria-hidden="true" />
                <span>Journal Habit</span>
              </span>
              <span className="kf-me-muted-meta">
                Best: {progression.streak.longestStreak}{' '}
                {progression.streak.longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="kf-me-streak-main">
              <strong>
                {progression.streak.currentStreak}{' '}
                <span>{progression.streak.currentStreak === 1 ? 'day' : 'days'}</span>
              </strong>
              <p>
                {progression.streak.activeDaysLast7} of 7 active days this week ·{' '}
                {progression.stats.thisWeekEpisodes}{' '}
                {progression.stats.thisWeekEpisodes === 1 ? 'episode' : 'episodes'}
              </p>
            </div>

            <p className="kf-me-forgiveness">
              1 rest day forgiven each week — pick up anytime
            </p>
          </article>
        )}

        <article className="kf-me-card is-recap">
          <div className="kf-me-card-top">
            <span className="kf-me-badge">
              <Calendar size={13} aria-hidden="true" />
              <span>Yearly Story</span>
            </span>
          </div>
          <div className="kf-me-recap-copy">
            <h2>{latestYear} Recap</h2>
            <p>
              Swipe through your hours watched, title of the year, favorite character, and top note.
            </p>
          </div>
          <div className="kf-me-recap-actions">
            <Link viewTransition to={`/me/recap/${latestYear}`} className="kf-me-recap-cta">
              <Sparkles size={16} aria-hidden="true" />
              <span>Open {latestYear} Recap</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
            {analytics.availableRecapYears.length > 1 && (
              <div className="kf-me-recap-years" aria-label="Earlier recap years">
                {analytics.availableRecapYears.slice(1, 5).map((yr) => (
                  <Link viewTransition key={yr} to={`/me/recap/${yr}`} className="kf-me-year-pill">
                    {yr}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      {/* Activity Calendar */}
      <section className="kf-me-section" aria-labelledby="kf-me-cal-heading">
        <div className="kf-me-section-head">
          <div>
            <h2 id="kf-me-cal-heading">Activity Calendar</h2>
            <p className="kf-me-section-sub">
              Every episode logged, note written, rewatch, or character saved lights up a day.
            </p>
          </div>
          <div className="kf-me-seg" role="group" aria-label="Calendar window">
            <button
              type="button"
              className={calWeeksCount === 26 ? 'is-active' : ''}
              onClick={() => setCalWeeksCount(26)}
            >
              6 months
            </button>
            <button
              type="button"
              className={calWeeksCount === 52 ? 'is-active' : ''}
              onClick={() => setCalWeeksCount(52)}
            >
              1 year
            </button>
          </div>
        </div>

        <div className="kf-me-panel kf-me-cal-panel">
          <div className="kf-me-cal-scroll">
            <div className="kf-me-cal-grid-wrap">
              <div className="kf-me-cal-weekdays" aria-hidden="true">
                {Array.from({ length: 7 }, (_, row) => {
                  const found = WEEKDAY_LABELS.find((w) => w.row === row);
                  return (
                    <span key={row} className="kf-me-cal-weekday">
                      {found ? found.label : ''}
                    </span>
                  );
                })}
              </div>

              <div className="kf-me-cal-columns">
                <div className="kf-me-cal-months" aria-hidden="true">
                  {calendarWeeks.map((week) => (
                    <span key={week.weekStartKey} className="kf-me-cal-month">
                      {week.monthLabel ?? ''}
                    </span>
                  ))}
                </div>

                <div className="kf-me-cal-weeks" role="grid" aria-label="Daily activity heatmap">
                  {calendarWeeks.map((week) => (
                    <div key={week.weekStartKey} className="kf-me-cal-week" role="row">
                      {week.days.map((day) => (
                        <button
                          key={day.dateKey}
                          type="button"
                          role="gridcell"
                          className={`kf-me-cal-cell is-lvl-${day.intensity}${day.isToday ? ' is-today' : ''}${day.isFuture ? ' is-future' : ''}`}
                          title={day.tooltip}
                          aria-label={day.tooltip}
                          onMouseEnter={() => setSelectedDay(day)}
                          onFocus={() => setSelectedDay(day)}
                          onClick={() => setSelectedDay(day)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="kf-me-cal-footer">
            <span className="kf-me-cal-readout" aria-live="polite">
              {activeDayPreview ? activeDayPreview.tooltip : 'Select a day to inspect activity'}
            </span>
            <div className="kf-me-cal-legend" aria-hidden="true">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <span key={lvl} className={`kf-me-cal-cell is-lvl-${lvl} is-legend`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Stats Grid */}
      <section className="kf-me-section" aria-labelledby="kf-me-stats-heading">
        <div className="kf-me-section-head">
          <div>
            <h2 id="kf-me-stats-heading">Collection Stats</h2>
            <p className="kf-me-section-sub">
              Your watching and reading footprint across anime, books, and characters.
            </p>
          </div>
        </div>

        <div className="kf-me-stat-tiles">
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <Tv size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.totalEpisodes.toLocaleString()}</strong>
            <span>Episodes</span>
          </div>
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <Clock size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.estimatedHours.toLocaleString()}h</strong>
            <span>Estimated Hours</span>
          </div>
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <Film size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.completedTotal}</strong>
            <span>Completed</span>
          </div>
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <BookOpen size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.booksCount}</strong>
            <span>Books</span>
          </div>
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <Users size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.charactersCount}</strong>
            <span>Characters</span>
          </div>
          <div className="kf-me-tile">
            <span className="kf-me-tile-icon">
              <PenLine size={16} aria-hidden="true" />
            </span>
            <strong>{analytics.notesCount}</strong>
            <span>Notes</span>
          </div>
        </div>

        <div className="kf-me-charts-grid">
          {/* Top Genres */}
          <article className="kf-me-panel">
            <h3 className="kf-me-panel-title">Top Genres</h3>
            {analytics.topGenres.length === 0 ? (
              <p className="kf-me-empty-note">Tag genres on your anime or books to see your taste profile.</p>
            ) : (
              <ol className="kf-me-bars-list">
                {analytics.topGenres.map((genre) => {
                  const pct = Math.round((genre.count / maxGenreCount) * 100);
                  return (
                    <li key={genre.id} className="kf-me-bar-row">
                      <div className="kf-me-bar-labels">
                        <span>{genre.name}</span>
                        <strong>{genre.count}</strong>
                      </div>
                      <div className="kf-me-bar-track" aria-hidden="true">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </article>

          {/* Top Studios */}
          <article className="kf-me-panel">
            <h3 className="kf-me-panel-title">Top Studios</h3>
            {analytics.topStudios.length === 0 ? (
              <p className="kf-me-empty-note">Add studios to anime titles to track your favorite teams.</p>
            ) : (
              <ol className="kf-me-bars-list">
                {analytics.topStudios.map((studio) => {
                  const pct = Math.round((studio.count / maxStudioCount) * 100);
                  return (
                    <li key={studio.id} className="kf-me-bar-row">
                      <div className="kf-me-bar-labels">
                        <span>{studio.name}</span>
                        <strong>{studio.count}</strong>
                      </div>
                      <div className="kf-me-bar-track is-studio" aria-hidden="true">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </article>

          {/* Rating Spread (1-10) */}
          <article className="kf-me-panel kf-me-rating-panel">
            <div className="kf-me-panel-head">
              <h3 className="kf-me-panel-title">Rating Spread (1–10)</h3>
              <span className="kf-me-muted-meta">
                {totalRatedCount} {totalRatedCount === 1 ? 'rated title' : 'rated titles'}
              </span>
            </div>
            <div className="kf-me-spread" role="list" aria-label="Rating spread from 1 to 10">
              {analytics.ratingSpread.map((bucket) => {
                const heightPct =
                  bucket.count === 0 ? 4 : Math.max(12, Math.round((bucket.count / maxRatingCount) * 100));
                const isGold = bucket.score >= 9;
                return (
                  <div
                    key={bucket.score}
                    role="listitem"
                    className="kf-me-spread-col"
                    aria-label={`Rated ${bucket.score}: ${bucket.count} ${bucket.count === 1 ? 'title' : 'titles'}`}
                  >
                    <span className="kf-me-spread-count">{bucket.count > 0 ? bucket.count : ''}</span>
                    <div className="kf-me-spread-track">
                      <span
                        className={`kf-me-spread-bar${isGold ? ' is-gold' : ''}${bucket.count === 0 ? ' is-zero' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`kf-me-spread-score${isGold ? ' is-gold' : ''}`}>
                      {bucket.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {/* Finished by Season of the Year */}
        <div className="kf-me-seasons-grid" aria-label="Finished by season of the year">
          {analytics.seasonalBreakdown.map((item) => {
            const { label, months, Icon } = SEASON_META[item.season];
            return (
              <article key={item.season} className="kf-me-season-card">
                <div className="kf-me-season-head">
                  <span className="kf-me-season-name">
                    <Icon size={16} aria-hidden="true" />
                    <strong>{label}</strong>
                  </span>
                  <span className="kf-me-season-months">{months}</span>
                </div>
                <p className="kf-me-season-count">
                  {item.count} {item.count === 1 ? 'title' : 'titles'}
                </p>
                {item.titles.length > 0 && (
                  <p className="kf-me-season-titles">
                    {item.titles.slice(0, 2).join(' · ')}
                    {item.titles.length > 2 ? ` +${item.titles.length - 2}` : ''}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Achievements Showcase (all 20) */}
      <section className="kf-me-section" aria-labelledby="kf-me-ach-heading">
        <div className="kf-me-section-head">
          <div>
            <h2 id="kf-me-ach-heading">
              Achievements ({unlockedCount}/{totalAchievements})
            </h2>
            <p className="kf-me-section-sub">
              Every milestone is derived live from your journal — writing, finishing, and caring.
            </p>
          </div>
          <div className="kf-me-seg" role="group" aria-label="Filter achievements">
            <button
              type="button"
              className={achievementFilter === 'all' ? 'is-active' : ''}
              onClick={() => setAchievementFilter('all')}
            >
              All ({totalAchievements})
            </button>
            <button
              type="button"
              className={achievementFilter === 'unlocked' ? 'is-active' : ''}
              onClick={() => setAchievementFilter('unlocked')}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              className={achievementFilter === 'locked' ? 'is-active' : ''}
              onClick={() => setAchievementFilter('locked')}
            >
              In Progress ({lockedCount})
            </button>
          </div>
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="kf-me-panel kf-me-empty-box">
            <Award size={20} aria-hidden="true" />
            <p>
              {achievementFilter === 'unlocked'
                ? 'No achievements unlocked yet — log an episode or write a note to unlock your first.'
                : 'Every single achievement is unlocked!'}
            </p>
          </div>
        ) : (
          <div className="kf-me-ach-grid">
            {filteredAchievements.map((ach) => (
              <article
                key={ach.id}
                className={`kf-me-ach-card${ach.unlocked ? ' is-unlocked' : ''}`}
              >
                <div className="kf-me-ach-top">
                  <span className="kf-me-ach-icon" aria-hidden="true">
                    {ach.unlocked ? <Trophy size={16} /> : <Award size={16} />}
                  </span>
                  <span className="kf-me-ach-cat">{ach.category}</span>
                  <span className="kf-me-ach-status">
                    {ach.unlocked ? 'Unlocked' : `${ach.current}/${ach.goal}`}
                  </span>
                </div>
                <h3>{ach.name}</h3>
                <p>{ach.detail}</p>
                {!ach.unlocked && (
                  <div className="kf-me-ach-bar" aria-hidden="true">
                    <span style={{ width: `${ach.pct}%` }} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* All-Time Favorites: Hall of Fame + Top Characters */}
      <section className="kf-me-section" aria-labelledby="kf-me-hof-heading">
        <div className="kf-me-section-head">
          <div>
            <h2 id="kf-me-hof-heading">Hall of Fame (10/10)</h2>
            <p className="kf-me-section-sub">
              The anime and books that earned your highest mark.
            </p>
          </div>
          <Link viewTransition to="/anime?view=fame" className="kf-me-text-link">
            <span>View in Library</span>
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {analytics.hallOfFame.length === 0 ? (
          <div className="kf-me-panel kf-me-empty-box">
            <Trophy size={20} aria-hidden="true" />
            <p>No 10/10 titles yet. Give a 10 to something unforgettable to enshrine it here.</p>
          </div>
        ) : (
          <div className="kf-me-hof-grid">
            {analytics.hallOfFame.map((item) => (
              <Link viewTransition key={item.id} to={item.href} className="kf-me-hof-card">
                <div className="kf-me-hof-cover">
                  <CoverArt title={item.title} imageUrl={item.coverUrl} size="card" />
                  <div className="kf-me-hof-score">
                    <ScoreTag score={item.rating} />
                  </div>
                </div>
                <div className="kf-me-hof-body">
                  <h3>{item.title}</h3>
                  {item.subtitle && <span className="kf-me-hof-sub">{item.subtitle}</span>}
                  {item.note && <p className="kf-me-hof-note">“{item.note}”</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="kf-me-section" aria-labelledby="kf-me-chars-heading">
        <div className="kf-me-section-head">
          <div>
            <h2 id="kf-me-chars-heading">Top Characters</h2>
            <p className="kf-me-section-sub">
              Ordered by card tier, gallery art, and how deeply you wrote about them.
            </p>
          </div>
          <Link viewTransition to="/characters" className="kf-me-text-link">
            <span>All Characters</span>
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {topCharacters.length === 0 ? (
          <div className="kf-me-panel kf-me-empty-box">
            <Users size={20} aria-hidden="true" />
            <p>No characters saved yet. Add someone who stayed with you from any series page.</p>
          </div>
        ) : (
          <div className="kf-me-chars-grid">
            {topCharacters.map((item) => (
              <Link viewTransition key={item.character.id} to={item.href} className="kf-me-char-link">
                <KfCharacterCard
                  name={item.character.name}
                  seriesTitle={item.seriesTitle}
                  why={item.character.why}
                  imageUrl={item.coverUrl}
                  tier={item.tier}
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
