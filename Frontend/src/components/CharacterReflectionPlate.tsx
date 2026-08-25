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
  label = 'WHY THEY MATTERED TO ME',
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
            title="Edit character reflection"
          >
            <PenLine size={12} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Reflection Content */}
      {hasText ? (
        <div className="character-reflection-body">
          <p className="character-reflection-text">{why}</p>
        </div>
      ) : (
        <div className="character-reflection-empty">
          <p className="character-reflection-empty-text">
            {characterName
              ? `No reflection recorded yet. What virtue, ideal, or memory did ${characterName} leave with you?`
              : 'No character reflection recorded yet. Record why this character made a lasting impression.'}
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
              <span>Record Reflection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
