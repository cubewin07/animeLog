import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  JournalStats,
  Rewatch,
} from '../types';
import { useJournalActions } from '../state/JournalContext';
import { JournalReflection, useReflections } from '../state/useReflections';
import { Cover, Stepper, Rating, Button, EmptyState } from '../ui';
import { formatDate } from '../lib/format';
import {
  ChevronRight,
  PenLine,
  Quote,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tv,
} from 'lucide-react';
import './DashboardView.css';

function getReflectionHref(r: JournalReflection): string {
  if (r.targetKind === 'season' && r.seriesId) {
    const epParam = r.episodeNumber ? `&ep=${r.episodeNumber}` : '';
    return `/anime/${r.seriesId}?release=season-${r.targetId}${epParam}`;
  }
  if (r.targetKind === 'movie' && r.seriesId) {
    return `/anime/${r.seriesId}?release=movie-${r.targetId}`;
  }
  if (r.targetKind === 'book') {
    return `/books/${r.targetId}`;
  }
  if (r.targetKind === 'character') {
    return `/characters/${r.targetId}`;
  }
  return '/journal';
}

function getRewatchHref(rewatch: Rewatch, seriesList: AnimeSeries[]): string {
  const seasonId = rewatch.season_id || (rewatch.target_type === 'season' ? rewatch.target_id : undefined);
  const movieId = rewatch.movie_id || (rewatch.target_type === 'movie' ? rewatch.target_id : undefined);
  let seriesId = rewatch.series_id ?? undefined;

  if (!seriesId) {
    for (const s of seriesList) {
      if (seasonId && s.seasons?.some((sea) => sea.id === seasonId)) {
        seriesId = s.id;
        break;
      }
      if (movieId && s.movies?.some((mov) => mov.id === movieId)) {
        seriesId = s.id;
        break;
      }
    }
  }

  if (seriesId) {
    if (seasonId) return `/anime/${seriesId}?release=season-${seasonId}`;
    if (movieId) return `/anime/${seriesId}?release=movie-${movieId}`;
    return `/anime/${seriesId}`;
  }
  return '/journal?kind=rewatch';
}

