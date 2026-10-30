import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReflections, JournalReflection } from '../state/useReflections';
import { useJournal } from '../state/JournalContext';
import { Paper, Rating, StatusMark, Button, EmptyState } from '../ui';
import { formatDate } from '../lib/format';
import { PenLine, Quote, Search, Filter } from 'lucide-react';

export const ReflectionsView: React.FC = () => {
  const { reflections } = useReflections();
  const { openComposer } = useJournal();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('ALL');
  const navigate = useNavigate();

  const filtered = reflections.filter((r) => {
    const matchesKind = selectedKind === 'ALL' || r.kind === selectedKind;
    const matchesSearch =
      !filterQuery.trim() ||
      r.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.note.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.context.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesKind && matchesSearch;
  });

  const handleOpenTarget = (reflection: JournalReflection) => {
    if (reflection.seriesId) {
      navigate(`/anime/${reflection.seriesId}`);
    } else if (reflection.targetKind === 'book') {
      navigate(`/books/${reflection.targetId}`);
    } else if (reflection.targetKind === 'character') {
      navigate('/characters');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lamp)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            <Quote size={14} />
            <span>Journal Reading Room</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.2vw, 36px)', color: 'var(--text)', lineHeight: 1.15 }}>
            What Stayed With You
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 4 }}>
            Every life lesson, philosophical thought, and takeaway written across titles, characters, and rewatches.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PenLine size={15} />}
          onClick={() => openComposer()}
        >
          Write Reflection
        </Button>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${reflections.length})` },
            { id: 'season', label: 'Seasons' },
            { id: 'episode', label: 'Episodes' },
            { id: 'film', label: 'Films' },
            { id: 'book', label: 'Books' },
            { id: 'character', label: 'People' },
            { id: 'rewatch', label: 'Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedKind(tab.id)}
              className={`filter-pill ${selectedKind === tab.id ? 'active' : ''}`}
              style={{
                background: selectedKind === tab.id ? 'var(--lamp)' : 'var(--surface)',
                color: selectedKind === tab.id ? 'var(--text-inverse)' : 'var(--text-2)',
                border: '1px solid var(--line)',
                padding: '5px 12px',
                borderRadius: 'var(--r-pill)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search reflections…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 34,
              paddingRight: 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Reflections Grid */}
      {filtered.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filtered.map((r) => (
            <Paper
              key={r.id}
              meta={
                <>
                  <span style={{ color: 'var(--lamp)' }}>{r.kind}</span>
                  {r.dateStr && <span>{formatDate(r.dateStr)}</span>}
                </>
              }
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenTarget(r)}
                    style={{ background: 'none', border: 'none', color: 'var(--paper-ink)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    {r.title} <span style={{ opacity: 0.65, fontWeight: 400 }}>· {r.context}</span>
                  </button>
                  {r.rating && <Rating score={r.rating} />}
                </>
              }
              isQuote
            >
              “{r.note}”
            </Paper>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Quote size={24} />}
          title="No reflections found"
          description={filterQuery ? `No reflections matched "${filterQuery}".` : "You haven't written any thoughts or lessons in this category yet."}
          action={
            <Button variant="primary" icon={<PenLine size={15} />} onClick={() => openComposer()}>
              Write a reflection
            </Button>
          }
        />
      )}
    </div>
  );
};
