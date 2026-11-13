import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Flame,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  Tv,
} from 'lucide-react';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { useReflections } from '../../state/useReflections';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { cloudinaryThumbUrl } from '../../lib/images/cloudinary';
import { computeProgression, getGamePrefs } from '../../lib/progression';
import { formatDate } from '../../lib/format';
import {
  CoverArt,
  KfButton,
  NotePaper,
  ScoreTag,
  StatusTag,
} from '../../ui/keyframe';
import {
  ContinueItem,
  selectContinueItems,
  selectFinishStoryItems,
  selectNextUpItems,
  selectPastNote,
} from './homeSelectors';
import '../../styles/keyframe.css';
import './HomePage.css';

function formatProgressText(item: ContinueItem): React.ReactNode {
  if (item.kind === 'season') {
    return (
      <>
        <strong>Ep {item.current}</strong>
        {item.total !== null ? ` of ${item.total}` : ''}
      </>
    );
  }
  if (item.kind === 'book') {
    return (
      <>
        <strong>{item.current}</strong>
        {item.total !== null ? ` of ${item.total} pages` : ' pages'}
      </>
    );
  }
  return (
    <>
      <strong>{item.current}</strong>
      {item.total !== null ? ` of ${item.total} min` : ' min'}
    </>
  );
}

function progressPercent(item: ContinueItem): number {
  if (item.total && item.total > 0) {
    return Math.min(100, Math.round((item.current / item.total) * 100));
  }
  return item.isFallbackCompleted ? 100 : 0;
}

function heroStepLabel(item: ContinueItem): string {
  if (item.kind === 'season') return '+1 Episode';
  if (item.kind === 'book') return `+${item.stepDelta} Pages`;
  return `+${item.stepDelta} Min`;
}

function compactStepLabel(item: ContinueItem): string {
  if (item.kind === 'season') return '+1';
  if (item.kind === 'book') return `+${item.stepDelta}p`;
  return `+${item.stepDelta}m`;
}

function composerTargetForContinue(item: ContinueItem) {
  if (item.kind === 'season') {
    return {
      targetKind: 'season' as const,
      id: item.targetId,
      title: item.title,
      context: item.context,
      defaultKind: item.isFallbackCompleted ? ('lesson' as const) : ('episode' as const),
      episodeNumber: item.nextEpisodeNumber,
    };
  }
  if (item.kind === 'movie') {
    return {
      targetKind: 'movie' as const,
      id: item.targetId,
      title: item.title,
      context: item.context,
      defaultKind: 'lesson' as const,
    };
  }
  return {
    targetKind: 'book' as const,
    id: item.targetId,
    title: item.title,
    context: item.context,
    defaultKind: 'lesson' as const,
  };
}

interface ContinueCardProps {
  item: ContinueItem;
  onStep: (item: ContinueItem) => void;
  onNote: (item: ContinueItem) => void;
}

const ContinueCard: React.FC<ContinueCardProps> = ({ item, onStep, onNote }) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(item.title, item.coverUrl);
  const pct = progressPercent(item);

  return (
    <article
      className="kf-home-continue-card"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <Link viewTransition to={item.href} className="kf-home-continue-cover" aria-label={`Open ${item.title}`}>
        <CoverArt
          title={item.title}
          imageUrl={item.coverUrl}
          accent={accent}
          size="thumb"
          onImageReady={onImageReady}
          onCorsBlocked={onCorsBlocked}
        />
      </Link>

      <div className="kf-home-continue-body">
        <Link viewTransition to={item.href} className="kf-home-continue-link">
          <strong className="kf-home-continue-title">{item.title}</strong>
          <span className="kf-home-continue-context">{item.context}</span>
        </Link>

        <div className="kf-home-continue-progress-row">
          <span className="kf-home-continue-progress-text">{formatProgressText(item)}</span>
          <div className="kf-home-continue-bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="kf-home-continue-actions">
          <KfButton
            variant="secondary"
            className="kf-home-continue-step"
            icon={<Plus size={15} />}
            disabled={!item.canStep}
            onClick={() => onStep(item)}
            aria-label={`${heroStepLabel(item)} for ${item.title}`}
          >
            {compactStepLabel(item)}
          </KfButton>
          <KfButton
            variant="quiet"
            className="kf-home-continue-note"
            icon={<PenLine size={15} />}
            onClick={() => onNote(item)}
            aria-label={`Write note for ${item.title}`}
            title={`Write note for ${item.title}`}
          />
        </div>
      </div>
    </article>
  );
};

