import React, { useRef } from 'react';
import { BookOpen, ChevronRight, Clapperboard, Film, PenLine, RotateCcw, Star, Tv, UsersRound } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Book, FavoriteCharacter, JournalStats, Rewatch } from '../types';
import { ProgressStepper } from '../components/ProgressStepper';
import { EASING, prefersReducedMotion } from '../utils/animations';

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
}

type LessonKind = 'season' | 'film' | 'episode' | 'rewatch' | 'book' | 'character';

interface Lesson {
  id: string;
  kind: LessonKind;
  title: string;
  context: string;
  note: string;
  rating?: number | null;
  timestamp: number;
  open: () => void;
}

interface CurrentTitle {
  id: string;
  format: 'Watching' | 'Reading';
  title: string;
  context: string;
  cover?: string | null;
  current: number;
  total?: number | null;
  unit: string;
  progress: (delta: number) => void;
  open: () => void;
}

const dateLabel = (timestamp: number) => timestamp ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp) : 'Undated memory';
const notePreview = (note: string, length = 210) => note.length > length ? `${note.slice(0, length).trimEnd()}…` : note;
const ratingClass = (rating?: number | null) => rating && rating >= 9 ? 'high' : rating && rating >= 7 ? 'mid' : rating ? 'low' : '';
const returnDate = (date?: string | null) => {
  if (!date) return { month: '—', day: '—', year: 'Undated' };
  const value = new Date(`${date}T00:00:00`);
  return {
    month: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(value),
    day: new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(value),
    year: new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(value),
  };
};

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
  const current: CurrentTitle[] = [];
  const lessons: Lesson[] = [];

  seriesList.forEach((series) => {
    const seriesCover = series.cover_image_url || series.image_url;
    series.seasons.forEach((season) => {
      const cover = season.cover_image_url || season.image_url || seriesCover;
      const created = season.created_at ? new Date(season.created_at).getTime() : 0;
      if (season.status === 'WATCHING') {
        current.push({
          id: `season-${season.id}`,
          format: 'Watching',
          title: season.title,
          context: `${series.title} · Season ${season.season_number}`,
          cover,
          current: season.progress || 0,
          total: season.total_episodes,
          unit: 'eps',
          progress: (delta) => onSeasonProgressDelta(season.id, delta),
          open: () => onNavigate('anime', series.id),
        });
      }
      if (season.notes?.trim()) lessons.push({ id: `season-${season.id}`, kind: 'season', title: series.title, context: `Season ${season.season_number} · ${season.title}`, note: season.notes, rating: season.rating, timestamp: created, open: () => onNavigate('anime', series.id) });
      season.episode_notes?.forEach((episode) => {
        if (episode.note?.trim()) lessons.push({
          id: `episode-${episode.id}`,
          kind: 'episode',
          title: series.title,
          context: `S${season.season_number} · Ep ${episode.episode_number}${episode.episode_title ? ` · ${episode.episode_title}` : ''}`,
          note: episode.note,
          rating: episode.rating,
          timestamp: episode.created_at ? new Date(episode.created_at).getTime() : created,
          open: () => onNavigate('anime', series.id),
        });
      });
      season.rewatches?.forEach((rewatch) => {
        if (rewatch.notes?.trim()) lessons.push({ id: `season-rewatch-${rewatch.id}`, kind: 'rewatch', title: series.title, context: `Return to ${season.title}`, note: rewatch.notes, rating: rewatch.rating, timestamp: rewatch.finish_date ? new Date(rewatch.finish_date).getTime() : rewatch.start_date ? new Date(rewatch.start_date).getTime() : created, open: () => onNavigate('rewatches') });
      });
    });
    series.movies.forEach((movie) => {
      const created = movie.created_at ? new Date(movie.created_at).getTime() : 0;
      if (movie.status === 'WATCHING') current.push({ id: `movie-${movie.id}`, format: 'Watching', title: movie.title, context: `${series.title} · Film`, cover: movie.cover_image_url || movie.image_url || seriesCover, current: movie.progress_minutes || 0, total: movie.total_minutes, unit: 'min', progress: (delta) => onMovieProgressDelta(movie.id, delta), open: () => onNavigate('anime', series.id) });
      if (movie.notes?.trim()) lessons.push({ id: `movie-${movie.id}`, kind: 'film', title: series.title, context: `Film · ${movie.title}`, note: movie.notes, rating: movie.rating, timestamp: created, open: () => onNavigate('anime', series.id) });
      movie.rewatches?.forEach((rewatch) => {
        if (rewatch.notes?.trim()) lessons.push({ id: `movie-rewatch-${rewatch.id}`, kind: 'rewatch', title: series.title, context: `Return to ${movie.title}`, note: rewatch.notes, rating: rewatch.rating, timestamp: rewatch.finish_date ? new Date(rewatch.finish_date).getTime() : rewatch.start_date ? new Date(rewatch.start_date).getTime() : created, open: () => onNavigate('rewatches') });
      });
    });
  });

  bookList.forEach((book) => {
    const created = book.created_at ? new Date(book.created_at).getTime() : 0;
    if (book.status === 'READING') current.push({ id: `book-${book.id}`, format: 'Reading', title: book.title, context: book.author ? `by ${book.author}` : 'Book journal', cover: book.cover_image_url || book.image_url, current: book.progress || 0, total: book.total_pages, unit: 'pages', progress: (delta) => onProgressBook(book.id, delta), open: () => onNavigate('books', book.id) });
    if (book.notes?.trim()) lessons.push({ id: `book-${book.id}`, kind: 'book', title: book.title, context: book.author ? `Book · ${book.author}` : 'Book journal', note: book.notes, rating: book.rating, timestamp: created, open: () => onNavigate('books', book.id) });
  });

  characterList.forEach((character) => {
    if (character.why?.trim()) lessons.push({ id: `character-${character.id}`, kind: 'character', title: character.name, context: character.series_title ? `Character · ${character.series_title}` : 'Character note', note: character.why, timestamp: 0, open: () => onNavigate('characters') });
  });

  lessons.sort((a, b) => b.timestamp - a.timestamp);
  current.sort((a, b) => a.format.localeCompare(b.format));
  const featuredLesson = lessons[0];
  const memoryIndex = lessons.slice(1, 5);
  const recentReturns = rewatchList.filter((rewatch) => rewatch.notes?.trim()).sort((a, b) => `${b.finish_date || b.start_date || ''}`.localeCompare(`${a.finish_date || a.start_date || ''}`)).slice(0, 3);
  const rememberedCharacters = characterList.filter((character) => character.why?.trim()).slice(0, 4);

  useGSAP(() => {
    if (prefersReducedMotion() || !containerRef.current) return;
    gsap.fromTo(containerRef.current.querySelectorAll('.desk-animate-item'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.07, ease: EASING.smooth, clearProps: 'transform,opacity' });
  }, { scope: containerRef, dependencies: [current.length, lessons.length] });

  return (
    <div ref={containerRef} className="desk-home">
      <header className="desk-home-header desk-animate-item">
        <div>
          <p className="desk-eyebrow"><Clapperboard size={14} /> personal viewing desk</p>
          <h1>Your stories, still in motion.</h1>
          <p className="desk-home-intro">A working desk for what you are living with now, and a reading room for the ideas that stayed after the credits.</p>
        </div>
        <div className="desk-ledger" aria-label="Journal totals">
          <div><strong>{stats.totalLessons}</strong><span>lessons kept</span></div>
          <div><strong>{stats.rewatchesCount}</strong><span>returns made</span></div>
          <div><strong>{stats.totalCompleted}</strong><span>titles finished</span></div>
        </div>
      </header>

      <section className="desk-now desk-animate-item" aria-labelledby="now-heading">
        <div className="desk-section-heading">
          <div><p className="desk-eyebrow">currently open</p><h2 id="now-heading">On the desk <span>{current.length}</span></h2></div>
          <button type="button" className="desk-text-action" onClick={() => onNavigate('anime')}>View library <ChevronRight size={15} /></button>
        </div>
        {current.length ? (
          <div className="current-title-grid">
            {current.slice(0, 3).map((item) => {
              const percentage = item.total ? Math.min(100, (item.current / item.total) * 100) : 0;
              return <article key={item.id} className={`current-title ${item.format === 'Reading' ? 'is-reading' : ''}`}>
                <button type="button" className="current-title-open" onClick={item.open} aria-label={`Open ${item.title}`}>
                  {item.cover ? <img src={item.cover} alt="" /> : <span className="current-title-placeholder">{item.format === 'Reading' ? <BookOpen size={22} /> : <Tv size={22} />}</span>}
                  <span className="current-title-copy"><span className="current-format">{item.format}</span><strong>{item.title}</strong><small>{item.context}</small></span>
                </button>
                <div className="current-progress">
                  <div><ProgressStepper current={item.current} total={item.total} unit={item.unit} step={item.unit === 'pages' || item.unit === 'min' ? 10 : 1} tone={item.format === 'Reading' ? 'reading' : 'watching'} onDelta={item.progress} ariaLabelPrefix={item.title} /></div>
                  {item.total && <span className="current-progress-line"><i style={{ width: `${percentage}%` }} /></span>}
                </div>
              </article>;
            })}
          </div>
        ) : (
          <div className="desk-empty-state"><div><Film size={20} /><p>Nothing is in progress. Start something worth returning to.</p></div>{onOpenLogModal && <button type="button" className="btn btn-primary" onClick={onOpenLogModal}>Log a title</button>}</div>
        )}
      </section>

      <section className="desk-reading-room desk-animate-item" aria-labelledby="reading-room-heading">
        <div className="desk-section-heading"><div><p className="desk-eyebrow">the reading room</p><h2 id="reading-room-heading">What stayed with you</h2></div><span className="desk-count-note">{lessons.length} recorded thoughts</span></div>
        {featuredLesson ? (
          <div className="lesson-layout">
            <article className="featured-lesson">
              <div className="featured-lesson-rule" />
              <div className="featured-lesson-meta"><span>{featuredLesson.kind}</span><time>{dateLabel(featuredLesson.timestamp)}</time></div>
              <button type="button" className="featured-lesson-open" onClick={featuredLesson.open}>
                <h3>{featuredLesson.title}</h3><p>{featuredLesson.context}</p>
              </button>
              <blockquote>“{notePreview(featuredLesson.note, 440)}”</blockquote>
              <div className="featured-lesson-footer"><span>Latest entry</span>{featuredLesson.rating && <span className={`lesson-score ${ratingClass(featuredLesson.rating)}`}><Star size={13} fill="currentColor" /> {featuredLesson.rating}/10</span>}</div>
            </article>
            <div className="memory-index">
              <div className="memory-index-heading"><span>Memory index</span><span>{memoryIndex.length.toString().padStart(2, '0')}</span></div>
              {memoryIndex.length ? memoryIndex.map((lesson) => <button type="button" key={lesson.id} className="memory-index-item" onClick={lesson.open}><span className="memory-index-type">{lesson.kind}</span><span><strong>{lesson.title}</strong><small>{lesson.context}</small></span>{lesson.rating && <span className={`lesson-score ${ratingClass(lesson.rating)}`}>{lesson.rating}</span>}<ChevronRight size={15} /></button>) : <p className="memory-index-empty">Your next note will join this index.</p>}
            </div>
          </div>
        ) : (
          <div className="lesson-empty"><PenLine size={22} /><div><strong>The reading room is waiting.</strong><p>Write a lesson on any title to make this a journal instead of a list.</p></div>{onOpenLogModal && <button type="button" className="desk-text-action" onClick={onOpenLogModal}>Log a title <ChevronRight size={15} /></button>}</div>
        )}
      </section>

      <div className="desk-lower-grid desk-animate-item">
        <section className="desk-side-section" aria-labelledby="returns-heading"><div className="desk-section-heading"><div><p className="desk-eyebrow"><RotateCcw size={13} /> return shelf</p><h2 id="returns-heading">Seen again</h2></div><button type="button" className="desk-text-action" onClick={() => onNavigate('rewatches')}>All returns <ChevronRight size={15} /></button></div>{recentReturns.length ? <div className="return-timeline">{recentReturns.map((rewatch) => { const date = returnDate(rewatch.finish_date || rewatch.start_date); return <button type="button" key={rewatch.id} className="return-timeline-item" onClick={() => onNavigate('rewatches')}><time className="return-timeline-date"><span>{date.month}</span><strong>{date.day}</strong><small>{date.year}</small></time><span className="return-timeline-node" /><span className="return-timeline-copy"><strong>{rewatch.release_title || rewatch.series_title || 'A remembered title'}</strong><small>{notePreview(rewatch.notes || '', 78)}</small></span></button>; })}</div> : <p className="desk-quiet-copy">Rewatches become a record of how a story changes with you.</p>}</section>
        <section className="desk-side-section" aria-labelledby="characters-heading"><div className="desk-section-heading"><div><p className="desk-eyebrow"><UsersRound size={13} /> character shelf</p><h2 id="characters-heading">People remembered</h2></div><button type="button" className="desk-text-action" onClick={() => onNavigate('characters')}>All characters <ChevronRight size={15} /></button></div>{rememberedCharacters.length ? <div className="character-memory-deck">{rememberedCharacters.map((character) => { const image = character.cover_image_url || character.image_url || character.images?.[0]?.url || character.images?.[0]?.file; return <button type="button" className="character-memory-card" key={character.id} onClick={() => onNavigate('characters')}><span className="character-memory-portrait">{image ? <img src={image} alt="" /> : character.name.slice(0, 1)}</span><span className="character-memory-copy"><small>{character.series_title || 'Favorite character'}</small><strong>{character.name}</strong><em>“{notePreview(character.why || '', 88)}”</em></span></button>; })}</div> : <p className="desk-quiet-copy">Keep the characters whose choices gave you something to think about.</p>}</section>
      </div>
    </div>
  );
};
