import React, { useState, useRef, useEffect } from 'react';
import { useJournal } from '../state/JournalContext';
import { ChevronDown, Search, Plus, Film, BookOpen, Sparkles, Check } from 'lucide-react';
import './TargetPicker.css';

export interface ChosenTarget {
  targetKind: 'season' | 'movie' | 'book' | 'character';
  id: number;
  title: string;
  context?: string;
  defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
  episodeNumber?: number;
  existingNotes?: string | null;
  totalEpisodes?: number | null;
}

export interface TargetPickerProps {
  value: ChosenTarget | null;
  onChange: (target: ChosenTarget) => void;
  onOpenNewCatalog?: () => void;
}

export const TargetPicker: React.FC<TargetPickerProps> = ({
  value,
  onChange,
  onOpenNewCatalog,
}) => {
  const { seriesList, bookList, characterList } = useJournal();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build target options: active titles first, then rest
  const options = React.useMemo(() => {
    const active: ChosenTarget[] = [];
    const others: ChosenTarget[] = [];

    // Anime series releases
    seriesList.forEach((s) => {
      s.seasons?.forEach((season) => {
        const item: ChosenTarget = {
          targetKind: 'season',
          id: season.id,
          title: s.title,
          context: `Season ${season.season_number} · ${season.title}`,
          defaultKind: 'lesson',
          existingNotes: season.notes,
          totalEpisodes: season.total_episodes,
        };
        if (season.status === 'WATCHING') active.push(item);
        else others.push(item);
      });

      s.movies?.forEach((movie) => {
        const item: ChosenTarget = {
          targetKind: 'movie',
          id: movie.id,
          title: s.title,
          context: `Film · ${movie.title}`,
          defaultKind: 'lesson',
          existingNotes: movie.notes,
        };
        if (movie.status === 'WATCHING') active.push(item);
        else others.push(item);
      });
    });

    // Books
    bookList.forEach((b) => {
      const item: ChosenTarget = {
        targetKind: 'book',
        id: b.id,
        title: b.title,
        context: b.author ? `by ${b.author} · Book` : 'Book',
        defaultKind: 'lesson',
        existingNotes: b.notes,
      };
      if (b.status === 'READING') active.push(item);
      else others.push(item);
    });

    // Characters
    characterList.forEach((c) => {
      others.push({
        targetKind: 'character',
        id: c.id,
        title: c.name,
        context: c.series_title ? `Character · ${c.series_title}` : 'Character',
        defaultKind: 'why',
        existingNotes: c.why,
      });
    });

    return { active, others };
  }, [seriesList, bookList, characterList]);

  const filterItem = (item: ChosenTarget) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.context && item.context.toLowerCase().includes(q))
    );
  };

  const filteredActive = options.active.filter(filterItem);
  const filteredOthers = options.others.filter(filterItem);

  return (
    <div className="lamplight-target-picker" ref={containerRef}>
      <button
        type="button"
        className="lamplight-target-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {value ? (
            <>
              {value.targetKind === 'book' ? (
                <BookOpen size={16} color="var(--lamp)" />
              ) : value.targetKind === 'character' ? (
                <Sparkles size={16} color="var(--lamp)" />
              ) : (
                <Film size={16} color="var(--lamp)" />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value.title}</span>
                {value.context && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{value.context}</span>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-3)' }}>Select a title or person to reflect on…</span>
          )}
        </div>
        <ChevronDown size={16} color="var(--text-3)" />
      </button>

      {isOpen && (
        <div className="lamplight-target-dropdown" role="listbox">
          <div className="lamplight-target-search">
            <Search size={14} color="var(--text-3)" />
            <input
              ref={inputRef}
              type="text"
              className="lamplight-target-input"
              placeholder="Search in-progress or completed titles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredActive.length > 0 && (
            <div className="lamplight-target-group">
              <div className="lamplight-target-group-label">Currently in progress</div>
              {filteredActive.map((item) => (
                <button
                  key={`${item.targetKind}-${item.id}`}
                  type="button"
                  className={`lamplight-target-option ${value?.id === item.id && value?.targetKind === item.targetKind ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(item);
                    setIsOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{item.title}</strong>
                    <small style={{ color: 'var(--text-3)' }}>{item.context}</small>
                  </div>
                  {value?.id === item.id && value?.targetKind === item.targetKind && (
                    <Check size={14} color="var(--lamp)" />
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredOthers.length > 0 && (
            <div className="lamplight-target-group">
              <div className="lamplight-target-group-label">Library & Characters</div>
              {filteredOthers.map((item) => (
                <button
                  key={`${item.targetKind}-${item.id}`}
                  type="button"
                  className={`lamplight-target-option ${value?.id === item.id && value?.targetKind === item.targetKind ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(item);
                    setIsOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.title}</span>
                    <small style={{ color: 'var(--text-3)' }}>{item.context}</small>
                  </div>
                  {value?.id === item.id && value?.targetKind === item.targetKind && (
                    <Check size={14} color="var(--lamp)" />
                  )}
                </button>
              ))}
            </div>
          )}

          {onOpenNewCatalog && (
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 4 }}>
              <button
                type="button"
                className="lamplight-target-option"
                style={{ color: 'var(--lamp)', fontWeight: 500 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewCatalog();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  <span>Can't find it? Log new title →</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
