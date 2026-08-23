import React from 'react';
import { ActiveTab } from '../types';
import {
  BookOpen,
  Film,
  Sparkles,
  RotateCcw,
  LayoutDashboard,
  Plus,
  Search,
  BookMarked,
  Image as ImageIcon,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenNewModal,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Desk', icon: <LayoutDashboard size={15} /> },
    { id: 'anime', label: 'Anime', icon: <Film size={15} /> },
    { id: 'books', label: 'Books', icon: <BookOpen size={15} /> },
    { id: 'characters', label: 'Characters', icon: <Sparkles size={15} /> },
    { id: 'rewatches', label: 'Rewatches', icon: <RotateCcw size={15} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={15} /> },
  ];

  return (
    <header className="journal-nav-bar">
      <a href="#journal-main" className="skip-link">
        Skip to journal
      </a>

      <div className="journal-nav-inner">
        {/* Brand & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => onTabChange('dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onTabChange('dashboard');
            }}
            aria-label="Go to Desk Dashboard"
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--desk-surface)',
                color: 'var(--text-desk)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookMarked size={18} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--text-desk)',
                  letterSpacing: '-0.01em',
                }}
              >
                AnimeLog
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="journal-nav-links" aria-label="Journal Navigation">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`journal-nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.75 }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search & New Entry Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '1 1 280px',
            maxWidth: 420,
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: 240 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-desk-dim)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search journal..."
              aria-label="Search journal"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: 32,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 14,
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--desk)',
              }}
            />
          </div>

          <button
            onClick={onOpenNewModal}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '6px 14px', fontSize: 14 }}
            aria-label="Log new entry"
          >
            <Plus size={15} />
            <span>Write Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
