import React, { useState } from 'react';
import { Book } from '../types';
import { DetailIdentity, MoreMenuItem } from '../components/DetailIdentity';
import { TakeawaySlip } from '../components/TakeawaySlip';
import { AboutTitle } from '../components/AboutTitle';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface BookDetailViewProps {
  book: Book;
  onBack: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onProgressDelta: (id: number, delta: number) => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  onBack,
  onEdit,
  onDelete,
  onProgressDelta,
}) => {
  const [lessonExpanded, setLessonExpanded] = useState(false);
  const coverUrl = book.cover_image_url || (book.cover_image as any)?.image_url;

  const moreMenuItems: MoreMenuItem[] = [
    {
      label: 'Delete Book',
      icon: <Trash2 size={13} />,
      onClick: () => onDelete(book.id),
      danger: true,
    },
  ];

  return (
    <div className="detail-page">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            fontSize: 14,
            color: 'var(--text-desk-muted)',
          }}
          aria-label="Back to book journal"
        >
          <ArrowLeft size={16} />
          <span>Back to Book Journal</span>
        </button>
      </div>

      {/* 1. Identity Band */}
      <DetailIdentity
        type="book"
        title={book.title}
        coverUrl={coverUrl}
        status={book.status}
        rating={book.rating}
        author={book.author}
        releaseLabel="Book"
        progress={book.progress || 0}
        totalUnits={book.total_pages}
        unitLabel="pages"
        onProgressDelta={(delta) => onProgressDelta(book.id, delta)}
        progressStep={10}
        progressTone="reading"
        ariaLabelPrefix={`${book.title} pages`}
        onEditRelease={() => onEdit(book)}
        moreMenuItems={moreMenuItems}
      />

      {/* 2. One Clamped Lesson Sheet */}
      <section className="detail-section-takeaway">
        <TakeawaySlip
          isDetail
          className="lesson-sheet"
          clamped={!lessonExpanded}
          onToggleClamp={() => setLessonExpanded(!lessonExpanded)}
          status={book.status}
          label="Book Lesson"
          text={book.notes}
          onWrite={() => onEdit(book)}
          emptyText="No lesson captured yet."
          emptyCtaText="Write the lesson"
        />
      </section>

      {/* 3. About this title */}
      <AboutTitle
        format="Literature / Book"
        author={book.author}
        genres={book.genres}
        startDate={book.start_date}
        finishDate={book.finish_date}
        totalPages={book.total_pages}
        onEdit={() => onEdit(book)}
        editLabel="Edit Book Details"
      />
    </div>
  );
};
