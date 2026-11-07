import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useJournalActions } from '../state/JournalContext';
import { Sheet } from '../ui';
import {
  BookOpen,
  Download,
  Film,
  Image as ImageIcon,
  LayoutDashboard,
  MoreHorizontal,
  PenLine,
  Quote,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import './BottomBar.css';

export interface BottomBarProps {
  onOpenExport?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onOpenExport }) => {
  const { openComposer } = useJournalActions();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="lamplight-bottom-bar" aria-label="Mobile Navigation">
        <NavLink viewTransition
          to="/"
          end
          className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Desk</span>
        </NavLink>

        <NavLink viewTransition
          to="/anime"
          className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
        >
          <Film size={18} />
          <span>Anime</span>
        </NavLink>

        {/* Center Floating Write Action */}
        <button
          type="button"
          className="lamplight-bottom-write-btn"
          onClick={() => openComposer()}
          aria-label="Write reflection"
          title="Write reflection"
        >
          <PenLine size={20} />
        </button>

        <NavLink viewTransition
          to="/books"
          className={({ isActive }) => `lamplight-bottom-tab ${isActive ? 'is-active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Books</span>
        </NavLink>

        <button
          type="button"
          className="lamplight-bottom-tab"
          onClick={() => setMoreSheetOpen(true)}
          aria-label="Open more sections"
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      <Sheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        title="Journal Sections & Tools"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
          <button
            type="button"
            className="lamplight-sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => {
              navigate('/reflections', { viewTransition: true });
              setMoreSheetOpen(false);
            }}
          >
            <div className="lamplight-sidebar-link-left">
              <Quote size={18} />
              <span>Reflections</span>
            </div>
          </button>

          <button
            type="button"
            className="lamplight-sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => {
              navigate('/characters', { viewTransition: true });
              setMoreSheetOpen(false);
            }}
          >
            <div className="lamplight-sidebar-link-left">
              <Sparkles size={18} />
              <span>People & Characters</span>
            </div>
          </button>

          <button
            type="button"
            className="lamplight-sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => {
              navigate('/rewatches', { viewTransition: true });
              setMoreSheetOpen(false);
            }}
          >
            <div className="lamplight-sidebar-link-left">
              <RotateCcw size={18} />
              <span>Returns Timeline</span>
            </div>
          </button>

          <div style={{ height: 1, backgroundColor: 'var(--line)', margin: '8px 0' }} />

          <button
            type="button"
            className="lamplight-sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => {
              navigate('/media', { viewTransition: true });
              setMoreSheetOpen(false);
            }}
          >
            <div className="lamplight-sidebar-link-left">
              <ImageIcon size={18} />
              <span>Media Library</span>
            </div>
          </button>

          {onOpenExport && (
            <button
              type="button"
              className="lamplight-sidebar-link"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => {
                setMoreSheetOpen(false);
                onOpenExport();
              }}
            >
              <div className="lamplight-sidebar-link-left">
                <Download size={18} />
                <span>Export Journal</span>
              </div>
            </button>
          )}
        </div>
      </Sheet>
    </>
  );
};

