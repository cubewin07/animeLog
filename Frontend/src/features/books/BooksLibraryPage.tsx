import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  PenLine,
  Plus,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { LibraryTabs } from '../../shell/LibraryTabs';
import { useJournalActions, useJournalData } from '../../state/JournalContext';
import { useCoverAccent } from '../../lib/color/useCoverAccent';
import { CoverArt, KfButton, NotePaper, ScoreTag, StatusTag } from '../../ui/keyframe';
import {
  BOOK_STATUS_DEFS,
  type BookItem,
  type BookSort,
  type BookStatusFilter,
  type BookViewMode,
  buildBookItems,
  clampedBookDelta,
  collectBookStatusCounts,
  filterAndSortBooks,
  groupBooksByYear,
  matchesBookFacetAndQuery,
  selectBookHallOfFame,
} from './booksUtils';
import '../../styles/keyframe.css';
import './Books.css';

const VALID_STATUSES = new Set<BookStatusFilter>(BOOK_STATUS_DEFS.map((d) => d.id));
const VALID_SORTS = new Set<BookSort>(['recent', 'rating', 'title', 'author', 'note']);
const VALID_VIEWS = new Set<BookViewMode>(['grid', 'list', 'year', 'fame']);

function parseNumericFilter(raw: string | null): number | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL';
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 'ALL';
}

interface BookGridCardProps {
  item: BookItem;
  onQuickStep: (item: BookItem, delta: number) => void;
}

const BookGridCard: React.FC<BookGridCardProps> = ({ item, onQuickStep }) => {
  const { book, coverUrl, progressPercent, progressLabel, hasNote } = item;
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(book.title, coverUrl);

  const stepDelta = book.status === 'READING' ? clampedBookDelta(book, 10) : 0;
  const hasBar = Boolean(book.total_pages && book.total_pages > 0);

  return (
    <div className="kf-books-card" style={{ '--title-accent': accent } as React.CSSProperties}>
      <Link
        viewTransition
        to={`/books/${book.id}`}
        className="kf-books-poster"
      >
        <div className="kf-books-poster-art">
          <CoverArt
            title={book.title}
            imageUrl={coverUrl}
            accent={accent}
            variant="poster"
            size="card"
            onImageReady={onImageReady}
            onCorsBlocked={onCorsBlocked}
          />
          <div className="kf-books-poster-score">
            <ScoreTag score={book.rating} />
          </div>
          {!hasNote && (
            <span className="kf-books-poster-pencil" title="No note yet">
              <PenLine size={14} aria-label="No note yet" />
            </span>
          )}
          {hasNote && book.notes && <p className="kf-books-poster-note">{book.notes}</p>}
        </div>

        <div className={`kf-books-poster-bar ${hasBar ? '' : 'is-empty'}`} aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <h3 className="kf-books-poster-title">{book.title}</h3>
        {book.author && <p className="kf-books-poster-author">by {book.author}</p>}

        <div className="kf-books-poster-meta">
          <StatusTag status={book.status} />
          <span className="kf-books-poster-pages">{progressLabel}</span>
        </div>
      </Link>

      {stepDelta > 0 && (
        <button
          type="button"
          className="kf-books-card-step"
          onClick={() => onQuickStep(item, stepDelta)}
          aria-label={`Add ${stepDelta} pages to ${book.title}`}
          title={`Add ${stepDelta} pages`}
        >
          +{stepDelta}p
        </button>
      )}
    </div>
  );
};

interface BookListRowProps {
  item: BookItem;
  onQuickStep: (item: BookItem, delta: number) => void;
  onWriteNote: (item: BookItem) => void;
}

