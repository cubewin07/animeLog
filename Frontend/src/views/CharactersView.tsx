import React, { useRef } from 'react';
import { FavoriteCharacter } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { Plus, Sparkles, BookMarked } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface CharactersViewProps {
  characters: FavoriteCharacter[];
  searchQuery: string;
  onEdit?: (character: FavoriteCharacter) => void;
  onDelete: (id: number) => void;
  onOpenAddModal: () => void;
}

export const CharactersView: React.FC<CharactersViewProps> = ({
  characters,
  searchQuery,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = characters.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      (c.series_title && c.series_title.toLowerCase().includes(q)) ||
      (c.why && c.why.toLowerCase().includes(q))
    );
  });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentRef.current) return;
      const cards = contentRef.current.querySelectorAll('.desk-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
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
    { scope: contentRef, dependencies: [filtered.length, searchQuery] }
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
            Favorite Characters
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-desk-muted)' }}>
            Characters worth remembering—and the specific virtues, ideals, or lessons they represent.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={15} />
          <span>Add Character</span>
        </button>
      </div>

      <div ref={contentRef}>
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
            <Sparkles size={36} color="var(--graphite)" />
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)' }}>No characters found</h3>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-desk-muted)', fontStyle: 'italic', maxWidth: 460 }}>
              {searchQuery
                ? `No characters match "${searchQuery}".`
                : 'Remember the characters that made a lasting impression on you.'}
            </p>
            {!searchQuery && (
              <button className="btn btn-primary" onClick={onOpenAddModal} style={{ marginTop: 8 }}>
                <Plus size={15} />
                <span>Add first character</span>
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20,
            }}
          >
            {filtered.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
