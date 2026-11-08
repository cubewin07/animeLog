import React from 'react';
import { PenLine, Quote, Sparkles } from 'lucide-react';

interface CharacterReflectionPlateProps {
  why?: string | null;
  characterName?: string;
  label?: string;
  onEdit?: () => void;
  className?: string;
}

export const CharacterReflectionPlate: React.FC<CharacterReflectionPlateProps> = ({
  why,
  characterName,
  label = 'CHARACTER NOTE',
  onEdit,
  className = '',
}) => {
  const hasText = Boolean(why && why.trim().length > 0);

  return (
    <div className={`character-reflection-plate ${className}`}>
      {/* Decorative ambient background quote watermark */}
      <Quote size={80} className="character-reflection-watermark" aria-hidden="true" />

      {/* Header bar */}
      <div className="character-reflection-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="character-reflection-badge">
            <Sparkles size={13} />
          </div>
          <span className="character-reflection-label">{label}</span>
        </div>

        {onEdit && hasText && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              fontSize: 12,
              padding: '2px 8px',
              gap: 5,
              color: 'var(--text-desk-muted)',
            }}
            title="Edit character note"
          >
            <PenLine size={12} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Note Content */}
      {hasText ? (
        <div className="character-reflection-body">
          <p className="character-reflection-text">{why}</p>
        </div>
      ) : (
        <div className="character-reflection-empty">
          <p className="character-reflection-empty-text">
            {characterName
              ? `No note recorded yet for ${characterName}.`
              : 'No character note recorded yet.'}
          </p>
          {onEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                gap: 6,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              <PenLine size={13} />
              <span>Write Note</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
