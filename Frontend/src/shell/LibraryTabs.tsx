import React from 'react';
import { NavLink } from 'react-router-dom';
import { useJournalData } from '../state/JournalContext';
import { BookOpen, Film, Sparkles } from 'lucide-react';
import './LibraryTabs.css';

export const LibraryTabs: React.FC = () => {
  const { seriesList, bookList, characterList } = useJournalData();

  return (
    <nav className="kf-library-tabs" aria-label="Library sections">
      <NavLink
        viewTransition
        to="/anime"
        className={({ isActive }) => `kf-library-tab ${isActive ? 'is-active' : ''}`}
      >
        <Film size={15} aria-hidden="true" />
        <span>Anime</span>
        <span className="kf-library-tab-count">{seriesList.length}</span>
      </NavLink>

      <NavLink
        viewTransition
        to="/books"
        className={({ isActive }) => `kf-library-tab ${isActive ? 'is-active' : ''}`}
      >
        <BookOpen size={15} aria-hidden="true" />
        <span>Books</span>
        <span className="kf-library-tab-count">{bookList.length}</span>
      </NavLink>

      <NavLink
        viewTransition
        to="/characters"
        className={({ isActive }) => `kf-library-tab ${isActive ? 'is-active' : ''}`}
      >
        <Sparkles size={15} aria-hidden="true" />
        <span>Characters</span>
        <span className="kf-library-tab-count">{characterList.length}</span>
      </NavLink>
    </nav>
  );
};
