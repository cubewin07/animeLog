import React, { useState } from 'react';
import { FavoriteCharacter } from '../types';
import { Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface CharacterStripProps {
  characters: FavoriteCharacter[];
  onAddCharacter: () => void;
  onSelectCharacter: (character: FavoriteCharacter) => void;
}

export const CharacterStrip: React.FC<CharacterStripProps> = ({
  characters,
  onAddCharacter,
  onSelectCharacter,
}) => {
  const [expanded, setExpanded] = useState(false);

  const MAX_INITIAL = 8;
  const hasOverflow = characters.length > MAX_INITIAL;
  const displayedCharacters = expanded ? characters : characters.slice(0, MAX_INITIAL);

  return (
    <section className="detail-section">
      {/* Section Header */}
      <div className="detail-section-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 className="detail-section-title">Characters</h2>
          {characters.length > 0 && (
            <span className="detail-section-count">
              {characters.length} remembered
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onAddCharacter}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <Plus size={13} />
          <span>Add</span>
        </button>
      </div>

      {characters.length > 0 ? (
        <div className="character-strip-container">
          <div className="character-strip">
            {displayedCharacters.map((char) => {
              const coverUrl =
                char.cover_image_url ||
                char.image_url ||
                (char.images && char.images.length > 0
                  ? (char.images[0] as any).image_url || (char.images[0] as any).url
                  : null);
              const hasWhy = Boolean(char.why && char.why.trim().length > 0);

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onSelectCharacter(char)}
                  className="character-chip"
                  aria-haspopup="dialog"
                  aria-label={`Character: ${char.name}`}
                >
                  {/* Avatar Still */}
                  <div className="character-chip-avatar">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={char.name}
                        className="character-chip-avatar-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="character-chip-avatar-placeholder">
                        <Sparkles size={14} />
                      </div>
                    )}
                  </div>

                  {/* Character Name */}
                  <span className="character-chip-name">{char.name}</span>

                  {/* Paper Pip (Reflection exists) */}
                  {hasWhy && (
                    <span className="character-chip-pip" title="Character reflection written" />
                  )}
                </button>
              );
            })}
          </div>

          {hasOverflow && (
            <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="btn btn-ghost btn-sm"
                style={{
                  gap: 6,
                  color: 'var(--text-desk-muted)',
                  fontSize: 12,
                }}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>
                    <span>Show fewer characters</span>
                    <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    <span>+{characters.length - MAX_INITIAL} more</span>
                    <ChevronDown size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="detail-section-empty">
          <p className="detail-empty-text">
            No favorite characters recorded yet from this franchise.
          </p>
        </div>
      )}
    </section>
  );
};
