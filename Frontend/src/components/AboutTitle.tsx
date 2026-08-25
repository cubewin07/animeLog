import React from 'react';
import { Genre, Studio } from '../types';
import { PenLine } from 'lucide-react';

interface AboutTitleProps {
  format?: string;
  studios?: Studio[];
  author?: string | null;
  genres?: Genre[];
  startDate?: string | null;
  finishDate?: string | null;
  totalPages?: number | null;
  japaneseTitle?: string | null;
  romajiTitle?: string | null;
  onEdit?: () => void;
  editLabel?: string;
}

export const AboutTitle: React.FC<AboutTitleProps> = ({
  format,
  studios,
  author,
  genres,
  startDate,
  finishDate,
  totalPages,
  japaneseTitle,
  romajiTitle,
  onEdit,
  editLabel = 'Edit Metadata',
}) => {
  const hasGenres = genres && genres.length > 0;
  const hasStudios = studios && studios.length > 0;

  return (
    <details className="about-title">
      <summary className="about-summary">
        <span>About this title</span>
      </summary>

      <div className="about-content">
        <div className="about-grid">
          {/* Format */}
          {format && (
            <div className="about-row">
              <span className="about-label">Format</span>
              <span className="about-value">{format}</span>
            </div>
          )}

          {/* Author (for books) */}
          {author && (
            <div className="about-row">
              <span className="about-label">Author</span>
              <span className="about-value">{author}</span>
            </div>
          )}

          {/* Studios (for anime) */}
          {hasStudios && (
            <div className="about-row">
              <span className="about-label">Studios</span>
              <div className="about-tags-list">
                {studios.map((st) => (
                  <span key={st.id} className="studio-tag">
                    {st.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Genres */}
          {hasGenres && (
            <div className="about-row">
              <span className="about-label">Genres</span>
              <div className="about-tags-list">
                {genres.map((g) => (
                  <span key={g.id} className="genre-tag">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Started Date */}
          {startDate && (
            <div className="about-row">
              <span className="about-label">Started</span>
              <span className="about-value-mono">{startDate}</span>
            </div>
          )}

          {/* Finished Date */}
          {finishDate && (
            <div className="about-row">
              <span className="about-label">Finished</span>
              <span className="about-value-mono">{finishDate}</span>
            </div>
          )}

          {/* Length / Total Pages (book) */}
          {totalPages !== null && totalPages !== undefined && (
            <div className="about-row">
              <span className="about-label">Length</span>
              <span className="about-value-mono">{totalPages} pages</span>
            </div>
          )}

          {/* Japanese Title */}
          {japaneseTitle && (
            <div className="about-row">
              <span className="about-label">Japanese</span>
              <span className="about-value">{japaneseTitle}</span>
            </div>
          )}

          {/* Romaji Title */}
          {romajiTitle && (
            <div className="about-row">
              <span className="about-label">Romaji</span>
              <span className="about-value">{romajiTitle}</span>
            </div>
          )}
        </div>

        {/* Quiet Edit Link */}
        {onEdit && (
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-desk-subtle)' }}>
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 12,
                color: 'var(--text-desk-muted)',
                gap: 5,
                padding: '4px 8px',
              }}
            >
              <PenLine size={12} />
              <span>{editLabel}</span>
            </button>
          </div>
        )}
      </div>
    </details>
  );
};
