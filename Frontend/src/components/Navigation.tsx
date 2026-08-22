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
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'anime', label: 'Anime Journal', icon: <Film size={16} /> },
    { id: 'books', label: 'Book Journal', icon: <BookOpen size={16} /> },
    { id: 'characters', label: 'Favorite Characters', icon: <Sparkles size={16} /> },
    { id: 'rewatches', label: 'Rewatches', icon: <RotateCcw size={16} /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon size={16} /> },
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 20, 36, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 500,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top row: Brand + Search + Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Logo & Philosophy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
            onClick={() => onTabChange('dashboard')}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <BookMarked size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                  }}
                >
                  AnimeLog
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--border-glow)',
                  }}
                >
                  JOURNAL
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Memories & Lessons Archive
              </p>
            </div>
          </div>

          {/* Search and Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', maxWidth: '480px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search
                size={15}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search titles, lessons, authors..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: '32px',
                  paddingTop: '7px',
                  paddingBottom: '7px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-pill)',
                }}
              />
            </div>

            <button onClick={onOpenNewModal} className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '8px 14px' }}>
              <Plus size={16} />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* Tab row */}
        <nav
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? '2px solid var(--color-primary-action)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