interface DashboardViewProps {
  stats: JournalStats;
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList?: FavoriteCharacter[];
  rewatchList?: Rewatch[];
  onNavigate: (tab: string, id?: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onProgressBook: (id: number, delta: number) => void;
  onEditSeason?: (series: AnimeSeries, season: AnimeSeason) => void;
  onEditMovie?: (series: AnimeSeries, movie: AnimeMovie) => void;
  onEditBook?: (book: Book) => void;
  onOpenLogModal?: () => void;
  onToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  seriesList,
  bookList,
  characterList = [],
  rewatchList = [],
  onNavigate,
  onSeasonProgressDelta,
  onMovieProgressDelta,
  onProgressBook,
  onOpenLogModal,
}) => {
  const { openComposer } = useJournalActions();
  const { reflections } = useReflections();

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // In-progress items
  const activeItems = useMemo(() => {
    const list: any[] = [];
    seriesList.forEach((series) => {
      series.seasons?.forEach((season) => {
        if (season.status === 'WATCHING') {
          list.push({
            id: `season-${season.id}`,
            format: 'anime',
            title: series.title,
            context: `Season ${season.season_number} · ${season.title}`,
            cover: season.cover_image_url || season.image_url || series.cover_image_url,
            current: season.progress || 0,
            total: season.total_episodes,
            unit: 'eps',
            href: `/anime/${series.id}?release=season-${season.id}`,
            progress: (delta: number) => onSeasonProgressDelta(season.id, delta),
            open: () => onNavigate('anime', series.id),
            onNote: () =>
              openComposer({
                targetKind: 'season',
                id: season.id,
                title: series.title,
                context: `Season ${season.season_number}`,
                defaultKind: 'episode',
                episodeNumber: (season.progress || 0) + 1,
              }),
          });
        }
      });

      series.movies?.forEach((movie) => {
        if (movie.status === 'WATCHING') {
          list.push({
            id: `movie-${movie.id}`,
            format: 'anime',
            title: series.title,
            context: `Movie · ${movie.title}`,
            cover: movie.cover_image_url || movie.image_url || series.cover_image_url,
            current: movie.progress_minutes || 0,
            total: movie.total_minutes,
            unit: 'min',
            href: `/anime/${series.id}?release=movie-${movie.id}`,
            progress: (delta: number) => onMovieProgressDelta(movie.id, delta),
            open: () => onNavigate('anime', series.id),
            onNote: () =>
              openComposer({
                targetKind: 'movie',
                id: movie.id,
                title: series.title,
                context: movie.title,
                defaultKind: 'lesson',
              }),
          });
        }
      });
    });

    bookList.forEach((book) => {
      if (book.status === 'READING') {
        list.push({
          id: `book-${book.id}`,
          format: 'book',
          title: book.title,
          context: book.author ? `by ${book.author}` : 'Book',
          cover: book.cover_image_url || book.image_url,
          current: book.progress || 0,
          total: book.total_pages,
          unit: 'pages',
          href: `/books/${book.id}`,
          progress: (delta: number) => onProgressBook(book.id, delta),
          open: () => onNavigate('books', book.id),
          onNote: () =>
            openComposer({
              targetKind: 'book',
              id: book.id,
              title: book.title,
              context: book.author || undefined,
              defaultKind: 'lesson',
            }),
        });
      }
    });

    return list;
  }, [seriesList, bookList, onSeasonProgressDelta, onMovieProgressDelta, onProgressBook, onNavigate, openComposer]);

  // Resurfaced memory selection (seeded daily pick, prioritizes substantive notes)
  const [resurfacedIndexOffset, setResurfacedIndexOffset] = useState(0);
  const substantiveReflections = useMemo(() => {
    return reflections.filter((r) => r.note && r.note.length > 25);
  }, [reflections]);

  const resurfaced = useMemo(() => {
    if (!substantiveReflections.length) return reflections[0] || null;
    const daySeed = new Date().getDate();
    const idx = (daySeed + resurfacedIndexOffset) % substantiveReflections.length;
    return substantiveReflections[idx];
  }, [substantiveReflections, reflections, resurfacedIndexOffset]);

  // Titles waiting for a note (completed or in library with no notes)
  const waitingForWords = useMemo(() => {
    const list: any[] = [];
    seriesList.forEach((s) => {
      s.seasons?.forEach((season) => {
        if (!season.notes?.trim() && season.status === 'COMPLETED') {
          list.push({
            id: `season-${season.id}`,
            targetKind: 'season',
            targetId: season.id,
            title: s.title,
            sub: `Season ${season.season_number} completed`,
            href: `/anime/${s.id}?release=season-${season.id}`,
          });
        }
      });
      s.movies?.forEach((movie) => {
        if (!movie.notes?.trim() && movie.status === 'COMPLETED') {
          list.push({
            id: `movie-${movie.id}`,
            targetKind: 'movie',
            targetId: movie.id,
            title: s.title,
            sub: `Movie "${movie.title}" completed`,
            href: `/anime/${s.id}?release=movie-${movie.id}`,
          });
        }
      });
    });

    bookList.forEach((b) => {
      if (!b.notes?.trim() && b.status === 'COMPLETED') {
        list.push({
          id: `book-${b.id}`,
          targetKind: 'book',
          targetId: b.id,
          title: b.title,
          sub: b.author ? `by ${b.author}` : 'Book completed',
          href: `/books/${b.id}`,
        });
      }
    });

    characterList.forEach((c) => {
      if (!c.why?.trim()) {
        list.push({
          id: `char-${c.id}`,
          targetKind: 'character',
          targetId: c.id,
          title: c.name,
          sub: c.series_title ? `Character in ${c.series_title}` : 'Character',
          href: `/characters/${c.id}`,
        });
      }
    });

    return list.slice(0, 4);
  }, [seriesList, bookList, characterList]);

  // Rewatches timeline excerpt (series title first!)
  const recentReturns = useMemo(() => {
    return rewatchList
      .filter((r) => r.notes?.trim())
      .sort((a, b) => `${b.finish_date || b.start_date || ''}`.localeCompare(`${a.finish_date || a.start_date || ''}`))
      .slice(0, 3);
  }, [rewatchList]);

  // Characters excerpt
  const rememberedCharacters = useMemo(() => {
    return characterList.filter((c) => c.why?.trim()).slice(0, 3);
  }, [characterList]);

  return (
    <div className="lamplight-desk">
      {/* 1. Header with quiet greeting */}
      <header className="lamplight-desk-header">
        <div>
          <div className="lamplight-desk-eyebrow">
            <Quote size={14} />
            <span>Home</span>
          </div>
          <h1 className="lamplight-desk-title">{greeting}</h1>
          <p className="lamplight-desk-meta">{todayLabel}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="primary"
            icon={<PenLine size={15} />}
            onClick={() => openComposer()}
          >
            Write Note
          </Button>
        </div>
      </header>

      {/* 2. Continue Watching & Reading: In-progress titles */}
      <section aria-labelledby="continue-heading">
        <div className="lamplight-desk-section-head">
          <h2 id="continue-heading" className="lamplight-desk-section-title">
            <span>Continue Watching & Reading</span>
            <span className="lamplight-desk-section-badge">{activeItems.length}</span>
          </h2>
          <Link viewTransition to="/anime" className="lamplight-desk-section-link">
            <span>View library</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {activeItems.length ? (
          <div className="lamplight-continue-grid">
            {activeItems.map((item) => (
              <article key={item.id} className="lamplight-continue-card">
                <Link
                  viewTransition
                  to={item.href}
                  style={{ width: 60, height: 90, flexShrink: 0, display: 'block', textDecoration: 'none' }}
                  aria-label={`Open ${item.title}`}
                >
                  <Cover
                    title={item.title}
                    subtitle={item.context}
                    imageUrl={item.cover}
                    variant={item.format === 'book' ? 'book' : 'poster'}
                    showTitle={false}
                  />
                </Link>

                <div className="lamplight-continue-info">
                  <Link
                    viewTransition
                    to={item.href}
                    className="lamplight-continue-title"
                    title={`Open ${item.title}`}
                  >
                    {item.title}
                  </Link>
                  <span className="lamplight-continue-context">{item.context}</span>

                  <div className="lamplight-continue-actions">
                    <Stepper
                      current={item.current}
                      total={item.total}
                      unit={item.unit}
                      step={item.unit === 'pages' || item.unit === 'min' ? 10 : 1}
                      onDelta={item.progress}
                    />
                    <Button variant="ghost" size="sm" onClick={item.onNote} title="Write note on this progress">
                      <PenLine size={12} />
                      <span>Note</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Tv size={24} />}
            title="Nothing is currently in progress"
            description="Start watching or reading something worth returning to."
            action={
              onOpenLogModal && (
                <Button variant="secondary" onClick={onOpenLogModal}>
                  Add a title
                </Button>
              )
            }
          />
        )}
      </section>

      {/* 3. Main Spread: A Note from Your Past & Waiting for a Note */}
      <div className="lamplight-desk-main-spread">
        {/* A Note from Your Past */}
        <section className="lamplight-resurfaced-wrap" aria-labelledby="resurfaced-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="resurfaced-heading" className="lamplight-desk-section-title">
              <Sparkles size={16} color="var(--lamp)" />
              <span>A Note from Your Past</span>
            </h2>
            {substantiveReflections.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw size={12} />}
                onClick={() => setResurfacedIndexOffset((prev) => prev + 1)}
              >
                Another
              </Button>
            )}
          </div>

          {resurfaced ? (
            <article className="lamplight-resurfaced-paper">
              <div className="lamplight-paper-rule" aria-hidden="true" />
              <blockquote className="lamplight-resurfaced-quote">
                “{resurfaced.note}”
              </blockquote>
              <footer className="lamplight-resurfaced-source">
                <Link viewTransition to={getReflectionHref(resurfaced)} className="lamplight-resurfaced-link">
                  <strong>{resurfaced.title}</strong>
                  <span style={{ opacity: 0.65, marginLeft: 6 }}>· {resurfaced.context}</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {resurfaced.rating && <Rating score={resurfaced.rating} />}
                  {resurfaced.kind !== 'rewatch' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openComposer({
                          targetKind: resurfaced.targetKind,
                          id: resurfaced.targetId,
                          title: resurfaced.title,
                          context: resurfaced.context,
                          defaultKind: resurfaced.kind === 'episode' ? 'episode' : undefined,
                          episodeNumber: resurfaced.episodeNumber,
                        })
                      }
                    >
                      Add to note
                    </Button>
                  )}
                </div>
              </footer>
            </article>
          ) : (
            <div className="lamplight-resurfaced-paper" style={{ fontStyle: 'italic', color: 'var(--paper-ink-2)' }}>
              Write your first note to see your past thoughts here.
            </div>
          )}
        </section>

        {/* Waiting for a Note */}
        <section aria-labelledby="waiting-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="waiting-heading" className="lamplight-desk-section-title">
              <span>Waiting for a Note</span>
              <span className="lamplight-desk-section-badge">{waitingForWords.length}</span>
            </h2>
          </div>

          {waitingForWords.length ? (
            <div className="lamplight-waiting-list">
              {waitingForWords.map((item) => (
                <div key={item.id} className="lamplight-waiting-item">
                  <div>
                    <Link viewTransition to={item.href} className="lamplight-waiting-title">
                      {item.title}
                    </Link>
                    <span className="lamplight-waiting-sub">{item.sub}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PenLine size={12} />}
                    onClick={() =>
                      openComposer({
                        targetKind: item.targetKind,
                        id: item.targetId,
                        title: item.title,
                        context: item.sub,
                        defaultKind: item.targetKind === 'character' ? 'why' : 'lesson',
                      })
                    }
                  >
                    Write
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="lamplight-waiting-list" style={{ color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>
              Every completed title has a note.
            </div>
          )}
        </section>
      </div>

      {/* 4. Bottom Grid: Recent Rewatches & Characters */}
      <div className="lamplight-desk-bottom-grid">
        {/* Recent Rewatches Shelf */}
        <section aria-labelledby="returns-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="returns-heading" className="lamplight-desk-section-title">
              <RotateCcw size={15} color="var(--lamp)" />
              <span>Recent Rewatches</span>
            </h2>
            <Link viewTransition to="/journal?kind=rewatch" className="lamplight-desk-section-link">
              <span>All rewatches</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {recentReturns.length ? (
            <div className="lamplight-desk-card-deck">
              {recentReturns.map((rewatch) => (
                <Link
                  key={rewatch.id}
                  viewTransition
                  to={getRewatchHref(rewatch, seriesList)}
                  className="lamplight-return-item"
                >
                  <span className="lamplight-return-date">
                    {formatDate(rewatch.finish_date || rewatch.start_date)}
                  </span>
                  <div>
                    <strong style={{ color: 'var(--text)', display: 'block', fontSize: 14 }}>
                      {rewatch.series_title || rewatch.release_title}
                    </strong>
                    <span style={{ color: 'var(--text-3)', fontSize: 12, display: 'block' }}>
                      {rewatch.release_title !== rewatch.series_title ? rewatch.release_title : ''}
                    </span>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, fontStyle: 'italic', marginTop: 2 }}>
                      “{rewatch.notes}”
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="lamplight-desk-card-deck" style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Rewatches become a record of how a story changes with you.
            </div>
          )}
        </section>

        {/* Characters */}
        <section aria-labelledby="people-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="people-heading" className="lamplight-desk-section-title">
              <Sparkles size={15} color="var(--lamp)" />
              <span>Characters</span>
            </h2>
            <Link viewTransition to="/characters" className="lamplight-desk-section-link">
              <span>All characters</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {rememberedCharacters.length ? (
            <div className="lamplight-desk-card-deck">
              {rememberedCharacters.map((char) => (
                <Link
                  key={char.id}
                  viewTransition
                  to={`/characters/${char.id}`}
                  className="lamplight-person-item"
                >
                  <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                    <Cover
                      title={char.name}
                      imageUrl={char.cover_image_url || char.image_url}
                      variant="portrait"
                    />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text)', display: 'block', fontSize: 14 }}>
                      {char.name}
                    </strong>
                    <span style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {char.series_title}
                    </span>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, fontStyle: 'italic', marginTop: 2 }}>
                      “{char.why}”
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="lamplight-desk-card-deck" style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Keep notes on characters whose choices gave you something to think about.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
