import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  Check,
  Copy,
  Film,
  ImageDown,
  PenLine,
  Pencil,
  Quote,
  RotateCcw,
  Search,
  Trash2,
  Tv,
  User,
  X,
} from 'lucide-react';
import { useJournalActions, useJournalData, useJournalUI } from '../../state/JournalContext';
import { useReflections } from '../../state/useReflections';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { downloadQuoteCard } from '../../utils/cardGenerator';
import { CoverArt, KfButton, NotePaper, ScoreTag } from '../../ui/keyframe';
import {
  JOURNAL_KIND_DEFS,
  type JournalEntry,
  type NormalizedReflectionKind,
  type ThenVsNowItem,
  buildThenVsNowItems,
  countJournalKinds,
  enrichJournalEntries,
  filterJournalEntries,
  filterThenVsNowItems,
  formatRatingDelta,
  groupJournalByMonth,
  normalizeJournalKind,
} from './journalUtils';
import '../../styles/keyframe.css';
import './Journal.css';

function renderKindIcon(kind: NormalizedReflectionKind): React.ReactNode {
  switch (kind) {
    case 'episode':
    case 'season':
      return <Tv size={12} aria-hidden="true" />;
    case 'movie':
      return <Film size={12} aria-hidden="true" />;
    case 'book':
      return <BookOpen size={12} aria-hidden="true" />;
    case 'character':
      return <User size={12} aria-hidden="true" />;
    case 'rewatch':
      return <RotateCcw size={12} aria-hidden="true" />;
  }
}

function buildEntrySlate(entry: JournalEntry): string[] {
  const parts = [entry.kindLabel, entry.context];
  if (entry.dateLabel !== 'Undated') parts.push(entry.dateLabel);
  if (entry.rating != null) parts.push(`${entry.rating}/10`);
  return parts.filter(Boolean);
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  copiedId: string | null;
  onCopy: (entry: JournalEntry) => void;
  onMakeCard: (entry: JournalEntry) => void;
  onOpenRead: (entryId: string) => void;
  onAddToNote: (entry: JournalEntry) => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  entry,
  copiedId,
  onCopy,
  onMakeCard,
  onOpenRead,
  onAddToNote,
}) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(entry.title, entry.coverUrl);
  const slate = useMemo(() => buildEntrySlate(entry), [entry]);
  const isCopied = copiedId === entry.id;

  return (
    <article
      className="kf-journal-entry"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <div className="kf-journal-entry-aside">
        <Link
          viewTransition
          to={entry.href}
          className="kf-journal-entry-target"
          aria-label={`Open ${entry.title}`}
        >
          <div className={`kf-journal-thumb is-${entry.coverVariant}`}>
            <CoverArt
              title={entry.title}
              imageUrl={entry.coverUrl}
              accent={accent}
              variant={entry.coverVariant}
              size="thumb"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>
          <div className="kf-journal-entry-meta">
            <div className="kf-journal-entry-badges">
              <span className="kf-journal-kind-badge">
                {renderKindIcon(entry.normalizedKind)}
                <span>{entry.kindLabel}</span>
              </span>
              <ScoreTag score={entry.rating} />
            </div>
            <strong className="kf-journal-entry-title">{entry.title}</strong>
            <span className="kf-journal-entry-context">{entry.context}</span>
            <span className="kf-journal-entry-date">{entry.dateLabel}</span>
          </div>
        </Link>
      </div>

      <div className="kf-journal-entry-main">
        <NotePaper slate={slate}>
          <p className="kf-journal-note-body">{entry.note}</p>
        </NotePaper>

        <div className="kf-journal-entry-actions">
          <button
            type="button"
            className={`kf-journal-action-btn ${isCopied ? 'is-copied' : ''}`}
            onClick={() => onCopy(entry)}
          >
            {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            className="kf-journal-action-btn"
            onClick={() => onMakeCard(entry)}
          >
            <ImageDown size={14} aria-hidden="true" />
            <span>Make card</span>
          </button>

          <button
            type="button"
            className="kf-journal-action-btn"
            onClick={() => onOpenRead(entry.id)}
          >
            <BookOpenText size={14} aria-hidden="true" />
            <span>Read</span>
          </button>

          <button
            type="button"
            className="kf-journal-action-btn is-accent"
            onClick={() => onAddToNote(entry)}
          >
            <PenLine size={14} aria-hidden="true" />
            <span>Add to note</span>
          </button>
        </div>
      </div>
    </article>
  );
};

