import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Book } from '../types';
import { useJournalActions } from '../state/JournalContext';
import { Cover, StatusMark, Rating, Button, EmptyState } from '../ui';
import {
  BookOpen,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  PenLine,
} from 'lucide-react';
import '../features/library/Library.css';

interface BookViewProps {
  bookList: Book[];
  searchQuery: string;
  onOpenDetail?: (bookId: number) => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
  onOpenNewModal: () => void;
}

export const BookView: React.FC<BookViewProps> = ({
  bookList,
  searchQuery,
  onOpenNewModal,
}) => {
  const { openComposer } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedStatus = searchParams.get('status') || 'ALL';
  const filterText = searchParams.get('q') ?? (searchQuery || '');
  const sortBy = (searchParams.get('sort') as 'recent' | 'rating' | 'title' | 'note' | 'lesson') || 'recent';
  const viewMode = (searchParams.get('view') as 'shelf' | 'list') || 'shelf';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const filterTabs = useMemo(() => {
    const count = (id: string) => bookList.filter((b) => b.status === id).length;
    const tabs = [
      { id: 'ALL', label: 'All', count: bookList.length },
      { id: 'READING', label: 'Reading', count: count('READING') },
      { id: 'COMPLETED', label: 'Completed', count: count('COMPLETED') },
      { id: 'PLAN_TO_READ', label: 'Plan to read', count: count('PLAN_TO_READ') },
      { id: 'ON_HOLD', label: 'On hold', count: count('ON_HOLD') },
      { id: 'DROPPED', label: 'Dropped', count: count('DROPPED') },
    ];
    return tabs.filter((tab) => tab.count > 0 || tab.id === 'ALL' || tab.id === selectedStatus);
  }, [bookList, selectedStatus]);

  const filtered = useMemo(() => {
    return bookList
      .filter((book) => {
        const matchesStatus =
          selectedStatus === 'ALL' || book.status === selectedStatus;
        const matchesSearch =
          !filterText.trim() ||
          book.title.toLowerCase().includes(filterText.toLowerCase()) ||
          book.author?.toLowerCase().includes(filterText.toLowerCase()) ||
          book.notes?.toLowerCase().includes(filterText.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'note' || sortBy === 'lesson') return (b.notes ? 1 : 0) - (a.notes ? 1 : 0);
        return b.id - a.id;
      });
  }, [bookList, selectedStatus, filterText, sortBy]);

  return (
    <div className="lamplight-library">
      {/* Header */}
      <header className="lamplight-library-header">
        <div>
          <h1 className="lamplight-library-title">Books</h1>
          <p className="lamplight-library-desc">
            Books read, reading progress, and the notes you kept from each book.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={onOpenNewModal}
        >
          Add Book
        </Button>
      </header>

      {/* Toolbar */}
      <div className="lamplight-library-toolbar">
        {/* Status Filters */}
        <div className="lamplight-library-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`lamplight-status-pill ${selectedStatus === tab.id ? 'is-active' : ''}`}
              onClick={() => updateParam('status', tab.id, 'ALL')}
            >
              <span>{tab.label}</span>
              <span className="lamplight-pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tools: Search, Sort & View Mode */}
        <div className="lamplight-library-tools">
          <div className="lamplight-library-search">
            <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Search books or notes…"
              value={filterText}
              onChange={(e) => updateParam('q', e.target.value, '')}
            />
          </div>

          <select
            value={sortBy === 'lesson' ? 'note' : sortBy}
            onChange={(e) => updateParam('sort', e.target.value, 'recent')}
            aria-label="Sort books"
            style={{
              height: 36,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              padding: '0 10px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="recent">Recently added</option>
            <option value="rating">Rating (Highest)</option>
            <option value="title">Title (A-Z)</option>
            <option value="note">Has note</option>
          </select>

          <div className="lamplight-view-toggle">
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'shelf' ? 'is-active' : ''}`}
              onClick={() => updateParam('view', 'shelf', 'shelf')}
              title="Shelf Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => updateParam('view', 'list', 'shelf')}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filtered.length ? (
        viewMode === 'shelf' ? (
          <div className="lamplight-shelf-grid">
            {filtered.map((book) => {
              const coverUrl = book.cover_image_url || book.image_url;
              return (
                <Link
                  key={book.id}
                  viewTransition
                  to={`/books/${book.id}`}
                  className="lamplight-card"
                >
                  <div className="lamplight-card-cover-wrap">
                    <Cover
                      title={book.title}
                      subtitle={book.author}
                      imageUrl={coverUrl}
                      variant="book"
                    />

                    <div className="lamplight-card-badges">
                      <StatusMark status={book.status} />
                      {book.rating && <Rating score={book.rating} />}
                    </div>
                  </div>

                  <div className="lamplight-card-body">
                    <h3 className="lamplight-card-title">{book.title}</h3>
                    <span className="lamplight-card-context">
                      {book.author ? `by ${book.author}` : 'Book'}
                      {book.total_pages ? ` · ${book.progress} / ${book.total_pages} pages` : ''}
                    </span>

                    {book.notes ? (
                      <div className="lamplight-card-lesson" title={book.notes}>
                        “{book.notes}”
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="lamplight-card-empty-lesson"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openComposer({
                            targetKind: 'book',
                            id: book.id,
                            title: book.title,
                            context: book.author || undefined,
                            defaultKind: 'lesson',
                          });
                        }}
                      >
                        <PenLine size={13} />
                        <span>Add note</span>
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="lamplight-list-wrap">
            {filtered.map((book) => {
              const coverUrl = book.cover_image_url || book.image_url;
              return (
                <Link
                  key={book.id}
                  viewTransition
                  to={`/books/${book.id}`}
                  className="lamplight-list-row"
                >
                  <div className="lamplight-list-left">
                    <div style={{ width: 44, height: 64, flexShrink: 0 }}>
                      <Cover
                        title={book.title}
                        subtitle={book.author}
                        imageUrl={coverUrl}
                        variant="book"
                      />
                    </div>
                    <div className="lamplight-list-title-wrap">
                      <h3 className="lamplight-list-title">{book.title}</h3>
                      <span className="lamplight-list-sub">
                        {book.author ? `by ${book.author}` : 'Book'}
                      </span>
                    </div>
                  </div>

                  {book.notes && (
                    <p className="lamplight-list-lesson">“{book.notes}”</p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <StatusMark status={book.status} />
                    {book.rating && <Rating score={book.rating} />}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No books found"
          description={filterText ? `No books matched "${filterText}".` : "Your book library is waiting for its first title."}
          action={
            <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenNewModal}>
              Add book
            </Button>
          }
        />
      )}
    </div>
  );
};
