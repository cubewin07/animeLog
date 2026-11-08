import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useJournalActions, useJournalData } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { Kbd } from '../ui';
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Film,
  Home,
  Keyboard,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import './Sidebar.css';

export interface SidebarProps {
  onOpenQuickLog?: () => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickLog, onOpenShortcuts }) => {
  const { seriesList, bookList, characterList, stats } = useJournalData();
  const { openComposer, openPalette } = useJournalActions();
  const { totalCount: notesCount } = useReflections();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('lamplight_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lamplight_sidebar_collapsed', String(next));
      return next;
    });
  };

  const inLibrary =
    pathname.startsWith('/anime') ||
    pathname.startsWith('/books') ||
    pathname.startsWith('/characters');

  return (
    <aside className={`lamplight-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand */}
      <NavLink viewTransition to="/" className="lamplight-sidebar-brand" title="AnimeLog">
        <div className="lamplight-sidebar-brand-icon">
          <BookMarked size={18} />
        </div>
        {!collapsed && (
          <div className="lamplight-sidebar-brand-text">
            <span className="lamplight-sidebar-brand-title">AnimeLog</span>
            <span className="lamplight-sidebar-brand-badge">Keyframe</span>
          </div>
        )}
      </NavLink>

      {/* Main Actions */}
      <div className="lamplight-sidebar-actions">
        <button
          type="button"
          className="lamplight-sidebar-write-btn"
          onClick={() => (onOpenQuickLog ? onOpenQuickLog() : openComposer())}
          title="Quick log episode or write a note (+)"
          aria-label="Quick log"
        >
          <Plus size={17} strokeWidth={2.5} />
          {!collapsed && <span>Quick Log</span>}
        </button>

        {!collapsed && (
          <button
            type="button"
            className="lamplight-sidebar-search-btn"
            onClick={openPalette}
            title="Search titles, notes and actions (⌘K or /)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={14} />
              <span>Search…</span>
            </div>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="lamplight-sidebar-nav" aria-label="Primary">
        <div className="lamplight-sidebar-group">
          <NavLink
            viewTransition
            to="/"
            end
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Home"
          >
            <div className="lamplight-sidebar-link-left">
              <Home size={16} />
              {!collapsed && <span>Home</span>}
            </div>
          </NavLink>

          <NavLink
            viewTransition
            to="/anime"
            className={() => `lamplight-sidebar-link ${inLibrary ? 'is-active' : ''}`}
            title="Library (Anime, Books, Characters)"
          >
            <div className="lamplight-sidebar-link-left">
              <Compass size={16} />
              {!collapsed && <span>Library</span>}
            </div>
            {!collapsed && (
              <span className="lamplight-sidebar-count">
                {seriesList.length + bookList.length + characterList.length}
              </span>
            )}
          </NavLink>

          {!collapsed && (
            <div className="lamplight-sidebar-subnav" role="group" aria-label="Library sections">
              <NavLink
                viewTransition
                to="/anime"
                className={({ isActive }) => `lamplight-sidebar-sublink ${isActive ? 'is-active' : ''}`}
              >
                <span className="lamplight-sidebar-link-left">
                  <Film size={14} />
                  <span>Anime</span>
                </span>
                <span className="lamplight-sidebar-count">{seriesList.length}</span>
              </NavLink>

              <NavLink
                viewTransition
                to="/books"
                className={({ isActive }) => `lamplight-sidebar-sublink ${isActive ? 'is-active' : ''}`}
              >
                <span className="lamplight-sidebar-link-left">
                  <BookOpen size={14} />
                  <span>Books</span>
                </span>
                <span className="lamplight-sidebar-count">{bookList.length}</span>
              </NavLink>

              <NavLink
                viewTransition
                to="/characters"
                className={({ isActive }) => `lamplight-sidebar-sublink ${isActive ? 'is-active' : ''}`}
              >
                <span className="lamplight-sidebar-link-left">
                  <Sparkles size={14} />
                  <span>Characters</span>
                </span>
                <span className="lamplight-sidebar-count">{characterList.length}</span>
              </NavLink>
            </div>
          )}

          <NavLink
            viewTransition
            to="/journal"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Journal (Notes & Rewatches)"
          >
            <div className="lamplight-sidebar-link-left">
              <NotebookPen size={16} />
              {!collapsed && <span>Journal</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{notesCount}</span>}
          </NavLink>

          <NavLink
            viewTransition
            to="/me"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Me (Level, Achievements, Stats)"
          >
            <div className="lamplight-sidebar-link-left">
              <UserCheck size={16} />
              {!collapsed && <span>Me</span>}
            </div>
          </NavLink>
        </div>

        {/* Settings & Shortcuts */}
        <div className="lamplight-sidebar-group" style={{ marginTop: 'auto' }}>
          <NavLink
            viewTransition
            to="/settings"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Settings (Media, Export, Import)"
          >
            <div className="lamplight-sidebar-link-left">
              <Settings size={16} />
              {!collapsed && <span>Settings</span>}
            </div>
          </NavLink>

          {onOpenShortcuts && (
            <button
              type="button"
              className="lamplight-sidebar-link"
              onClick={onOpenShortcuts}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Keyboard shortcuts (?)"
            >
              <div className="lamplight-sidebar-link-left">
                <Keyboard size={16} />
                {!collapsed && <span>Shortcuts</span>}
              </div>
              {!collapsed && <Kbd>?</Kbd>}
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="lamplight-sidebar-footer">
        {!collapsed && (
          <p className="lamplight-sidebar-summary">
            <strong>{stats.totalLessons || notesCount}</strong> notes ·{' '}
            <strong>{stats.totalCompleted}</strong> completed
          </p>
        )}
        <button
          type="button"
          className="lamplight-sidebar-collapse-btn"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </footer>
    </aside>
  );
};
