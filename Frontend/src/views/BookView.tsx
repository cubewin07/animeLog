import React, { useState, useRef } from 'react';
import { Book } from '../types';
import { BookCard } from '../components/BookCard';
import { Plus, BookOpen } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface BookViewProps {
  bookList: Book[];
  searchQuery: string;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
  onOpenNewModal: () => void;
}

export const BookView: React.FC<BookViewProps> = ({
  bookList,
  searchQuery,
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
    const matchesSearch =
      searchQuery.trim() === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (book.notes && book.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (book.genres && book.genres.some((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesStatus && matchesSearch;
  });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentAreaRef.current) return;

      const cards = contentAreaRef.current.querySelectorAll('.book-grid-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 16, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: EASING.smooth,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: contentAreaRef, dependencies: [selectedStatus, filtered.length, searchQuery] }
  );

  return (
    <div>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', color: '#ffffff' }}>Book Journal</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track pages read, philosophical insights, and life lessons from books.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewModal}>
          <Plus size={16} /> Log Book
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px',
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-accent-cyan)' : 'var(--border-subtle)',
                background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(18, 33, 49, 0.6)',
                color: isActive ? 'var(--color-accent-cyan)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  background: isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div ref={contentAreaRef}>
        {filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <BookOpen size={36} color="var(--color-accent-cyan)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '17px', color: '#ffffff', marginBottom: '6px' }}>
              No Books Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 16px' }}>
              {searchQuery
                ? `No books match "${searchQuery}". Try refining your search query.`
                : 'There are no book entries under this filter yet.'}
            </p>
            <button className="btn btn-secondary" onClick={onOpenNewModal}>
              <Plus size={15} /> Log Your First Book
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((book) => (
              <div key={book.id} className="book-grid-card">
                <BookCard
                  book={book}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onProgressDelta={onProgressDelta}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
