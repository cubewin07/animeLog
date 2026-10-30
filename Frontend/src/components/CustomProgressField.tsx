import React from 'react';
import { Plus, Minus, CheckCheck } from 'lucide-react';

export interface CustomProgressFieldProps {
  current: number;
  total: number | '' | null | undefined;
  onCurrentChange: (val: number) => void;
  onTotalChange: (val: number | '') => void;
  unitLabel?: string; // 'Episodes' | 'Pages' | 'Minutes'
  unitShort?: string; // 'eps' | 'p' | 'min'
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomProgressField: React.FC<CustomProgressFieldProps> = ({
  current = 0,
  total = '',
  onCurrentChange,
  onTotalChange,
  unitLabel = 'Episodes',
  unitShort = 'eps',
  disabled = false,
  className = '',
  style,
}) => {
  const currentNum = Math.max(0, current || 0);
  const totalNum = total === '' || total === null || total === undefined ? null : Number(total);

  const percentage =
    totalNum !== null && totalNum > 0
      ? Math.min(100, Math.round((currentNum / totalNum) * 100))
      : null;

  const isCompleted = percentage !== null && percentage >= 100;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || currentNum <= 0) return;
    onCurrentChange(currentNum - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (totalNum !== null && currentNum >= totalNum) return;
    onCurrentChange(currentNum + 1);
  };

  const handleQuickAdd = (delta: number) => {
    if (disabled) return;
    const next = currentNum + delta;
    if (totalNum !== null && next > totalNum) {
      onCurrentChange(totalNum);
    } else {
      onCurrentChange(next);
    }
  };

  const handleComplete = () => {
    if (disabled || totalNum === null) return;
    onCurrentChange(totalNum);
  };

  const handleCurrentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      onCurrentChange(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      let clamped = Math.max(0, parsed);
      if (totalNum !== null && clamped > totalNum) {
        clamped = totalNum;
      }
      onCurrentChange(clamped);
    }
  };

  const handleTotalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      onTotalChange('');
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onTotalChange(parsed);
    }
  };

  return (
    <div
      className={`custom-progress-field-card ${className} ${disabled ? 'disabled' : ''}`}
      style={style}
    >
      {/* 2 Distinct Columns: Watched/Done and Total */}
      <div className="custom-progress-inputs-row">
        {/* Column 1: Current Done */}
        <div className="custom-progress-col">
          <label className="custom-progress-sublabel">
            {unitLabel === 'Pages'
              ? 'Pages Read'
              : unitLabel === 'Minutes'
              ? 'Minutes Watched'
              : 'Episodes Watched'}
          </label>
          <div className="custom-progress-stepper-box">
            <button
              type="button"
              className="custom-progress-step-btn"
              onClick={handleDecrement}
              disabled={disabled || currentNum <= 0}
              aria-label={`Decrease ${unitLabel}`}
            >
              <Minus size={14} />
            </button>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={currentNum}
              onChange={handleCurrentInput}
              disabled={disabled}
              className="custom-progress-num-input mono"
              aria-label={`Current ${unitLabel} count`}
            />

            <button
              type="button"
              className="custom-progress-step-btn"
              onClick={handleIncrement}
              disabled={disabled || (totalNum !== null && currentNum >= totalNum)}
              aria-label={`Increase ${unitLabel}`}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="custom-progress-col-divider">of</div>

        {/* Column 2: Total */}
        <div className="custom-progress-col">
          <label className="custom-progress-sublabel">
            {unitLabel === 'Pages'
              ? 'Total Pages'
              : unitLabel === 'Minutes'
              ? 'Total Runtime'
              : 'Total in Season'}
          </label>
          <div className="custom-progress-total-box">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={total === '' || total === null || total === undefined ? '' : total}
              onChange={handleTotalInput}
              placeholder="Optional"
              disabled={disabled}
              className="custom-progress-total-input mono"
              aria-label={`Total ${unitLabel} count`}
            />
            <span className="custom-progress-unit-tag mono">{unitShort}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Quick Action Shortcuts */}
      <div className="custom-progress-footer">
        <div className="custom-progress-bar-wrapper">
          <div className="custom-progress-bar-track">
            <div
              className={`custom-progress-bar-fill ${isCompleted ? 'completed' : ''}`}
              style={{
                width: percentage !== null ? `${percentage}%` : currentNum > 0 ? '100%' : '0%',
              }}
            />
          </div>
          <div className="custom-progress-bar-meta mono">
            <span>
              {currentNum} {totalNum !== null ? `/ ${totalNum}` : ''} {unitShort}
            </span>
            {percentage !== null && <span>{percentage}%</span>}
          </div>
        </div>

        {/* Quick buttons */}
        <div className="custom-progress-shortcuts">
          <button
            type="button"
            className="custom-progress-chip"
            onClick={() => handleQuickAdd(1)}
            disabled={disabled || (totalNum !== null && currentNum >= totalNum)}
          >
            +1
          </button>
          {unitLabel === 'Pages' && (
            <button
              type="button"
              className="custom-progress-chip"
              onClick={() => handleQuickAdd(10)}
              disabled={disabled || (totalNum !== null && currentNum >= totalNum)}
            >
              +10
            </button>
          )}
          {totalNum !== null && totalNum > 0 && currentNum < totalNum && (
            <button
              type="button"
              className="custom-progress-chip complete-chip"
              onClick={handleComplete}
              disabled={disabled}
            >
              <CheckCheck size={12} />
              <span>All Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
