import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDialog } from '../ui/Sheet/useDialog';
import { useAppNavigate } from '../app/useAppNavigate';
import { useJournalActions, useJournalData } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { Kbd } from '../ui';
import {
  findMovie,
  findSeason,
  nextBookState,
  nextMovieState,
  nextSeasonState,
} from '../lib/journal/progress';
import { buildPaletteItems, PaletteItem } from './paletteSearch';
import {
  BookOpen,
  Film,
  PenLine,
  Play,
  Plus,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import './CommandPalette.css';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

const iconForKind = (item: PaletteItem) => {
  switch (item.kind) {
    case 'recent':
      return <Play size={15} color="var(--kf-brand)" />;
    case 'action':
      return <Zap size={15} color="var(--kf-brand)" />;
    case 'anime':
      return <Film size={15} color="var(--kf-text-2)" />;
    case 'book':
      return <BookOpen size={15} color="var(--kf-text-2)" />;
    case 'character':
      return <Sparkles size={15} color="var(--kf-gold)" />;
    case 'note':
      return <PenLine size={15} color="var(--kf-brand)" />;
  }
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
}) => {
  const { seriesList, bookList, characterList } = useJournalData();
  const {
    openComposer,
    openNewFranchiseModal,
    openNewBookModal,
    openAddCharacterModal,
    openAddRewatch,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
    addToast,
  } = useJournalActions();
  const { reflections } = useReflections();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useAppNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, isOpen, onClose);

  const filteredItems = useMemo(() => {
    return buildPaletteItems(
      query,
      { seriesList, bookList, characterList, reflections },
      {
        navigate: (to) => {
          onClose();
          navigate(to);
        },
        openComposer: (target) => {
          onClose();
          openComposer(target);
        },
        openNewSeries: () => {
          onClose();
          openNewFranchiseModal();
        },
        openNewBook: () => {
          onClose();
          openNewBookModal();
        },
        openNewCharacter: () => {
          onClose();
          openAddCharacterModal();
        },
        openNewRewatch: () => {
          onClose();
          openAddRewatch();
        },
        openShortcuts: () => {
          onClose();
          onOpenShortcuts?.();
        },
        seasonDelta: (seasonId, delta) => {
          void (async () => {
            const season = findSeason(seriesList, seasonId);
            if (!season || !nextSeasonState(season, delta)) {
              addToast('Cannot log +1 episode for this season.', 'error');
              return;
            }
            onClose();
            try {
              const result = await Promise.resolve(handleSeasonProgressDelta(seasonId, delta) as unknown);
              if (result === false) {
                addToast('Failed to log episode.', 'error');
                return;
              }
              addToast('Episode logged (+1)');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to log episode';
              addToast(msg, 'error');
            }
          })();
        },
        movieDelta: (movieId, delta) => {
          void (async () => {
            const movie = findMovie(seriesList, movieId);
            if (!movie || !nextMovieState(movie, delta)) {
              addToast('Cannot update progress for this movie.', 'error');
              return;
            }
            onClose();
            try {
              const result = await Promise.resolve(handleMovieProgressDelta(movieId, delta) as unknown);
              if (result === false) {
                addToast('Failed to update movie progress.', 'error');
                return;
              }
              addToast(`+${delta} min logged`);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to update movie progress';
              addToast(msg, 'error');
            }
          })();
        },
        bookDelta: (bookId, delta) => {
          void (async () => {
            const book = bookList.find((b) => b.id === bookId);
            if (!book || !nextBookState(book, delta)) {
              addToast('Cannot update progress for this book.', 'error');
              return;
            }
            onClose();
            try {
              const result = await Promise.resolve(handleBookProgressDelta(bookId, delta) as unknown);
              if (result === false) {
                addToast('Failed to update book progress.', 'error');
                return;
              }
              addToast(`+${delta} pages logged`);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to update book progress';
              addToast(msg, 'error');
            }
          })();
        },
      }
    );
  }, [
    query,
    seriesList,
    bookList,
    characterList,
    reflections,
    navigate,
    onClose,
    openComposer,
    openNewFranchiseModal,
    openNewBookModal,
    openAddCharacterModal,
    openAddRewatch,
    onOpenShortcuts,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
    addToast,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].run();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="lamplight-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search titles, characters, notes and actions"
    >
      <div className="lamplight-palette">
        <div className="lamplight-palette-search-wrap">
          <Search size={18} color="var(--kf-text-2)" />
          <input
            ref={inputRef}
            type="text"
            className="lamplight-palette-input"
            placeholder="Search titles, characters, notes, or type “+1 Frieren”, “write about…”"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="lamplight-palette-results" role="listbox">
          {filteredItems.length ? (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={idx === selectedIndex}
                className={`lamplight-palette-item ${idx === selectedIndex ? 'is-selected' : ''}`}
                onClick={item.run}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="lamplight-palette-item-left">
                  {iconForKind(item)}
                  <div style={{ minWidth: 0 }}>
                    <div className="lamplight-palette-item-title">{item.title}</div>
                    <div className="lamplight-palette-item-meta">{item.meta}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {item.badge && <span className="lamplight-palette-badge">{item.badge}</span>}
                  <Kbd>↵</Kbd>
                </div>
              </button>
            ))
          ) : (
            <div className="lamplight-palette-empty">
              <p>No matches found for “{query}”.</p>
              <button
                type="button"
                className="lamplight-palette-add-btn"
                onClick={() => {
                  onClose();
                  openNewFranchiseModal();
                }}
              >
                <Plus size={14} />
                <span>Add a new title</span>
              </button>
            </div>
          )}
        </div>

        <footer className="lamplight-palette-footer">
          <span>Try “+1”, “write about”, or any word from your notes</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Kbd>↵</Kbd>
          </div>
        </footer>
      </div>
    </div>
  );
};
