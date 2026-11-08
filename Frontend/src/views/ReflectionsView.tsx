import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useReflections, JournalReflection } from '../state/useReflections';
import { useJournalActions } from '../state/JournalContext';
import { Rating, Button, EmptyState } from '../ui';
import { formatDate } from '../lib/format';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Film,
  PenLine,
  Quote,
  RotateCcw,
  Search,
  Tv,
  User,
  X,
} from 'lucide-react';

function getReflectionHref(r: JournalReflection): string {
  if (r.targetKind === 'season' && r.seriesId) {
    const epParam = r.episodeNumber ? `&ep=${r.episodeNumber}` : '';
    return `/anime/${r.seriesId}?release=season-${r.targetId}${epParam}`;
  }
  if (r.targetKind === 'movie' && r.seriesId) {
    return `/anime/${r.seriesId}?release=movie-${r.targetId}`;
  }
  if (r.seriesId) {
    return `/anime/${r.seriesId}`;
  }
  if (r.targetKind === 'book') {
    return `/books/${r.targetId}`;
  }
  if (r.targetKind === 'character') {
    return `/characters/${r.targetId}`;
  }
  return '/journal';
}

export const ReflectionsView: React.FC = () => {
  const { reflections } = useReflections();
  const { openComposer, openAddRewatch, addToast } = useJournalActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawKind = searchParams.get('kind') || 'ALL';
  const selectedKind = rawKind === 'film' ? 'movie' : rawKind;
  const filterQuery = searchParams.get('q') || '';

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleCopyQuote = (r: JournalReflection, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${r.note}" — ${r.title} (${r.context})`);
    setCopiedId(r.id);
    addToast('Note copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = reflections.filter((r) => {
    const itemKind = r.kind === 'film' ? 'movie' : r.kind;
    const matchesKind = selectedKind === 'ALL' || itemKind === selectedKind;
    const matchesSearch =
      !filterQuery.trim() ||
      r.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.note.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.context.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesKind && matchesSearch;
  });

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'season':
      case 'episode':
        return <Tv size={12} />;
      case 'film':
      case 'movie':
        return <Film size={12} />;
      case 'book':
        return <BookOpen size={12} />;
      case 'character':
        return <User size={12} />;
      case 'rewatch':
        return <RotateCcw size={12} />;
      default:
        return <Quote size={12} />;
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'season':
        return 'Season Note';
      case 'episode':
        return 'Episode Note';
      case 'film':
      case 'movie':
        return 'Movie Note';
      case 'book':
        return 'Book Note';
      case 'character':
        return 'Character Note';
      case 'rewatch':
        return 'Rewatch Note';
      default:
        return 'Note';
    }
  };

  const countsByKind: Record<string, number> = {
    ALL: reflections.length,
    season: reflections.filter((r) => r.kind === 'season').length,
    episode: reflections.filter((r) => r.kind === 'episode').length,
    movie: reflections.filter((r) => r.kind === 'film').length,
    book: reflections.filter((r) => r.kind === 'book').length,
    character: reflections.filter((r) => r.kind === 'character').length,
    rewatch: reflections.filter((r) => r.kind === 'rewatch').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeIn var(--dur-base) var(--ease-smooth)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lamp)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            <Quote size={14} />
            <span>Journal</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.2vw, 36px)', color: 'var(--text)', lineHeight: 1.15 }}>
            Journal
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 6, maxWidth: 620, lineHeight: 1.5 }}>
            Every note written across seasons, episodes, movies, books, characters, and rewatches.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="secondary"
            icon={<RotateCcw size={15} />}
            onClick={() => openAddRewatch()}
          >
            Log Rewatch
          </Button>
          <Button
            variant="primary"
            icon={<PenLine size={15} />}
            onClick={() => openComposer()}
          >
            Write Note
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Notes' },
            { id: 'season', label: 'Seasons' },
            { id: 'episode', label: 'Episodes' },
            { id: 'movie', label: 'Movies' },
            { id: 'book', label: 'Books' },
            { id: 'character', label: 'Characters' },
            { id: 'rewatch', label: 'Rewatches' },
          ].map((tab) => {
            const count = countsByKind[tab.id] || 0;
            const isActive = selectedKind === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParam('kind', tab.id, 'ALL')}
                style={{
                  background: isActive ? 'var(--lamp)' : 'var(--surface)',
                  color: isActive ? 'var(--text-inverse)' : 'var(--text-2)',
                  border: `1px solid ${isActive ? 'var(--lamp)' : 'var(--line)'}`,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-full)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all var(--dur-fast) var(--ease-smooth)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: isActive ? 0.9 : 0.6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(0,0,0,0.18)' : 'var(--surface-sunken)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search notes…"
            value={filterQuery}
            onChange={(e) => updateParam('q', e.target.value, '')}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 34,
              paddingRight: filterQuery ? 32 : 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color var(--dur-fast) var(--ease-smooth)',
            }}
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => updateParam('q', '', '')}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 2,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filtered.length ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {filtered.map((r) => (
            <article
              key={r.id}
              style={{
                backgroundColor: 'var(--paper)',
                color: 'var(--paper-ink)',
                borderRadius: 'var(--r-lg)',
                padding: 'var(--s-5)',
                boxShadow: 'var(--shadow-paper)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                position: 'relative',
                transition: 'transform var(--dur-fast) var(--ease-smooth), box-shadow var(--dur-fast) var(--ease-smooth)',
              }}
            >
              {/* Header meta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--lamp-dark, #8A6432)',
                    background: 'rgba(217, 138, 59, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 'var(--r-full)',
                  }}
                >
                  {getKindIcon(r.kind)}
                  <span>{getKindLabel(r.kind)}</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.dateStr && (
                    <span style={{ fontSize: 11, color: 'var(--paper-ink-muted)', opacity: 0.8 }}>
                      {formatDate(r.dateStr)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleCopyQuote(r, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--paper-ink-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.7,
                      transition: 'opacity var(--dur-fast) ease',
                    }}
                    title="Copy note to clipboard"
                    aria-label="Copy note"
                  >
                    {copiedId === r.id ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Note Body */}
              <div style={{ position: 'relative', paddingLeft: 16 }}>
                <Quote
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 2,
                    color: 'var(--lamp)',
                    opacity: 0.6,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: 'var(--paper-ink)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {r.note}
                </p>
              </div>

              {/* Footer: Target link + Rating */}
              <footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(0, 0, 0, 0.07)',
                  marginTop: 'auto',
                }}
              >
                <Link
                  viewTransition
                  to={getReflectionHref(r)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--paper-ink)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                    textDecoration: 'none',
                    transition: 'color var(--dur-fast) ease',
                  }}
                  title={`Open ${r.title}`}
                >
                  <span>{r.title}</span>
                  <span style={{ opacity: 0.6, fontWeight: 400 }}>· {r.context}</span>
                  <ArrowUpRight size={13} style={{ opacity: 0.7 }} />
                </Link>

                {r.rating != null && (
                  <Rating score={r.rating} max={10} />
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Quote size={28} />}
          title="No notes found"
          description={
            filterQuery
              ? `No notes matched "${filterQuery}".`
              : "You haven't written any notes in this category yet."
          }
          action={
            <Button variant="primary" icon={<PenLine size={15} />} onClick={() => openComposer()}>
              Write a note
            </Button>
          }
        />
      )}
    </div>
  );
};
