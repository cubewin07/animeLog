import React, { useState } from 'react';
import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import {
  AnimeMovie,
  AnimeSeason,
  AnimeSeries,
  Book,
  EpisodeNote,
  FavoriteCharacter,
  Rewatch,
} from './types';
import { JournalProvider, useJournal } from './state/JournalContext';
import { AppShell } from './shell/AppShell';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EntryModal } from './components/EntryModal';
import { EpisodeNoteModal } from './components/EpisodeNoteModal';
import { CharacterModal, RewatchModal } from './components/QuickModals';
import { ExportModal } from './components/ExportModal';
import { DashboardView } from './views/DashboardView';
import { AnimeView } from './views/AnimeView';
import { FranchiseDetailView } from './views/FranchiseDetailView';
import { BookView } from './views/BookView';
import { BookDetailView } from './views/BookDetailView';
import { CharactersView } from './views/CharactersView';
import { RewatchesView } from './views/RewatchesView';
import { ReflectionsView } from './views/ReflectionsView';
import { MediaView } from './views/MediaView';
import { Loader2 } from 'lucide-react';

// Wrapper for FranchiseDetailView to extract route params
const FranchiseDetailRouteWrapper: React.FC<{
  seriesList: AnimeSeries[];
  allRewatches: Rewatch[];
  onBack: () => void;
  onEditSeries: (series: AnimeSeries) => void;
  onDeleteSeries: (id: number) => void;
  onAddSeason: (series: AnimeSeries) => void;
  onAddMovie: (series: AnimeSeries) => void;
  onEditSeason: (season: AnimeSeason) => void;
  onDeleteSeason: (id: number) => void;
  onSeasonProgressDelta: (id: number, delta: number) => void;
  onEditMovie: (movie: AnimeMovie) => void;
  onDeleteMovie: (id: number) => void;
  onMovieProgressDelta: (id: number, delta: number) => void;
  onOpenEpisodeNotes: (season: AnimeSeason, note?: EpisodeNote) => void;
  onAddRewatchSeries?: (series: AnimeSeries) => void;
  onAddRewatchSeason: (season: AnimeSeason) => void;
  onAddRewatchMovie: (movie: AnimeMovie) => void;
  onAddRewatchEpisode?: (season: AnimeSeason, episodeNumber: number) => void;
  onEditRewatch?: (rewatch: Rewatch) => void;
  onDeleteRewatch?: (id: number) => void;
  onAddCharacter: (series: AnimeSeries) => void;
  onEditCharacter?: (character: FavoriteCharacter) => void;
  onDeleteCharacter?: (id: number) => void;
  onRefresh?: () => Promise<void>;
}> = (props) => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const idNum = Number(seriesId);
  const series = props.seriesList.find((s) => s.id === idNum);

  if (!series) {
    return (
      <div className="desk-card" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 8 }}>Franchise Not Found</h3>
        <p style={{ color: 'var(--text-desk-muted)', marginBottom: 16 }}>
          The requested franchise entry could not be found.
        </p>
        <button onClick={props.onBack} className="btn btn-secondary">
          Return to Anime Journal
        </button>
      </div>
    );
  }

  return <FranchiseDetailView series={series} {...props} />;
};

// Wrapper for BookDetailView to extract route params
const BookDetailRouteWrapper: React.FC<{
  bookList: Book[];
  onBack: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}> = (props) => {
  const { bookId } = useParams<{ bookId: string }>();
  const idNum = Number(bookId);
  const book = props.bookList.find((b) => b.id === idNum);

  if (!book) {
    return (
      <div className="desk-card" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-desk)', marginBottom: 8 }}>Book Not Found</h3>
        <p style={{ color: 'var(--text-desk-muted)', marginBottom: 16 }}>
          The requested book journal entry could not be found.
        </p>
        <button onClick={props.onBack} className="btn btn-secondary">
          Return to Book Journal
        </button>
      </div>
    );
  }

  return <BookDetailView book={book} {...props} />;
};