interface ThenVsNowCardProps {
  item: ThenVsNowItem;
  onMakeCard: (item: ThenVsNowItem) => void;
  onEdit: (item: ThenVsNowItem) => void;
  onDelete: (id: number) => void;
}

const ThenVsNowCard: React.FC<ThenVsNowCardProps> = ({
  item,
  onMakeCard,
  onEdit,
  onDelete,
}) => {
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(item.title, item.coverUrl);
  const delta = formatRatingDelta(item.ratingDelta);

  return (
    <article
      className="kf-journal-then-now"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <header className="kf-journal-then-head">
        <Link
          viewTransition
          to={item.href}
          className="kf-journal-then-target"
          aria-label={`Open ${item.title}`}
        >
          <div className="kf-journal-then-thumb">
            <CoverArt
              title={item.title}
              imageUrl={item.coverUrl}
              accent={accent}
              variant="poster"
              size="thumb"
              onImageReady={onImageReady}
              onCorsBlocked={onCorsBlocked}
            />
          </div>
          <div className="kf-journal-then-meta">
            <div className="kf-journal-then-badges">
              <strong className="kf-journal-then-pass">Rewatch {item.passNumber}</strong>
              <span className="kf-journal-then-date">{item.dateLabel}</span>
              {delta && (
                <span
                  className={`kf-journal-delta is-${delta.direction}`}
                  aria-label={`Rating change ${delta.label}`}
                >
                  {delta.label}
                </span>
              )}
            </div>
            <strong className="kf-journal-then-title">{item.title}</strong>
            <span className="kf-journal-then-context">{item.context}</span>
          </div>
        </Link>

        <div className="kf-journal-then-controls">
          <button
            type="button"
            className="kf-journal-action-btn"
            onClick={() => onMakeCard(item)}
            aria-label={`Make card for ${item.title} Rewatch ${item.passNumber}`}
          >
            <ImageDown size={14} aria-hidden="true" />
            <span>Make card</span>
          </button>

          <button
            type="button"
            className="kf-journal-action-btn"
            onClick={() => onEdit(item)}
            aria-label={`Edit rewatch ${item.passNumber} for ${item.title}`}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            className="kf-journal-action-btn is-danger"
            onClick={() => onDelete(item.id)}
            aria-label={`Delete rewatch ${item.passNumber} for ${item.title}`}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </header>

      <div className="kf-journal-then-grid">
        <div className="kf-journal-then-col">
          <div className="kf-journal-then-col-head">
            <span className="kf-journal-then-col-label">Original</span>
            <ScoreTag score={item.originalRating} />
          </div>
          {item.originalNote?.trim() ? (
            <p className="kf-journal-then-col-body">{item.originalNote}</p>
          ) : (
            <p className="kf-journal-then-col-empty">No original note recorded.</p>
          )}
        </div>

        <div className="kf-journal-then-col">
          <div className="kf-journal-then-col-head">
            <span className="kf-journal-then-col-label">
              Rewatch {item.passNumber} · {item.dateLabel}
            </span>
            <ScoreTag score={item.rewatchRating} />
          </div>
          {item.rewatchNote?.trim() ? (
            <p className="kf-journal-then-col-body">{item.rewatchNote}</p>
          ) : (
            <p className="kf-journal-then-col-empty">No rewatch note recorded.</p>
          )}
        </div>
      </div>
    </article>
  );
};

