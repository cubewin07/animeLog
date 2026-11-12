import React, { lazy, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { LibraryTabs } from '../shell/LibraryTabs';
import { useAppNavigate } from './useAppNavigate';
import type { AppOutletContext } from './AppLayout';
import { Download, Flame, ImagePlus, Sparkles, Trophy, Upload } from 'lucide-react';
import { buildFindArtItems, summarizeFindArt } from '../features/find-art/findArtQueue';

// Each page loads on first visit, and `preloadPages` fetches the rest while the browser is idle
const loaders = {
  dashboard: () => import('../views/DashboardView'),
  anime: () => import('../views/AnimeView'),
  franchise: () => import('../views/FranchiseDetailView'),
  books: () => import('../views/BookView'),
  book: () => import('../views/BookDetailView'),
  reflections: () => import('../views/ReflectionsView'),
  characters: () => import('../views/CharactersView'),
  rewatches: () => import('../views/RewatchesView'),
  media: () => import('../views/MediaView'),
  findArt: () => import('../features/find-art/FindArtPage'),
};

const DashboardView = lazy(() => loaders.dashboard().then((m) => ({ default: m.DashboardView })));
const AnimeView = lazy(() => loaders.anime().then((m) => ({ default: m.AnimeView })));
const FranchiseDetailView = lazy(() => loaders.franchise().then((m) => ({ default: m.FranchiseDetailView })));
const BookView = lazy(() => loaders.books().then((m) => ({ default: m.BookView })));
const BookDetailView = lazy(() => loaders.book().then((m) => ({ default: m.BookDetailView })));
const ReflectionsView = lazy(() => loaders.reflections().then((m) => ({ default: m.ReflectionsView })));
const CharactersView = lazy(() => loaders.characters().then((m) => ({ default: m.CharactersView })));
const RewatchesView = lazy(() => loaders.rewatches().then((m) => ({ default: m.RewatchesView })));
const MediaView = lazy(() => loaders.media().then((m) => ({ default: m.MediaView })));
export const FindArtPage = lazy(() => loaders.findArt().then((m) => ({ default: m.FindArtPage })));

export function preloadPages() {
  Object.values(loaders).forEach((load) => load().catch(() => {}));
}

const NotFound: React.FC<{ title: string; message: string; backLabel: string; onBack: () => void }> = ({
  title,
  message,
  backLabel,
  onBack,
}) => (
  <div className="desk-card" style={{ padding: 40, textAlign: 'center' }}>
    <h3 style={{ fontSize: 18, color: 'var(--kf-text)', marginBottom: 8 }}>{title}</h3>
    <p style={{ color: 'var(--kf-text-2)', marginBottom: 16 }}>{message}</p>
    <button onClick={onBack} className="btn btn-secondary">
      {backLabel}
    </button>
  </div>
);

export const HomePage: React.FC = () => {
  const { stats, seriesList, bookList, characterList, rewatchList } = useJournalData();
  const actions = useJournalActions();
  const navigate = useAppNavigate();
  return (
    <DashboardView
      stats={stats}
      seriesList={seriesList}
      bookList={bookList}
      characterList={characterList}
      rewatchList={rewatchList}
      onNavigate={(tab, id) => {
        if (tab === 'anime' && id) navigate(`/anime/${id}`);
        else if (tab === 'books' && id) navigate(`/books/${id}`);
        else if (tab === 'characters' && id) navigate(`/characters/${id}`);
        else if (tab === 'rewatches') navigate('/journal?kind=rewatch');
        else if (tab === 'reflections') navigate('/journal');
        else if (tab === 'dashboard' || tab === 'home') navigate('/');
        else navigate(`/${tab}`);
      }}
      onSeasonProgressDelta={actions.handleSeasonProgressDelta}
      onMovieProgressDelta={actions.handleMovieProgressDelta}
      onProgressBook={actions.handleBookProgressDelta}
      onEditSeason={(_, season) => actions.openEditSeasonModal(season)}
      onEditMovie={(_, movie) => actions.openEditMovieModal(movie)}
      onEditBook={actions.openEditBookModal}
      onOpenLogModal={actions.openNewFranchiseModal}
      onToast={actions.addToast}
    />
  );
};

export const AnimePage: React.FC = () => {
  const { seriesList } = useJournalData();
  const { searchQuery } = useJournalUI();
  const a = useJournalActions();
  const navigate = useAppNavigate();
  return (
    <>
      <LibraryTabs />
      <AnimeView
        seriesList={seriesList}
        searchQuery={searchQuery}
        onOpenDetail={(id) => navigate(`/anime/${id}`)}
        onEditSeries={a.openEditSeriesModal}
        onDeleteSeries={a.handleDeleteSeries}
        onAddSeason={a.openAddSeasonModal}
        onAddMovie={a.openAddMovieModal}
        onEditSeason={a.openEditSeasonModal}
        onDeleteSeason={a.handleDeleteSeason}
        onSeasonProgressDelta={a.handleSeasonProgressDelta}
        onEditMovie={a.openEditMovieModal}
        onDeleteMovie={a.handleDeleteMovie}
        onMovieProgressDelta={a.handleMovieProgressDelta}
        onOpenEpisodeNotes={a.openEpisodeNotesModal}
        onAddRewatchSeason={a.openAddRewatchSeason}
        onAddRewatchMovie={a.openAddRewatchMovie}
        onAddCharacter={a.openAddCharacterModal}
        onOpenNewFranchiseModal={a.openNewFranchiseModal}
      />
    </>
  );
};

export const FranchisePage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { seriesList, rewatchList } = useJournalData();
  const a = useJournalActions();
  const navigate = useAppNavigate();
  const onBack = () => navigate('/anime');
  const series = seriesList.find((s) => s.id === Number(seriesId));

  if (!series) {
    return (
      <NotFound
        title="Anime not found"
        message="This anime isn’t in your journal."
        backLabel="Back to Anime"
        onBack={onBack}
      />
    );
  }

  return (
    <FranchiseDetailView
      series={series}
      allRewatches={rewatchList}
      onBack={onBack}
      onEditSeries={a.openEditSeriesModal}
      onDeleteSeries={a.handleDeleteSeries}
      onAddSeason={a.openAddSeasonModal}
      onAddMovie={a.openAddMovieModal}
      onEditSeason={a.openEditSeasonModal}
      onDeleteSeason={a.handleDeleteSeason}
      onSeasonProgressDelta={a.handleSeasonProgressDelta}
      onEditMovie={a.openEditMovieModal}
      onDeleteMovie={a.handleDeleteMovie}
      onMovieProgressDelta={a.handleMovieProgressDelta}
      onOpenEpisodeNotes={a.openEpisodeNotesModal}
      onAddRewatchSeries={a.openAddRewatchSeries}
      onAddRewatchSeason={a.openAddRewatchSeason}
      onAddRewatchMovie={a.openAddRewatchMovie}
      onAddRewatchEpisode={a.openAddRewatchEpisode}
      onEditRewatch={a.openEditRewatchModal}
      onDeleteRewatch={a.handleDeleteRewatch}
      onAddCharacter={a.openAddCharacterModal}
      onEditCharacter={a.openEditCharacterModal}
      onDeleteCharacter={a.handleDeleteCharacter}
      onRefresh={a.refreshAll}
    />
  );
};