const JournalAppContent: React.FC = () => {
  const navigate = useNavigate();
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    loading,
    seriesList,
    bookList,
    rewatchList,
    characterList,
    genres,
    studios,
    stats,
    searchQuery,
    refreshAll,
    toasts,
    removeToast,
    addToast,
    requestConfirm,
    handleSaveSeries,
    handleDeleteSeries,
    handleSaveSeason,
    handleDeleteSeason,
    handleSeasonProgressDelta,
    handleSaveMovie,
    handleDeleteMovie,
    handleMovieProgressDelta,
    handleSaveBook,
    handleDeleteBook,
    handleBookProgressDelta,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleSaveRewatch,
    handleDeleteRewatch,
    handleSaveEpisodeNote,
    handleDeleteEpisodeNote,
    openNewFranchiseModal,
    openEditSeriesModal,
    openAddSeasonModal,
    openEditSeasonModal,
    openAddMovieModal,
    openEditMovieModal,
    openNewBookModal,
    openEditBookModal,
    openAddRewatchSeries,
    openAddRewatchSeason,
    openAddRewatchMovie,
    openAddRewatchEpisode,
    openEditRewatchModal,
    openAddCharacterModal,
    openEditCharacterModal,
    openEpisodeNotesModal,
    entryModalOpen,
    setEntryModalOpen,
    entryModalMode,
    entryModalEditTarget,
    entryModalTargetSeries,
    episodeNoteModalOpen,
    setEpisodeNoteModalOpen,
    targetSeasonForNotes,
    targetNoteForEpisodeModal,
    rewatchModalOpen,
    setRewatchModalOpen,
    rewatchTargetSeries,
    rewatchTargetSeason,
    rewatchTargetMovie,
    rewatchTargetEpisodeNumber,
    editRewatchTarget,
    characterModalOpen,
    setCharacterModalOpen,
    characterTargetSeries,
    editCharacterTarget,
  } = useJournal();

  return (
    <AppShell onOpenExport={() => setShowExportModal(true)}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {loading ? (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: 'var(--text-3)',
          }}
        >
          <Loader2 className="animate-spin" size={32} color="var(--lamp)" />
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16 }}>
            Opening the journal…
          </p>
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <DashboardView
                stats={stats}
                seriesList={seriesList}
                bookList={bookList}
                characterList={characterList}
                rewatchList={rewatchList}
                onNavigate={(tab, id) => {
                  if (tab === 'anime' && id) {
                    navigate(`/anime/${id}`);
                  } else if (tab === 'books' && id) {
                    navigate(`/books/${id}`);
                  } else if (tab === 'dashboard') {
                    navigate('/');
                  } else {
                    navigate(`/${tab}`);
                  }
                }}
                onSeasonProgressDelta={handleSeasonProgressDelta}
                onMovieProgressDelta={handleMovieProgressDelta}
                onProgressBook={handleBookProgressDelta}
                onEditSeason={(_, season) => openEditSeasonModal(season)}
                onEditMovie={(_, movie) => openEditMovieModal(movie)}
                onEditBook={openEditBookModal}
                onOpenLogModal={openNewFranchiseModal}
                onToast={addToast}
              />
            }
          />

          <Route
            path="/anime"
            element={
              <AnimeView
                seriesList={seriesList}
                searchQuery={searchQuery}
                onOpenDetail={(seriesId) => navigate(`/anime/${seriesId}`)}
                onEditSeries={openEditSeriesModal}
                onDeleteSeries={handleDeleteSeries}
                onAddSeason={openAddSeasonModal}
                onAddMovie={openAddMovieModal}
                onEditSeason={openEditSeasonModal}
                onDeleteSeason={handleDeleteSeason}
                onSeasonProgressDelta={handleSeasonProgressDelta}
                onEditMovie={openEditMovieModal}
                onDeleteMovie={handleDeleteMovie}
                onMovieProgressDelta={handleMovieProgressDelta}
                onOpenEpisodeNotes={openEpisodeNotesModal}
                onAddRewatchSeason={openAddRewatchSeason}
                onAddRewatchMovie={openAddRewatchMovie}
                onAddCharacter={openAddCharacterModal}
                onOpenNewFranchiseModal={openNewFranchiseModal}
              />
            }
          />

          <Route
            path="/anime/:seriesId"
            element={
              <FranchiseDetailRouteWrapper
                seriesList={seriesList}
                allRewatches={rewatchList}
                onBack={() => navigate('/anime')}
                onEditSeries={openEditSeriesModal}
                onDeleteSeries={handleDeleteSeries}
                onAddSeason={openAddSeasonModal}
                onAddMovie={openAddMovieModal}
                onEditSeason={openEditSeasonModal}
                onDeleteSeason={handleDeleteSeason}
                onSeasonProgressDelta={handleSeasonProgressDelta}
                onEditMovie={openEditMovieModal}
                onDeleteMovie={handleDeleteMovie}
                onMovieProgressDelta={handleMovieProgressDelta}
                onOpenEpisodeNotes={openEpisodeNotesModal}
                onAddRewatchSeries={openAddRewatchSeries}
                onAddRewatchSeason={openAddRewatchSeason}
                onAddRewatchMovie={openAddRewatchMovie}
                onAddRewatchEpisode={openAddRewatchEpisode}
                onEditRewatch={openEditRewatchModal}
                onDeleteRewatch={handleDeleteRewatch}
                onAddCharacter={openAddCharacterModal}
                onEditCharacter={openEditCharacterModal}
                onDeleteCharacter={handleDeleteCharacter}
                onRefresh={refreshAll}
              />
            }
          />

          <Route
            path="/books"
            element={
              <BookView
                bookList={bookList}
                searchQuery={searchQuery}
                onOpenDetail={(bookId) => navigate(`/books/${bookId}`)}
                onEdit={openEditBookModal}
                onDelete={handleDeleteBook}
                onProgressDelta={handleBookProgressDelta}
                onOpenNewModal={openNewBookModal}
              />
            }
          />

          <Route
            path="/books/:bookId"
            element={
              <BookDetailRouteWrapper
                bookList={bookList}
                onBack={() => navigate('/books')}
                onEdit={openEditBookModal}
                onDelete={handleDeleteBook}
                onProgressDelta={handleBookProgressDelta}
              />
            }
          />

          <Route path="/reflections" element={<ReflectionsView />} />

          <Route
            path="/characters"
            element={
              <CharactersView
                characters={characterList}
                searchQuery={searchQuery}
                onEdit={openEditCharacterModal}
                onDelete={handleDeleteCharacter}
                onOpenAddModal={() => openAddCharacterModal()}
                onRefresh={refreshAll}
              />
            }
          />

          <Route
            path="/rewatches"
            element={
              <RewatchesView
                rewatches={rewatchList}
                seriesList={seriesList}
                searchQuery={searchQuery}
                onEdit={openEditRewatchModal}
                onDelete={handleDeleteRewatch}
                onOpenRewatchModal={() => {
                  openAddRewatchSeries(seriesList[0]);
                }}
                onNavigateSeries={(seriesId) => navigate(`/anime/${seriesId}`)}
              />
            }
          />

          <Route
            path="/media"
            element={<MediaView onNotify={addToast} onRequestConfirm={requestConfirm} />}
          />
        </Routes>
      )}

      {/* Global Modals */}
      <EntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        mode={entryModalMode}
        editTarget={entryModalEditTarget}
        targetSeries={entryModalTargetSeries}
        seriesList={seriesList}
        genres={genres}
        studios={studios}
        onSaveSeries={handleSaveSeries}
        onSaveSeason={handleSaveSeason}
        onSaveMovie={handleSaveMovie}
        onSaveBook={handleSaveBook}
      />

      <EpisodeNoteModal
        isOpen={episodeNoteModalOpen}
        onClose={() => setEpisodeNoteModalOpen(false)}
        season={targetSeasonForNotes}
        initialNote={targetNoteForEpisodeModal}
        onSaveNote={handleSaveEpisodeNote}
        onDeleteNote={handleDeleteEpisodeNote}
      />

      <RewatchModal
        isOpen={rewatchModalOpen}
        onClose={() => setRewatchModalOpen(false)}
        targetSeries={rewatchTargetSeries}
        targetSeason={rewatchTargetSeason}
        targetMovie={rewatchTargetMovie}
        targetEpisodeNumber={rewatchTargetEpisodeNumber}
        editRewatch={editRewatchTarget}
        seriesList={seriesList}
        onSave={handleSaveRewatch}
      />

      <CharacterModal
        isOpen={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        seriesList={seriesList}
        preselectedSeries={characterTargetSeries}
        editCharacter={editCharacterTarget}
        onSave={handleSaveCharacter}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onToast={addToast}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <JournalProvider>
      <JournalAppContent />
    </JournalProvider>
  );
};
