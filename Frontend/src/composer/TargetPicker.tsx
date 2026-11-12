import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, Film, Plus, Search, Sparkles } from 'lucide-react';
import { useJournalData } from '../state/JournalContext';
import './Composer.css';

export interface ChosenTarget {
  targetKind: 'season' | 'movie' | 'book' | 'character';
  id: number;
  title: string;
  context?: string;
  defaultKind?: 'lesson' | 'episode' | 'return' | 'why';
  episodeNumber?: number;
}

export interface TargetPickerProps {
  value: ChosenTarget | null;
  onChange: (target: ChosenTarget) => void;
  onOpenNewCatalog?: () => void;
}

function TargetIcon({ kind }: { kind: ChosenTarget['targetKind'] }) {
  if (kind === 'book') return <BookOpen size={16} color="var(--kf-plan)" aria-hidden="true" />;
  if (kind === 'character') return <Sparkles size={16} color="var(--kf-gold)" aria-hidden="true" />;
  return <Film size={16} color="var(--kf-brand)" aria-hidden="true" />;
}

export const TargetPicker: React.FC<TargetPickerProps> = ({
  value,
  onChange,
  onOpenNewCatalog,
}) => {
  const { seriesList, bookList, characterList } = useJournalData();
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
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Build target options: active titles first, then rest
  const options = useMemo(() => {
    const active: ChosenTarget[] = [];
    const others: ChosenTarget[] = [];

    seriesList.forEach((s) => {
      s.seasons?.forEach((season) => {
        const item: ChosenTarget = {
          targetKind: 'season',
          id: season.id,
          title: s.title,
          context: `Season ${season.season_number} · ${season.title}`,
          defaultKind: 'lesson',
        };
        if (season.status === 'WATCHING') active.push(item);
        else others.push(item);
      });

      s.movies?.forEach((movie) => {
        const item: ChosenTarget = {
          targetKind: 'movie',
          id: movie.id,
          title: s.title,
          context: `Movie · ${movie.title}`,
          defaultKind: 'lesson',
        };
        if (movie.status === 'WATCHING') active.push(item);
        else others.push(item);
      });
    });

    bookList.forEach((b) => {
      const item: ChosenTarget = {
        targetKind: 'book',
        id: b.id,
        title: b.title,
        context: b.author ? `by ${b.author} · Book` : 'Book',
        defaultKind: 'lesson',
      };
      if (b.status === 'READING') active.push(item);
      else others.push(item);
    });

    characterList.forEach((c) => {
      others.push({
        targetKind: 'character',
        id: c.id,
        title: c.name,
        context: c.series_title ? `Character · ${c.series_title}` : 'Character',
        defaultKind: 'why',
      });
    });

    return { active, others };
  }, [seriesList, bookList, characterList]);

  const filterItem = (item: ChosenTarget) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      Boolean(item.context && item.context.toLowerCase().includes(q))
    );
  };

  const filteredActive = options.active.filter(filterItem);
  const filteredOthers = options.others.filter(filterItem);
  const hasResults = filteredActive.length > 0 || filteredOthers.length > 0;

  return (
    <div
      className="kf-target-picker"
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="kf-target-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="kf-target-btn-main">
          {value ? (
            <>
              <TargetIcon kind={value.targetKind} />
              <div className="kf-target-btn-copy">
                <span className="kf-target-btn-title">{value.title}</span>
                {value.context && (
                  <span className="kf-target-btn-sub">{value.context}</span>
                )}
              </div>
            </>
          ) : (
            <span className="kf-target-placeholder">
              Select a title or character to write about…
            </span>
          )}
        </div>
        <ChevronDown size={16} color="var(--kf-text-2)" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="kf-target-dropdown" role="listbox" aria-label="Choose a title or character">
          <div className="kf-target-search">
            <Search size={14} color="var(--kf-text-2)" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              className="kf-target-input"
              placeholder="Search in-progress or completed titles…"
              aria-label="Filter titles and characters"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredActive.length > 0 && (
            <div className="kf-target-group">
              <div className="kf-target-group-label">Currently in progress</div>
              {filteredActive.map((item) => {
                const selected = value?.id === item.id && value?.targetKind === item.targetKind;
                return (
                  <button
                    key={`${item.targetKind}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`kf-target-option ${selected ? 'is-selected' : ''}`}
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                  >
                    <div className="kf-target-option-copy">
                      <strong>{item.title}</strong>
                      <small>{item.context}</small>
                    </div>
                    {selected && <Check size={14} color="var(--kf-brand)" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {filteredOthers.length > 0 && (
            <div className="kf-target-group">
              <div className="kf-target-group-label">Library &amp; Characters</div>
              {filteredOthers.map((item) => {
                const selected = value?.id === item.id && value?.targetKind === item.targetKind;
                return (
                  <button
                    key={`${item.targetKind}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`kf-target-option ${selected ? 'is-selected' : ''}`}
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                  >
                    <div className="kf-target-option-copy">
                      <span>{item.title}</span>
                      <small>{item.context}</small>
                    </div>
                    {selected && <Check size={14} color="var(--kf-brand)" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {!hasResults && (
            <div className="kf-target-empty">No matching titles or characters.</div>
          )}

          {onOpenNewCatalog && (
            <div className="kf-target-footer">
              <button
                type="button"
                className="kf-target-option kf-target-add-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewCatalog();
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} aria-hidden="true" />
                  <span>Can&apos;t find it? Add new title</span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
