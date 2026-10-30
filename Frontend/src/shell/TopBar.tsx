import React from 'react';
import { NavLink } from 'react-router-dom';
import { useJournal } from '../state/JournalContext';
import { BookMarked, Search } from 'lucide-react';
import './TopBar.css';

export const TopBar: React.FC = () => {
  const { openPalette } = useJournal();

  return (
    <header className="lamplight-top-bar" aria-label="Mobile Header">
      <NavLink to="/" className="lamplight-top-bar-brand" title="AnimeLog Desk">
        <div className="lamplight-top-bar-icon">
          <BookMarked size={16} />
        </div>
        <span className="lamplight-top-bar-title">AnimeLog</span>
      </NavLink>

      <button
        type="button"
        className="lamplight-top-bar-search-btn"
        onClick={openPalette}
        aria-label="Search journal"
      >
        <Search size={16} />
      </button>
    </header>
  );
};