export const BooksPage: React.FC = () => {
  const { bookList } = useJournalData();
  const { searchQuery } = useJournalUI();
  const a = useJournalActions();
  const navigate = useAppNavigate();
  return (
    <>
      <LibraryTabs />
      <BookView
        bookList={bookList}
        searchQuery={searchQuery}
        onOpenDetail={(id) => navigate(`/books/${id}`)}
        onEdit={a.openEditBookModal}
        onDelete={a.handleDeleteBook}
        onProgressDelta={a.handleBookProgressDelta}
        onOpenNewModal={a.openNewBookModal}
      />
    </>
  );
};

export const BookPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { bookList } = useJournalData();
  const a = useJournalActions();
  const navigate = useAppNavigate();
  const onBack = () => navigate('/books');
  const book = bookList.find((b) => b.id === Number(bookId));

  if (!book) {
    return (
      <NotFound
        title="Book not found"
        message="This book isn’t in your journal."
        backLabel="Back to Books"
        onBack={onBack}
      />
    );
  }

  return (
    <BookDetailView
      book={book}
      onBack={onBack}
      onEdit={a.openEditBookModal}
      onDelete={a.handleDeleteBook}
      onProgressDelta={a.handleBookProgressDelta}
    />
  );
};

export const CharactersPage: React.FC = () => {
  const { characterList } = useJournalData();
  const { searchQuery } = useJournalUI();
  const a = useJournalActions();
  return (
    <>
      <LibraryTabs />
      <CharactersView
        characters={characterList}
        searchQuery={searchQuery}
        onEdit={a.openEditCharacterModal}
        onDelete={a.handleDeleteCharacter}
        onOpenAddModal={() => a.openAddCharacterModal()}
        onRefresh={a.refreshAll}
      />
    </>
  );
};

