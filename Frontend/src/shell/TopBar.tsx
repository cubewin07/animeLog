import React from 'react';
import { NavLink } from 'react-router-dom';
import { useJournalActions } from '../state/JournalContext';
import { BookMarked, Search, Settings } from 'lucide-react';
import './TopBar.css';

export const TopBar: React.FC = () => {
  const { openPalette } = useJournalActions();

  return (
    <header className="lamplight-top-bar" aria-label="Mobile Header">
      <NavLink viewTransition to="/" className="lamplight-top-bar-brand" title="AnimeLog Home">
        <div className="lamplight-top-bar-icon">
          <BookMarked size={16} />
        </div>
        <span className="lamplight-top-bar-title">AnimeLog</span>
      </NavLink>

      <div className="lamplight-top-bar-actions">
        <button
          type="button"
          className="lamplight-top-bar-btn"
          onClick={openPalette}
          aria-label="Search journal"
          title="Search (⌘K)"
        >
          <Search size={17} />
        </button>

        <NavLink
          viewTransition
          to="/settings"
          className={({ isActive }) => `lamplight-top-bar-btn ${isActive ? 'is-active' : ''}`}
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={17} />
        </NavLink>
      </div>
    </header>
  );
};
