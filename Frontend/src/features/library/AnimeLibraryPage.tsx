import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Film,
  LayoutGrid,
  List as ListIcon,
  PenLine,
  Plus,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { CoverArt, KfButton, NotePaper, PosterCard, ScoreTag, StatusTag } from '../../ui/keyframe';
import {
  buildLibraryItems,
  filterAndSortLibrary,
  groupByYear,
  LibraryItem,
  LibrarySort,
  LibraryStatusFilter,
  LibraryViewMode,
  matchesLibraryFacetAndQuery,
  selectHallOfFame,
} from './animeLibrarySelectors';
import './Library.css';

const VALID_STATUSES = new Set<LibraryStatusFilter>([
  'ALL',
  'WATCHING',
  'COMPLETED',
  'PLAN_TO_WATCH',
  'ON_HOLD',
  'DROPPED',
]);

const VALID_SORTS = new Set<LibrarySort>(['recent', 'rating', 'title', 'aired', 'note']);
const VALID_VIEWS = new Set<LibraryViewMode>(['grid', 'list', 'year', 'fame']);

const STATUS_DEFS: Array<{ id: LibraryStatusFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'WATCHING', label: 'Watching' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PLAN_TO_WATCH', label: 'Plan to watch' },
  { id: 'ON_HOLD', label: 'On hold' },
  { id: 'DROPPED', label: 'Dropped' },
];

function parseNumericFilter(raw: string | null): number | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL';
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 'ALL';
}

function progressForPoster(
  item: LibraryItem,
): { current: number; total: number | null } | undefined {
  if (item.totalEpisodes !== null && item.totalEpisodes > 0) {
    return { current: item.watchedEpisodes, total: item.totalEpisodes };
  }
  if (item.primaryRelease?.kind === 'season') {
    const s = item.primaryRelease.release;
    if (s.total_episodes && s.total_episodes > 0) {
      return { current: Math.max(0, s.progress || 0), total: s.total_episodes };
    }
  }
  if (item.primaryRelease?.kind === 'movie') {
    const m = item.primaryRelease.release;
    if (m.total_minutes && m.total_minutes > 0) {
      return { current: Math.max(0, m.progress_minutes || 0), total: m.total_minutes };
    }
  }
  return undefined;
}

function formatListProgress(item: LibraryItem): {
  label: string;
  pct: number;
  hasBar: boolean;
} {
  const seasonCount = item.series.seasons?.length ?? 0;
  if (seasonCount > 0) {
    if (item.totalEpisodes !== null && item.totalEpisodes > 0) {
      const pct = Math.min(100, Math.round((item.watchedEpisodes / item.totalEpisodes) * 100));
      return {
        label: `${item.watchedEpisodes} / ${item.totalEpisodes} eps`,
        pct,
        hasBar: true,
      };
    }
    return {
      label: `${item.watchedEpisodes} eps`,
      pct: 0,
      hasBar: false,
    };
  }

  const movie = item.series.movies?.[0];
  if (movie) {
    if (movie.total_minutes && movie.total_minutes > 0) {
      const pct = Math.min(100, Math.round((movie.progress_minutes / movie.total_minutes) * 100));
      return {
        label: `${movie.progress_minutes} / ${movie.total_minutes} min`,
        pct,
        hasBar: true,
      };
    }
    return {
      label: movie.status === 'COMPLETED' ? 'Watched movie' : `${movie.progress_minutes} min`,
      pct: movie.status === 'COMPLETED' ? 100 : 0,
      hasBar: movie.status === 'COMPLETED',
    };
  }

  return { label: '0 eps', pct: 0, hasBar: false };
}

function quickStepShortLabel(item: LibraryItem): string {
  if (!item.quickStepTarget) return '+1';
  return item.quickStepTarget.kind === 'movie' ? `+${item.quickStepTarget.delta}m` : '+1';
}

function quickStepAriaLabel(item: LibraryItem): string {
  if (!item.quickStepTarget) return `Update progress for ${item.series.title}`;
  return item.quickStepTarget.kind === 'movie'
    ? `Add ${item.quickStepTarget.delta} minutes to ${item.series.title}`
    : `Log +1 episode for ${item.series.title}`;
}

interface TileProps {
  item: LibraryItem;
  onQuickStep: (item: LibraryItem) => void;
}

