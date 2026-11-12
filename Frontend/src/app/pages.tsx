import React, { lazy } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJournalActions, useJournalData } from '../state/JournalContext';
import { LibraryTabs } from '../shell/LibraryTabs';
import { useAppNavigate } from './useAppNavigate';

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
  settings: () => import('../features/settings/SettingsPage'),
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
const KeyframeSettingsView = lazy(() => loaders.settings().then((m) => ({ default: m.SettingsPage })));
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

export const MePage: React.FC = () => <KeyframeMeView />;

export const RecapPage: React.FC = () => <KeyframeRecapView />;

export const SettingsPage: React.FC = () => <KeyframeSettingsView />;

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
