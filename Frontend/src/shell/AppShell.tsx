import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { CommandPalette } from './CommandPalette';
import { useJournal } from '../state/JournalContext';
import './AppShell.css';

export interface AppShellProps {
  children: React.ReactNode;
  onOpenExport?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, onOpenExport }) => {
  const { paletteOpen, setPaletteOpen, openComposer, openNewFranchiseModal } = useJournal();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput) {
        // ⌘K or Ctrl+K or / opens Command Palette
        if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
          e.preventDefault();
          setPaletteOpen(true);
        }
        // W opens Composer
        else if (e.key.toLowerCase() === 'w' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          openComposer();
        }
        // N opens Log Entry Modal
        else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          openNewFranchiseModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPaletteOpen, openComposer, openNewFranchiseModal]);

  return (
    <div className="lamplight-shell">
      <Sidebar onOpenExport={onOpenExport} />
      <TopBar />

      <main id="journal-main" className="lamplight-shell-main">
        <div className="lamplight-shell-content">{children}</div>
      </main>

      <BottomBar onOpenExport={onOpenExport} />

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};