const LibraryPosterTile: React.FC<TileProps> = ({ item, onQuickStep }) => (
  <div className="kf-lib-card">
    <PosterCard
      to={`/anime/${item.series.id}`}
      title={item.series.title}
      imageUrl={item.coverUrl}
      status={item.overallStatus}
      score={item.avgRating}
      meta={item.metaLabel}
      progress={progressForPoster(item)}
      latestNote={item.latestNote}
    />
    {item.canQuickStep && item.quickStepTarget && (
      <button
        type="button"
        className="kf-lib-card-step"
        onClick={() => onQuickStep(item)}
        aria-label={quickStepAriaLabel(item)}
        title={quickStepAriaLabel(item)}
      >
        {quickStepShortLabel(item)}
      </button>
    )}
  </div>
);

interface ListRowProps {
  item: LibraryItem;
  onQuickStep: (item: LibraryItem) => void;
  onWriteNote: (item: LibraryItem) => void;
}

const LibraryListRow: React.FC<ListRowProps> = ({ item, onQuickStep, onWriteNote }) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(item.series.title, item.coverUrl);
  const progress = formatListProgress(item);
  const subParts = [item.metaLabel, item.year ? String(item.year) : null].filter(Boolean);

  return (
    <article
      className="kf-lib-list-row"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <Link
        viewTransition
        to={`/anime/${item.series.id}`}
        className="kf-lib-list-thumb"
        aria-label={`Open ${item.series.title}`}
      >
        <CoverArt
          title={item.series.title}
          imageUrl={item.coverUrl}
          accent={accent}
          size="thumb"
          onImageReady={onImageReady}
          onCorsBlocked={onCorsBlocked}
        />
      </Link>

      <div className="kf-lib-list-main">
        <div className="kf-lib-list-title-row">
          <Link viewTransition to={`/anime/${item.series.id}`} className="kf-lib-list-title">
            {item.series.title}
          </Link>
          <span className="kf-lib-list-sub">{subParts.join(' · ')}</span>
        </div>

        <div className="kf-lib-list-status-row">
          <StatusTag status={item.overallStatus} />
          <div className="kf-lib-list-progress">
            <span className="kf-lib-list-progress-text">{progress.label}</span>
            {progress.hasBar && (
              <div className="kf-lib-list-bar" aria-hidden="true">
                <span style={{ width: `${progress.pct}%` }} />
              </div>
            )}
          </div>
        </div>

        {item.latestNote && (
          <p className="kf-lib-list-note" title={item.latestNote}>
            “{item.latestNote}”
          </p>
        )}
      </div>

      <div className="kf-lib-list-actions">
        <ScoreTag score={item.avgRating} />

        {!item.hasAnyNote && item.primaryRelease && (
          <button
            type="button"
            className="kf-lib-list-icon-btn"
            onClick={() => onWriteNote(item)}
            aria-label={`Write a note for ${item.series.title}`}
            title="Write a note"
          >
            <PenLine size={15} aria-hidden="true" />
          </button>
        )}

        {item.canQuickStep && item.quickStepTarget && (
          <button
            type="button"
            className="kf-lib-list-step-btn"
            onClick={() => onQuickStep(item)}
            aria-label={quickStepAriaLabel(item)}
            title={quickStepAriaLabel(item)}
          >
            {quickStepShortLabel(item)}
          </button>
        )}
      </div>
    </article>
  );
};

interface HallOfFameCardProps {
  item: LibraryItem;
  onWriteNote: (item: LibraryItem) => void;
}

const HallOfFameCard: React.FC<HallOfFameCardProps> = ({ item, onWriteNote }) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(item.series.title, item.coverUrl);
  const slate = [
    '10 / 10',
    item.latestNoteContext,
    item.year ? String(item.year) : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <article
      className="kf-lib-fame-card"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <div className="kf-lib-fame-head">
        <Link
          viewTransition
          to={`/anime/${item.series.id}`}
          className="kf-lib-fame-cover"
          aria-label={`Open ${item.series.title}`}
        >
          <CoverArt
            title={item.series.title}
            imageUrl={item.coverUrl}
            accent={accent}
            size="card"
            onImageReady={onImageReady}
            onCorsBlocked={onCorsBlocked}
          />
        </Link>

        <div className="kf-lib-fame-info">
          <div className="kf-lib-fame-badges">
            <ScoreTag score={10} />
            <span className="kf-lib-fame-crown">
              <Trophy size={13} aria-hidden="true" />
              <span>Hall of Fame</span>
            </span>
          </div>

          <h3 className="kf-lib-fame-title">
            <Link viewTransition to={`/anime/${item.series.id}`}>
              {item.series.title}
            </Link>
          </h3>

          {item.series.japanese_title && (
            <p className="kf-lib-fame-jp" lang="ja">
              {item.series.japanese_title}
            </p>
          )}

          <div className="kf-lib-fame-meta">
            <StatusTag status={item.overallStatus} />
            <span>{item.metaLabel}</span>
            {item.year && <span>· {item.year}</span>}
          </div>
        </div>
      </div>

      <NotePaper slate={slate}>
        {item.latestNote ? (
          <p className="kf-lib-fame-quote">“{item.latestNote}”</p>
        ) : (
          <div className="kf-lib-fame-no-note">
            <p>A 10/10 without a written memory yet — capture what made it unforgettable.</p>
            {item.primaryRelease && (
              <KfButton
                variant="secondary"
                icon={<PenLine size={14} />}
                onClick={() => onWriteNote(item)}
              >
                Write note
              </KfButton>
            )}
          </div>
        )}
      </NotePaper>
    </article>
  );
};

