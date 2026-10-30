import React from 'react';
import { FavoriteCharacter } from '../types';
import { Cover, Button } from '../ui';
import { useJournal } from '../state/JournalContext';
import {
  Sparkles,
  Trash2,
  PenLine,
  Image as ImageIcon,
  Quote,
  Plus,
} from 'lucide-react';

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
  const { openComposer } = useJournal();
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
      className="lamplight-character-card"
      onClick={() => onClick?.(character)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px 20px 20px 20px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--dur-fast) var(--ease-smooth), box-shadow var(--dur-fast) var(--ease-smooth), border-color var(--dur-fast) var(--ease-smooth)',
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
      {/* Top Floating Actions */}
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
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 'var(--r-sm)', color: 'var(--text-3)' }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
            title={`Edit ${character.name}`}
            aria-label={`Edit ${character.name}`}
          >
            <PenLine size={13} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 'var(--r-sm)', color: 'var(--red)' }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character.id);
            }}
            title={`Remove ${character.name}`}
            aria-label={`Delete ${character.name}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Circular Avatar / Monogram Portrait */}
      <div
        style={{
          position: 'relative',
          width: 110,
          height: 110,
          borderRadius: '50%',
          backgroundColor: 'var(--surface-sunken)',
          padding: 3,
          boxShadow: '0 0 0 3px var(--line), var(--shadow-sm)',
          flexShrink: 0,
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <Cover
          title={character.name}
          imageUrl={charImg}
          variant="portrait"
          style={{ width: '100%', height: '100%', borderRadius: '50%' }}
        />
      </div>

      {/* Series Eyebrow */}
      {character.series_title && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--lamp)',
            lineHeight: 1.3,
            display: 'block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 4,
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
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {character.name}
      </h3>

      {/* The Virtue / Lesson Paper Strip */}
      <div style={{ width: '100%', marginTop: 14 }}>
        {hasReflection ? (
          <div
            style={{
              backgroundColor: 'var(--paper)',
              color: 'var(--paper-ink)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              textAlign: 'left',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Quote size={13} style={{ color: 'var(--lamp)', flexShrink: 0, marginTop: 2, opacity: 0.8 }} />
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {character.why}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              border: '1px dashed var(--line)',
              background: 'var(--surface-sunken)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 6 }}>
              No virtue or lesson recorded yet.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                fontSize: 11.5,
                color: 'var(--lamp)',
                padding: '2px 8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              onClick={() => {
                openComposer({
                  type: 'character',
                  targetId: character.id,
                  title: character.name,
                  currentNotes: character.why,
                });
              }}
            >
              <Plus size={12} />
              <span>Write why they matter</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Meta: Stills indicator */}
      {imagesCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--line-subtle)',
            width: '100%',
            fontSize: 11,
            color: 'var(--text-3)',
          }}
        >
          <ImageIcon size={12} />
          <span>{imagesCount} {imagesCount === 1 ? 'still' : 'stills'} in gallery</span>
        </div>
      )}
    </div>
  );
};
