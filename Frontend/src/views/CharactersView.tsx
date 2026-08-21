import React, { useRef } from 'react';
import { FavoriteCharacter } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { Plus, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

interface CharactersViewProps {
  characters: FavoriteCharacter[];
  searchQuery: string;
  onDelete: (id: number) => void;
  onOpenAddModal: () => void;
}

export const CharactersView: React.FC<CharactersViewProps> = ({
  characters,
  searchQuery,
  onDelete,
  onOpenAddModal,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = characters.filter((c) => {
    return (
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.anime_title && c.anime_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.why && c.why.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentRef.current) return;

      const cards = contentRef.current.querySelectorAll('.character-grid-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 16, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.06,
            ease: EASING.spring,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: contentRef, dependencies: [filtered.length, searchQuery] }
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', color: '#ffffff' }}>Favorite Characters</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Characters worth remembering—and the specific virtues, ideals, or lessons they represent.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={16} /> Add Character
        </button>
      </div>

      <div ref={contentRef}>
        {filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <Sparkles size={36} color="var(--color-accent-emerald)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '17px', color: '#ffffff', marginBottom: '6px' }}>
              No Characters Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 16px' }}>
              {searchQuery
                ? `No characters match "${searchQuery}".`
                : 'Remember the characters that made an impact on you.'}
            </p>
            <button className="btn btn-secondary" onClick={onOpenAddModal}>
              <Plus size={15} /> Add First Character
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((character) => (
              <div key={character.id} className="character-grid-card">
                <CharacterCard
                  character={character}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
