import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface ProgressStepperProps {
  current: number;
  total?: number | null;
  unit?: string;
  onDelta: (delta: number) => void;
  step?: number;
  disabled?: boolean;
  ariaLabelPrefix?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  current,
  total,
  unit = 'eps',
  onDelta,
  step = 1,
  disabled = false,
  ariaLabelPrefix = 'progress',
}) => {
  const isMax = total !== null && total !== undefined && current >= total;
  const isMin = current <= 0;

  return (
    <div className="stepper-group" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelta(-step);
        }}
        disabled={disabled || isMin}
        className="stepper-btn"
        aria-label={`Decrease ${ariaLabelPrefix} by ${step} ${unit}`}
        title={`- ${step} ${unit}`}
      >
        <Minus size={15} />
      </button>

      <div className="progress-count-mono" style={{ minWidth: 60, textAlign: 'center' }}>
        <span>{current}</span>
        {total ? (
          <span style={{ color: 'var(--text-desk-dim)', fontWeight: 400, fontSize: 16 }}>
            {' '}/ {total}
          </span>
        ) : null}
        <span style={{ fontSize: 13, color: 'var(--text-desk-muted)', marginLeft: 4, fontWeight: 500 }}>
          {unit}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelta(step);
        }}
        disabled={disabled || isMax}
        className="stepper-btn"
        aria-label={`Increase ${ariaLabelPrefix} by ${step} ${unit}`}
        title={`+ ${step} ${unit}`}
      >
        <Plus size={15} />
      </button>
    </div>
  );
};
