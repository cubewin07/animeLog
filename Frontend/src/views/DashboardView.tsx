import React, { useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Book, FavoriteCharacter, JournalStats, Rewatch } from '../types';
import { JournalStrip } from '../components/JournalStrip';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { ProgressStepper } from '../components/ProgressStepper';
import { BookOpen, Film, Tv, Feather } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface DashboardViewProps {
  stats: JournalStats;
  seriesList: AnimeSeries[];
  bookList: Book[];
  characterList?: FavoriteCharacter[];
  rewatchList?: Rewatch[];
  onNavigate: (tab: any, id?: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onProgressBook: (id: number, delta: number) => void;
  onEditSeason?: (series: AnimeSeries, season: AnimeSeason) => void;
  onEditMovie?: (series: AnimeSeries, movie: AnimeMovie) => void;
  onEditBook?: (book: Book) => void;
  onOpenLogModal?: () => void;
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
  onEditSeason,
  onEditMovie,
  onEditBook,
  onOpenLogModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active watching & reading
  const activeSeasons: { series: AnimeSeries; season: AnimeSeason }[] = [];
  const activeMovies: { series: AnimeSeries; movie: AnimeMovie }[] = [];

  seriesList.forEach((series) => {
    series.seasons?.forEach((season) => {
      if (season.status === 'WATCHING') {
        activeSeasons.push({ series, season });
      }
    });
    series.movies?.forEach((movie) => {
      if (movie.status === 'WATCHING') {
        activeMovies.push({ series, movie });
      }
    });
  });

  const activeBooks = bookList.filter((b) => b.status === 'READING');
  const totalActive = activeSeasons.length + activeMovies.length + activeBooks.length;

  // Ranked Lessons Collection
  interface LessonItem {
    id: string;
    type: 'season' | 'movie' | 'episode' | 'rewatch' | 'book' | 'character';
    title: string;
    subTitle: string;
    coverUrl?: string | null;
    rating?: number | null;
    notes: string;
    timestamp: number;
    onClickTarget?: () => void;
  }

  const allLessons: LessonItem[] = [];

  seriesList.forEach((series) => {
    const seriesCover = series.cover_image_url || (series.cover_image as any)?.image_url;

    series.seasons?.forEach((season) => {
      const seasonCover = season.cover_image_url || (season.cover_image as any)?.image_url || seriesCover;
      const created = season.created_at ? new Date(season.created_at).getTime() : 0;

      if (season.notes && season.notes.trim().length > 0) {
        allLessons.push({
          id: `season-${season.id}`,
          type: 'season',
          title: series.title,
          subTitle: `Season ${season.season_number}: ${season.title}`,
          coverUrl: seasonCover,
          rating: season.rating,
          notes: season.notes,
          timestamp: created,
          onClickTarget: () => onNavigate('anime', series.id),
        });
      }

      season.episode_notes?.forEach((ep) => {
        if (ep.note && ep.note.trim().length > 0) {
          const epCreated = ep.created_at ? new Date(ep.created_at).getTime() : created;
          allLessons.push({
            id: `ep-${ep.id}`,
            type: 'episode',
            title: series.title,
            subTitle: `S${season.season_number} Ep ${ep.episode_number}${ep.episode_title ? `: ${ep.episode_title}` : ''}`,
            coverUrl: seasonCover,
            rating: ep.rating,
            notes: ep.note,
            timestamp: epCreated,
            onClickTarget: () => onNavigate('anime', series.id),
          });
        }
      });

      season.rewatches?.forEach((r) => {
        if (r.notes && r.notes.trim().length > 0) {
          const rDate = r.start_date ? new Date(r.start_date).getTime() : created;
          allLessons.push({
            id: `rewatch-${r.id}`,
            type: 'rewatch',
            title: series.title,
            subTitle: `Rewatch: ${season.title}`,
            coverUrl: seasonCover,
            rating: r.rating,
            notes: r.notes,
            timestamp: rDate,
            onClickTarget: () => onNavigate('rewatches'),
          });
        }
      });
    });

    series.movies?.forEach((movie) => {
      const movieCover = movie.cover_image_url || (movie.cover_image as any)?.image_url || seriesCover;
      const created = movie.created_at ? new Date(movie.created_at).getTime() : 0;

      if (movie.notes && movie.notes.trim().length > 0) {
        allLessons.push({
          id: `movie-${movie.id}`,
          type: 'movie',
          title: series.title,
          subTitle: `Film: ${movie.title}`,
          coverUrl: movieCover,
          rating: movie.rating,
          notes: movie.notes,
          timestamp: created,
          onClickTarget: () => onNavigate('anime', series.id),
        });
      }

      movie.rewatches?.forEach((r) => {
        if (r.notes && r.notes.trim().length > 0) {
          const rDate = r.start_date ? new Date(r.start_date).getTime() : created;
          allLessons.push({
            id: `rewatch-${r.id}`,
            type: 'rewatch',
            title: series.title,
            subTitle: `Rewatch: ${movie.title}`,
            coverUrl: movieCover,
            rating: r.rating,
            notes: r.notes,
            timestamp: rDate,
            onClickTarget: () => onNavigate('rewatches'),
          });
        }
      });
    });
  });

  bookList.forEach((book) => {
    const bookCover = book.cover_image_url || (book.cover_image as any)?.image_url;
    const created = book.created_at ? new Date(book.created_at).getTime() : 0;

    if (book.notes && book.notes.trim().length > 0) {
      allLessons.push({
        id: `book-${book.id}`,
        type: 'book',
        title: book.title,
        subTitle: book.author ? `by ${book.author}` : 'Book Journal',
        coverUrl: bookCover,
        rating: book.rating,
        notes: book.notes,
        timestamp: created,
        onClickTarget: () => onNavigate('books', book.id),
      });
    }
  });

  characterList.forEach((char) => {
    if (char.why && char.why.trim().length > 0) {
      const charImage = char.images && char.images.length > 0 ? (char.images[0] as any).image_url || (char.images[0] as any).url : null;
      allLessons.push({
        id: `char-${char.id}`,
        type: 'character',
        title: char.name,
        subTitle: char.series_title ? `from ${char.series_title}` : 'Favorite Character',
        coverUrl: charImage,
        rating: null,
        notes: char.why,
        timestamp: 0,
        onClickTarget: () => onNavigate('characters'),
      });
    }
  });

  // Rank lessons by recency
  allLessons.sort((a, b) => b.timestamp - a.timestamp);
  const spotlightLessons = allLessons.slice(0, 6);

  // Subtle entrance animation
  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;

      const deskSections = containerRef.current.querySelectorAll('.desk-animate-item');
      if (deskSections.length > 0) {
        gsap.fromTo(
          deskSections,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: containerRef, dependencies: [totalActive, spotlightLessons.length] }
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <section className="desk-animate-item" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p className="section-kicker" style={{ marginBottom: 2 }}>Desk</p>
          <h1 className="display-title" style={{ color: 'var(--text-desk)', fontSize: 24 }}>
            What you are in the middle of
          </h1>
        </div>
        <JournalStrip stats={stats} />
      </section>

      {/* 1. NOW ON THE DESK */}
      <section className="desk-animate-item">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <p className="section-kicker">In progress</p>
            <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
              Now watching & reading
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--text-desk-dim)',
                  fontWeight: 500,
                  marginLeft: 10,
                }}
              >
                {totalActive}
              </span>
            </h2>
          </div>
          {totalActive === 0 && onOpenLogModal && (
            <button onClick={onOpenLogModal} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
              Log an entry
            </button>
          )}
        </div>

        {totalActive === 0 ? (
          <div
            className="desk-card"
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text-desk-muted)', fontStyle: 'italic' }}>
              No titles currently in progress. The desk is open for a new watch or read.
            </p>
            {onOpenLogModal && (
              <button onClick={onOpenLogModal} className="btn btn-primary" style={{ marginTop: 8 }}>
                <Feather size={15} />
                <span>Begin a new journal entry</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Active Anime Seasons */}
            {activeSeasons.map(({ series, season }) => {
              const coverUrl = season.cover_image_url || (season.cover_image as any)?.image_url || series.cover_image_url;
              return (
                <div
                  key={`active-season-${season.id}`}
                  className="desk-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 20,
                    alignItems: 'start',
                  }}
                >
                  {/* Poster Still */}
                  <div
                    onClick={() => onNavigate('anime', series.id)}
                    style={{ cursor: 'pointer' }}
                    title={`View ${series.title}`}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={season.title || series.title}
                        className="still-poster-list"
                        width={96}
                        height={144}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="still-poster-list"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--graphite)' }}
                      >
                        <Tv size={32} />
                      </div>
                    )}
                  </div>

                  {/* Content Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    {/* Header Row: Title, Status, Rating, Stepper */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--text-desk-muted)',
                            marginBottom: 2,
                          }}
                        >
                          {series.title}
                        </div>
                        <h3
                          onClick={() => onNavigate('anime', series.id)}
                          style={{
                            fontSize: 18,
                            color: 'var(--text-desk)',
                            cursor: 'pointer',
                          }}
                        >
                          Season {season.season_number}: {season.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className="status-indicator watching">WATCHING</span>
                        <ProgressStepper
                          current={season.progress || 0}
                          total={season.total_episodes}
                          unit="eps"
                          onDelta={(delta) => onSeasonProgressDelta(season.id, delta)}
                          ariaLabelPrefix={`${series.title} S${season.season_number}`}
                        />
                      </div>
                    </div>

                    {/* Progress Bar (Visual aid) */}
                    {season.total_episodes && (
                      <div className="progress-track" style={{ height: 4 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, ((season.progress || 0) / season.total_episodes) * 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    {/* Clean reflection text directly on desk surface */}
                    {season.notes ? (
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: 'var(--text-desk-muted)',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        "{season.notes}"
                      </p>
                    ) : onEditSeason ? (
                      <button
                        type="button"
                        onClick={() => onEditSeason(series, season)}
                        className="btn btn-ghost"
                        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 12, color: 'var(--text-desk-dim)' }}
                      >
                        + Add reflection
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* Active Anime Movies */}
            {activeMovies.map(({ series, movie }) => {
              const coverUrl = movie.cover_image_url || (movie.cover_image as any)?.image_url || series.cover_image_url;
              return (
                <div
                  key={`active-movie-${movie.id}`}
                  className="desk-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 20,
                    alignItems: 'start',
                  }}
                >
                  <div
                    onClick={() => onNavigate('anime', series.id)}
                    style={{ cursor: 'pointer' }}
                    title={`View ${series.title}`}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={movie.title || series.title}
                        className="still-poster-list"
                        width={96}
                        height={144}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="still-poster-list"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--graphite)' }}
                      >
                        <Film size={32} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--text-desk-muted)',
                            marginBottom: 2,
                          }}
                        >
                          {series.title}
                        </div>
                        <h3
                          onClick={() => onNavigate('anime', series.id)}
                          style={{ fontSize: 18, color: 'var(--text-desk)', cursor: 'pointer' }}
                        >
                          Film: {movie.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className="status-indicator watching">WATCHING</span>
                        <ProgressStepper
                          current={movie.progress_minutes || 0}
                          total={movie.total_minutes}
                          unit="mins"
                          step={10}
                          onDelta={(delta) => onMovieProgressDelta(movie.id, delta)}
                          ariaLabelPrefix={`${movie.title} minutes`}
                        />
                      </div>
                    </div>

                    {/* Clean reflection text directly on desk surface */}
                    {movie.notes ? (
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: 'var(--text-desk-muted)',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        "{movie.notes}"
                      </p>
                    ) : onEditMovie ? (
                      <button
                        type="button"
                        onClick={() => onEditMovie(series, movie)}
                        className="btn btn-ghost"
                        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 12, color: 'var(--text-desk-dim)' }}
                      >
                        + Add reflection
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* Active Books */}
            {activeBooks.map((book) => {
              const coverUrl = book.cover_image_url || (book.cover_image as any)?.image_url;
              return (
                <div
                  key={`active-book-${book.id}`}
                  className="desk-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 20,
                    alignItems: 'start',
                  }}
                >
                  <div
                    onClick={() => onNavigate('books', book.id)}
                    style={{ cursor: 'pointer' }}
                    title={`View ${book.title}`}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="still-poster-list"
                        width={96}
                        height={144}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="still-poster-list"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--graphite)' }}
                      >
                        <BookOpen size={32} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        {book.author && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              color: 'var(--text-desk-muted)',
                              marginBottom: 2,
                            }}
                          >
                            by {book.author}
                          </div>
                        )}
                        <h3
                          onClick={() => onNavigate('books', book.id)}
                          style={{ fontSize: 18, color: 'var(--text-desk)', cursor: 'pointer' }}
                        >
                          {book.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className="status-indicator reading">READING</span>
                        <ProgressStepper
                          current={book.progress || 0}
                          total={book.total_pages}
                          unit="p"
                          step={10}
                          onDelta={(delta) => onProgressBook(book.id, delta)}
                          ariaLabelPrefix={`${book.title} pages`}
                        />
                      </div>
                    </div>

                    {/* Clean reflection text directly on desk surface */}
                    {book.notes ? (
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: 'var(--text-desk-muted)',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        "{book.notes}"
                      </p>
                    ) : onEditBook ? (
                      <button
                        type="button"
                        onClick={() => onEditBook(book)}
                        className="btn btn-ghost"
                        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 12, color: 'var(--text-desk-dim)' }}
                      >
                        + Add reflection
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. LESSONS ON PAPER — slips sit on the desk, not inside a second card */}
      <section className="desk-animate-item">
        <div style={{ marginBottom: 14 }}>
          <p className="section-kicker">Journal</p>
          <h2 className="section-title" style={{ color: 'var(--text-desk)' }}>
            Recent lessons
          </h2>
        </div>

        {spotlightLessons.length === 0 ? (
          <div
            className="desk-card"
            style={{
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic' }}>
              No takeaways recorded yet. Open any title to write down the memories and lessons worth keeping.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {spotlightLessons.map((item) => (
              <div
                key={item.id}
                onClick={item.onClickTarget}
                role={item.onClickTarget ? 'button' : undefined}
                tabIndex={item.onClickTarget ? 0 : undefined}
                onKeyDown={(e) => {
                  if (item.onClickTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    item.onClickTarget();
                  }
                }}
                style={{
                  cursor: item.onClickTarget ? 'pointer' : 'default',
                }}
              >
                <TakeawaySlip
                  text={item.notes}
                  label={item.type}
                  title={item.title}
                  subTitle={item.subTitle}
                  rating={item.rating}
                  status="COMPLETED"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
