import React, { lazy } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { useAppNavigate } from './useAppNavigate';

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
    <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 8 }}>{title}</h3>
    <p style={{ color: 'var(--text-desk-muted)', marginBottom: 16 }}>{message}</p>
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
        else if (tab === 'dashboard') navigate('/');
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
    <BookView
      bookList={bookList}
      searchQuery={searchQuery}
      onOpenDetail={(id) => navigate(`/books/${id}`)}
      onEdit={a.openEditBookModal}
      onDelete={a.handleDeleteBook}
      onProgressDelta={a.handleBookProgressDelta}
      onOpenNewModal={a.openNewBookModal}
    />
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

export const ReflectionsPage: React.FC = () => <ReflectionsView />;

export const CharactersPage: React.FC = () => {
  const { characterList } = useJournalData();
  const { searchQuery } = useJournalUI();
  const a = useJournalActions();
  return (
    <CharactersView
      characters={characterList}
      searchQuery={searchQuery}
      onEdit={a.openEditCharacterModal}
      onDelete={a.handleDeleteCharacter}
      onOpenAddModal={() => a.openAddCharacterModal()}
      onRefresh={a.refreshAll}
    />
  );
};

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

export const MediaPage: React.FC = () => {
  const { addToast, requestConfirm } = useJournalActions();
  return <MediaView onNotify={addToast} onRequestConfirm={requestConfirm} />;
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
