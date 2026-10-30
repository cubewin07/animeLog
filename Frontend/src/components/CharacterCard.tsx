import React from 'react';
import { FavoriteCharacter } from '../types';
import { Cover } from '../ui';
import { Sparkles, Trash2, PenLine, Image as ImageIcon, BookOpen } from 'lucide-react';

interface CharacterCardProps {
  character: FavoriteCharacter;
  onClick?: (character: FavoriteCharacter) => void;
  onEdit?: (character: FavoriteCharacter) => void;
  onDelete?: (id: number) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onClick,
  onEdit,
  onDelete,
}) => {
  const charImg =
    character.cover_image_url ||
    character.image_url ||
    (character.images && character.images.length > 0
      ? (character.images[0] as any).image_url || (character.images[0] as any).url
      : null);

  const imagesCount = character.images ? character.images.length : 0;
  const hasReflection = Boolean(character.why && character.why.trim().length > 0);

  return (
    <div
      className="desk-card character-card"
      onClick={() => onClick?.(character)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '28px 20px 20px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease',
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(character);
        }
      }}
    >
      {/* Top-Right Floating Actions */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
            title={`Edit reflection for ${character.name}`}
            aria-label={`Edit ${character.name}`}
          >
            <PenLine size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="btn-icon danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character.id);
            }}
            title={`Remove ${character.name}`}
            aria-label={`Delete ${character.name}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Prominent Large Circular Avatar (168x168px) / Generated Monogram Portrait */}
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 140,
          borderRadius: '50%',
          backgroundColor: 'var(--desk-surface)',
          padding: 3,
          boxShadow: '0 0 0 4px var(--desk-surface), var(--shadow-paper), 0 10px 32px rgba(0, 0, 0, 0.45)',
          border: '2px solid var(--border-desk-medium)',
          flexShrink: 0,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <Cover
          title={character.name}
          imageUrl={charImg}
          variant="portrait"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Series Eyebrow */}
      {character.series_title && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-desk-muted)',
            marginTop: 0,
            lineHeight: 1.3,
            display: 'block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={character.series_title}
        >
          {character.series_title}
        </span>
      )}

      {/* Character Name */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-desk)',
          marginTop: character.series_title ? 4 : 0,
          marginBottom: 0,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}
      >
        {character.name}
      </h3>

      {/* Subtle Metadata Pill Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-desk-subtle)',
          width: '100%',
        }}
      >
        {hasReflection ? (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--ember-text, #F0B27A)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600,
            }}
            title="Character reflection recorded"
          >
            <BookOpen size={12} /> Reflection
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-desk-muted)',
              fontStyle: 'italic',
            }}
          >
            No reflection
          </span>
        )}

        {imagesCount > 1 && (
          <>
            <span style={{ color: 'var(--border-desk-subtle)', fontSize: 10 }}>•</span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-desk-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={`${imagesCount} stills in gallery`}
            >
              <ImageIcon size={12} /> {imagesCount} stills
            </span>
          </>
        )}
      </div>
    </div>
  );
};

