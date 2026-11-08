import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useJournalActions } from '../state/JournalContext';
import {
  Compass,
  Home,
  NotebookPen,
  Plus,
  UserCheck,
} from 'lucide-react';
import './BottomBar.css';

export interface BottomBarProps {
  onOpenQuickLog?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onOpenQuickLog }) => {
  const { openComposer } = useJournalActions();
  const { pathname } = useLocation();

  const inLibrary =
    pathname.startsWith('/anime') ||
    pathname.startsWith('/books') ||
    pathname.startsWith('/characters');

  return (
    <nav className="lamplight-bottom-bar" aria-label="Mobile Navigation">
      <NavLink
        viewTransition
        to="/"
        end
        className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      <NavLink
        viewTransition
        to="/anime"
        className={() => `lamplight-bottom-tab ${inLibrary ? 'is-active' : ''}`}
      >
        <Compass size={18} />
        <span>Library</span>
      </NavLink>

      {/* Center Quick Log Action */}
      <button
        type="button"
        className="lamplight-bottom-write-btn"
        onClick={() => (onOpenQuickLog ? onOpenQuickLog() : openComposer())}
        aria-label="Quick log"
        title="Quick log"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <NavLink
        viewTransition
        to="/journal"
        className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
      >
        <NotebookPen size={18} />
        <span>Journal</span>
      </NavLink>

      <NavLink
        viewTransition
        to="/me"
        className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
      >
        <UserCheck size={18} />
        <span>Me</span>
      </NavLink>
    </nav>
  );
};
