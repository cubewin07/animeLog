import React from 'react';
import { FavoriteCharacter } from '../types';
import { Sparkles, Trash2, Film, Heart } from 'lucide-react';

interface CharacterCardProps {
  character: FavoriteCharacter;
  onDelete: (id: number) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onDelete }) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        borderLeft: '4px solid var(--color-accent-emerald)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(78, 222, 163, 0.12)',
              color: 'var(--color-accent-emerald)',
            }}
          >
            <Heart size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', color: '#ffffff' }}>{character.name}</h3>
            {character.anime_title && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <Film size={12} /> {character.anime_title}
              </span>
            )}
          </div>
        </div>

        <button
          className="btn-icon"
          onClick={() => onDelete(character.id)}
          title="Remove from favorites"
          style={{ color: '#fb7185' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div
        style={{
          background: 'rgba(13, 28, 45, 0.8)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Sparkles size={13} color="var(--color-accent-emerald)" />
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              color: 'var(--color-accent-emerald)',
            }}
          >
            Why Worth Remembering
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#d4e4fa', lineHeight: '1.6', fontStyle: 'italic' }}>
          "{character.why || 'A character that made an impression.'}"
        </p>
      </div>
    </div>
  );
};
