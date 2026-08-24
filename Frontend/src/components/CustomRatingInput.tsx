import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';

export interface CustomRatingInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export const CustomRatingInput: React.FC<CustomRatingInputProps> = ({
  value,
  onChange,
  min = 1,
  max = 10,
  placeholder = '–',
  disabled = false,
  className = '',
  style,
  ariaLabel = 'Rating input',
}) => {
  const [inputValue, setInputValue] = useState<string>(
    value !== null && value !== undefined ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();

    if (raw === '') {
      setInputValue('');
      onChange(null);
      return;
    }

    // Only allow integer digits
    if (!/^\d+$/.test(raw)) return;

    const num = parseInt(raw, 10);

    if (num > max) {
      setInputValue(String(max));
      onChange(max);
    } else if (num < min) {
      // If user types 0, keep it in input for typing but don't set invalid rating yet or set to min
      setInputValue(raw);
      onChange(null);
    } else {
      setInputValue(String(num));
      onChange(num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue === '') {
      onChange(null);
      return;
    }
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < min) {
      setInputValue('');
      onChange(null);
    } else if (num > max) {
      setInputValue(String(max));
      onChange(max);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const current = value || 0;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(max, current < min ? min : current + 1);
      setInputValue(String(next));
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (current <= min) {
        setInputValue('');
        onChange(null);
      } else {
        const next = Math.max(min, current - 1);
        setInputValue(String(next));
        onChange(next);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange(null);
  };

  const numericVal = value !== null && value !== undefined ? Number(value) : null;
  const hasValue = numericVal !== null && numericVal >= min && numericVal <= max;

  return (
    <div
      className={`custom-rating-container ${className} ${isFocused ? 'is-focused' : ''} ${
        disabled ? 'disabled' : ''
      }`}
      style={style}
    >
      <div className="custom-rating-star-icon">
        <Star
          size={16}
          fill={hasValue ? 'var(--tungsten)' : 'none'}
          color={hasValue ? 'var(--tungsten)' : 'var(--text-desk-dim)'}
          style={{ transition: 'all 0.2s ease' }}
        />
      </div>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className="custom-rating-input mono"
      />

      <span className="custom-rating-suffix mono">/ {max}</span>

      {hasValue && !disabled && (
        <button
          type="button"
          className="custom-rating-clear-btn"
          onClick={handleClear}
          aria-label="Clear rating"
          tabIndex={-1}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
