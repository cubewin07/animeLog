import React, { useState, useMemo } from 'react';
import { AnimeSeries } from '../types';
import { useJournal } from '../state/JournalContext';
import { Cover, StatusMark, Rating, Button, EmptyState } from '../ui';
import {
  Film,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  PenLine,
  MoreVertical,
  RotateCcw,
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
  onEditSeries,
  onDeleteSeries,
  onOpenNewFranchiseModal,
}) => {
  const { openComposer } = useJournal();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterText, setFilterText] = useState(searchQuery || '');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title' | 'lesson'>('recent');
  const [viewMode, setViewMode] = useState<'shelf' | 'list'>('shelf');

  // Compute status counts
  const filterTabs = useMemo(() => {
    return [
      { id: 'ALL', label: 'All', count: seriesList.length },
      {
        id: 'WATCHING',
        label: 'Watching',
        count: seriesList.filter((s) =>
          s.seasons?.some((sea) => sea.status === 'WATCHING') ||
          s.movies?.some((m) => m.status === 'WATCHING')
        ).length,
      },
      {
        id: 'COMPLETED',
        label: 'Finished',
        count: seriesList.filter((s) =>
          s.seasons?.some((sea) => sea.status === 'COMPLETED') ||
          s.movies?.some((m) => m.status === 'COMPLETED')
        ).length,
      },
      {
        id: 'PLAN_TO_WATCH',
        label: 'Up next',
        count: seriesList.filter((s) =>
          s.seasons?.some((sea) => sea.status === 'PLAN_TO_WATCH') ||
          s.movies?.some((m) => m.status === 'PLAN_TO_WATCH')
        ).length,
      },
    ];
  }, [seriesList]);

  // Extract helper for each series
  const enrichedSeries = useMemo(() => {
    return seriesList.map((series) => {
      // Find active release or primary season
      const watchingSeason = series.seasons?.find((s) => s.status === 'WATCHING');
      const watchingMovie = series.movies?.find((m) => m.status === 'WATCHING');
      const primarySeason = series.seasons?.[0];

      // Overall status
      let overallStatus = 'PLAN_TO_WATCH';
      if (watchingSeason || watchingMovie) overallStatus = 'WATCHING';
      else if (
        series.seasons?.every((s) => s.status === 'COMPLETED') &&
        (series.movies?.length === 0 || series.movies?.every((m) => m.status === 'COMPLETED'))
      ) {
        overallStatus = 'COMPLETED';
      }

      // Ratings
      const ratings = [
        ...(series.seasons?.map((s) => s.rating) || []),
        ...(series.movies?.map((m) => m.rating) || []),
      ].filter((r): r is number => r !== null && r !== undefined);
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      // Extract latest note/lesson
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
      let label = '1 Season';
      if (watchingSeason) label = `Watching · Season ${watchingSeason.season_number}`;
      else if (totalSeasons > 1 && totalMovies === 0) label = `${totalSeasons} Seasons`;
      else if (totalSeasons === 1 && totalMovies > 0) label = `1 Season · ${totalMovies} Film${totalMovies > 1 ? 's' : ''}`;
      else if (totalSeasons > 1 && totalMovies > 0) label = `${totalSeasons} Seasons · ${totalMovies} Films`;

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
      };
    });
  }, [seriesList]);

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
        if (sortBy === 'lesson') return (b.latestLesson ? 1 : 0) - (a.latestLesson ? 1 : 0);
        return b.series.id - a.series.id; // recent
      });
  }, [enrichedSeries, selectedStatus, filterText, sortBy]);

  return (
    <div className="lamplight-library">
      {/* Header */}
      <header className="lamplight-library-header">
        <div>
          <h1 className="lamplight-library-title">Anime Journal</h1>
          <p className="lamplight-library-desc">
            Your viewing ledger, season notes, and memories kept from watching.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={onOpenNewFranchiseModal}
        >
          Log Franchise
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
              onClick={() => setSelectedStatus(tab.id)}
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
              placeholder="Search anime or lessons…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
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
            <option value="lesson">Has reflection</option>
          </select>

          <div className="lamplight-view-toggle">
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'shelf' ? 'is-active' : ''}`}
              onClick={() => setViewMode('shelf')}
              title="Shelf Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
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
            {filtered.map(({ series, overallStatus, avgRating, latestLesson, label, coverUrl, primarySeason }) => (
              <article
                key={series.id}
                className="lamplight-card"
                onClick={() => onOpenDetail?.(series.id)}
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
                        e.stopPropagation();
                        openComposer({
                          targetKind: 'season',
                          id: primarySeason?.id || series.id,
                          title: series.title,
                          defaultKind: 'lesson',
                        });
                      }}
                    >
                      <PenLine size={13} />
                      <span>Write what stayed</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="lamplight-list-wrap">
            {filtered.map(({ series, overallStatus, avgRating, latestLesson, label, coverUrl }) => (
              <div
                key={series.id}
                className="lamplight-list-row"
                onClick={() => onOpenDetail?.(series.id)}
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
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<Film size={24} />}
          title="No franchises found"
          description={filterText ? `No titles matched "${filterText}".` : "Your anime library is waiting for its first title."}
          action={
            <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenNewFranchiseModal}>
              Log a franchise
            </Button>
          }
        />
      )}
    </div>
  );
};
