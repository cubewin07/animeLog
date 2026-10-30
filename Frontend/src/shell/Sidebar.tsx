import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useJournal } from '../state/JournalContext';
import { useReflections } from '../state/useReflections';
import { Kbd } from '../ui';
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Image as ImageIcon,
  LayoutDashboard,
  PenLine,
  Quote,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import './Sidebar.css';

export interface SidebarProps {
  onOpenExport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenExport }) => {
  const { seriesList, bookList, characterList, rewatchList, stats, openComposer, openPalette } =
    useJournal();
  const { totalCount: reflectionsCount } = useReflections();

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

  return (
    <aside className={`lamplight-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand */}
      <NavLink to="/" className="lamplight-sidebar-brand" title="AnimeLog Journal">
        <div className="lamplight-sidebar-brand-icon">
          <BookMarked size={18} />
        </div>
        {!collapsed && (
          <div className="lamplight-sidebar-brand-text">
            <span className="lamplight-sidebar-brand-title">AnimeLog</span>
            <span className="lamplight-sidebar-brand-badge">Journal</span>
          </div>
        )}
      </NavLink>

      {/* Main Actions */}
      <div className="lamplight-sidebar-actions">
        <button
          type="button"
          className="lamplight-sidebar-write-btn"
          onClick={() => openComposer()}
          title="Write reflection or note (W)"
          aria-label="Write reflection"
        >
          <PenLine size={16} />
          {!collapsed && <span>Write</span>}
        </button>

        {!collapsed && (
          <button
            type="button"
            className="lamplight-sidebar-search-btn"
            onClick={openPalette}
            title="Search journal (⌘K or /)"
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
      <nav className="lamplight-sidebar-nav">
        {/* Desk */}
        <div className="lamplight-sidebar-group">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Desk / Today"
          >
            <div className="lamplight-sidebar-link-left">
              <LayoutDashboard size={16} />
              {!collapsed && <span>Desk</span>}
            </div>
          </NavLink>
        </div>

        {/* Library */}
        <div className="lamplight-sidebar-group">
          {!collapsed && <span className="lamplight-sidebar-label">Library</span>}
          <NavLink
            to="/anime"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Anime Library"
          >
            <div className="lamplight-sidebar-link-left">
              <Film size={16} />
              {!collapsed && <span>Anime</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{seriesList.length}</span>}
          </NavLink>

          <NavLink
            to="/books"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Book Library"
          >
            <div className="lamplight-sidebar-link-left">
              <BookOpen size={16} />
              {!collapsed && <span>Books</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{bookList.length}</span>}
          </NavLink>
        </div>

        {/* Journal Reflections */}
        <div className="lamplight-sidebar-group">
          {!collapsed && <span className="lamplight-sidebar-label">Journal</span>}
          <NavLink
            to="/reflections"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="All Written Reflections"
          >
            <div className="lamplight-sidebar-link-left">
              <Quote size={16} />
              {!collapsed && <span>Reflections</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{reflectionsCount}</span>}
          </NavLink>

          <NavLink
            to="/characters"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="People & Character Reflections"
          >
            <div className="lamplight-sidebar-link-left">
              <Sparkles size={16} />
              {!collapsed && <span>People</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{characterList.length}</span>}
          </NavLink>

          <NavLink
            to="/rewatches"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Returns & Rewatches Timeline"
          >
            <div className="lamplight-sidebar-link-left">
              <RotateCcw size={16} />
              {!collapsed && <span>Returns</span>}
            </div>
            {!collapsed && <span className="lamplight-sidebar-count">{rewatchList.length}</span>}
          </NavLink>
        </div>

        {/* Utilities */}
        <div className="lamplight-sidebar-group" style={{ marginTop: 'auto' }}>
          {!collapsed && <span className="lamplight-sidebar-label">Tools</span>}
          <NavLink
            to="/media"
            className={({ isActive }) => `lamplight-sidebar-link ${isActive ? 'is-active' : ''}`}
            title="Media & Stills Library"
          >
            <div className="lamplight-sidebar-link-left">
              <ImageIcon size={16} />
              {!collapsed && <span>Media</span>}
            </div>
          </NavLink>

          {onOpenExport && (
            <button
              type="button"
              className="lamplight-sidebar-link"
              onClick={onOpenExport}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Export Journal (Markdown & JSON)"
            >
              <div className="lamplight-sidebar-link-left">
                <Download size={16} />
                {!collapsed && <span>Export</span>}
              </div>
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="lamplight-sidebar-footer">
        {!collapsed && (
          <p className="lamplight-sidebar-summary">
            <strong>{stats.totalLessons || reflectionsCount}</strong> lessons kept ·{' '}
            <strong>{stats.totalCompleted}</strong> finished
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