export const JournalPage: React.FC = () => {
  const { loading, loadFailed, seriesList, bookList, characterList, rewatchList } = useJournalData();
  const {
    retryLoad,
    openComposer,
    openAddRewatch,
    openEditRewatchModal,
    handleDeleteRewatch,
    addToast,
  } = useJournalActions();
  const {
    composerOpen,
    paletteOpen,
    entryModalOpen,
    episodeNoteModalOpen,
    rewatchModalOpen,
    characterModalOpen,
    confirmDialog,
  } = useJournalUI();
  const { reflections } = useReflections();

  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readEntryId, setReadEntryId] = useState<string | null>(null);

  const readDialogRef = useRef<HTMLDialogElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readerTitleId = useId();

  const selectedKind = normalizeJournalKind(searchParams.get('kind'));
  const filterQuery = searchParams.get('q') ?? '';

  const updateParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === defaultValue) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('kind');
    next.delete('q');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const enrichedEntries = useMemo(
    () => enrichJournalEntries(reflections, { seriesList, bookList, characterList }),
    [reflections, seriesList, bookList, characterList],
  );

  const thenVsNowItems = useMemo(
    () => buildThenVsNowItems(rewatchList, seriesList),
    [rewatchList, seriesList],
  );

  const kindCounts = useMemo(
    () => countJournalKinds(enrichedEntries, thenVsNowItems, filterQuery),
    [enrichedEntries, thenVsNowItems, filterQuery],
  );

  const filteredEntries = useMemo(
    () => filterJournalEntries(enrichedEntries, { kind: selectedKind, q: filterQuery }),
    [enrichedEntries, selectedKind, filterQuery],
  );

  const monthGroups = useMemo(
    () => groupJournalByMonth(filteredEntries),
    [filteredEntries],
  );

  const thenVsNowFiltered = useMemo(
    () => filterThenVsNowItems(thenVsNowItems, filterQuery),
    [thenVsNowItems, filterQuery],
  );

  const readIndex = useMemo(
    () => (readEntryId ? filteredEntries.findIndex((entry) => entry.id === readEntryId) : -1),
    [filteredEntries, readEntryId],
  );
  const activeReadEntry = readIndex >= 0 ? filteredEntries[readIndex] : null;
  const isReadOpen = activeReadEntry !== null;

  const {
    accent: readAccent,
    onImageReady: onReadImageReady,
    onCorsBlocked: onReadCorsBlocked,
  } = useCoverAccent(activeReadEntry?.title ?? '', activeReadEntry?.coverUrl ?? null);

  // Sync <dialog> showModal() / close() and body scroll lock
  useEffect(() => {
    const dialog = readDialogRef.current;
    if (!dialog) return;

    if (isReadOpen) {
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal();
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }

    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
    return undefined;
  }, [isReadOpen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const closeReadMode = useCallback(() => {
    setReadEntryId(null);
  }, []);

  const goPrevRead = useCallback(() => {
    if (readIndex > 0) {
      setReadEntryId(filteredEntries[readIndex - 1].id);
    }
  }, [filteredEntries, readIndex]);

  const goNextRead = useCallback(() => {
    if (readIndex >= 0 && readIndex < filteredEntries.length - 1) {
      setReadEntryId(filteredEntries[readIndex + 1].id);
    }
  }, [filteredEntries, readIndex]);

  // ArrowLeft / ArrowRight navigation active ONLY while Read Mode is open
  const otherModalOpen =
    composerOpen ||
    paletteOpen ||
    entryModalOpen ||
    episodeNoteModalOpen ||
    rewatchModalOpen ||
    characterModalOpen ||
    confirmDialog.isOpen;

  useEffect(() => {
    if (!isReadOpen || otherModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevRead();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextRead();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOpen, otherModalOpen, goPrevRead, goNextRead]);

  const handleCopyEntry = useCallback(
    async (entry: JournalEntry) => {
      const quote = `"${entry.note}" — ${entry.title} (${entry.context})`;
      try {
        await navigator.clipboard.writeText(quote);
        setCopiedId(entry.id);
        addToast('Note copied to clipboard');
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      } catch {
        addToast('Couldn’t access clipboard in this browser.', 'error');
      }
    },
    [addToast],
  );

  const handleMakeEntryCard = useCallback(
    (entry: JournalEntry) => {
      downloadQuoteCard({
        title: entry.title,
        context: entry.context,
        note: entry.note,
        rating: entry.rating,
      });
      addToast('Quote card downloaded');
    },
    [addToast],
  );

  const handleMakeRewatchCard = useCallback(
    (item: ThenVsNowItem) => {
      const noteText = item.rewatchNote?.trim() || item.originalNote?.trim();
      if (!noteText) {
        addToast('Add a note to this rewatch first to create a card.', 'info');
        return;
      }
      downloadQuoteCard({
        title: item.title,
        context: `${item.context} · Rewatch ${item.passNumber}`,
        note: noteText,
        rating: item.rewatchRating ?? item.originalRating,
      });
      addToast('Quote card downloaded');
    },
    [addToast],
  );

  const handleAddToNote = useCallback(
    (entry: JournalEntry) => {
      openComposer(entry.composerTarget ?? undefined);
    },
    [openComposer],
  );

  const handleOpenReadMode = useCallback(() => {
    if (filteredEntries.length === 0) return;
    setReadEntryId(filteredEntries[0].id);
  }, [filteredEntries]);

  const isRewatchView = selectedKind === 'rewatch';
  const hasAnyData =
    seriesList.length > 0 ||
    bookList.length > 0 ||
    characterList.length > 0 ||
    rewatchList.length > 0;
  const hasActiveFilters = selectedKind !== 'ALL' || filterQuery.trim().length > 0;

  if (loading && !hasAnyData) {
    return (
      <div className="kf kf-journal" aria-label="Loading journal">
        <header className="kf-journal-header">
          <div>
            <div className="kf-journal-title-row">
              <h1 className="kf-journal-title">Journal</h1>
            </div>
            <p className="kf-journal-desc">Loading your writing…</p>
          </div>
        </header>
        <div className="kf-journal-skeleton-list" aria-hidden="true">
          <div className="kf-journal-skeleton" />
          <div className="kf-journal-skeleton" />
        </div>
      </div>
    );
  }

  if (loadFailed && !hasAnyData) {
    return (
      <div className="kf kf-journal">
        <div className="kf-journal-error" role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <div>
            <strong>Couldn’t load your journal</strong>
            <p>Check that the backend server is running, then try again.</p>
          </div>
          <KfButton variant="primary" onClick={retryLoad}>
            Retry
          </KfButton>
        </div>
      </div>
    );
  }

  const badgeCount = isRewatchView ? thenVsNowFiltered.length : filteredEntries.length;
  const badgeUnit = isRewatchView
    ? badgeCount === 1
      ? 'rewatch'
      : 'rewatches'
    : badgeCount === 1
      ? 'note'
      : 'notes';

  return (
    <div className="kf kf-journal">
      {/* Header */}
      <header className="kf-journal-header">
        <div className="kf-journal-header-copy">
          <div className="kf-journal-title-row">
            <h1 className="kf-journal-title">Journal</h1>
            <span className="kf-journal-count-badge" aria-live="polite">
              {badgeCount} {badgeUnit}
            </span>
          </div>
          <p className="kf-journal-desc">
            {isRewatchView
              ? 'Then vs Now: compare your first watch with later rewatches to see how your perspective changed.'
              : 'Every memory and lesson across episodes, seasons, movies, books, characters, and rewatches.'}
          </p>
        </div>

        <div className="kf-journal-header-actions">
          <KfButton
            variant="primary"
            icon={<BookOpenText size={16} />}
            disabled={filteredEntries.length === 0}
            onClick={handleOpenReadMode}
            title={
              filteredEntries.length === 0
                ? 'No written notes match the current filter'
                : 'Open Read mode on filtered notes'
            }
          >
            Read mode
          </KfButton>

          <KfButton
            variant="secondary"
            icon={<PenLine size={16} />}
            onClick={() => openComposer()}
          >
            Write Note
          </KfButton>

          <KfButton
            variant="secondary"
            icon={<RotateCcw size={16} />}
            onClick={() => openAddRewatch()}
          >
            Log Rewatch
          </KfButton>
        </div>
      </header>

      {/* Filter Toolbar */}
      <section className="kf-journal-toolbar" aria-label="Filter journal entries">
        <div className="kf-journal-pills" role="group" aria-label="Filter by note kind">
          {JOURNAL_KIND_DEFS.map((def) => {
            const isActive = selectedKind === def.id;
            const count = kindCounts[def.id] ?? 0;
            return (
              <button
                key={def.id}
                type="button"
                className={`kf-journal-pill ${isActive ? 'is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => updateParam('kind', def.id, 'ALL')}
              >
                <span>{def.label}</span>
                <span className="kf-journal-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="kf-journal-search">
          <Search size={15} className="kf-journal-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={filterQuery}
            onChange={(e) => updateParam('q', e.target.value, '')}
            placeholder="Search all your writing…"
            aria-label="Search all your writing"
          />
          {filterQuery && (
            <button
              type="button"
              className="kf-journal-search-clear"
              onClick={() => updateParam('q', '', '')}
              aria-label="Clear search"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* Main Content */}
      {isRewatchView ? (
        thenVsNowFiltered.length > 0 ? (
          <section className="kf-journal-then-section" aria-label="Then vs Now rewatch timeline">
            <div className="kf-journal-then-banner">
              <div>
                <h2>Then vs Now</h2>
                <p>Side-by-side comparison of your original impression and every rewatch pass.</p>
              </div>
              <KfButton
                variant="secondary"
                icon={<RotateCcw size={15} />}
                onClick={() => openAddRewatch()}
              >
                Log Rewatch
              </KfButton>
            </div>

            <div className="kf-journal-then-list">
              {thenVsNowFiltered.map((item) => (
                <ThenVsNowCard
                  key={item.id}
                  item={item}
                  onMakeCard={handleMakeRewatchCard}
                  onEdit={(entry) => openEditRewatchModal(entry.rewatch)}
                  onDelete={handleDeleteRewatch}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="kf-journal-empty">
            <div className="kf-journal-empty-icon">
              <RotateCcw size={24} aria-hidden="true" />
            </div>
            <h2>{thenVsNowItems.length === 0 ? 'No rewatches logged yet' : 'No matching rewatches'}</h2>
            <p>
              {thenVsNowItems.length === 0
                ? 'Rewatching is how lessons deepen. Log a second pass on any series, season, movie, or episode to compare your past and present thoughts.'
                : `No rewatches matched “${filterQuery}”.`}
            </p>
            <div className="kf-journal-empty-actions">
              {thenVsNowItems.length === 0 ? (
                <KfButton
                  variant="primary"
                  icon={<RotateCcw size={16} />}
                  onClick={() => openAddRewatch()}
                >
                  Log Rewatch
                </KfButton>
              ) : (
                <KfButton variant="secondary" onClick={clearFilters}>
                  Clear filters
                </KfButton>
              )}
            </div>
          </div>
        )
      ) : monthGroups.length > 0 ? (
        <div className="kf-journal-timeline">
          {monthGroups.map((group) => (
            <section
              key={group.monthKey}
              className="kf-journal-month"
              aria-labelledby={`month-${group.monthKey}`}
            >
              <header className="kf-journal-month-head">
                <h2 id={`month-${group.monthKey}`}>{group.monthLabel}</h2>
                <span>
                  {group.entries.length} {group.entries.length === 1 ? 'note' : 'notes'}
                </span>
              </header>

              <div className="kf-journal-month-list">
                {group.entries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    copiedId={copiedId}
                    onCopy={handleCopyEntry}
                    onMakeCard={handleMakeEntryCard}
                    onOpenRead={(id) => setReadEntryId(id)}
                    onAddToNote={handleAddToNote}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="kf-journal-empty">
          <div className="kf-journal-empty-icon">
            <Quote size={24} aria-hidden="true" />
          </div>
          <h2>{enrichedEntries.length === 0 ? 'Your journal has no notes yet' : 'No notes match'}</h2>
          <p>
            {enrichedEntries.length === 0
              ? 'Write your first episode, season, movie, book, or character note and it will appear here.'
              : filterQuery
                ? `No notes matched “${filterQuery}” in this filter.`
                : 'No notes written in this category yet.'}
          </p>
          <div className="kf-journal-empty-actions">
            {hasActiveFilters && enrichedEntries.length > 0 && (
              <KfButton variant="secondary" onClick={clearFilters}>
                Show all notes
              </KfButton>
            )}
            <KfButton
              variant="primary"
              icon={<PenLine size={16} />}
              onClick={() => openComposer()}
            >
              Write Note
            </KfButton>
          </div>
        </div>
      )}

      {/* Read Mode Dialog */}
      <dialog
        ref={readDialogRef}
        className="kf-journal-reader"
        aria-labelledby={activeReadEntry ? readerTitleId : undefined}
        aria-hidden={activeReadEntry ? undefined : true}
        onCancel={(e) => {
          e.preventDefault();
          closeReadMode();
        }}
        onClick={(e) => {
          if (e.target === readDialogRef.current) {
            closeReadMode();
          }
        }}
      >
        {activeReadEntry && (
          <div
            className="kf-journal-reader-frame"
            style={{ '--title-accent': readAccent } as React.CSSProperties}
          >
            <header className="kf-journal-reader-head">
              <div className="kf-journal-reader-subject">
                <div className={`kf-journal-reader-thumb is-${activeReadEntry.coverVariant}`}>
                  <CoverArt
                    title={activeReadEntry.title}
                    imageUrl={activeReadEntry.coverUrl}
                    accent={readAccent}
                    variant={activeReadEntry.coverVariant}
                    size="thumb"
                    onImageReady={onReadImageReady}
                    onCorsBlocked={onReadCorsBlocked}
                  />
                </div>
                <div className="kf-journal-reader-meta">
                  <div className="kf-journal-reader-badges">
                    <span className="kf-journal-kind-badge">
                      {renderKindIcon(activeReadEntry.normalizedKind)}
                      <span>{activeReadEntry.kindLabel}</span>
                    </span>
                    <ScoreTag score={activeReadEntry.rating} />
                  </div>
                  <h2 id={readerTitleId} className="kf-journal-reader-title">
                    {activeReadEntry.title}
                  </h2>
                  <p className="kf-journal-reader-context">
                    {activeReadEntry.context}
                    {activeReadEntry.dateLabel !== 'Undated'
                      ? ` · ${activeReadEntry.dateLabel}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="kf-journal-reader-top-right">
                <span className="kf-journal-reader-counter" aria-live="polite">
                  {readIndex + 1} of {filteredEntries.length}
                </span>
                <button
                  type="button"
                  className="kf-journal-reader-close"
                  onClick={closeReadMode}
                  aria-label="Close Read mode"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="kf-journal-reader-paper-wrap">
              <NotePaper slate={buildEntrySlate(activeReadEntry)}>
                <p className="kf-journal-reader-text">{activeReadEntry.note}</p>
              </NotePaper>
            </div>

            <footer className="kf-journal-reader-foot">
              <div className="kf-journal-reader-nav">
                <KfButton
                  variant="secondary"
                  icon={<ArrowLeft size={15} />}
                  disabled={readIndex <= 0}
                  onClick={goPrevRead}
                >
                  Previous
                </KfButton>
                <KfButton
                  variant="secondary"
                  icon={<ArrowRight size={15} />}
                  disabled={readIndex >= filteredEntries.length - 1}
                  onClick={goNextRead}
                >
                  Next
                </KfButton>
              </div>

              <div className="kf-journal-reader-actions">
                <KfButton
                  variant="secondary"
                  icon={<ImageDown size={15} />}
                  onClick={() => handleMakeEntryCard(activeReadEntry)}
                >
                  Make card
                </KfButton>

                <Link
                  viewTransition
                  to={activeReadEntry.href}
                  className="kf-btn is-secondary is-md kf-journal-open-link"
                  onClick={closeReadMode}
                >
                  <span>Open title</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>

                <KfButton
                  variant="primary"
                  icon={<PenLine size={15} />}
                  onClick={() => {
                    const target = activeReadEntry.composerTarget ?? undefined;
                    closeReadMode();
                    openComposer(target);
                  }}
                >
                  Add to note
                </KfButton>
              </div>
            </footer>
          </div>
        )}
      </dialog>
    </div>
  );
};
