import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  X,
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
    { id: 'dashboard', label: 'Desk', icon: <LayoutDashboard size={14} /> },
    { id: 'anime', label: 'Anime', icon: <Film size={14} /> },
    { id: 'books', label: 'Books', icon: <BookOpen size={14} /> },
    { id: 'characters', label: 'Characters', icon: <Sparkles size={14} /> },
    { id: 'rewatches', label: 'Rewatches', icon: <RotateCcw size={14} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={14} /> },
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Update sliding indicator position
  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
    const trackEl = trackRef.current;
    if (activeEl && trackEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });

      // Ensure active tab is visible when track is scrollable
      if (trackEl.scrollWidth > trackEl.clientWidth) {
        const scrollLeft =
          activeEl.offsetLeft - trackEl.clientWidth / 2 + activeEl.offsetWidth / 2;
        trackEl.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    // Update after any fonts or layout settle
    const frameId = requestAnimationFrame(updateIndicator);
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, updateIndicator]);

  // Global keyboard shortcut for quick search ('/' or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput) {
        if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="journal-nav-bar">
      <a href="#journal-main" className="skip-link">
        Skip to journal
      </a>

      <div className="journal-nav-inner">
        {/* Brand & Pill Track */}
        <div className="journal-nav-left">
          <div
            className="journal-brand-mark"
            onClick={() => onTabChange('dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onTabChange('dashboard');
            }}
            aria-label="AnimeLog Journal — Return to Desk"
          >
            <div className="journal-brand-icon">
              <BookMarked size={16} />
            </div>
            <div className="journal-brand-text">
              <span className="journal-brand-title">AnimeLog</span>
              <span className="journal-brand-badge">Journal</span>
            </div>
          </div>

          {/* Navigation Segmented Pill Track */}
          <nav
            className="journal-nav-track"
            ref={trackRef}
            aria-label="Journal Sections"
          >
            {/* Smooth Sliding Active Pill Background */}
            <div
              className="journal-nav-indicator"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
              aria-hidden="true"
            />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => onTabChange(tab.id)}
                  className={`journal-nav-tab ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  type="button"
                >
                  <span className="journal-tab-icon">{tab.icon}</span>
                  <span className="journal-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search & New Entry Action */}
        <div className="journal-nav-right">
          <div className={`journal-search-capsule ${isSearchFocused ? 'focused' : ''}`}>
            <Search size={14} className="journal-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search journal..."
              aria-label="Search journal entries"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="journal-search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="journal-search-clear"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            ) : (
              <kbd className="journal-search-shortcut" title="Press '/' to search">
                /
              </kbd>
            )}
          </div>

          <button
            onClick={onOpenNewModal}
            className="journal-action-btn"
            aria-label="Log new journal entry"
            type="button"
          >
            <Plus size={15} />
            <span>Write Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};

