import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { Kbd } from '../ui';
import {
  BookOpen,
  Film,
  PenLine,
  Quote,
  Search,
  Sparkles,
  RotateCcw,
  Plus,
} from 'lucide-react';
import './CommandPalette.css';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { seriesList, bookList, characterList, openComposer, openNewFranchiseModal, openNewBookModal } =
    useJournal();
  const { reflections } = useReflections();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation & global shortcuts (⌘K and /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate and filter items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const actions = [
      {
        id: 'action-write',
        type: 'action',
        title: 'Write Reflection…',
        meta: 'Add a thought, lesson, or takeaway (W)',
        icon: <PenLine size={15} color="var(--lamp)" />,
        run: () => {
          onClose();
          openComposer();
        },
      },
      {
        id: 'action-log-anime',
        type: 'action',
        title: 'Log New Anime Franchise…',
        meta: 'Add a new series to your catalog',
        icon: <Plus size={15} />,
        run: () => {
          onClose();
          openNewFranchiseModal();
        },
      },
      {
        id: 'action-log-book',
        type: 'action',
        title: 'Log New Book…',
        meta: 'Record a new book or light novel',
        icon: <Plus size={15} />,
        run: () => {
          onClose();
          openNewBookModal();
        },
      },
    ];

    if (!q) {
      return actions;
    }

    const matches: any[] = [];

    // Search Actions
    actions.forEach((a) => {
      if (a.title.toLowerCase().includes(q)) matches.push(a);
    });

    // Search Anime Series
    seriesList.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.romaji_title?.toLowerCase().includes(q)) {
        matches.push({
          id: `anime-${s.id}`,
          type: 'anime',
          title: s.title,
          meta: `${s.seasons?.length || 1} seasons · Anime`,
          icon: <Film size={15} />,
          run: () => {
            onClose();
            navigate(`/anime/${s.id}`);
          },
        });
      }
    });

    // Search Books
    bookList.forEach((b) => {
      if (b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)) {
        matches.push({
          id: `book-${b.id}`,
          type: 'book',
          title: b.title,
          meta: b.author ? `by ${b.author} · Book` : 'Book',
          icon: <BookOpen size={15} />,
          run: () => {
            onClose();
            navigate(`/books/${b.id}`);
          },
        });
      }
    });

    // Search Characters
    characterList.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.series_title?.toLowerCase().includes(q)) {
        matches.push({
          id: `char-${c.id}`,
          type: 'character',
          title: c.name,
          meta: c.series_title ? `${c.series_title} · Character` : 'Character',
          icon: <Sparkles size={15} />,
          run: () => {
            onClose();
            navigate('/characters');
          },
        });
      }
    });

    // Search Reflections full text
    reflections.forEach((r) => {
      if (r.note.toLowerCase().includes(q)) {
        matches.push({
          id: `refl-${r.id}`,
          type: 'reflection',
          title: `"${r.note.slice(0, 70)}…"`,
          meta: `${r.title} (${r.context})`,
          icon: <Quote size={15} color="var(--lamp)" />,
          run: () => {
            onClose();
            navigate('/reflections');
          },
        });
      }
    });

    return matches.slice(0, 12);
  }, [query, seriesList, bookList, characterList, reflections, openComposer, openNewFranchiseModal, openNewBookModal, navigate, onClose]);

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
      className="lamplight-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="lamplight-palette">
        <div className="lamplight-palette-search-wrap">
          <Search size={18} color="var(--text-3)" />
          <input
            ref={inputRef}
            type="text"
            className="lamplight-palette-input"
            placeholder="Search titles, characters, thoughts or run an action…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="lamplight-palette-results">
          {filteredItems.length ? (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`lamplight-palette-item ${idx === selectedIndex ? 'is-selected' : ''}`}
                onClick={item.run}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="lamplight-palette-item-left">
                  {item.icon}
                  <div>
                    <div className="lamplight-palette-item-title">{item.title}</div>
                    <div className="lamplight-palette-item-meta">{item.meta}</div>
                  </div>
                </div>
                <Kbd>↵</Kbd>
              </button>
            ))
          ) : (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
              No matches found for "{query}".
            </div>
          )}
        </div>

        <footer className="lamplight-palette-footer">
          <span>Navigate with ↑ ↓, press Enter to select</span>
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

