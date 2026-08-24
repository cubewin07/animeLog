import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface CustomNumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  allowEmpty?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const CustomNumberInput: React.FC<CustomNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  disabled = false,
  className = '',
  style,
  ariaLabel = 'Number input',
  allowEmpty = true,
  prefix,
  suffix,
}) => {
  const numValue = value === '' ? null : Number(value);

  const isMinDisabled = disabled || (numValue !== null && min !== undefined && numValue <= min);
  const isMaxDisabled = disabled || (numValue !== null && max !== undefined && numValue >= max);

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isMinDisabled) return;
    const current = numValue === null ? min : numValue;
    const next = Math.max(min, current - step);
    onChange(next);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isMaxDisabled) return;
    const current = numValue === null ? min : numValue;
    const next = max !== undefined ? Math.min(max, current + step) : current + step;
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      if (allowEmpty) {
        onChange('');
      } else {
        onChange(min);
      }
      return;
    }

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      onChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = numValue === null ? min : numValue;
      const next = max !== undefined ? Math.min(max, current + step) : current + step;
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = numValue === null ? min : numValue;
      const next = Math.max(min, current - step);
      onChange(next);
    }
  };

  return (
    <div
      className={`custom-number-container ${className} ${disabled ? 'disabled' : ''}`}
      style={style}
    >
      {prefix && <span className="custom-number-prefix">{prefix}</span>}

      <button
        type="button"
        className="custom-number-btn decrement"
        onClick={handleDecrement}
        disabled={isMinDisabled}
        aria-label="Decrease value"
        tabIndex={-1}
      >
        <Minus size={13} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === '' ? '' : value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className="custom-number-input mono"
      />

      <button
        type="button"
        className="custom-number-btn increment"
        onClick={handleIncrement}
        disabled={isMaxDisabled}
        aria-label="Increase value"
        tabIndex={-1}
      >
        <Plus size={13} />
      </button>

      {suffix && <span className="custom-number-suffix">{suffix}</span>}
    </div>
  );
};
