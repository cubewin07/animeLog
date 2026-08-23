import React, { useState, useRef } from 'react';
import { Book } from '../types';
import { BookRow } from '../components/BookRow';
import { Plus, BookOpen, BookMarked } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

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
  onEdit,
  onDelete,
  onProgressDelta,
  onOpenNewModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const filterTabs: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Books', count: bookList.length },
    {
      id: 'READING',
      label: 'Reading',
      count: bookList.filter((b) => b.status === 'READING').length,
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: bookList.filter((b) => b.status === 'COMPLETED').length,
    },
    {
      id: 'PLAN_TO_READ',
      label: 'Plan to Read',
      count: bookList.filter((b) => b.status === 'PLAN_TO_READ').length,
    },
    {
      id: 'ON_HOLD',
      label: 'On Hold',
      count: bookList.filter((b) => b.status === 'ON_HOLD').length,
    },
    {
      id: 'DROPPED',
      label: 'Dropped',
      count: bookList.filter((b) => b.status === 'DROPPED').length,
    },
  ];

  const filtered = bookList.filter((book) => {
    const matchesStatus = selectedStatus === 'ALL' || book.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.notes && book.notes.toLowerCase().includes(q)) ||
      (book.genres && book.genres.some((g) => g.name.toLowerCase().includes(q)));

    return matchesStatus && matchesSearch;
  });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentAreaRef.current) return;
      const rows = contentAreaRef.current.querySelectorAll('.desk-card');
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.04,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: contentAreaRef, dependencies: [selectedStatus, filtered.length, searchQuery] }
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="display-title" style={{ color: 'var(--text-desk)', marginBottom: 4 }}>
            Book Journal
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-desk-muted)' }}>
            Track pages read, philosophical insights, and life lessons from books.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewModal}>
          <Plus size={15} />
          <span>Log Book</span>
        </button>
      </div>

      <div className="filter-chip-row" role="tablist" aria-label="Filter by status">
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
            >
              <span>{tab.label}</span>
              <span className="chip-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Book Rows List */}
      <div ref={contentAreaRef}>
        {filtered.length === 0 ? (
          <div
            className="desk-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <BookMarked size={36} color="var(--graphite)" />
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>No books found</h3>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic', maxWidth: 460 }}>
              {searchQuery
                ? `No books match "${searchQuery}". Try refining your search query.`
                : 'No book entries under this filter yet. Begin recording your reading lessons.'}
            </p>
            {!searchQuery && (
              <button onClick={onOpenNewModal} className="btn btn-primary" style={{ marginTop: 8 }}>
                <Plus size={15} />
                <span>Log first book</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filtered.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                onOpenDetail={onOpenDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                onProgressDelta={onProgressDelta}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