export const JournalPage: React.FC = () => <ReflectionsView />;

export const RewatchesPage: React.FC = () => {
  const { rewatchList, seriesList } = useJournalData();
  const { searchQuery } = useJournalUI();
  const a = useJournalActions();
  const navigate = useAppNavigate();
  return (
    <RewatchesView
      rewatches={rewatchList}
      seriesList={seriesList}
      searchQuery={searchQuery}
      onEdit={a.openEditRewatchModal}
      onDelete={a.handleDeleteRewatch}
      onOpenRewatchModal={a.openAddRewatch}
      onNavigateSeries={(id) => navigate(`/anime/${id}`)}
    />
  );
};

const LEVEL_NAMES = [
  { minXp: 0, level: 1, name: 'Newcomer', nextXp: 50 },
  { minXp: 50, level: 2, name: 'Regular', nextXp: 150 },
  { minXp: 150, level: 3, name: 'Binger', nextXp: 300 },
  { minXp: 300, level: 4, name: 'Otaku', nextXp: 500 },
  { minXp: 500, level: 5, name: 'Critic', nextXp: 800 },
  { minXp: 800, level: 6, name: 'Sensei', nextXp: 1200 },
];

export const MePage: React.FC = () => {
  const { year } = useParams<{ year?: string }>();
  const { seriesList, bookList, characterList, rewatchList } = useJournalData();
  const { reflections } = useReflections();

  const summary = useMemo(() => {
    let episodesWatched = 0;
    let episodeNotes = 0;
    let seasonOrMovieNotes = 0;
    let finishedReleases = 0;

    seriesList.forEach((s) => {
      s.seasons?.forEach((sea) => {
        episodesWatched += sea.progress || 0;
        episodeNotes += sea.episode_notes?.filter((n) => n.note?.trim()).length || 0;
        if (sea.notes?.trim()) seasonOrMovieNotes += 1;
        if (sea.status === 'COMPLETED') finishedReleases += 1;
      });
      s.movies?.forEach((m) => {
        if (m.notes?.trim()) seasonOrMovieNotes += 1;
        if (m.status === 'COMPLETED') finishedReleases += 1;
      });
    });

    const bookNotes = bookList.filter((b) => b.notes?.trim()).length;
    const charNotes = characterList.filter((c) => c.why?.trim()).length;
    const rewatchNotes = rewatchList.filter((r) => r.notes?.trim()).length;

    const xp =
      episodesWatched * 1 +
      episodeNotes * 5 +
      charNotes * 10 +
      (seasonOrMovieNotes + bookNotes + rewatchNotes) * 15 +
      finishedReleases * 20;

    const tier = [...LEVEL_NAMES].reverse().find((t) => xp >= t.minXp) ?? LEVEL_NAMES[0];
    const progressPct = Math.min(100, Math.round(((xp - tier.minXp) / Math.max(1, tier.nextXp - tier.minXp)) * 100));

    return {
      xp,
      tier,
      progressPct,
      episodesWatched,
      finishedReleases,
      notesCount: reflections.length,
      charactersCount: characterList.length,
      rewatchesCount: rewatchList.length,
    };
  }, [seriesList, bookList, characterList, rewatchList, reflections.length]);

  const currentYear = year || String(new Date().getFullYear());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--kf-font-display)', fontStretch: '82%', fontSize: 'var(--kf-text-xl)', fontWeight: 800, color: 'var(--kf-text)' }}>
            {year ? `${year} Recap` : 'Me'}
          </h1>
          <p style={{ color: 'var(--kf-text-2)', fontSize: 'var(--kf-text-sm)', marginTop: 4 }}>
            Your level, achievements, watching stats and collection highlights.
          </p>
        </div>
        {!year ? (
          <Link
            viewTransition
            to={`/me/recap/${currentYear}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 'var(--kf-radius)',
              background: 'var(--kf-panel)',
              border: '1px solid var(--kf-line-strong)',
              color: 'var(--kf-text)',
              textDecoration: 'none',
              fontSize: 'var(--kf-text-sm)',
              fontWeight: 600,
            }}
          >
            <Sparkles size={15} color="var(--kf-gold)" />
            <span>{currentYear} Recap</span>
          </Link>
        ) : (
          <Link
            viewTransition
            to="/me"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 'var(--kf-radius)',
              background: 'var(--kf-panel)',
              border: '1px solid var(--kf-line-strong)',
              color: 'var(--kf-text)',
              textDecoration: 'none',
              fontSize: 'var(--kf-text-sm)',
              fontWeight: 600,
            }}
          >
            <span>Back to Me</span>
          </Link>
        )}
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
        aria-label="Level and stats"
      >
        <div
          style={{
            background: 'var(--kf-panel)',
            border: '1px solid var(--kf-line)',
            borderRadius: 'var(--kf-radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kf-gold)' }}>
            Level {summary.tier.level}
          </span>
          <strong style={{ fontFamily: 'var(--kf-font-display)', fontSize: 24, color: 'var(--kf-text)' }}>
            {summary.tier.name}
          </strong>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--kf-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${summary.progressPct}%`, height: '100%', background: 'var(--kf-gold)' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>
            {summary.xp} XP earned from watching and writing notes
          </span>
        </div>

        <div
          style={{
            background: 'var(--kf-panel)',
            border: '1px solid var(--kf-line)',
            borderRadius: 'var(--kf-radius-lg)',
            padding: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div>
            <strong style={{ fontSize: 22, display: 'block', color: 'var(--kf-text)' }}>{summary.episodesWatched}</strong>
            <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>Episodes watched</span>
          </div>
          <div>
            <strong style={{ fontSize: 22, display: 'block', color: 'var(--kf-text)' }}>{summary.notesCount}</strong>
            <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>Notes written</span>
          </div>
          <div>
            <strong style={{ fontSize: 22, display: 'block', color: 'var(--kf-text)' }}>{summary.finishedReleases}</strong>
            <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>Completed seasons & movies</span>
          </div>
          <div>
            <strong style={{ fontSize: 22, display: 'block', color: 'var(--kf-text)' }}>{summary.charactersCount}</strong>
            <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>Character cards</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--kf-panel)',
            border: '1px solid var(--kf-line)',
            borderRadius: 'var(--kf-radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kf-gold)' }}>
            <Trophy size={18} />
            <Flame size={18} />
            <strong style={{ color: 'var(--kf-text)' }}>Achievements & Activity Calendar</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--kf-text-2)', margin: 0 }}>
            Full activity calendar, streak history, achievements and story recap arrive in Phases 5 and 10.
          </p>
        </div>
      </section>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { seriesList, bookList, characterList } = useJournalData();
  const { addToast, requestConfirm } = useJournalActions();
  const outlet = useOutletContext<AppOutletContext | undefined>();

  const findArtSummary = useMemo(
    () => summarizeFindArt(buildFindArtItems({ seriesList, bookList, characterList })),
    [seriesList, bookList, characterList]
  );

  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem('animelog_game_prefs_v1');
      if (raw) return JSON.parse(raw) as { xp: boolean; streak: boolean; celebrations: boolean };
    } catch {
      // ignore
    }
    return { xp: true, streak: true, celebrations: true };
  });

  const togglePref = (key: 'xp' | 'streak' | 'celebrations') => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('animelog_game_prefs_v1', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--kf-font-display)', fontStretch: '82%', fontSize: 'var(--kf-text-xl)', fontWeight: 800, color: 'var(--kf-text)' }}>
            Settings
          </h1>
          <p style={{ color: 'var(--kf-text-2)', fontSize: 'var(--kf-text-sm)', marginTop: 4 }}>
            Backup and import your journal, adjust progression features, and manage your media library.
          </p>
        </div>

        {outlet?.onOpenExport && (
          <button
            type="button"
            onClick={outlet.onOpenExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 40,
              padding: '0 16px',
              borderRadius: 'var(--kf-radius)',
              background: 'var(--kf-brand)',
              color: 'var(--kf-on-fill)',
              border: 'none',
              fontFamily: 'var(--kf-font-ui)',
              fontSize: 'var(--kf-text-sm)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <Upload size={15} />
            <span>Export & Import</span>
          </button>
        )}
      </header>

      <section
        aria-label="Progression preferences"
        style={{
          background: 'var(--kf-panel)',
          border: '1px solid var(--kf-line)',
          borderRadius: 'var(--kf-radius-lg)',
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {[
          { key: 'xp' as const, title: 'XP & Levels', desc: 'Earn XP from watching and writing notes' },
          { key: 'streak' as const, title: 'Weekly Streak', desc: 'Track active days with 1 rest day per week' },
          { key: 'celebrations' as const, title: 'Finale Celebrations', desc: 'Celebrate completing a season or book' },
        ].map((item) => (
          <label
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: 12,
              background: 'var(--kf-bg)',
              border: '1px solid var(--kf-line)',
              borderRadius: 'var(--kf-radius)',
              cursor: 'pointer',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: 14, color: 'var(--kf-text)' }}>{item.title}</strong>
              <span style={{ fontSize: 12, color: 'var(--kf-text-2)' }}>{item.desc}</span>
            </div>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={() => togglePref(item.key)}
              style={{ width: 18, height: 18, accentColor: 'var(--kf-brand)' }}
            />
          </label>
        ))}
      </section>

      <section
        aria-label="Find Art"
        style={{
          background: 'var(--kf-panel)',
          border: '1px solid var(--kf-line-strong)',
          borderRadius: 'var(--kf-radius-lg)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: '1 1 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImagePlus size={18} color="var(--kf-brand)" />
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--kf-font-display)',
                fontStretch: '82%',
                fontSize: 'var(--kf-text-lg)',
                fontWeight: 800,
                color: 'var(--kf-text)',
              }}
            >
              Find Art
            </h2>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--kf-radius)',
                background:
                  findArtSummary.missing > 0
                    ? 'color-mix(in srgb, var(--kf-brand) 16%, transparent)'
                    : 'color-mix(in srgb, var(--kf-completed) 16%, transparent)',
                color: findArtSummary.missing > 0 ? 'var(--kf-brand)' : 'var(--kf-completed)',
                fontSize: 'var(--kf-text-xs)',
                fontWeight: 700,
              }}
            >
              {findArtSummary.missing > 0
                ? `${findArtSummary.missing} missing`
                : `All ${findArtSummary.total} saved`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--kf-text-sm)', color: 'var(--kf-text-2)' }}>
            {findArtSummary.missing > 0
              ? `${findArtSummary.missing} of ${findArtSummary.total} entries (anime, books, and characters) don’t have cover art yet. Review matches or upload local art one step at a time.`
              : `All ${findArtSummary.total} entries already have cover art. You can still review matches or swap artwork anytime.`}
          </p>
        </div>

        <Link
          viewTransition
          to="/settings/find-art"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 44,
            padding: '0 18px',
            borderRadius: 'var(--kf-radius)',
            background: 'var(--kf-brand)',
            color: 'var(--kf-on-fill)',
            textDecoration: 'none',
            fontFamily: 'var(--kf-font-ui)',
            fontSize: 'var(--kf-text-sm)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{findArtSummary.missing > 0 ? 'Open Find Art' : 'Review Cover Art'}</span>
        </Link>
      </section>

      <MediaView onNotify={addToast} onRequestConfirm={requestConfirm} />
    </div>
  );
};

export const PageNotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <NotFound
      title="Page not found"
      message="That address doesn’t match anything in the app."
      backLabel="Go to Home"
      onBack={() => navigate('/')}
    />
  );
};
