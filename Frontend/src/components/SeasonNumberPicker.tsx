import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface SeasonNumberPickerProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const QUICK_SEASONS = [1, 2, 3, 4, 5, 6];

function toRoman(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result || String(num);
}

export const SeasonNumberPicker: React.FC<SeasonNumberPickerProps> = ({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className = '',
  style,
}) => {
  const currentVal = Math.max(min, value || 1);

  const handleSelectQuick = (sNum: number) => {
    if (disabled) return;
    onChange(sNum);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || currentVal <= min) return;
    onChange(currentVal - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || currentVal >= max) return;
    onChange(currentVal + 1);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className={`season-picker-container ${className} ${disabled ? 'disabled' : ''}`} style={style}>
      {/* Quick Season Chips */}
      <div className="season-picker-chips" role="radiogroup" aria-label="Select season number">
        {QUICK_SEASONS.map((sNum) => {
          const isActive = currentVal === sNum;
          return (
            <button
              key={sNum}
              type="button"
              disabled={disabled}
              className={`season-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => handleSelectQuick(sNum)}
              aria-checked={isActive}
              role="radio"
            >
              <span className="season-chip-prefix">S</span>
              <span className="season-chip-num">{sNum}</span>
            </button>
          );
        })}
      </div>

      {/* Tactile Season Stepper Dial */}
      <div className="season-picker-stepper">
        <button
          type="button"
          className="season-stepper-btn"
          onClick={handleDecrement}
          disabled={disabled || currentVal <= min}
          aria-label="Previous season"
        >
          <Minus size={14} />
        </button>

        <div className="season-stepper-display">
          <div className="season-stepper-badge">
            <span className="season-stepper-label">Season</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={currentVal}
              onChange={handleDirectInput}
              disabled={disabled}
              className="season-stepper-input mono"
              aria-label="Season number"
            />
          </div>
          <span className="season-roman-tag mono">{toRoman(currentVal)}</span>
        </div>

        <button
          type="button"
          className="season-stepper-btn"
          onClick={handleIncrement}
          disabled={disabled || currentVal >= max}
          aria-label="Next season"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
