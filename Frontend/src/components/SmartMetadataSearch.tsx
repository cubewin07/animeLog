import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalAnimeLookupResult,
  ExternalBookLookupResult,
  ExternalCharacterLookupResult,
  imageApi,
  lookupApi,
} from '../api/client';
import { Search, Sparkles, Loader2, X, Check, BookOpen, Tv, AlertCircle } from 'lucide-react';

type LookupResultItem = (
  | (ExternalAnimeLookupResult & { name?: string; portrait_url?: string; key?: string })
  | (ExternalCharacterLookupResult & { title?: string; cover_url?: string; key?: string })
  | (ExternalBookLookupResult & { name?: string; portrait_url?: string; source_id?: number })
);

interface SmartMetadataSearchProps {
  type: 'anime' | 'character' | 'book';
  onSelectAnime?: (item: ExternalAnimeLookupResult, importedImage?: { id: number; url: string } | null) => void;
  onSelectCharacter?: (item: ExternalCharacterLookupResult, importedImage?: { id: number; url: string } | null) => void;
  onSelectBook?: (item: ExternalBookLookupResult, importedImage?: { id: number; url: string } | null) => void;
}

export const SmartMetadataSearch: React.FC<SmartMetadataSearchProps> = ({
  type,
  onSelectAnime,
  onSelectCharacter,
  onSelectBook,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importingImage, setImportingImage] = useState(false);
  const [autofilledTitle, setAutofilledTitle] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setIsOpen(false);
      setErrorMessage(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setErrorMessage(null);
      setHighlightedIndex(-1);

      let data: LookupResultItem[] = [];
      if (type === 'anime') {
        data = await lookupApi.searchAnime(q) as LookupResultItem[];
      } else if (type === 'character') {
        data = await lookupApi.searchCharacter(q) as LookupResultItem[];
      } else if (type === 'book') {
        data = await lookupApi.searchBook(q) as LookupResultItem[];
      }

      setResults(data);
      setIsOpen(true);
      if (data.length === 0) {
        setErrorMessage(`No matching ${type === 'book' ? 'books' : 'titles'} found. You can enter details manually below.`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Metadata lookup error:', err);
      const isRateLimit = err?.status === 429 || String(err?.message || '').includes('429');
      if (isRateLimit) {
        setErrorMessage('Rate limit reached on public metadata API. Please wait a few seconds and try again.');
      } else {
        setErrorMessage('External metadata lookup is currently unreachable. You can continue logging manually.');
      }
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: LookupResultItem) => {
    setIsOpen(false);
    setErrorMessage(null);
    const itemTitle = (item as any).title || (item as any).name || '';
    setAutofilledTitle(itemTitle);

    let importedImage: { id: number; url: string } | null = null;
    const remoteUrl = (item as any).cover_url || (item as any).portrait_url;

    if (remoteUrl) {
      try {
        setImportingImage(true);
        const folderName = type === 'character' ? 'Character Portraits' : type === 'book' ? 'Book Covers' : 'Anime Covers';
        const img = await imageApi.importUrl(remoteUrl, itemTitle, folderName);
        importedImage = { id: img.id, url: img.url };
      } catch (err) {
        console.warn('Could not auto-import remote cover image:', err);
      } finally {
        setImportingImage(false);
      }
    }

    if (type === 'anime' && onSelectAnime) {
      onSelectAnime(item as ExternalAnimeLookupResult, importedImage);
    } else if (type === 'character' && onSelectCharacter) {
      onSelectCharacter(item as ExternalCharacterLookupResult, importedImage);
    } else if (type === 'book' && onSelectBook) {
      onSelectBook(item as ExternalBookLookupResult, importedImage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (results.length > 0) {
        setHighlightedIndex((prev) => {
          const next = prev < results.length - 1 ? prev + 1 : 0;
          return next;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && results.length > 0) {
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : results.length - 1;
          return next;
        });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const placeholderText =
    type === 'anime'
      ? 'Auto-fill from MyAnimeList (e.g. Frieren, Steins;Gate, Mugen Train)...'
      : type === 'character'
      ? 'Search MyAnimeList character (e.g. Himmel, Rintaro Okabe, Thorfinn)...'
      : 'Auto-fill from OpenLibrary (e.g. Meditations, Norwegian Wood)...';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--desk-surface)',
          border: '1px solid var(--border-desk-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <Sparkles size={15} color="var(--tungsten)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="metadata-lookup-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `metadata-option-${highlightedIndex}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) {
              setIsOpen(false);
              setErrorMessage(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          aria-label={placeholderText}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text-desk)',
            padding: '4px 0',
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              setErrorMessage(null);
              setHighlightedIndex(-1);
            }}
            aria-label="Clear autofill search"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-desk-dim)',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="btn btn-secondary"
          style={{
            fontSize: 12,
            padding: '4px 10px',
            height: 28,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {loading ? (
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={13} />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Importing feedback pill */}
      {importingImage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--tungsten)',
            marginTop: 6,
            padding: '2px 8px',
          }}
        >
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Saving cover artwork to Media Library...</span>
        </div>
      )}

      {/* Error or notice banner */}
      {errorMessage && !isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--tungsten)',
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            marginTop: 6,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Success banner if applied */}
      {autofilledTitle && !isOpen && !importingImage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--spine-text)',
            background: 'var(--desk-surface-high)',
            border: '1px solid var(--border-desk-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            marginTop: 6,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} />
            Autofilled details from {type === 'book' ? 'OpenLibrary' : 'MyAnimeList'}: <strong>{autofilledTitle}</strong>
          </span>
          <button
            type="button"
            onClick={() => setAutofilledTitle(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-desk-dim)', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Dropdown Results List */}
      {isOpen && results.length > 0 && (
        <div
          ref={listboxRef}
          id="metadata-lookup-listbox"
          role="listbox"
          aria-label="Metadata search results"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 280,
            overflowY: 'auto',
            background: 'var(--desk-surface)',
            border: '1px solid var(--border-desk-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-desk-dim)',
              borderBottom: '1px solid var(--border-desk-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{results.length} Matches Found</span>
            <span>Use ↑↓ and Enter or click</span>
          </div>

          {results.map((item, idx) => {
            const itemTitle = (item as any).title || (item as any).name || '';
            const thumb = (item as any).cover_url || (item as any).portrait_url;
            const isHighlighted = highlightedIndex === idx;

            return (
              <button
                type="button"
                id={`metadata-option-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                key={(item as any).source_id || (item as any).key || idx}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  background: isHighlighted ? 'var(--desk-surface-high)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-desk-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text-desk)',
                  transition: 'background 0.15s',
                  width: '100%',
                  outline: isHighlighted ? '1px solid var(--border-desk-focus)' : 'none',
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <div
                  style={{
                    width: 38,
                    height: 52,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'var(--still-well)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : type === 'book' ? (
                    <BookOpen size={16} color="var(--text-desk-dim)" />
                  ) : (
                    <Tv size={16} color="var(--text-desk-dim)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {itemTitle}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-desk-muted)',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginTop: 2,
                    }}
                  >
                    {(item as any).japanese_title && <span>{(item as any).japanese_title}</span>}
                    {(item as any).author && <span>by {(item as any).author}</span>}
                    {(item as any).total_episodes && <span>{(item as any).total_episodes} eps</span>}
                    {(item as any).total_pages && <span>{(item as any).total_pages} pages</span>}
                    {(item as any).studios && (item as any).studios.length > 0 && <span>· {(item as any).studios[0]}</span>}
                  </div>
                </div>

                {(item as any).score && (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'var(--desk-raised)',
                      border: '1px solid var(--border-desk-subtle)',
                      color: 'var(--tungsten)',
                      flexShrink: 0,
                    }}
                  >
                    ★ {(item as any).score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
