import React from 'react';
import { FavoriteCharacter } from '../types';
import { Sparkles, Trash2, Film, PenLine } from 'lucide-react';

interface CharacterCardProps {
  character: FavoriteCharacter;
  onEdit?: (character: FavoriteCharacter) => void;
  onDelete: (id: number) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onEdit, onDelete }) => {
  const charImg =
    character.cover_image_url ||
    character.image_url ||
    (character.images && character.images.length > 0
      ? (character.images[0] as any).image_url || (character.images[0] as any).url
      : null);

  return (
    <div
      className="desk-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
      }}
    >
      {/* Top row: Avatar + Name + Series + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {charImg ? (
            <img
              src={charImg}
              alt={character.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--border-desk-medium)',
                boxShadow: 'var(--shadow-paper)',
                flexShrink: 0,
              }}
              width={56}
              height={56}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--desk-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--graphite)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 18, color: 'var(--text-desk)', lineHeight: 1.3, marginBottom: 2 }}>
              {character.name}
            </h3>
            {character.series_title && (
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-desk-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Film size={12} /> {character.series_title}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onEdit && (
            <button
              className="btn-icon"
              onClick={() => onEdit(character)}
              title="Edit character reflection"
              aria-label={`Edit ${character.name}`}
            >
              <PenLine size={14} />
            </button>
          )}
          <button
            className="btn-icon danger"
            onClick={() => onDelete(character.id)}
            title="Remove character"
            aria-label={`Delete ${character.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Why Worth Remembering */}
      {character.why && (
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-desk-subtle)' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              fontStyle: 'italic',
              color: 'var(--text-desk)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            "{character.why}"
          </p>
        </div>
      )}
    </div>
  );
};
