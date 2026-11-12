import React, { useId, useRef, useState } from 'react';
import { BookOpen, Clapperboard, Film, Tv, X } from 'lucide-react';
import { AnimeMovie, AnimeSeason, AnimeSeries, Book, Genre, Studio } from '../../types';
import { useDialog } from '../../ui/Sheet/useDialog';
import {
  BookCreateForm,
  BookEditForm,
  MovieForm,
  SeasonForm,
  SeriesCreateForm,
  SeriesEditForm,
} from './AddTitleForms';
import './AddTitle.css';

export type EntryModalMode =
  | 'new-franchise'
  | 'add-season'
  | 'add-movie'
  | 'book'
  | 'edit-series'
  | 'edit-season'
  | 'edit-movie'
  | 'edit-book';

export interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: EntryModalMode;
  editTarget?: {
    type: 'series' | 'season' | 'movie' | 'book';
    data: any;
  } | null;
  targetSeries?: AnimeSeries | null;
  seriesList: AnimeSeries[];
  genres: Genre[];
  studios: Studio[];
  onSaveSeries: (
    data: {
      title: string;
      japanese_title?: string | null;
      romaji_title?: string | null;
      cover_image?: number | null;
      genres: number[];
      initial_season?: any;
    },
    id?: number
  ) => Promise<void>;
  onSaveSeason: (data: any, id?: number) => Promise<void>;
  onSaveMovie: (data: any, id?: number) => Promise<void>;
  onSaveBook: (data: any, id?: number) => Promise<void>;
}

const AddTitleInner: React.FC<Omit<EntryModalProps, 'isOpen'> & { titleId: string }> = ({
  onClose,
  mode = 'new-franchise',
  editTarget,
  targetSeries,
  seriesList,
  genres,
  studios,
  onSaveSeries,
  onSaveSeason,
  onSaveMovie,
  onSaveBook,
  titleId,
}) => {
  const [activeTab, setActiveTab] = useState<EntryModalMode>(mode);
  const isEditing = Boolean(editTarget);

  const headerTitle = (() => {
    if (isEditing && editTarget) {
      if (editTarget.type === 'series') return 'Edit Series';
      if (editTarget.type === 'season') return `Edit Season: ${editTarget.data.title}`;
      if (editTarget.type === 'movie') return `Edit Movie: ${editTarget.data.title}`;
      if (editTarget.type === 'book') return `Edit Book: ${editTarget.data.title}`;
    }
    if (activeTab === 'book') return 'Add Book';
    if (activeTab === 'add-season') return 'Add Season';
    if (activeTab === 'add-movie') return 'Add Movie';
    return 'Add Anime';
  })();

  const headerSubtitle = (() => {
    if (isEditing) return 'Update title details or your note';
    if (activeTab === 'book') return 'Search OpenLibrary or add a book manually';
    if (activeTab === 'add-season') {
      return targetSeries ? `Adding season to ${targetSeries.title}` : 'Add a season to an existing series';
    }
    if (activeTab === 'add-movie') {
      return targetSeries ? `Adding movie to ${targetSeries.title}` : 'Add a movie to an existing series';
    }
    return 'Search MyAnimeList or add a series manually';
  })();

  const HeaderIcon =
    activeTab === 'book' || activeTab === 'edit-book'
      ? BookOpen
      : activeTab === 'add-movie' || activeTab === 'edit-movie'
      ? Clapperboard
      : activeTab === 'add-season' || activeTab === 'edit-season'
      ? Tv
      : Film;

  return (
    <>
      <header className="kf-dialog-header">
        <div className="kf-dialog-header-main">
          <div className="kf-dialog-badge" aria-hidden="true">
            <HeaderIcon size={18} />
          </div>
          <div className="kf-dialog-title-wrap">
            <h2 id={titleId} className="kf-dialog-title">
              {headerTitle}
            </h2>
            <p className="kf-dialog-subtitle">{headerSubtitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="kf-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </header>

      {!isEditing && (
        <div className="kf-mode-tabs" role="tablist" aria-label="Entry type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'new-franchise'}
            className={`kf-mode-tab ${activeTab === 'new-franchise' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('new-franchise')}
          >
            <Film size={15} aria-hidden="true" />
            <span>Add Anime</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'book'}
            className={`kf-mode-tab ${activeTab === 'book' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <BookOpen size={15} aria-hidden="true" />
            <span>Add Book</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'add-season'}
            disabled={seriesList.length === 0}
            className={`kf-mode-tab ${activeTab === 'add-season' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('add-season')}
          >
            <Tv size={15} aria-hidden="true" />
            <span>+ Season</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'add-movie'}
            disabled={seriesList.length === 0}
            className={`kf-mode-tab ${activeTab === 'add-movie' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('add-movie')}
          >
            <Clapperboard size={15} aria-hidden="true" />
            <span>+ Movie</span>
          </button>
        </div>
      )}

      {isEditing && editTarget?.type === 'series' && (
        <SeriesEditForm
          series={editTarget.data as AnimeSeries}
          genres={genres}
          onSaveSeries={onSaveSeries}
          onClose={onClose}
        />
      )}

      {isEditing && editTarget?.type === 'season' && (
        <SeasonForm
          editSeason={editTarget.data as AnimeSeason}
          targetSeries={targetSeries}
          seriesList={seriesList}
          studios={studios}
          onSaveSeason={onSaveSeason}
          onClose={onClose}
        />
      )}

      {isEditing && editTarget?.type === 'movie' && (
        <MovieForm
          editMovie={editTarget.data as AnimeMovie}
          targetSeries={targetSeries}
          seriesList={seriesList}
          studios={studios}
          onSaveMovie={onSaveMovie}
          onClose={onClose}
        />
      )}

      {isEditing && editTarget?.type === 'book' && (
        <BookEditForm
          book={editTarget.data as Book}
          genres={genres}
          onSaveBook={onSaveBook}
          onClose={onClose}
        />
      )}

      {!isEditing && activeTab === 'new-franchise' && (
        <SeriesCreateForm
          genres={genres}
          studios={studios}
          onSaveSeries={onSaveSeries}
          onClose={onClose}
        />
      )}

      {!isEditing && activeTab === 'book' && (
        <BookCreateForm genres={genres} onSaveBook={onSaveBook} onClose={onClose} />
      )}

      {!isEditing && activeTab === 'add-season' && (
        <SeasonForm
          targetSeries={targetSeries}
          seriesList={seriesList}
          studios={studios}
          onSaveSeason={onSaveSeason}
          onClose={onClose}
        />
      )}

      {!isEditing && activeTab === 'add-movie' && (
        <MovieForm
          targetSeries={targetSeries}
          seriesList={seriesList}
          studios={studios}
          onSaveMovie={onSaveMovie}
          onClose={onClose}
        />
      )}
    </>
  );
};

export const AddTitleModal: React.FC<EntryModalProps> = ({ isOpen, onClose, ...rest }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  const instanceKey = `${rest.mode ?? 'new-franchise'}-${rest.editTarget?.type ?? 'new'}-${
    rest.editTarget?.data?.id ?? rest.targetSeries?.id ?? 'none'
  }`;

  return (
    <div
      className="kf-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="kf-dialog-panel"
      >
        <AddTitleInner key={instanceKey} titleId={titleId} onClose={onClose} {...rest} />
      </div>
    </div>
  );
};
