import React from 'react';
import { Minus, Plus } from 'lucide-react';
import './Progress.css';

export interface ProgressBarProps {
  current: number;
  total?: number | null;
  tone?: 'watching' | 'reading' | 'completed';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  tone = 'watching',
  className = '',
}) => {
  const percentage = total && total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div
      className={`lamplight-progress-track ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total || 100}
    >
      <div
        className={`lamplight-progress-fill tone-${tone}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export interface StepperProps {
  current: number;
  total?: number | null;
  unit?: string;
  step?: number;
  onDelta: (delta: number) => void;
  className?: string;
  ariaLabel?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  current,
  total,
  unit = 'eps',
  step = 1,
  onDelta,
  className = '',
  ariaLabel,
}) => {
  return (
    <div className={`lamplight-stepper ${className}`} aria-label={ariaLabel || 'Progress stepper'}>
      <button
        type="button"
        className="lamplight-stepper-btn"
        disabled={current <= 0}
        onClick={(e) => {
          e.stopPropagation();
          onDelta(-step);
        }}
        aria-label="Decrease progress"
      >
        <Minus size={13} />
      </button>

      <span className="lamplight-stepper-count">{current}</span>

      {total && (
        <span className="lamplight-stepper-total">
          / {total} {unit}
        </span>
      )}

      <button
        type="button"
        className="lamplight-stepper-btn"
        disabled={total !== undefined && total !== null && current >= total}
        onClick={(e) => {
          e.stopPropagation();
          onDelta(step);
        }}
        aria-label="Increase progress"
      >
        <Plus size={13} />
      </button>
    </div>
  );
};
