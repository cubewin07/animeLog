import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Check, Loader2, Search, Sparkles, Tv, X } from 'lucide-react';
import {
  ExternalAnimeLookupResult,
  ExternalBookLookupResult,
  ExternalCharacterLookupResult,
  imageApi,
  lookupApi,
} from '../api/client';
import './SmartMetadataSearch.css';

type LookupResultItem =
  | (ExternalAnimeLookupResult & { name?: string; portrait_url?: string; key?: string })
  | (ExternalCharacterLookupResult & { title?: string; cover_url?: string; key?: string })
  | (ExternalBookLookupResult & { name?: string; portrait_url?: string; source_id?: number });

interface SmartMetadataSearchProps {
  type: 'anime' | 'character' | 'book';
  onSelectAnime?: (
    item: ExternalAnimeLookupResult,
    importedImage?: { id: number; url: string } | null
  ) => void;
  onSelectCharacter?: (
    item: ExternalCharacterLookupResult,
    importedImage?: { id: number; url: string } | null
  ) => void;
  onSelectBook?: (
    item: ExternalBookLookupResult,
    importedImage?: { id: number; url: string } | null
  ) => void;
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
        data = (await lookupApi.searchAnime(q)) as LookupResultItem[];
      } else if (type === 'character') {
        data = (await lookupApi.searchCharacter(q)) as LookupResultItem[];
      } else if (type === 'book') {
        data = (await lookupApi.searchBook(q)) as LookupResultItem[];
      }

      setResults(data);
      setIsOpen(true);
      if (data.length === 0) {
        setErrorMessage(
          `No matching ${type === 'book' ? 'books' : 'titles'} found. You can enter details manually below.`
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('Metadata lookup error:', err);
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : String(err || '');
      const isRateLimit = status === 429 || msg.includes('429');
      if (isRateLimit) {
        setErrorMessage(
          'Rate limit reached on public metadata API. Please wait a few seconds and try again.'
        );
      } else {
        setErrorMessage(
          'External metadata lookup is currently unreachable. You can continue logging manually.'
        );
      }
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: LookupResultItem) => {
    setIsOpen(false);
    setErrorMessage(null);
    const itemTitle = item.title || item.name || '';
    setAutofilledTitle(itemTitle);

    let importedImage: { id: number; url: string } | null = null;
    const remoteUrl = item.cover_url || item.portrait_url;

    if (remoteUrl) {
      try {
        setImportingImage(true);
        const folderName =
          type === 'character'
            ? 'Character Portraits'
            : type === 'book'
              ? 'Book Covers'
              : 'Anime Covers';
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
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && results.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
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
    <div ref={containerRef} className="kf-lookup">
      <div className="kf-lookup-bar">
        <Sparkles size={15} className="kf-lookup-sparkle" aria-hidden="true" />
        <input
          type="text"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="metadata-lookup-listbox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `metadata-option-${highlightedIndex}` : undefined
          }
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
          className="kf-lookup-input"
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
            className="kf-lookup-clear"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="kf-lookup-search-btn"
        >
          {loading ? (
            <Loader2 size={13} className="kf-spin" aria-hidden="true" />
          ) : (
            <Search size={13} aria-hidden="true" />
          )}
          <span>Search</span>
        </button>
      </div>

      {importingImage && (
        <div className="kf-lookup-importing" role="status">
          <Loader2 size={12} className="kf-spin" aria-hidden="true" />
          <span>Saving cover artwork to Media Library…</span>
        </div>
      )}

      {errorMessage && !isOpen && (
        <div className="kf-lookup-notice" role="status">
          <AlertCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss notice"
            className="kf-lookup-banner-close"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {autofilledTitle && !isOpen && !importingImage && (
        <div className="kf-lookup-success" role="status">
          <span className="kf-lookup-success-copy">
            <Check size={13} aria-hidden="true" />
            <span>
              Autofilled details from {type === 'book' ? 'OpenLibrary' : 'MyAnimeList'}:{' '}
              <strong>{autofilledTitle}</strong>
            </span>
          </span>
          <button
            type="button"
            onClick={() => setAutofilledTitle(null)}
            aria-label="Dismiss autofill banner"
            className="kf-lookup-banner-close"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div
          ref={listboxRef}
          id="metadata-lookup-listbox"
          role="listbox"
          aria-label="Metadata search results"
          className="kf-lookup-listbox"
        >
          <div className="kf-lookup-listhead">
            <span>{results.length} Matches Found</span>
            <span>Use ↑↓ and Enter or click</span>
          </div>

          {results.map((item, idx) => {
            const itemTitle = item.title || item.name || '';
            const thumb = item.cover_url || item.portrait_url;
            const isHighlighted = highlightedIndex === idx;
            const animeItem = item as ExternalAnimeLookupResult;
            const bookItem = item as ExternalBookLookupResult;

            return (
              <button
                type="button"
                id={`metadata-option-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                key={item.source_id || item.key || idx}
                onClick={() => handleSelect(item)}
                className={`kf-lookup-option ${isHighlighted ? 'is-highlighted' : ''}`}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <div className="kf-lookup-thumb">
                  {thumb ? (
                    <img src={thumb} alt="" />
                  ) : type === 'book' ? (
                    <BookOpen size={16} aria-hidden="true" />
                  ) : (
                    <Tv size={16} aria-hidden="true" />
                  )}
                </div>

                <div className="kf-lookup-meta">
                  <div className="kf-lookup-title">{itemTitle}</div>
                  <div className="kf-lookup-sub">
                    {animeItem.japanese_title && <span>{animeItem.japanese_title}</span>}
                    {bookItem.author && <span>by {bookItem.author}</span>}
                    {animeItem.total_episodes && <span>{animeItem.total_episodes} eps</span>}
                    {bookItem.total_pages && <span>{bookItem.total_pages} pages</span>}
                    {animeItem.studios && animeItem.studios.length > 0 && (
                      <span>· {animeItem.studios[0]}</span>
                    )}
                  </div>
                </div>

                {animeItem.score && <span className="kf-lookup-score">★ {animeItem.score}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
