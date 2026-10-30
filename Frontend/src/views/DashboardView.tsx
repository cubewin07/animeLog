import React, { useState, useMemo } from 'react';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  FavoriteCharacter,
  JournalStats,
  Rewatch,
} from '../types';
import { useJournal } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { Cover, Stepper, Rating, Button, EmptyState } from '../ui';
import { formatDate } from '../lib/format';
import {
  BookOpen,
  ChevronRight,
  Film,
  PenLine,
  Quote,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tv,
} from 'lucide-react';
import './DashboardView.css';

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
  stats,
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
  const { openComposer } = useJournal();
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
            context: `Film · ${movie.title}`,
            cover: movie.cover_image_url || movie.image_url || series.cover_image_url,
            current: movie.progress_minutes || 0,
            total: movie.total_minutes,
            unit: 'min',
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
          context: book.author ? `by ${book.author}` : 'Book journal',
          cover: book.cover_image_url || book.image_url,
          current: book.progress || 0,
          total: book.total_pages,
          unit: 'pages',
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

  // Resurfaced memory selection (seeded daily pick, prioritizes substantive lessons)
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

  // Titles waiting for words (finished or in library with no notes)
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
            sub: `Film "${movie.title}" completed`,
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
          sub: c.series_title ? `Character in ${c.series_title}` : 'Character remembered',
        });
      }
    });

    return list.slice(0, 4);
  }, [seriesList, bookList, characterList]);

  // Returns timeline excerpt (series title first!)
  const recentReturns = useMemo(() => {
    return rewatchList
      .filter((r) => r.notes?.trim())
      .sort((a, b) => `${b.finish_date || b.start_date || ''}`.localeCompare(`${a.finish_date || a.start_date || ''}`))
      .slice(0, 3);
  }, [rewatchList]);

  // Remembered Characters excerpt
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
            <span>Personal Viewing & Reading Desk</span>
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
            Write Reflection
          </Button>
        </div>
      </header>

      {/* 2. On the desk: In-progress titles */}
      <section aria-labelledby="continue-heading">
        <div className="lamplight-desk-section-head">
          <h2 id="continue-heading" className="lamplight-desk-section-title">
            <span>On the Desk</span>
            <span className="lamplight-desk-section-badge">{activeItems.length}</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('anime')}>
            <span>View library</span>
            <ChevronRight size={14} />
          </Button>
        </div>

        {activeItems.length ? (
          <div className="lamplight-continue-grid">
            {activeItems.map((item) => (
              <article key={item.id} className="lamplight-continue-card">
                <div style={{ width: 60, height: 90, flexShrink: 0 }}>
                  <Cover
                    title={item.title}
                    subtitle={item.context}
                    imageUrl={item.cover}
                    variant={item.format === 'book' ? 'book' : 'poster'}
                    showTitle={false}
                  />
                </div>

                <div className="lamplight-continue-info">
                  <h3 className="lamplight-continue-title" onClick={item.open} title={`Open ${item.title}`}>
                    {item.title}
                  </h3>
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
                  Log a title
                </Button>
              )
            }
          />
        )}
      </section>

      {/* 3. Main Spread: Resurfaced Memory & Waiting for Words */}
      <div className="lamplight-desk-main-spread">
        {/* Resurfaced Memory */}
        <section className="lamplight-resurfaced-wrap" aria-labelledby="resurfaced-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="resurfaced-heading" className="lamplight-desk-section-title">
              <Sparkles size={16} color="var(--lamp)" />
              <span>Resurfaced Memory</span>
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
                <div>
                  <strong>{resurfaced.title}</strong>
                  <span style={{ opacity: 0.65, marginLeft: 6 }}>· {resurfaced.context}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {resurfaced.rating && <Rating score={resurfaced.rating} />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openComposer({
                        targetKind: resurfaced.targetKind,
                        id: resurfaced.targetId,
                        title: resurfaced.title,
                        context: resurfaced.context,
                        defaultKind: 'lesson',
                      })
                    }
                  >
                    Add thought
                  </Button>
                </div>
              </footer>
            </article>
          ) : (
            <div className="lamplight-resurfaced-paper" style={{ fontStyle: 'italic', color: 'var(--paper-ink-2)' }}>
              Write your first reflection to seed the reading room.
            </div>
          )}
        </section>

        {/* Waiting for Words */}
        <section aria-labelledby="waiting-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="waiting-heading" className="lamplight-desk-section-title">
              <span>Waiting for Words</span>
              <span className="lamplight-desk-section-badge">{waitingForWords.length}</span>
            </h2>
          </div>

          {waitingForWords.length ? (
            <div className="lamplight-waiting-list">
              {waitingForWords.map((item) => (
                <div key={item.id} className="lamplight-waiting-item">
                  <div>
                    <h4 className="lamplight-waiting-title">{item.title}</h4>
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
              Every completed title has its lesson kept.
            </div>
          )}
        </section>
      </div>

      {/* 4. Bottom Grid: Seen Again (Returns) & People Remembered */}
      <div className="lamplight-desk-bottom-grid">
        {/* Seen Again Returns Shelf */}
        <section aria-labelledby="returns-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="returns-heading" className="lamplight-desk-section-title">
              <RotateCcw size={15} color="var(--lamp)" />
              <span>Seen Again</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('rewatches')}>
              <span>All returns</span>
              <ChevronRight size={14} />
            </Button>
          </div>

          {recentReturns.length ? (
            <div className="lamplight-desk-card-deck">
              {recentReturns.map((rewatch) => (
                <button
                  key={rewatch.id}
                  type="button"
                  className="lamplight-return-item"
                  onClick={() => onNavigate('rewatches')}
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
                </button>
              ))}
            </div>
          ) : (
            <div className="lamplight-desk-card-deck" style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Rewatches become a record of how a story changes with you.
            </div>
          )}
        </section>

        {/* People Remembered */}
        <section aria-labelledby="people-heading">
          <div className="lamplight-desk-section-head">
            <h2 id="people-heading" className="lamplight-desk-section-title">
              <Sparkles size={15} color="var(--lamp)" />
              <span>People Remembered</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('characters')}>
              <span>All people</span>
              <ChevronRight size={14} />
            </Button>
          </div>

          {rememberedCharacters.length ? (
            <div className="lamplight-desk-card-deck">
              {rememberedCharacters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  className="lamplight-person-item"
                  onClick={() => onNavigate('characters')}
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
                </button>
              ))}
            </div>
          ) : (
            <div className="lamplight-desk-card-deck" style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Remember the people whose choices gave you something to think about.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