export const HomePage: React.FC = () => {
  const { seriesList, bookList, characterList, rewatchList, activityList } = useJournalData();
  const {
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
    openComposer,
    openNewFranchiseModal,
    openNewBookModal,
  } = useJournalActions();
  const { reflections } = useReflections();

  const [pastOffset, setPastOffset] = useState(0);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);

  const isLibraryEmpty =
    seriesList.length === 0 && bookList.length === 0 && characterList.length === 0;

  const { hero, rest } = useMemo(
    () => selectContinueItems({ seriesList, bookList, activityList }),
    [seriesList, bookList, activityList],
  );

  const { accent: heroAccent, onImageReady: onHeroImageReady, onCorsBlocked: onHeroCorsBlocked } =
    useCoverAccent(hero?.title ?? '', hero?.coverUrl ?? null);

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

  const gamePrefs = getGamePrefs();

  const pastResult = useMemo(
    () =>
      selectPastNote({
        reflections,
        seriesList,
        rewatchList,
        offset: pastOffset,
      }),
    [reflections, seriesList, rewatchList, pastOffset],
  );

  const finishStoryItems = useMemo(
    () => selectFinishStoryItems({ seriesList, bookList, characterList }, 6),
    [seriesList, bookList, characterList],
  );

  const nextUpItems = useMemo(
    () => selectNextUpItems({ seriesList, bookList }, 8),
    [seriesList, bookList],
  );

  const handleStep = (item: ContinueItem) => {
    if (!item.canStep) return;
    if (item.kind === 'season') {
      handleSeasonProgressDelta(item.targetId, item.stepDelta);
    } else if (item.kind === 'movie') {
      handleMovieProgressDelta(item.targetId, item.stepDelta);
    } else {
      handleBookProgressDelta(item.targetId, item.stepDelta);
    }
  };

  const handleNoteForContinue = (item: ContinueItem) => {
    openComposer(composerTargetForContinue(item));
  };

  const heroBackdropUrl = hero?.coverUrl ? cloudinaryThumbUrl(hero.coverUrl, 'card') ?? hero.coverUrl : null;
  const showHeroBackdrop = Boolean(heroBackdropUrl && failedBackdropUrl !== heroBackdropUrl);

  const pastNote = pastResult.note;
  const pastSlate = useMemo(() => {
    if (!pastNote) return ['From your journal'];
    return [
      pastNote.badge,
      pastNote.title,
      pastNote.context,
      pastNote.dateStr ? formatDate(pastNote.dateStr) : '',
    ].filter(Boolean);
  }, [pastNote]);

  const nearest = progression.nearestAchievement;
  const nearestRemaining = nearest ? Math.max(0, nearest.goal - nearest.current) : 0;
  const nearestUnit =
    nearest?.category === 'journaling'
      ? nearestRemaining === 1
        ? 'note'
        : 'notes'
      : nearestRemaining === 1
        ? 'step'
        : 'steps';

  const streakGuidance =
    progression.streak.currentStreak === 0
      ? '1 rest day forgiven each week'
      : progression.streak.restDaysUsedThisWeek === 0
        ? '1 rest day ready this week'
        : !progression.streak.activeToday
          ? 'Rest day forgiven · pick up anytime'
          : '1 rest day forgiven this week';

  return (
    <div className="kf kf-home">
      {/* 1. Hero */}
      {isLibraryEmpty ? (
        <section className="kf-home-hero" aria-label="Welcome to your journal">
          <div className="kf-home-hero-empty">
            <span className="kf-home-hero-badge">Home</span>
            <h1>Your journal is ready for its first title</h1>
            <p>
              Keep your watching and reading progress alongside the scenes, characters, and
              thoughts worth remembering.
            </p>
            <div className="kf-home-hero-actions">
              <KfButton
                variant="primary"
                size="lg"
                icon={<Plus size={18} />}
                onClick={openNewFranchiseModal}
              >
                Add Title
              </KfButton>
              <KfButton variant="secondary" size="lg" onClick={openNewBookModal}>
                Add Book
              </KfButton>
            </div>
          </div>
        </section>
      ) : !hero ? (
        <section className="kf-home-hero" aria-label="Nothing in progress">
          <div className="kf-home-hero-empty">
            <span className="kf-home-hero-badge">Home</span>
            <h1>Pick up your next story</h1>
            <p>
              Nothing is marked Watching or Reading right now. Start a title from your Plan to
              watch shelf or add a new series.
            </p>
            <div className="kf-home-hero-actions">
              <KfButton
                variant="primary"
                size="lg"
                icon={<Plus size={18} />}
                onClick={openNewFranchiseModal}
              >
                Add Title
              </KfButton>
              <KfButton
                variant="secondary"
                size="lg"
                icon={<PenLine size={16} />}
                onClick={() => openComposer()}
              >
                Write Note
              </KfButton>
              <Link viewTransition to="/anime" className="kf-home-text-link">
                <span>Browse Library</span>
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section
          className="kf-home-hero"
          style={{ '--title-accent': heroAccent } as React.CSSProperties}
          aria-labelledby="kf-home-hero-heading"
        >
          {showHeroBackdrop && heroBackdropUrl && (
            <div className="kf-home-hero-backdrop" aria-hidden="true">
              <img
                key={heroBackdropUrl}
                src={heroBackdropUrl}
                alt=""
                loading="eager"
                decoding="async"
                className="kf-home-hero-backdrop-img"
                onError={() => setFailedBackdropUrl(heroBackdropUrl)}
              />
            </div>
          )}

          <div className="kf-home-hero-inner">
            <Link
              viewTransition
              to={hero.href}
              className="kf-home-hero-poster-link"
              aria-label={`Open ${hero.title}`}
            >
              <CoverArt
                title={hero.title}
                imageUrl={hero.coverUrl}
                accent={heroAccent}
                size="card"
                fetchPriority="high"
                onImageReady={onHeroImageReady}
                onCorsBlocked={onHeroCorsBlocked}
              />
            </Link>

            <div className="kf-home-hero-copy">
              <div className="kf-home-hero-status">
                <StatusTag status={hero.status} />
                <ScoreTag score={hero.rating} />
                {hero.isFallbackCompleted && (
                  <span className="kf-home-hero-badge">Recently finished</span>
                )}
              </div>

              <h1 id="kf-home-hero-heading" className="kf-home-hero-title">
                <Link viewTransition to={hero.href} className="kf-home-hero-title-link">
                  {hero.title}
                </Link>
              </h1>

              <p className="kf-home-hero-context">{hero.context}</p>

              <p className="kf-home-hero-progress">{formatProgressText(hero)}</p>

              <div
                className="kf-home-hero-bar"
                role="progressbar"
                aria-valuenow={hero.current}
                aria-valuemin={0}
                aria-valuemax={hero.total ?? Math.max(1, hero.current)}
                aria-label={`${hero.title} progress`}
              >
                <span style={{ width: `${progressPercent(hero)}%` }} />
              </div>

              <div className="kf-home-hero-actions">
                {hero.canStep && (
                  <KfButton
                    variant="primary"
                    size="lg"
                    icon={<Plus size={18} />}
                    onClick={() => handleStep(hero)}
                  >
                    {heroStepLabel(hero)}
                  </KfButton>
                )}

                <KfButton
                  variant={hero.canStep ? 'secondary' : 'primary'}
                  size="lg"
                  icon={<PenLine size={16} />}
                  onClick={() => handleNoteForContinue(hero)}
                >
                  Note
                </KfButton>

                {hero.isFallbackCompleted && (
                  <KfButton
                    variant="secondary"
                    size="lg"
                    icon={<Plus size={16} />}
                    onClick={openNewFranchiseModal}
                  >
                    Add Title
                  </KfButton>
                )}
              </div>
            </div>

            {hero.japaneseTitle && (
              <div className="kf-home-hero-jp" lang="ja" aria-hidden="true">
                {hero.japaneseTitle}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Continue row */}
      {rest.length > 0 && (
        <section aria-labelledby="kf-home-continue-heading">
          <div className="kf-home-section-head">
            <div className="kf-home-section-title-wrap">
              <h2 id="kf-home-continue-heading">Continue</h2>
              <span className="kf-home-section-count">{rest.length}</span>
            </div>
            <Link viewTransition to="/anime" className="kf-home-section-link">
              <span>Library</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="kf-home-continue-grid">
            {rest.map((item) => (
              <ContinueCard
                key={item.key}
                item={item}
                onStep={handleStep}
                onNote={handleNoteForContinue}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Today strip */}
      <section aria-labelledby="kf-home-progress-heading">
        <div className="kf-home-section-head">
          <div className="kf-home-section-title-wrap">
            <h2 id="kf-home-progress-heading">Momentum</h2>
          </div>
          <Link viewTransition to="/me" className="kf-home-section-link">
            <span>Me</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        <div className="kf-home-today-grid">
          {gamePrefs.xp && (
            <Link viewTransition to="/me" className="kf-home-stat-card is-xp">
              <div className="kf-home-stat-top">
                <span className="kf-home-stat-eyebrow">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>
                    Lv. {progression.level.level} · {progression.level.name}
                  </span>
                </span>
                <span className="kf-home-xp-today">+{progression.stats.todayXp} XP today</span>
              </div>
              <p className="kf-home-stat-value">{progression.xp.total} XP</p>
              <div className="kf-home-xp-track" aria-hidden="true">
                <span style={{ width: `${progression.level.progressPct}%` }} />
              </div>
              <p className="kf-home-stat-meta">
                {progression.level.xpIntoLevel} /{' '}
                {progression.level.nextXp - progression.level.minXp} XP · {progression.level.xpToNext}{' '}
                to next tier
              </p>
            </Link>
          )}

          {gamePrefs.streak && (
            <Link viewTransition to="/me" className="kf-home-stat-card is-streak">
              <div className="kf-home-stat-top">
                <span className="kf-home-stat-eyebrow">
                  <Flame size={14} aria-hidden="true" />
                  <span>Habit</span>
                </span>
              </div>
              <p className="kf-home-stat-value">
                {progression.streak.currentStreak} day streak
              </p>
              <span className="kf-home-streak-pill">{streakGuidance}</span>
            </Link>
          )}

          <div className="kf-home-stat-card is-episodes">
            <div className="kf-home-stat-top">
              <span className="kf-home-stat-eyebrow">
                <Tv size={14} aria-hidden="true" />
                <span>This week</span>
              </span>
            </div>
            <p className="kf-home-stat-value">
              {progression.stats.thisWeekEpisodes}{' '}
              {progression.stats.thisWeekEpisodes === 1 ? 'episode' : 'episodes'}
            </p>
            <p className="kf-home-stat-meta">
              {progression.stats.notesCount} {progression.stats.notesCount === 1 ? 'note' : 'notes'}{' '}
              in your journal
            </p>
          </div>

          {gamePrefs.xp && nearest && (
            <Link viewTransition to="/me" className="kf-home-stat-card is-xp">
              <div className="kf-home-stat-top">
                <span className="kf-home-stat-eyebrow">
                  <Trophy size={14} aria-hidden="true" />
                  <span>Next milestone</span>
                </span>
                <span className="kf-home-stat-meta">
                  {nearest.current}/{nearest.goal}
                </span>
              </div>
              <p className="kf-home-stat-meta" style={{ color: 'var(--kf-text)', fontWeight: 700, fontSize: 'var(--kf-text-sm)' }}>
                {nearestRemaining} {nearestUnit} from {nearest.name}
              </p>
              <div className="kf-home-achieve-track" aria-hidden="true">
                <span style={{ width: `${nearest.pct}%` }} />
              </div>
              <p className="kf-home-stat-meta">{nearest.detail}</p>
            </Link>
          )}
        </div>
      </section>

      {/* 4. A note from your past */}
      <section aria-labelledby="kf-home-past-heading" className="kf-home-past-wrap">
        <div className="kf-home-section-head">
          <div className="kf-home-section-title-wrap">
            <h2 id="kf-home-past-heading">A note from your past</h2>
          </div>
          {pastResult.totalChoices > 1 && (
            <KfButton
              variant="quiet"
              icon={<RefreshCw size={14} />}
              onClick={() => setPastOffset((prev) => prev + 1)}
            >
              Another note
            </KfButton>
          )}
        </div>

        {pastNote ? (
          <>
            <NotePaper slate={pastSlate}>
              <div className="kf-home-past-body">
                {pastNote.comparison ? (
                  <>
                    <div className="kf-home-past-meta-row">
                      {pastNote.comparison.ratingDelta !== null && (
                        <span
                          className={`kf-home-compare-delta ${
                            pastNote.comparison.ratingDelta > 0 ? 'is-up' : ''
                          }`}
                        >
                          {pastNote.comparison.ratingDelta > 0
                            ? `+${pastNote.comparison.ratingDelta} on rewatch`
                            : pastNote.comparison.ratingDelta < 0
                              ? `${pastNote.comparison.ratingDelta} on rewatch`
                              : 'Same rating on rewatch'}
                        </span>
                      )}
                    </div>
                    <div className="kf-home-compare">
                      <div className="kf-home-compare-col">
                        <div className="kf-home-compare-head">
                          <span className="kf-home-compare-label">Then</span>
                          {pastNote.comparison.originalDateStr && (
                            <span>{formatDate(pastNote.comparison.originalDateStr)}</span>
                          )}
                          <ScoreTag score={pastNote.comparison.originalRating} />
                        </div>
                        <p>{pastNote.comparison.originalNote}</p>
                      </div>

                      <div className="kf-home-compare-col">
                        <div className="kf-home-compare-head">
                          <span className="kf-home-compare-label">Now</span>
                          {pastNote.comparison.rewatchDateStr && (
                            <span>{formatDate(pastNote.comparison.rewatchDateStr)}</span>
                          )}
                          <ScoreTag score={pastNote.comparison.rewatchRating} />
                        </div>
                        <p>{pastNote.comparison.rewatchNote}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {pastNote.rating != null && (
                      <div className="kf-home-past-meta-row">
                        <ScoreTag score={pastNote.rating} />
                      </div>
                    )}
                    <p className="kf-home-past-quote">{pastNote.note}</p>
                  </>
                )}
              </div>
            </NotePaper>

            <div className="kf-home-past-footer">
              <div className="kf-home-past-links">
                <Link viewTransition to={pastNote.href} className="kf-home-text-link">
                  Open title
                </Link>
                <Link viewTransition to="/journal" className="kf-home-text-link">
                  Journal
                </Link>
              </div>
              {pastNote.targetKind && pastNote.targetId != null && (
                <KfButton
                  variant="quiet"
                  icon={<PenLine size={14} />}
                  onClick={() =>
                    openComposer({
                      targetKind: pastNote.targetKind!,
                      id: pastNote.targetId!,
                      title: pastNote.title,
                      context: pastNote.context,
                      defaultKind:
                        pastNote.reflectionKind === 'episode'
                          ? 'episode'
                          : pastNote.targetKind === 'character'
                            ? 'why'
                            : 'lesson',
                      episodeNumber: pastNote.episodeNumber,
                    })
                  }
                >
                  Add to note
                </KfButton>
              )}
            </div>
          </>
        ) : (
          <NotePaper slate={pastSlate}>
            <div className="kf-home-past-body">
              <p className="kf-home-past-empty">
                Write your first note to see past thoughts and rewatches resurface here.
              </p>
            </div>
          </NotePaper>
        )}
      </section>

      {/* 5. Finish the story */}
      <section aria-labelledby="kf-home-finish-heading">
        <div className="kf-home-section-head">
          <div className="kf-home-section-title-wrap">
            <h2 id="kf-home-finish-heading">Finish the story</h2>
            {finishStoryItems.length > 0 && (
              <span className="kf-home-section-count">{finishStoryItems.length}</span>
            )}
          </div>
          <p className="kf-home-section-sub">
            Completed titles and characters still waiting for a note.
          </p>
        </div>

        {finishStoryItems.length > 0 ? (
          <div className="kf-home-finish-grid">
            {finishStoryItems.map((item) => (
              <article key={item.key} className="kf-home-finish-card">
                <Link
                  viewTransition
                  to={item.href}
                  className="kf-home-finish-cover"
                  aria-label={`Open ${item.title}`}
                >
                  <CoverArt
                    title={item.title}
                    imageUrl={item.coverUrl}
                    variant={item.targetKind === 'character' ? 'portrait' : 'poster'}
                    size="thumb"
                  />
                </Link>

                <div className="kf-home-finish-info">
                  <Link viewTransition to={item.href} className="kf-home-finish-title">
                    {item.title}
                  </Link>
                  <span className="kf-home-finish-sub">{item.subtitle}</span>
                  {gamePrefs.xp && (
                    <span className="kf-home-finish-xp">+{item.xpReward} XP</span>
                  )}
                </div>

                <KfButton
                  variant="secondary"
                  icon={<PenLine size={14} />}
                  onClick={() =>
                    openComposer({
                      targetKind: item.targetKind,
                      id: item.targetId,
                      title: item.title,
                      context: item.subtitle,
                      defaultKind: item.defaultKind,
                    })
                  }
                >
                  Note
                </KfButton>
              </article>
            ))}
          </div>
        ) : (
          <div className="kf-home-empty-card">
            <span>Every completed title and character already has your notes.</span>
          </div>
        )}
      </section>

      {/* 6. Next up */}
      <section aria-labelledby="kf-home-next-heading">
        <div className="kf-home-section-head">
          <div className="kf-home-section-title-wrap">
            <h2 id="kf-home-next-heading">Next up</h2>
            {nextUpItems.length > 0 && (
              <span className="kf-home-section-count">{nextUpItems.length}</span>
            )}
          </div>
          <Link viewTransition to="/anime" className="kf-home-section-link">
            <span>Plan to watch</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {nextUpItems.length > 0 ? (
          <div className="kf-home-next-grid">
            {nextUpItems.map((item) => (
              <Link viewTransition key={item.key} to={item.href} className="kf-home-next-card">
                <div className="kf-home-next-art">
                  <CoverArt title={item.title} imageUrl={item.coverUrl} size="card" />
                </div>
                <h3 className="kf-home-next-title">{item.title}</h3>
                <span className="kf-home-next-meta">{item.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="kf-home-empty-card">
            <span>Nothing queued in Plan to watch or Plan to read yet.</span>
            <KfButton variant="secondary" icon={<Plus size={14} />} onClick={openNewFranchiseModal}>
              Add Title
            </KfButton>
          </div>
        )}
      </section>
    </div>
  );
};
