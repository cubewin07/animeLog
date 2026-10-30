import React, { useState, useMemo } from 'react';
import { Book } from '../types';
import { useJournal } from '../state/JournalContext';
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
  onOpenDetail,
  onOpenNewModal,
}) => {
  const { openComposer } = useJournal();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterText, setFilterText] = useState(searchQuery || '');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title' | 'lesson'>('recent');
  const [viewMode, setViewMode] = useState<'shelf' | 'list'>('shelf');

  const filterTabs = useMemo(() => {
    return [
      { id: 'ALL', label: 'All', count: bookList.length },
      {
        id: 'READING',
        label: 'Reading',
        count: bookList.filter((b) => b.status === 'READING').length,
      },
      {
        id: 'COMPLETED',
        label: 'Finished',
        count: bookList.filter((b) => b.status === 'COMPLETED').length,
      },
      {
        id: 'PLAN_TO_READ',
        label: 'Up next',
        count: bookList.filter((b) => b.status === 'PLAN_TO_READ').length,
      },
    ];
  }, [bookList]);

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
        if (sortBy === 'lesson') return (b.notes ? 1 : 0) - (a.notes ? 1 : 0);
        return b.id - a.id;
      });
  }, [bookList, selectedStatus, filterText, sortBy]);

  return (
    <div className="lamplight-library">
      {/* Header */}
      <header className="lamplight-library-header">
        <div>
          <h1 className="lamplight-library-title">Book Journal</h1>
          <p className="lamplight-library-desc">
            Pages read, philosophical insights, and life lessons kept from books.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={onOpenNewModal}
        >
          Log Book
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
              onClick={() => setSelectedStatus(tab.id)}
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
              placeholder="Search books or insights…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
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
            <option value="lesson">Has reflection</option>
          </select>

          <div className="lamplight-view-toggle">
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'shelf' ? 'is-active' : ''}`}
              onClick={() => setViewMode('shelf')}
              title="Shelf Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`lamplight-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setViewMode('list')}
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
                <article
                  key={book.id}
                  className="lamplight-card"
                  onClick={() => onOpenDetail?.(book.id)}
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
                        <span>Write what stayed</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="lamplight-list-wrap">
            {filtered.map((book) => {
              const coverUrl = book.cover_image_url || book.image_url;
              return (
                <div
                  key={book.id}
                  className="lamplight-list-row"
                  onClick={() => onOpenDetail?.(book.id)}
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
                </div>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No books found"
          description={filterText ? `No books matched "${filterText}".` : "Your book journal is waiting for its first title."}
          action={
            <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenNewModal}>
              Log a book
            </Button>
          }
        />
      )}
    </div>
  );
};
