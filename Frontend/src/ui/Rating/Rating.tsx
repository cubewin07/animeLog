import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './Rating.css';

export interface RatingProps {
  score?: number | null;
  max?: number;
  showOutOf?: boolean;
  className?: string;
  onChange?: (score: number | null) => void;
  interactive?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  score,
  max = 10,
  showOutOf = false,
  className = '',
  onChange,
  interactive = false,
}) => {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  if (interactive && onChange) {
    const activeVal = hoverScore !== null ? hoverScore : (score || 0);
    return (
      <div className={`lamplight-rating-input ${className}`} role="radiogroup" aria-label="Rating">
        {Array.from({ length: max }, (_, i) => i + 1).map((val) => {
          const isFilled = val <= activeVal;
          return (
            <button
              key={val}
              type="button"
              role="radio"
              aria-checked={score === val}
              aria-label={`${val} out of ${max}`}
              className={`lamplight-rating-tick ${isFilled ? 'is-filled' : ''}`}
              onMouseEnter={() => setHoverScore(val)}
              onMouseLeave={() => setHoverScore(null)}
              onClick={() => onChange(score === val ? null : val)}
            >
              <Star size={14} fill={isFilled ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
    );
  }

  if (score === null || score === undefined) {
    return null;
  }

  const isHigh = score >= 9;

  return (
    <div className={`lamplight-rating-badge ${isHigh ? 'is-high' : ''} ${className}`}>
      <Star size={12} fill="currentColor" />
      <span className="lamplight-rating-score">{score}</span>
      {showOutOf && <span className="lamplight-rating-out-of">/{max}</span>}
    </div>
  );
};

