import React, { useState, useRef } from 'react';
import { X, Search, Star, Copy, Check, PenLine, ChevronRight, BookOpen, Tv, Film, UsersRound, RotateCcw, Image as ImageIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';
import { downloadQuoteCard } from '../utils/cardGenerator';

export type LessonKind = 'season' | 'film' | 'episode' | 'rewatch' | 'book' | 'character';

export interface ReadingRoomLesson {
  id: string;
  kind: LessonKind;
  title: string;
  context: string;
  note: string;
  rating?: number | null;
  timestamp: number;
  open: () => void;
}

interface ReadingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: ReadingRoomLesson[];
  onToast?: (text: string, type?: 'success' | 'error') => void;
}

const kindIcons: Record<LessonKind, React.ReactNode> = {
  season: <Tv size={14} />,
  film: <Film size={14} />,
  episode: <Tv size={14} />,
  book: <BookOpen size={14} />,
  rewatch: <RotateCcw size={14} />,
  character: <UsersRound size={14} />,
};

export const ReadingRoomModal: React.FC<ReadingRoomModalProps> = ({
  isOpen,
  onClose,
  lessons,
  onToast,
}) => {
  const [selectedKind, setSelectedKind] = useState<'ALL' | LessonKind>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isOpen || prefersReducedMotion()) return;
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.96, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: EASING.smooth }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  if (!isOpen) return null;

  const filtered = lessons.filter((lesson) => {
    if (selectedKind !== 'ALL' && lesson.kind !== selectedKind) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      lesson.title.toLowerCase().includes(q) ||
      lesson.context.toLowerCase().includes(q) ||
      lesson.note.toLowerCase().includes(q)
    );
  });

  const handleCopyQuote = (lesson: ReadingRoomLesson) => {
    const text = `“${lesson.note}”\n— ${lesson.title} (${lesson.context})${lesson.rating ? ` [${lesson.rating}/10]` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(lesson.id);
    if (onToast) onToast('Copied lesson quote to clipboard');
    setTimeout(() => setCopiedId(null), 2200);
  };

  const kindFilters: { id: 'ALL' | LessonKind; label: string }[] = [
    { id: 'ALL', label: `All (${lessons.length})` },
    { id: 'season', label: `Seasons (${lessons.filter((l) => l.kind === 'season').length})` },
    { id: 'episode', label: `Episodes (${lessons.filter((l) => l.kind === 'episode').length})` },
    { id: 'film', label: `Films (${lessons.filter((l) => l.kind === 'film').length})` },
    { id: 'book', label: `Books (${lessons.filter((l) => l.kind === 'book').length})` },
    { id: 'rewatch', label: `Returns (${lessons.filter((l) => l.kind === 'rewatch').length})` },
    { id: 'character', label: `Characters (${lessons.filter((l) => l.kind === 'character').length})` },
  ];

  return (
    <div ref={overlayRef} className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="modal-container"
        style={{ maxWidth: '820px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <p className="desk-eyebrow" style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenLine size={13} /> the reading room archive
            </p>
            <h3 style={{ fontSize: 20, color: 'var(--text-desk)', margin: 0, fontFamily: 'var(--font-serif)' }}>
              All Recorded Thoughts & Lessons
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Filter bar & search */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-desk-subtle)',
            background: 'var(--desk-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Search input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-desk-dim)' }} />
            <input
              type="text"
              placeholder="Search thoughts, ideas, titles, or characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 13 }}
            />
          </div>

          {/* Kind filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {kindFilters.map((tab) => {
              const active = selectedKind === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setSelectedKind(tab.id)}
                  className={`filter-chip ${active ? 'active' : ''}`}
                  style={{ fontSize: 12, padding: '3px 10px' }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lessons List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-desk-muted)' }}>
              <PenLine size={32} color="var(--graphite)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 15, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                No lessons found matching your filters.
              </p>
            </div>
          ) : (
            filtered.map((lesson) => (
              <article
                key={lesson.id}
                className="desk-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  background: 'var(--desk-surface)',
                  border: '1px solid var(--border-desk-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        color: 'var(--tungsten)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {kindIcons[lesson.kind]} {lesson.kind}
                    </span>
                    <span style={{ color: 'var(--border-desk-medium)' }}>·</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-desk)' }}>{lesson.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-desk-muted)' }}>({lesson.context})</span>
                  </div>

                  {lesson.rating && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--tungsten)',
                      }}
                    >
                      <Star size={12} fill="currentColor" /> {lesson.rating}/10
                    </span>
                  )}
                </div>

                <blockquote
                  style={{
                    margin: 0,
                    padding: '8px 14px',
                    borderLeft: '2px solid var(--tungsten)',
                    background: 'var(--desk-raised)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text-desk)',
                    fontStyle: 'italic',
                  }}
                >
                  “{lesson.note}”
                </blockquote>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 2 }}>
                  <button
                    type="button"
                    onClick={() => {
                      downloadQuoteCard({
                        title: lesson.title,
                        context: lesson.context,
                        note: lesson.note,
                        rating: lesson.rating,
                      });
                      if (onToast) onToast('Downloaded paper-slip quote card (PNG)!');
                    }}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    aria-label="Save shareable quote card"
                  >
                    <ImageIcon size={13} />
                    <span>Quote Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyQuote(lesson)}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    aria-label="Copy lesson quote"
                  >
                    {copiedId === lesson.id ? <Check size={13} color="var(--spine-text)" /> : <Copy size={13} />}
                    <span>{copiedId === lesson.id ? 'Copied' : 'Copy Quote'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      lesson.open();
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    <span>Open Title</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
