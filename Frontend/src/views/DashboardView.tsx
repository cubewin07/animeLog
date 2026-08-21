import React, { useRef } from 'react';
import { Anime, Book, JournalStats } from '../types';
import { StatsOverview } from '../components/StatsOverview';
import { AnimeCard } from '../components/AnimeCard';
import { BookCard } from '../components/BookCard';
import { Lightbulb, ArrowRight, Quote } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface DashboardViewProps {
  stats: JournalStats;
  animeList: Anime[];
  bookList: Book[];
  onNavigate: (tab: any) => void;
  onEditAnime: (a: Anime) => void;
  onDeleteAnime: (id: number) => void;
  onProgressAnime: (id: number, delta: number) => void;
  onAddRewatch: (a: Anime) => void;
  onAddCharacter: (a: Anime) => void;
  onEditBook: (b: Book) => void;
  onDeleteBook: (id: number) => void;
  onProgressBook: (id: number, delta: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  animeList,
  bookList,
  onNavigate,
  onEditAnime,
  onDeleteAnime,
  onProgressAnime,
  onAddRewatch,
  onAddCharacter,
  onEditBook,
  onDeleteBook,
  onProgressBook,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeAnime = animeList.filter((a) => a.status === 'WATCHING');
  const activeBooks = bookList.filter((b) => b.status === 'READING');

  // Lessons spotlight from completed media
  const mediaWithLessons = [
    ...animeList
      .filter((a) => a.notes && a.notes.trim().length > 0)
      .map((a) => ({
        type: 'anime',
        title: a.title,
        rating: a.rating,
        notes: a.notes!,
        date: a.finish_date || a.start_date || 'Past',
      })),
    ...bookList
      .filter((b) => b.notes && b.notes.trim().length > 0)
      .map((b) => ({
        type: 'book',
        title: b.title,
        rating: b.rating,
        notes: b.notes!,
        date: b.finish_date || b.start_date || 'Past',
      })),
  ].slice(0, 3);

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
    { scope: containerRef, dependencies: [activeAnime.length, activeBooks.length] }
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
            {activeAnime.length} watching · {activeBooks.length} reading
          </span>
        </div>

        {activeAnime.length === 0 && activeBooks.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <p>No active series or books right now.</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Check your Plan to Watch / Read lists to start a new journey!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {activeAnime.map((a) => (
              <div key={a.id} className="dashboard-active-item">
                <AnimeCard
                  anime={a}
                  onEdit={onEditAnime}
                  onDelete={onDeleteAnime}
                  onProgressDelta={onProgressAnime}
                  onAddRewatch={onAddRewatch}
                  onAddCharacter={onAddCharacter}
                />
              </div>
            ))}
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
          {mediaWithLessons.map((item, i) => (
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
                      color: item.type === 'anime' ? 'var(--color-primary)' : 'var(--color-accent-cyan)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {item.type === 'anime' ? 'Anime Memory' : 'Book Insight'}
                  </span>
                  {item.rating && (
                    <span className="rating-pill">★ {item.rating}/10</span>
                  )}
                </div>

                <h4 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '8px' }}>
                  {item.title}
                </h4>

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