export const AnimeLibraryPage: React.FC = () => {
  const { loading, loadFailed, seriesList, genres, studios, activityList } = useJournalData();
  const {
    retryLoad,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    openNewFranchiseModal,
    openComposer,
  } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'ALL';
  const selectedStatus: LibraryStatusFilter = VALID_STATUSES.has(rawStatus as LibraryStatusFilter)
    ? (rawStatus as LibraryStatusFilter)
    : 'ALL';

  const selectedGenre = parseNumericFilter(searchParams.get('genre'));
  const selectedStudio = parseNumericFilter(searchParams.get('studio'));
  const filterText = searchParams.get('q') ?? '';

  const rawSort = searchParams.get('sort');
  const normalizedSort = rawSort === 'lesson' ? 'note' : rawSort || 'recent';
  const sortBy: LibrarySort = VALID_SORTS.has(normalizedSort as LibrarySort)
    ? (normalizedSort as LibrarySort)
    : 'recent';

  const rawView = searchParams.get('view');
  const normalizedView = rawView === 'shelf' ? 'grid' : rawView || 'grid';
  const viewMode: LibraryViewMode = VALID_VIEWS.has(normalizedView as LibraryViewMode)
    ? (normalizedView as LibraryViewMode)
    : 'grid';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    next.delete('genre');
    next.delete('studio');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const allItems = useMemo(
    () => buildLibraryItems(seriesList, activityList),
    [seriesList, activityList],
  );

  // Status tab counts reflect overallSeriesStatus over items matching active facet/query filters
  const facetFilteredItems = useMemo(
    () =>
      allItems.filter((item) =>
        matchesLibraryFacetAndQuery(item, {
          genreId: selectedGenre,
          studioId: selectedStudio,
          q: filterText,
        }),
      ),
    [allItems, selectedGenre, selectedStudio, filterText],
  );

  const statusTabs = useMemo(() => {
    const counts = new Map<LibraryStatusFilter, number>();
    for (const item of facetFilteredItems) {
      counts.set(item.overallStatus, (counts.get(item.overallStatus) ?? 0) + 1);
    }
    return STATUS_DEFS.map((def) => ({
      ...def,
      count: def.id === 'ALL' ? facetFilteredItems.length : (counts.get(def.id) ?? 0),
    })).filter((tab) => tab.count > 0 || tab.id === 'ALL' || tab.id === selectedStatus);
  }, [facetFilteredItems, selectedStatus]);

  const filteredItems = useMemo(
    () =>
      filterAndSortLibrary(allItems, {
        status: selectedStatus,
        genreId: selectedGenre,
        studioId: selectedStudio,
        q: filterText,
        sort: sortBy,
      }),
    [allItems, selectedStatus, selectedGenre, selectedStudio, filterText, sortBy],
  );

  const genreOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of genres) map.set(g.id, g.name);
    for (const s of seriesList) {
      for (const g of s.genres ?? []) map.set(g.id, g.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [genres, seriesList]);

  const studioOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const st of studios) map.set(st.id, st.name);
    for (const s of seriesList) {
      for (const st of s.studios ?? []) map.set(st.id, st.name);
      for (const sea of s.seasons ?? []) {
        for (const st of sea.studios ?? []) map.set(st.id, st.name);
      }
      for (const mov of s.movies ?? []) {
        for (const st of mov.studios ?? []) map.set(st.id, st.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studios, seriesList]);

  const yearGroups = useMemo(
    () => (viewMode === 'year' ? groupByYear(filteredItems) : []),
    [viewMode, filteredItems],
  );

  const allHallOfFame = useMemo(() => selectHallOfFame(allItems), [allItems]);
  const visibleHallOfFame = useMemo(
    () => (viewMode === 'fame' ? selectHallOfFame(filteredItems) : []),
    [viewMode, filteredItems],
  );

  const hasActiveFilters =
    selectedStatus !== 'ALL' ||
    selectedGenre !== 'ALL' ||
    selectedStudio !== 'ALL' ||
    filterText.trim().length > 0;

  const handleQuickStep = (item: LibraryItem) => {
    const target = item.quickStepTarget;
    if (!target) return;
    if (target.kind === 'season') {
      handleSeasonProgressDelta(target.id, target.delta);
    } else {
      handleMovieProgressDelta(target.id, target.delta);
    }
  };

  const handleWriteNote = (item: LibraryItem) => {
    const rel = item.primaryRelease;
    if (!rel) return;
    openComposer({
      targetKind: rel.kind,
      id: rel.release.id,
      title: item.series.title,
      context:
        rel.kind === 'season'
          ? `Season ${rel.release.season_number}`
          : rel.release.title || 'Movie',
      defaultKind: 'lesson',
    });
  };

  return (
    <div className="kf-lib">
      <header className="kf-lib-header">
        <div>
          <h1 className="kf-lib-title">Anime</h1>
          <p className="kf-lib-desc">
            Series, seasons, movies, and the notes you kept along the way.
          </p>
        </div>

        <KfButton variant="primary" icon={<Plus size={16} />} onClick={openNewFranchiseModal}>
          Add Anime
        </KfButton>
      </header>

      <section className="kf-lib-toolbar" aria-label="Library filters and display options">
        <div className="kf-lib-status-bar" role="group" aria-label="Filter by status">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`kf-lib-status-pill ${selectedStatus === tab.id ? 'is-active' : ''}`}
              aria-pressed={selectedStatus === tab.id}
              onClick={() => updateParam('status', tab.id, 'ALL')}
            >
              <span>{tab.label}</span>
              <span className="kf-lib-pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="kf-lib-controls">
          <div className="kf-lib-search">
            <Search size={15} className="kf-lib-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search titles or notes…"
              aria-label="Search titles or notes"
              value={filterText}
              onChange={(e) => updateParam('q', e.target.value, '')}
            />
            {filterText && (
              <button
                type="button"
                className="kf-lib-search-clear"
                onClick={() => updateParam('q', '', '')}
                aria-label="Clear search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="kf-lib-selects">
            <select
              className="kf-lib-select"
              value={String(selectedGenre)}
              onChange={(e) => updateParam('genre', e.target.value, 'ALL')}
              aria-label="Filter by genre"
            >
              <option value="ALL">All genres</option>
              {genreOptions.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              className="kf-lib-select"
              value={String(selectedStudio)}
              onChange={(e) => updateParam('studio', e.target.value, 'ALL')}
              aria-label="Filter by studio"
            >
              <option value="ALL">All studios</option>
              {studioOptions.map((st) => (
                <option key={st.id} value={String(st.id)}>
                  {st.name}
                </option>
              ))}
            </select>

            <select
              className="kf-lib-select"
              value={sortBy}
              onChange={(e) => updateParam('sort', e.target.value, 'recent')}
              aria-label="Sort anime"
            >
              <option value="recent">Last activity</option>
              <option value="rating">Rating (highest)</option>
              <option value="title">Title (A–Z)</option>
              <option value="aired">Release year</option>
              <option value="note">Has note</option>
            </select>
          </div>

          <div className="kf-lib-views" role="group" aria-label="Shelf view">
            <button
              type="button"
              className={`kf-lib-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              onClick={() => updateParam('view', 'grid', 'grid')}
            >
              <LayoutGrid size={15} aria-hidden="true" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`kf-lib-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'list'}
              onClick={() => updateParam('view', 'list', 'grid')}
            >
              <ListIcon size={15} aria-hidden="true" />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`kf-lib-view-btn ${viewMode === 'year' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'year'}
              onClick={() => updateParam('view', 'year', 'grid')}
            >
              <Calendar size={15} aria-hidden="true" />
              <span>By Year</span>
            </button>
            <button
              type="button"
              className={`kf-lib-view-btn is-fame ${viewMode === 'fame' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'fame'}
              onClick={() => updateParam('view', 'fame', 'grid')}
            >
              <Trophy size={15} aria-hidden="true" />
              <span>Hall of Fame</span>
            </button>
          </div>
        </div>
      </section>

      {loading && seriesList.length === 0 ? (
        <div className="kf-lib-grid" aria-label="Loading anime library">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="kf-lib-skeleton" />
          ))}
        </div>
      ) : loadFailed && seriesList.length === 0 ? (
        <div className="kf-lib-empty" role="alert">
          <div className="kf-lib-empty-icon">
            <AlertCircle size={24} aria-hidden="true" />
          </div>
          <h2>Couldn’t load your anime library</h2>
          <p>Check that the backend server is running, then try again.</p>
          <KfButton variant="primary" onClick={retryLoad}>
            Retry
          </KfButton>
        </div>
      ) : seriesList.length === 0 ? (
        <div className="kf-lib-empty">
          <div className="kf-lib-empty-icon">
            <Film size={24} aria-hidden="true" />
          </div>
          <h2>Your anime shelf is ready</h2>
          <p>Add your first series or movie to track episodes and keep notes from each watch.</p>
          <KfButton variant="primary" icon={<Plus size={16} />} onClick={openNewFranchiseModal}>
            Add Anime
          </KfButton>
        </div>
      ) : viewMode === 'fame' ? (
        allHallOfFame.length === 0 ? (
          <div className="kf-lib-empty is-fame">
            <div className="kf-lib-empty-icon is-fame">
              <Trophy size={24} aria-hidden="true" />
            </div>
            <h2>Hall of Fame</h2>
            <p>Rate a season or movie 10/10 to place it in your Hall of Fame</p>
            <KfButton variant="secondary" onClick={() => updateParam('view', 'grid', 'grid')}>
              Browse all anime
            </KfButton>
          </div>
        ) : visibleHallOfFame.length === 0 ? (
          <div className="kf-lib-empty is-fame">
            <div className="kf-lib-empty-icon is-fame">
              <Trophy size={24} aria-hidden="true" />
            </div>
            <h2>No 10/10 titles match these filters</h2>
            <p>Clear your active search or filters to see your Hall of Fame collection.</p>
            <KfButton variant="secondary" onClick={clearAllFilters}>
              Clear filters
            </KfButton>
          </div>
        ) : (
          <section className="kf-lib-fame-wrap" aria-label="Hall of Fame 10/10 anime">
            <div className="kf-lib-fame-banner">
              <div className="kf-lib-fame-banner-title">
                <Trophy size={18} aria-hidden="true" />
                <h2>Hall of Fame</h2>
                <span className="kf-lib-fame-count">{visibleHallOfFame.length}</span>
              </div>
              <p>Titles with a 10/10 season or movie and the words you kept from them.</p>
            </div>
            <div className="kf-lib-fame-grid">
              {visibleHallOfFame.map((item) => (
                <HallOfFameCard key={item.series.id} item={item} onWriteNote={handleWriteNote} />
              ))}
            </div>
          </section>
        )
      ) : filteredItems.length === 0 ? (
        <div className="kf-lib-empty">
          <div className="kf-lib-empty-icon">
            <Film size={24} aria-hidden="true" />
          </div>
          <h2>No anime matched</h2>
          <p>
            {filterText
              ? `No titles or notes matched “${filterText}”.`
              : 'Try adjusting your status, genre, or studio filters.'}
          </p>
          {hasActiveFilters && (
            <KfButton variant="secondary" onClick={clearAllFilters}>
              Clear filters
            </KfButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="kf-lib-grid">
          {filteredItems.map((item) => (
            <LibraryPosterTile key={item.series.id} item={item} onQuickStep={handleQuickStep} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="kf-lib-list">
          {filteredItems.map((item) => (
            <LibraryListRow
              key={item.series.id}
              item={item}
              onQuickStep={handleQuickStep}
              onWriteNote={handleWriteNote}
            />
          ))}
        </div>
      ) : (
        <div className="kf-lib-years">
          {yearGroups.map((group) => (
            <section
              key={group.yearLabel}
              className="kf-lib-year-group"
              aria-labelledby={`kf-lib-year-${group.yearLabel}`}
            >
              <div className="kf-lib-year-head">
                <h2 id={`kf-lib-year-${group.yearLabel}`}>{group.yearLabel}</h2>
                <span className="kf-lib-year-count">{group.items.length}</span>
              </div>
              <div className="kf-lib-grid">
                {group.items.map((item) => (
                  <LibraryPosterTile
                    key={item.series.id}
                    item={item}
                    onQuickStep={handleQuickStep}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
