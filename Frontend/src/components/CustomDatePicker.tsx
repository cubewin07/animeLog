import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';

export interface CustomDatePickerProps {
  value: string; // ISO format 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  clearable?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatIso(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIso(isoStr: string): { year: number; month: number; day: number } | null {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function formatDisplayDate(isoStr: string): string {
  const parsed = parseIso(isoStr);
  if (!parsed) return '';
  const { year, month, day } = parsed;
  return `${MONTH_SHORT[month]} ${day}, ${year}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  minDate,
  maxDate,
  className = '',
  style,
  ariaLabel = 'Date picker',
  clearable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'days' | 'months' | 'years'>('days');

  // Initialize view date based on value or today
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(
    () => formatIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const parsedValue = useMemo(() => parseIso(value), [value]);

  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedValue ? parsedValue.year : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedValue ? parsedValue.month : today.getMonth();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectorMode('days');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number, isOtherMonth?: 'prev' | 'next') => {
    let targetYear = viewYear;
    let targetMonth = viewMonth;

    if (isOtherMonth === 'prev') {
      if (viewMonth === 0) {
        targetMonth = 11;
        targetYear -= 1;
      } else {
        targetMonth -= 1;
      }
    } else if (isOtherMonth === 'next') {
      if (viewMonth === 11) {
        targetMonth = 0;
        targetYear += 1;
      } else {
        targetMonth += 1;
      }
    }

    const iso = formatIso(targetYear, targetMonth, day);
    onChange(iso);
    setIsOpen(false);
    setSelectorMode('days');
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(todayIso);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setSelectorMode('days');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSelectorMode('days');
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      day: number;
      iso: string;
      isCurrentMonth: boolean;
      isOtherMonth?: 'prev' | 'next';
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYearNum = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = formatIso(prevYearNum, prevMonthIdx, dayNum);
      const isDis = Boolean(
        (minDate && iso < minDate) || (maxDate && iso > maxDate)
      );
      days.push({
        day: dayNum,
        iso,
        isCurrentMonth: false,
        isOtherMonth: 'prev',
        isSelected: value === iso,
        isToday: todayIso === iso,
        isDisabled: isDis,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = formatIso(viewYear, viewMonth, d);
      const isDis = Boolean(
        (minDate && iso < minDate) || (maxDate && iso > maxDate)
      );
      days.push({
        day: d,
        iso,
        isCurrentMonth: true,
        isSelected: value === iso,
        isToday: todayIso === iso,
        isDisabled: isDis,
      });
    }

    // Next month filler days (fill up to complete weeks, e.g. multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let n = 1; n <= remaining; n++) {
        const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYearNum = viewMonth === 11 ? viewYear + 1 : viewYear;
        const iso = formatIso(nextYearNum, nextMonthIdx, n);
        const isDis = Boolean(
          (minDate && iso < minDate) || (maxDate && iso > maxDate)
        );
        days.push({
          day: n,
          iso,
          isCurrentMonth: false,
          isOtherMonth: 'next',
          isSelected: value === iso,
          isToday: todayIso === iso,
          isDisabled: isDis,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate, todayIso]);

  // Year list for year selector mode (range e.g. viewYear - 10 to viewYear + 10)
  const yearList = useMemo(() => {
    const startYear = Math.max(1970, viewYear - 12);
    const endYear = startYear + 24;
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [viewYear]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectorMode('days');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-datepicker-container ${className} ${disabled ? 'disabled' : ''} ${
        isOpen ? 'is-open' : ''
      }`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Input Box */}
      <button
        type="button"
        className="custom-datepicker-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className="custom-datepicker-trigger-content">
          <CalendarIcon size={16} className="custom-datepicker-icon" />
          <span className={`custom-datepicker-value ${!value ? 'is-placeholder' : ''}`}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        <div className="custom-datepicker-actions">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              className="custom-datepicker-clear-btn"
              onClick={handleClear}
              aria-label="Clear date"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`custom-datepicker-chevron ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="custom-datepicker-popover" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="custom-datepicker-header">
            <button
              type="button"
              className="custom-datepicker-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="custom-datepicker-title-group">
              <button
                type="button"
                className="custom-datepicker-month-btn"
                onClick={() =>
                  setSelectorMode(selectorMode === 'months' ? 'days' : 'months')
                }
              >
                <span>{MONTH_NAMES[viewMonth]}</span>
              </button>
              <button
                type="button"
                className="custom-datepicker-year-btn"
                onClick={() =>
                  setSelectorMode(selectorMode === 'years' ? 'days' : 'years')
                }
              >
                <span>{viewYear}</span>
              </button>
            </div>

            <button
              type="button"
              className="custom-datepicker-nav-btn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month Selector Mode */}
          {selectorMode === 'months' && (
            <div className="custom-datepicker-grid-selector">
              {MONTH_SHORT.map((mName, idx) => (
                <button
                  key={mName}
                  type="button"
                  className={`custom-datepicker-selector-cell ${
                    idx === viewMonth ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setViewMonth(idx);
                    setSelectorMode('days');
                  }}
                >
                  {mName}
                </button>
              ))}
            </div>
          )}

          {/* Year Selector Mode */}
          {selectorMode === 'years' && (
            <div className="custom-datepicker-grid-selector years-grid">
              {yearList.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`custom-datepicker-selector-cell ${
                    y === viewYear ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setViewYear(y);
                    setSelectorMode('days');
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Regular Days View */}
          {selectorMode === 'days' && (
            <>
              {/* Weekday Headers */}
              <div className="custom-datepicker-weekdays">
                {WEEKDAY_NAMES.map((w) => (
                  <div key={w} className="custom-datepicker-weekday">
                    {w}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="custom-datepicker-days-grid">
                {calendarDays.map((d, index) => (
                  <button
                    key={`${d.iso}-${index}`}
                    type="button"
                    disabled={d.isDisabled}
                    className={`custom-datepicker-day-cell ${
                      !d.isCurrentMonth ? 'other-month' : ''
                    } ${d.isSelected ? 'selected' : ''} ${d.isToday ? 'today' : ''} ${
                      d.isDisabled ? 'disabled' : ''
                    }`}
                    onClick={() => handleSelectDay(d.day, d.isOtherMonth)}
                  >
                    <span>{d.day}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer Bar */}
          <div className="custom-datepicker-footer">
            <button
              type="button"
              className="custom-datepicker-footer-btn"
              onClick={handleToday}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                className="custom-datepicker-footer-btn text-muted"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="custom-datepicker-footer-btn primary"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
