import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { CommandPalette } from './CommandPalette';
import { Composer } from '../composer/Composer';
import { QuickLogSheet } from '../features/quick-log/QuickLogSheet';
import { Kbd, Sheet } from '../ui';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { Keyboard } from 'lucide-react';
import './AppShell.css';

export interface AppShellProps {
  children: React.ReactNode;
}

const SHORTCUTS = [
  { keys: ['⌘K', '/'], label: 'Search titles, characters, notes and actions' },
  { keys: ['W'], label: 'Write a note' },
  { keys: ['N'], label: 'Add a new title' },
  { keys: ['+'], label: 'Log next episode or reading progress' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
  { keys: ['⌘↵'], label: 'Save note in Composer' },
  { keys: ['Esc'], label: 'Close open dialog or panel' },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { seriesList, bookList } = useJournalData();
  const { paletteOpen, composerOpen } = useJournalUI();
  const {
    setPaletteOpen,
    setComposerOpen,
    openComposer,
    openNewFranchiseModal,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
  } = useJournalActions();

  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const activeItems = useMemo(() => {
    const items: {
      key: string;
      title: string;
      context: string;
      href: string;
      stepLabel: string;
      onStep: () => void;
      onNote: () => void;
    }[] = [];

    seriesList.forEach((s) => {
      s.seasons?.forEach((sea) => {
        if (sea.status === 'WATCHING') {
          const nextEp = (sea.progress || 0) + 1;
          items.push({
            key: `season-${sea.id}`,
            title: s.title,
            context: `Season ${sea.season_number} · Ep ${sea.progress || 0}${sea.total_episodes ? ` of ${sea.total_episodes}` : ''}`,
            href: `/anime/${s.id}?release=season-${sea.id}`,
            stepLabel: `+1 Ep ${nextEp}`,
            onStep: () => {
              handleSeasonProgressDelta(sea.id, 1);
            },
            onNote: () => {
              setQuickLogOpen(false);
              openComposer({
                targetKind: 'season',
                id: sea.id,
                title: s.title,
                context: `Season ${sea.season_number}`,
                defaultKind: 'episode',
                episodeNumber: nextEp,
              });
            },
          });
        }
      });

      s.movies?.forEach((m) => {
        if (m.status === 'WATCHING') {
          items.push({
            key: `movie-${m.id}`,
            title: s.title,
            context: `Movie · ${m.title}`,
            href: `/anime/${s.id}?release=movie-${m.id}`,
            stepLabel: '+10 min',
            onStep: () => {
              handleMovieProgressDelta(m.id, 10);
            },
            onNote: () => {
              setQuickLogOpen(false);
              openComposer({
                targetKind: 'movie',
                id: m.id,
                title: s.title,
                context: m.title,
                defaultKind: 'lesson',
              });
            },
          });
        }
      });
    });

    bookList.forEach((b) => {
      if (b.status === 'READING') {
        items.push({
          key: `book-${b.id}`,
          title: b.title,
          context: `Book · ${b.progress || 0}${b.total_pages ? ` of ${b.total_pages}` : ''} pages`,
          href: `/books/${b.id}`,
          stepLabel: '+10 pages',
          onStep: () => {
            handleBookProgressDelta(b.id, 10);
          },
          onNote: () => {
            setQuickLogOpen(false);
            openComposer({
              targetKind: 'book',
              id: b.id,
              title: b.title,
              context: b.author || undefined,
              defaultKind: 'lesson',
            });
          },
        });
      }
    });

    return items;
  }, [
    seriesList,
    bookList,
    handleSeasonProgressDelta,
    handleMovieProgressDelta,
    handleBookProgressDelta,
    openComposer,
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        !target ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // ⌘K or Ctrl+K or / opens Command Palette
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
      // ? opens Keyboard Shortcuts list
      else if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
      // + logs next episode on primary watching title or opens Quick Log
      else if (e.key === '+' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (activeItems.length > 0) {
          activeItems[0].onStep();
        } else {
          setQuickLogOpen(true);
        }
      }
      // W opens Composer
      else if (e.key.toLowerCase() === 'w' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openComposer();
      }
      // N opens Add Title Modal
      else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openNewFranchiseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPaletteOpen, openComposer, openNewFranchiseModal, activeItems]);

  return (
    <div className="lamplight-shell">
      <a href="#journal-main" className="skip-link">
        Skip to journal content
      </a>
      <Sidebar
        onOpenQuickLog={() => setQuickLogOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <TopBar />

      <main id="journal-main" className="lamplight-shell-main">
        <div className="lamplight-shell-content">{children}</div>
      </main>

      <BottomBar onOpenQuickLog={() => setQuickLogOpen(true)} />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <Composer isOpen={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* Quick Log Sheet (+ button) */}
      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        activeItems={activeItems}
      />

      {/* Keyboard Shortcuts Sheet (? key) */}
      <Sheet
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={18} color="var(--kf-brand)" />
            <span>Keyboard Shortcuts</span>
          </div>
        }
      >
        <div className="kf-shortcuts-list" role="list">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="kf-shortcut-row" role="listitem">
              <span>{s.label}</span>
              <div className="kf-shortcut-keys">
                {s.keys.map((k, idx) => (
                  <React.Fragment key={k}>
                    {idx > 0 && <small>or</small>}
                    <Kbd>{k}</Kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
