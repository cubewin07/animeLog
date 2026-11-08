import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimeSeries } from '../types';
import { useJournalActions } from '../state/JournalContext';
import { overallSeriesStatus } from '../lib/selectors/seriesStatus';
import { Cover, StatusMark, Rating, Button, EmptyState } from '../ui';
import {
  Film,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  PenLine,
} from 'lucide-react';
import '../features/library/Library.css';

interface AnimeViewProps {
  seriesList: AnimeSeries[];
  searchQuery: string;
  onOpenDetail?: (seriesId: number) => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason?: (series: AnimeSeries) => void;
  onAddMovie?: (series: AnimeSeries) => void;
  onEditSeason?: (season: any) => void;
  onDeleteSeason?: (id: number) => void;
  onSeasonProgressDelta?: (id: number, delta: number) => void;
  onEditMovie?: (movie: any) => void;
  onDeleteMovie?: (id: number) => void;
  onMovieProgressDelta?: (id: number, delta: number) => void;
  onOpenEpisodeNotes?: (season: any) => void;
  onAddRewatchSeason?: (season: any) => void;
  onAddRewatchMovie?: (movie: any) => void;
  onAddCharacter?: (series: AnimeSeries) => void;
  onOpenNewFranchiseModal: () => void;
}

export const AnimeView: React.FC<AnimeViewProps> = ({
  seriesList,
  searchQuery,
  onOpenDetail,
  onOpenNewFranchiseModal,
}) => {
  const { openComposer } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedStatus = searchParams.get('status') || 'ALL';
  const filterText = searchParams.get('q') ?? (searchQuery || '');
  const sortBy = (searchParams.get('sort') as 'recent' | 'rating' | 'title' | 'note' | 'lesson') || 'recent';
  const viewMode = (searchParams.get('view') as 'shelf' | 'list') || 'shelf';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  // Extract helper for each series
  const enrichedSeries = useMemo(() => {
    return seriesList.map((series) => {
      // Find active release or primary season
      const watchingSeason = series.seasons?.find((s) => s.status === 'WATCHING');
      const watchingMovie = series.movies?.find((m) => m.status === 'WATCHING');
      const primarySeason = series.seasons?.[0];

      const overallStatus = overallSeriesStatus(series);

      // Ratings
      const ratings = [
        ...(series.seasons?.map((s) => s.rating) || []),
        ...(series.movies?.map((m) => m.rating) || []),
      ].filter((r): r is number => r !== null && r !== undefined);
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      // Extract latest note
      let latestLesson = '';
      series.seasons?.forEach((s) => {
        if (s.notes?.trim()) latestLesson = s.notes;
        s.episode_notes?.forEach((ep) => {
          if (ep.note?.trim()) latestLesson = ep.note;
        });
      });
      series.movies?.forEach((m) => {
        if (m.notes?.trim()) latestLesson = m.notes;
      });

      // Season label
      const totalSeasons = series.seasons?.length || 0;
      const totalMovies = series.movies?.length || 0;
      let label = totalSeasons === 0 && totalMovies === 0 ? 'No seasons yet' : '1 Season';
      if (totalSeasons === 0 && totalMovies > 0) label = `${totalMovies} Movie${totalMovies > 1 ? 's' : ''}`;
      if (watchingSeason) label = `Watching · Season ${watchingSeason.season_number}`;
      else if (totalSeasons > 1 && totalMovies === 0) label = `${totalSeasons} Seasons`;
      else if (totalSeasons === 1 && totalMovies > 0) label = `1 Season · ${totalMovies} Movie${totalMovies > 1 ? 's' : ''}`;
      else if (totalSeasons > 1 && totalMovies > 0) label = `${totalSeasons} Seasons · ${totalMovies} Movies`;

      const coverUrl =
        watchingSeason?.cover_image_url ||
        watchingMovie?.cover_image_url ||
        series.cover_image_url ||
        primarySeason?.cover_image_url;

      return {
        series,
        overallStatus,
        avgRating,
        latestLesson,
        label,
        coverUrl,
        primarySeason,
        primaryMovie: series.movies?.[0],
      };
    });
  }, [seriesList]);

  // Counts use the same status as the filter, so a tab's number always matches its results
  const filterTabs = useMemo(() => {
    const count = (id: string) => enrichedSeries.filter((item) => item.overallStatus === id).length;
    const tabs = [
      { id: 'ALL', label: 'All', count: enrichedSeries.length },
      { id: 'WATCHING', label: 'Watching', count: count('WATCHING') },
      { id: 'COMPLETED', label: 'Completed', count: count('COMPLETED') },
      { id: 'PLAN_TO_WATCH', label: 'Plan to watch', count: count('PLAN_TO_WATCH') },
      { id: 'ON_HOLD', label: 'On hold', count: count('ON_HOLD') },
      { id: 'DROPPED', label: 'Dropped', count: count('DROPPED') },
    ];
    return tabs.filter((tab) => tab.count > 0 || tab.id === 'ALL' || tab.id === selectedStatus);
  }, [enrichedSeries, selectedStatus]);

  // Filter & sort
  const filtered = useMemo(() => {
    return enrichedSeries
      .filter((item) => {
        const matchesStatus =
          selectedStatus === 'ALL' || item.overallStatus === selectedStatus;
        const matchesSearch =
          !filterText.trim() ||
          item.series.title.toLowerCase().includes(filterText.toLowerCase()) ||
          item.series.romaji_title?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.latestLesson.toLowerCase().includes(filterText.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
        if (sortBy === 'title') return a.series.title.localeCompare(b.series.title);
        if (sortBy === 'note' || sortBy === 'lesson') return (b.latestLesson ? 1 : 0) - (a.latestLesson ? 1 : 0);
        return b.series.id - a.series.id; // recent
      });
  }, [enrichedSeries, selectedStatus, filterText, sortBy]);

  return (
    <div className="lamplight-library">
      {/* Header */}
      <header className="lamplight-library-header">
        <div>
          <h1 className="lamplight-library-title">Anime</h1>
          <p className="lamplight-library-desc">
            Series, seasons, movies, and the notes you kept along the way.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={onOpenNewFranchiseModal}
        >
          Add Anime
        </Button>
      </header>

      {/* Toolbar */}
      <div className="lamplight-library-toolbar">
        {/* Status Filters */}
        <div className="lamplight-library-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`lamplight-status-pill ${selectedStatus === tab.id ? 'is-active' : ''}`}
              onClick={() => updateParam('status', tab.id, 'ALL')}
            >
              <span>{tab.label}</span>
              <span className="lamplight-pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tools: Search, Sort & View Mode */}
        <div className="lamplight-library-tools">
          <div className="lamplight-library-search">
            <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Search anime or notes…"
              value={filterText}
              onChange={(e) => updateParam('q', e.target.value, '')}
            />
          </div>

          <select
            value={sortBy === 'lesson' ? 'note' : sortBy}
            onChange={(e) => updateParam('sort', e.target.value, 'recent')}
            aria-label="Sort anime"
            style={{
              height: 36,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              padding: '0 10px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="recent">Recently added</option>
            <option value="rating">Rating (Highest)</option>
            <option value="title">Title (A-Z)</option>
            <option value="note">Has note</option>
          </select>

          <div className="lamplight-view-toggle">
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'shelf' ? 'is-active' : ''}`}
              onClick={() => updateParam('view', 'shelf', 'shelf')}
              title="Shelf Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => updateParam('view', 'list', 'shelf')}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filtered.length ? (
        viewMode === 'shelf' ? (
          <div className="lamplight-shelf-grid">
            {filtered.map(({ series, overallStatus, avgRating, latestLesson, label, coverUrl, primarySeason, primaryMovie }) => (
              <Link
                key={series.id}
                viewTransition
                to={`/anime/${series.id}`}
                className="lamplight-card"
              >
                <div className="lamplight-card-cover-wrap">
                  <Cover
                    title={series.title}
                    subtitle={series.romaji_title}
                    imageUrl={coverUrl}
                    variant="poster"
                    showTitle={false}
                  />

                  <div className="lamplight-card-badges">
                    <StatusMark status={overallStatus} />
                    {avgRating && <Rating score={avgRating} />}
                  </div>
                </div>

                <div className="lamplight-card-body">
                  <h3 className="lamplight-card-title">{series.title}</h3>
                  <span className="lamplight-card-context">{label}</span>

                  {latestLesson ? (
                    <div className="lamplight-card-lesson" title={latestLesson}>
                      “{latestLesson}”
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="lamplight-card-empty-lesson"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const release = primarySeason
                          ? { targetKind: 'season' as const, id: primarySeason.id }
                          : primaryMovie
                            ? { targetKind: 'movie' as const, id: primaryMovie.id }
                            : null;
                        if (!release) {
                          onOpenDetail?.(series.id);
                          return;
                        }
                        openComposer({ ...release, title: series.title, defaultKind: 'lesson' });
                      }}
                    >
                      <PenLine size={13} />
                      <span>Add note</span>
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="lamplight-list-wrap">
            {filtered.map(({ series, overallStatus, avgRating, latestLesson, label, coverUrl }) => (
              <Link
                key={series.id}
                viewTransition
                to={`/anime/${series.id}`}
                className="lamplight-list-row"
              >
                <div className="lamplight-list-left">
                  <div style={{ width: 44, height: 64, flexShrink: 0 }}>
                    <Cover
                      title={series.title}
                      imageUrl={coverUrl}
                      variant="poster"
                      showTitle={false}
                    />
                  </div>
                  <div className="lamplight-list-title-wrap">
                    <h3 className="lamplight-list-title">{series.title}</h3>
                    <span className="lamplight-list-sub">{label}</span>
                  </div>
                </div>

                {latestLesson && (
                  <p className="lamplight-list-lesson">“{latestLesson}”</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <StatusMark status={overallStatus} />
                  {avgRating && <Rating score={avgRating} />}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<Film size={24} />}
          title="No series found"
          description={filterText ? `No titles matched "${filterText}".` : "Your anime library is waiting for its first title."}
          action={
            <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenNewFranchiseModal}>
              Add anime
            </Button>
          }
        />
      )}
    </div>
  );
};
