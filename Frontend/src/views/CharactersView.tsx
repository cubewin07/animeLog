import React from 'react';
import { FavoriteCharacter } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { Plus, Sparkles } from 'lucide-react';

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
  const filtered = characters.filter((c) => {
    return (
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.anime_title && c.anime_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.why && c.why.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

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
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