const BookListRow: React.FC<BookListRowProps> = ({ item, onQuickStep, onWriteNote }) => {
  const { book, coverUrl, progressPercent, progressLabel, hasNote, year } = item;
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(book.title, coverUrl);

  const stepDelta = book.status === 'READING' ? clampedBookDelta(book, 10) : 0;
  const hasBar = Boolean(book.total_pages && book.total_pages > 0);
  const subParts = [book.author ? `by ${book.author}` : null, year ? String(year) : null].filter(Boolean);

  return (
    <article
      className="kf-books-list-row"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <Link
        viewTransition
        to={`/books/${book.id}`}
        className="kf-books-list-thumb"
        aria-label={`Open ${book.title}`}
      >
        <CoverArt
          title={book.title}
          imageUrl={coverUrl}
          accent={accent}
          variant="poster"
          size="thumb"
          onImageReady={onImageReady}
          onCorsBlocked={onCorsBlocked}
        />
      </Link>

      <div className="kf-books-list-main">
        <div className="kf-books-list-title-row">
          <Link viewTransition to={`/books/${book.id}`} className="kf-books-list-title">
            {book.title}
          </Link>
          {subParts.length > 0 && <span className="kf-books-list-sub">{subParts.join(' · ')}</span>}
        </div>

        <div className="kf-books-list-status-row">
          <StatusTag status={book.status} />
          <div className="kf-books-list-progress">
            <span className="kf-books-list-progress-text">{progressLabel}</span>
            {hasBar && (
              <div className="kf-books-list-bar" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        </div>

        {hasNote && book.notes && (
          <p className="kf-books-list-note" title={book.notes}>
            “{book.notes}”
          </p>
        )}
      </div>

      <div className="kf-books-list-actions">
        <ScoreTag score={book.rating} />

        {!hasNote && (
          <button
            type="button"
            className="kf-books-list-icon-btn"
            onClick={() => onWriteNote(item)}
            aria-label={`Write a note for ${book.title}`}
            title="Write a note"
          >
            <PenLine size={15} aria-hidden="true" />
          </button>
        )}

        {stepDelta > 0 && (
          <button
            type="button"
            className="kf-books-list-step-btn"
            onClick={() => onQuickStep(item, stepDelta)}
            aria-label={`Add ${stepDelta} pages to ${book.title}`}
            title={`Add ${stepDelta} pages`}
          >
            +{stepDelta}p
          </button>
        )}
      </div>
    </article>
  );
};

interface BookHallOfFameCardProps {
  item: BookItem;
  onWriteNote: (item: BookItem) => void;
}

const BookHallOfFameCard: React.FC<BookHallOfFameCardProps> = ({ item, onWriteNote }) => {
  const { book, coverUrl, year, hasNote } = item;
  const { accent, onImageReady, onCorsBlocked } = useCoverAccent(book.title, coverUrl);
  const slate = [
    '10 / 10',
    book.author ? `by ${book.author}` : null,
    year ? String(year) : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <article
      className="kf-books-fame-card"
      style={{ '--title-accent': accent } as React.CSSProperties}
    >
      <div className="kf-books-fame-head">
        <Link
          viewTransition
          to={`/books/${book.id}`}
          className="kf-books-fame-cover"
          aria-label={`Open ${book.title}`}
        >
          <CoverArt
            title={book.title}
            imageUrl={coverUrl}
            accent={accent}
            variant="poster"
            size="card"
            onImageReady={onImageReady}
            onCorsBlocked={onCorsBlocked}
          />
        </Link>

        <div className="kf-books-fame-info">
          <div className="kf-books-fame-badges">
            <ScoreTag score={10} />
            <span className="kf-books-fame-crown">
              <Trophy size={13} aria-hidden="true" />
              <span>Hall of Fame</span>
            </span>
          </div>

          <h3 className="kf-books-fame-title">
            <Link viewTransition to={`/books/${book.id}`}>
              {book.title}
            </Link>
          </h3>

          {book.author && <p className="kf-books-fame-author">by {book.author}</p>}

          <div className="kf-books-fame-meta">
            <StatusTag status={book.status} />
            <span>{item.progressLabel}</span>
            {year && <span>· {year}</span>}
          </div>
        </div>
      </div>

      <NotePaper slate={slate}>
        {hasNote && book.notes ? (
          <p className="kf-books-fame-quote">“{book.notes.trim()}”</p>
        ) : (
          <div className="kf-books-fame-no-note">
            <p>A 10/10 without a written note yet — capture what stayed with you.</p>
            <KfButton
              variant="secondary"
              icon={<PenLine size={14} />}
              onClick={() => onWriteNote(item)}
            >
              Write note
            </KfButton>
          </div>
        )}
      </NotePaper>
    </article>
  );
};

export const BooksLibraryPage: React.FC = () => {
  const { loading, loadFailed, bookList, genres, activityList } = useJournalData();
  const {
    retryLoad,
    handleBookProgressDelta,
    openNewBookModal,
    openComposer,
  } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'ALL';
  const selectedStatus: BookStatusFilter = VALID_STATUSES.has(rawStatus as BookStatusFilter)
    ? (rawStatus as BookStatusFilter)
    : 'ALL';

  const selectedGenre = parseNumericFilter(searchParams.get('genre'));
  const filterText = searchParams.get('q') ?? '';

  const rawSort = searchParams.get('sort');
  const normalizedSort = rawSort === 'lesson' ? 'note' : rawSort || 'recent';
  const sortBy: BookSort = VALID_SORTS.has(normalizedSort as BookSort)
    ? (normalizedSort as BookSort)
    : 'recent';

  const rawView = searchParams.get('view');
  const normalizedView = rawView === 'shelf' ? 'grid' : rawView || 'grid';
  const viewMode: BookViewMode = VALID_VIEWS.has(normalizedView as BookViewMode)
    ? (normalizedView as BookViewMode)
    : 'grid';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    next.delete('genre');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const allItems = useMemo(
    () => buildBookItems(bookList, activityList),
    [bookList, activityList],
  );

  // Status pill counts reflect books matching active genre and search filters
  const facetFilteredBooks = useMemo(
    () =>
      allItems
        .filter((item) =>
          matchesBookFacetAndQuery(item, {
            genreId: selectedGenre,
            q: filterText,
          }),
        )
        .map((item) => item.book),
    [allItems, selectedGenre, filterText],
  );

  const statusTabs = useMemo(
    () =>
      collectBookStatusCounts(facetFilteredBooks).filter(
        (tab) => tab.count > 0 || tab.id === 'ALL' || tab.id === selectedStatus,
      ),
    [facetFilteredBooks, selectedStatus],
  );

  const filteredItems = useMemo(
    () =>
      filterAndSortBooks(allItems, {
        status: selectedStatus,
        genreId: selectedGenre,
        q: filterText,
        sort: sortBy,
      }),
    [allItems, selectedStatus, selectedGenre, filterText, sortBy],
  );

  const genreOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of genres) map.set(g.id, g.name);
    for (const b of bookList) {
      for (const g of b.genres ?? []) map.set(g.id, g.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [genres, bookList]);

  const yearGroups = useMemo(
    () => (viewMode === 'year' ? groupBooksByYear(filteredItems) : []),
    [viewMode, filteredItems],
  );

  const allHallOfFame = useMemo(() => selectBookHallOfFame(allItems), [allItems]);
  const visibleHallOfFame = useMemo(
    () => (viewMode === 'fame' ? selectBookHallOfFame(filteredItems) : []),
    [viewMode, filteredItems],
  );

  const hasActiveFilters =
    selectedStatus !== 'ALL' ||
    selectedGenre !== 'ALL' ||
    filterText.trim().length > 0;

  const handleQuickStep = (item: BookItem, delta: number) => {
    handleBookProgressDelta(item.book.id, delta);
  };

  const handleWriteNote = (item: BookItem) => {
    openComposer({
      targetKind: 'book',
      id: item.book.id,
      title: item.book.title,
      context: item.book.author || undefined,
      defaultKind: 'lesson',
    });
  };

  return (
    <div className="kf kf-books">
      <LibraryTabs />

      <header className="kf-books-header">
        <div>
          <h1 className="kf-books-title">Books</h1>
          <p className="kf-books-desc">
            Books you’ve read, notes and takeaways you kept.
          </p>
        </div>

        <KfButton variant="primary" icon={<Plus size={16} />} onClick={openNewBookModal}>
          Add Book
        </KfButton>
      </header>

      <section className="kf-books-toolbar" aria-label="Book library filters and display options">
        <div className="kf-books-status-bar" role="group" aria-label="Filter by status">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`kf-books-status-pill ${selectedStatus === tab.id ? 'is-active' : ''}`}
              aria-pressed={selectedStatus === tab.id}
              onClick={() => updateParam('status', tab.id, 'ALL')}
            >
              <span>{tab.label}</span>
              <span className="kf-books-pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="kf-books-controls">
          <div className="kf-books-search">
            <Search size={15} className="kf-books-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search books, authors, or notes…"
              aria-label="Search books, authors, or notes"
              value={filterText}
              onChange={(e) => updateParam('q', e.target.value, '')}
            />
            {filterText && (
              <button
                type="button"
                className="kf-books-search-clear"
                onClick={() => updateParam('q', '', '')}
                aria-label="Clear search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="kf-books-selects">
            <select
              className="kf-books-select"
              value={String(selectedGenre)}
              onChange={(e) => updateParam('genre', e.target.value, 'ALL')}
              aria-label="Filter by genre"
            >
              <option value="ALL">All genres</option>
              {genreOptions.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              className="kf-books-select"
              value={sortBy}
              onChange={(e) => updateParam('sort', e.target.value, 'recent')}
              aria-label="Sort books"
            >
              <option value="recent">Last activity</option>
              <option value="rating">Rating (highest)</option>
              <option value="title">Title (A–Z)</option>
              <option value="author">Author (A–Z)</option>
              <option value="note">Has note</option>
            </select>
          </div>

          <div className="kf-books-views" role="group" aria-label="Shelf view">
            <button
              type="button"
              className={`kf-books-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              onClick={() => updateParam('view', 'grid', 'grid')}
            >
              <LayoutGrid size={15} aria-hidden="true" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`kf-books-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'list'}
              onClick={() => updateParam('view', 'list', 'grid')}
            >
              <ListIcon size={15} aria-hidden="true" />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`kf-books-view-btn ${viewMode === 'year' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'year'}
              onClick={() => updateParam('view', 'year', 'grid')}
            >
              <Calendar size={15} aria-hidden="true" />
              <span>By Year</span>
            </button>
            <button
              type="button"
              className={`kf-books-view-btn is-fame ${viewMode === 'fame' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'fame'}
              onClick={() => updateParam('view', 'fame', 'grid')}
            >
              <Trophy size={15} aria-hidden="true" />
              <span>Hall of Fame</span>
            </button>
          </div>
        </div>
      </section>

      {loading && bookList.length === 0 ? (
        <div className="kf-books-grid" aria-label="Loading book library">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="kf-books-skeleton" />
          ))}
        </div>
      ) : loadFailed && bookList.length === 0 ? (
        <div className="kf-books-empty" role="alert">
          <div className="kf-books-empty-icon">
            <AlertCircle size={24} aria-hidden="true" />
          </div>
          <h2>Couldn’t load your books</h2>
          <p>Check that the backend server is running, then try again.</p>
          <KfButton variant="primary" onClick={retryLoad}>
            Retry
          </KfButton>
        </div>
      ) : bookList.length === 0 ? (
        <div className="kf-books-empty">
          <div className="kf-books-empty-icon">
            <BookOpen size={24} aria-hidden="true" />
          </div>
          <h2>Your book shelf is ready</h2>
          <p>Add your first book to track pages and keep the takeaways that stayed with you.</p>
          <KfButton variant="primary" icon={<Plus size={16} />} onClick={openNewBookModal}>
            Add Book
          </KfButton>
        </div>
      ) : viewMode === 'fame' ? (
        allHallOfFame.length === 0 ? (
          <div className="kf-books-empty is-fame">
            <div className="kf-books-empty-icon is-fame">
              <Trophy size={24} aria-hidden="true" />
            </div>
            <h2>Hall of Fame</h2>
            <p>Rate a book 10/10 to place it in your Hall of Fame</p>
            <KfButton variant="secondary" onClick={() => updateParam('view', 'grid', 'grid')}>
              Browse all books
            </KfButton>
          </div>
        ) : visibleHallOfFame.length === 0 ? (
          <div className="kf-books-empty is-fame">
            <div className="kf-books-empty-icon is-fame">
              <Trophy size={24} aria-hidden="true" />
            </div>
            <h2>No 10/10 books match these filters</h2>
            <p>Clear your active search or filters to see your Hall of Fame collection.</p>
            <KfButton variant="secondary" onClick={clearAllFilters}>
              Clear filters
            </KfButton>
          </div>
        ) : (
          <section className="kf-books-fame-wrap" aria-label="Hall of Fame 10/10 books">
            <div className="kf-books-fame-banner">
              <div className="kf-books-fame-banner-title">
                <Trophy size={18} aria-hidden="true" />
                <h2>Hall of Fame</h2>
                <span className="kf-books-fame-count">{visibleHallOfFame.length}</span>
              </div>
              <p>Your 10/10 books and the words you kept from them.</p>
            </div>
            <div className="kf-books-fame-grid">
              {visibleHallOfFame.map((item) => (
                <BookHallOfFameCard
                  key={item.book.id}
                  item={item}
                  onWriteNote={handleWriteNote}
                />
              ))}
            </div>
          </section>
        )
      ) : filteredItems.length === 0 ? (
        <div className="kf-books-empty">
          <div className="kf-books-empty-icon">
            <BookOpen size={24} aria-hidden="true" />
          </div>
          <h2>No books matched</h2>
          <p>
            {filterText
              ? `No books or notes matched “${filterText}”.`
              : 'Try adjusting your status or genre filters.'}
          </p>
          {hasActiveFilters && (
            <KfButton variant="secondary" onClick={clearAllFilters}>
              Clear filters
            </KfButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="kf-books-grid">
          {filteredItems.map((item) => (
            <BookGridCard key={item.book.id} item={item} onQuickStep={handleQuickStep} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="kf-books-list">
          {filteredItems.map((item) => (
            <BookListRow
              key={item.book.id}
              item={item}
              onQuickStep={handleQuickStep}
              onWriteNote={handleWriteNote}
            />
          ))}
        </div>
      ) : (
        <div className="kf-books-years">
          {yearGroups.map((group) => (
            <section
              key={group.yearLabel}
              className="kf-books-year-group"
              aria-labelledby={`kf-books-year-${group.yearLabel}`}
            >
              <div className="kf-books-year-head">
                <h2 id={`kf-books-year-${group.yearLabel}`}>{group.yearLabel}</h2>
                <span className="kf-books-year-count">{group.items.length}</span>
              </div>
              <div className="kf-books-grid">
                {group.items.map((item) => (
                  <BookGridCard key={item.book.id} item={item} onQuickStep={handleQuickStep} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
