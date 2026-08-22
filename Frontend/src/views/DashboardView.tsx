import React, { useRef } from 'react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Book, JournalStats } from '../types';
import { StatsOverview } from '../components/StatsOverview';
import { BookCard } from '../components/BookCard';
import { Lightbulb, ArrowRight, Quote, Tv, Clapperboard, Plus, Minus, Star } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface DashboardViewProps {
  stats: JournalStats;
  seriesList: AnimeSeries[];
  bookList: Book[];
  onNavigate: (tab: any) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onEditBook: (b: Book) => void;
  onDeleteBook: (id: number) => void;
  onProgressBook: (id: number, delta: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  seriesList,
  bookList,
  onNavigate,
  onSeasonProgressDelta,
  onMovieProgressDelta,
  onEditBook,
  onDeleteBook,
  onProgressBook,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active TV seasons and movies
  const activeSeasons: { series: AnimeSeries; season: AnimeSeason }[] = [];
  const activeMovies: { series: AnimeSeries; movie: AnimeMovie }[] = [];

  seriesList.forEach((series) => {
    series.seasons.forEach((season) => {
      if (season.status === 'WATCHING') {
        activeSeasons.push({ series, season });
      }
    });
    series.movies.forEach((movie) => {
      if (movie.status === 'WATCHING') {
        activeMovies.push({ series, movie });
      }
    });
  });

  const activeBooks = bookList.filter((b) => b.status === 'READING');

  // Lessons spotlight from all journal sources
  const mediaWithLessons: {
    type: 'season' | 'movie' | 'episode' | 'rewatch' | 'book';
    title: string;
    subTitle?: string;
    rating?: number | null;
    notes: string;
  }[] = [];

  seriesList.forEach((series) => {
    series.seasons.forEach((season) => {
      if (season.notes && season.notes.trim().length > 0) {
        mediaWithLessons.push({
          type: 'season',
          title: series.title,
          subTitle: `Season ${season.season_number}: ${season.title}`,
          rating: season.rating,
          notes: season.notes,
        });
      }
      season.episode_notes?.forEach((ep) => {
        if (ep.note && ep.note.trim().length > 0) {
          mediaWithLessons.push({
            type: 'episode',
            title: series.title,
            subTitle: `Ep ${ep.episode_number}${ep.episode_title ? `: ${ep.episode_title}` : ''}`,
            rating: ep.rating,
            notes: ep.note,
          });
        }
      });
      season.rewatches?.forEach((r) => {
        if (r.notes && r.notes.trim().length > 0) {
          mediaWithLessons.push({
            type: 'rewatch',
            title: series.title,
            subTitle: `Rewatch: ${season.title}`,
            rating: r.rating,
            notes: r.notes,
          });
        }
      });
    });

    series.movies.forEach((movie) => {
      if (movie.notes && movie.notes.trim().length > 0) {
        mediaWithLessons.push({
          type: 'movie',
          title: series.title,
          subTitle: `Film: ${movie.title}`,
          rating: movie.rating,
          notes: movie.notes,
        });
      }
      movie.rewatches?.forEach((r) => {
        if (r.notes && r.notes.trim().length > 0) {
          mediaWithLessons.push({
            type: 'rewatch',
            title: series.title,
            subTitle: `Rewatch: ${movie.title}`,
            rating: r.rating,
            notes: r.notes,
          });
        }
      });
    });
  });

  bookList.forEach((book) => {
    if (book.notes && book.notes.trim().length > 0) {
      mediaWithLessons.push({
        type: 'book',
        title: book.title,
        subTitle: book.author || 'Book Reflection',
        rating: book.rating,
        notes: book.notes,
      });
    }
  });

  const spotlightList = mediaWithLessons.slice(0, 3);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;

      const activeItems = containerRef.current.querySelectorAll('.dashboard-active-item');
      if (activeItems.length > 0) {
        gsap.fromTo(
          activeItems,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }

      const lessonItems = containerRef.current.querySelectorAll('.spotlight-card');
      if (lessonItems.length > 0) {
        gsap.fromTo(
          lessonItems,
          { opacity: 0, y: 24, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            delay: 0.1,
            stagger: 0.08,
            ease: EASING.spring,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: containerRef, dependencies: [activeSeasons.length, activeMovies.length, activeBooks.length] }
  );

  return (
    <div ref={containerRef}>
      {/* Metrics Banner */}
      <StatsOverview stats={stats} />

      {/* Currently In-Progress Grid */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-accent-amber)',
                boxShadow: '0 0 10px var(--color-accent-amber)',
              }}
            />
            <h2 style={{ fontSize: '20px', color: '#ffffff' }}>Active In-Progress</h2>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {activeSeasons.length + activeMovies.length} watching · {activeBooks.length} reading
          </span>
        </div>

        {activeSeasons.length === 0 && activeMovies.length === 0 && activeBooks.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <p>No active series, movies, or books right now.</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Check your Plan to Watch / Read lists to start a new journey!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Active Seasons */}
            {activeSeasons.map(({ series, season }) => {
              const progressPct =
                season.total_episodes && season.total_episodes > 0
                  ? Math.min(100, Math.round((season.progress / season.total_episodes) * 100))
                  : season.progress > 0
                  ? 50
                  : 0;

              return (
                <div key={`active-season-${season.id}`} className="glass-card dashboard-active-item" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {series.title}
                      </span>
                      <h4 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tv size={14} color="var(--color-primary)" />
                        Season {season.season_number}: {season.title}
                      </h4>
                    </div>
                    {season.rating && (
                      <span className="rating-pill" style={{ padding: '1px 5px', fontSize: '11px' }}>
                        ★ {season.rating}
                      </span>
                    )}
                  </div>

                  {/* Progress bar + stepper */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                      {season.progress} / {season.total_episodes ?? '??'} eps
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => onSeasonProgressDelta(season.id, -1)}
                        disabled={season.progress <= 0}
                        title="Subtract 1 episode"
                      >
                        <Minus size={11} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onSeasonProgressDelta(season.id, 1)}
                        disabled={season.total_episodes !== null && season.progress >= season.total_episodes}
                        title="Add 1 episode"
                        style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              );
            })}

            {/* Active Movies */}
            {activeMovies.map(({ series, movie }) => {
              const progressPct =
                movie.total_minutes && movie.total_minutes > 0
                  ? Math.min(100, Math.round((movie.progress_minutes / movie.total_minutes) * 100))
                  : movie.progress_minutes > 0
                  ? 50
                  : 0;

              return (
                <div key={`active-movie-${movie.id}`} className="glass-card dashboard-active-item" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {series.title}
                      </span>
                      <h4 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clapperboard size={14} color="var(--color-accent-cyan)" />
                        Film: {movie.title}
                      </h4>
                    </div>
                    {movie.rating && (
                      <span className="rating-pill" style={{ padding: '1px 5px', fontSize: '11px' }}>
                        ★ {movie.rating}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                      {movie.progress_minutes} / {movie.total_minutes ?? '??'} min
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => onMovieProgressDelta(movie.id, -Math.min(10, movie.progress_minutes))}
                        disabled={movie.progress_minutes <= 0}
                        title="Subtract 10 minutes"
                      >
                        <Minus size={11} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onMovieProgressDelta(
                          movie.id,
                          movie.total_minutes === null
                            ? 10
                            : Math.min(10, movie.total_minutes - movie.progress_minutes)
                        )}
                        disabled={movie.total_minutes !== null && movie.progress_minutes >= movie.total_minutes}
                        title="Add 10 minutes"
                        style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent-cyan)' }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              );
            })}

            {/* Active Books */}
            {activeBooks.map((b) => (
              <div key={b.id} className="dashboard-active-item">
                <BookCard
                  book={b}
                  onEdit={onEditBook}
                  onDelete={onDeleteBook}
                  onProgressDelta={onProgressBook}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Lessons & Reflections Spotlight */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '20px', color: '#ffffff' }}>Lessons & Reflections Spotlight</h2>
          </div>
          <button
            onClick={() => onNavigate('anime')}
            className="btn btn-ghost"
            style={{ fontSize: '13px', color: 'var(--color-primary)' }}
          >
            <span>Explore All Journals</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {spotlightList.map((item, i) => (
            <div
              key={i}
              className="glass-card spotlight-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'linear-gradient(160deg, rgba(18, 33, 49, 0.8), rgba(99, 102, 241, 0.08))',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color:
                        item.type === 'book'
                          ? 'var(--color-accent-cyan)'
                          : item.type === 'episode'
                          ? 'var(--color-accent-emerald)'
                          : item.type === 'rewatch'
                          ? 'var(--color-secondary)'
                          : 'var(--color-primary)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {item.type === 'book'
                      ? 'Book Insight'
                      : item.type === 'episode'
                      ? 'Standout Episode'
                      : item.type === 'rewatch'
                      ? 'Rewatch Pass'
                      : item.type === 'movie'
                      ? 'Film Memory'
                      : 'Season Lesson'}
                  </span>
                  {item.rating && (
                    <span className="rating-pill">★ {item.rating}/10</span>
                  )}
                </div>

                <h4 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '2px' }}>
                  {item.title}
                </h4>
                {item.subTitle && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {item.subTitle}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#d4e4fa',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                  }}
                >
                  <Quote size={18} style={{ flexShrink: 0, opacity: 0.6, color: 'var(--color-primary)' }} />
                  <p>{item.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
