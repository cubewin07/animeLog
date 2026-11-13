import React, { lazy, Suspense, useState } from 'react';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AddTitleModal = lazy(() =>
  import('../features/add-title/AddTitleModal').then((m) => ({ default: m.AddTitleModal }))
);
const EpisodeNoteModal = lazy(() =>
  import('../components/EpisodeNoteModal').then((m) => ({ default: m.EpisodeNoteModal }))
);
const RewatchModal = lazy(() => import('../components/QuickModals').then((m) => ({ default: m.RewatchModal })));
const CharacterModal = lazy(() => import('../components/QuickModals').then((m) => ({ default: m.CharacterModal })));
const ExportModal = lazy(() => import('../components/ExportModal').then((m) => ({ default: m.ExportModal })));

/** Stays true once a modal has been opened, so its code only downloads when first needed. */
function useOpenedOnce(isOpen: boolean): boolean {
  const [opened, setOpened] = useState(isOpen);
  if (isOpen && !opened) setOpened(true);
  return opened;
}

export const GlobalModals: React.FC<{ exportOpen: boolean; onCloseExport: () => void }> = ({
  exportOpen,
  onCloseExport,
}) => {
  const { seriesList, genres, studios } = useJournalData();
  const ui = useJournalUI();
  const a = useJournalActions();

  const entryOpened = useOpenedOnce(ui.entryModalOpen);
  const noteOpened = useOpenedOnce(ui.episodeNoteModalOpen);
  const rewatchOpened = useOpenedOnce(ui.rewatchModalOpen);
  const characterOpened = useOpenedOnce(ui.characterModalOpen);
  const exportOpened = useOpenedOnce(exportOpen);

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        {entryOpened && (
          <AddTitleModal
            isOpen={ui.entryModalOpen}
            onClose={() => a.setEntryModalOpen(false)}
            mode={ui.entryModalMode}
            editTarget={ui.entryModalEditTarget}
            targetSeries={ui.entryModalTargetSeries}
            seriesList={seriesList}
            genres={genres}
            studios={studios}
            onSaveSeries={a.handleSaveSeries}
            onSaveSeason={a.handleSaveSeason}
            onSaveMovie={a.handleSaveMovie}
            onSaveBook={a.handleSaveBook}
          />
        )}
        {noteOpened && (
          <EpisodeNoteModal
            isOpen={ui.episodeNoteModalOpen}
            onClose={() => a.setEpisodeNoteModalOpen(false)}
            season={ui.targetSeasonForNotes}
            initialNote={ui.targetNoteForEpisodeModal}
            onSaveNote={a.handleSaveEpisodeNote}
            onDeleteNote={a.handleDeleteEpisodeNote}
          />
        )}
        {rewatchOpened && (
          <RewatchModal
            isOpen={ui.rewatchModalOpen}
            onClose={() => a.setRewatchModalOpen(false)}
            targetSeries={ui.rewatchTargetSeries}
            targetSeason={ui.rewatchTargetSeason}
            targetMovie={ui.rewatchTargetMovie}
            targetEpisodeNumber={ui.rewatchTargetEpisodeNumber}
            editRewatch={ui.editRewatchTarget}
            seriesList={seriesList}
            onSave={a.handleSaveRewatch}
          />
        )}
        {characterOpened && (
          <CharacterModal
            isOpen={ui.characterModalOpen}
            onClose={() => a.setCharacterModalOpen(false)}
            seriesList={seriesList}
            preselectedSeries={ui.characterTargetSeries}
            editCharacter={ui.editCharacterTarget}
            onSave={a.handleSaveCharacter}
          />
        )}
        {exportOpened && (
          <ExportModal
            isOpen={exportOpen}
            onClose={onCloseExport}
            onToast={a.addToast}
            onImported={a.refreshAll}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};
