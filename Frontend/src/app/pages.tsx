import React, { lazy, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { LibraryTabs } from '../shell/LibraryTabs';
import { useAppNavigate } from './useAppNavigate';
import type { AppOutletContext } from './AppLayout';
import { Download, ImagePlus, Upload } from 'lucide-react';
import { buildFindArtItems, summarizeFindArt } from '../features/find-art/findArtQueue';

// Each page loads on first visit, and `preloadPages` fetches the rest while the browser is idle
const loaders = {
  dashboard: () => import('../features/home/HomePage'),
  anime: () => import('../features/library/AnimeLibraryPage'),
  franchise: () => import('../features/title/TitlePage'),
  books: () => import('../features/books/BooksLibraryPage'),
  book: () => import('../features/books/BookDetailPage'),
  reflections: () => import('../features/journal/JournalPage'),
  characters: () => import('../features/characters/CharactersPage'),
  characterDetail: () => import('../features/characters/CharacterDetailPage'),
  me: () => import('../features/me/MePage'),
  recap: () => import('../features/me/RecapPage'),
  rewatches: () => import('../views/RewatchesView'),
  media: () => import('../views/MediaView'),
  findArt: () => import('../features/find-art/FindArtPage'),
};

const KeyframeHomeView = lazy(() => loaders.dashboard().then((m) => ({ default: m.HomePage })));
const AnimeLibraryView = lazy(() => loaders.anime().then((m) => ({ default: m.AnimeLibraryPage })));
const FranchiseDetailView = lazy(() => loaders.franchise().then((m) => ({ default: m.TitlePage })));
const BookView = lazy(() => loaders.books().then((m) => ({ default: m.BooksLibraryPage })));
const BookDetailView = lazy(() => loaders.book().then((m) => ({ default: m.BookDetailPage })));
const ReflectionsView = lazy(() => loaders.reflections().then((m) => ({ default: m.JournalPage })));
const CharactersView = lazy(() => loaders.characters().then((m) => ({ default: m.CharactersPage })));
const CharacterDetailView = lazy(() => loaders.characterDetail().then((m) => ({ default: m.CharacterDetailPage })));
const KeyframeMeView = lazy(() => loaders.me().then((m) => ({ default: m.MePage })));
const KeyframeRecapView = lazy(() => loaders.recap().then((m) => ({ default: m.RecapPage })));
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

export const HomePage: React.FC = () => <KeyframeHomeView />;

export const AnimePage: React.FC = () => (
  <>
    <LibraryTabs />
    <AnimeLibraryView />
  </>
);

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

export const BooksPage: React.FC = () => <BookView />;

export const BookPage: React.FC = () => <BookDetailView />;

export const CharactersPage: React.FC = () => <CharactersView />;

export const CharacterPage: React.FC = () => <CharacterDetailView />;

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

export const MePage: React.FC = () => <KeyframeMeView />;

export const RecapPage: React.FC = () => <KeyframeRecapView />;

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
