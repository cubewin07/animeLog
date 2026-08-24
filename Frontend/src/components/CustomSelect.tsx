import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface SelectGroup<T = string | number> {
  group: string;
  options: SelectOption<T>[];
}

export type SelectItem<T = string | number> = SelectOption<T> | SelectGroup<T>;

function isGroup<T>(item: SelectItem<T>): item is SelectGroup<T> {
  return 'group' in item && Array.isArray(item.options);
}

export interface CustomSelectProps<T = string | number> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: SelectItem<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  mono?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchable,
  searchPlaceholder = 'Search...',
  disabled = false,
  error = false,
  className = '',
  style,
  ariaLabel,
  mono = false,
  clearable = false,
  onClear,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Flatten all available options for easy lookup and keyboard navigation
  const flatOptions = useMemo(() => {
    const list: { option: SelectOption<T>; groupName?: string }[] = [];
    for (const item of options) {
      if (isGroup(item)) {
        for (const opt of item.options) {
          list.push({ option: opt, groupName: item.group });
        }
      } else {
        list.push({ option: item });
      }
    }
    return list;
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return flatOptions.find((item) => item.option.value === value)?.option || null;
  }, [flatOptions, value]);

  // Filtered options based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();

    const result: SelectItem<T>[] = [];
    for (const item of options) {
      if (isGroup(item)) {
        const matchingOptions = item.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(query) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
            (opt.badge && opt.badge.toLowerCase().includes(query))
        );
        if (matchingOptions.length > 0) {
          result.push({ group: item.group, options: matchingOptions });
        }
      } else {
        if (
          item.label.toLowerCase().includes(query) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(query)) ||
          (item.badge && item.badge.toLowerCase().includes(query))
        ) {
          result.push(item);
        }
      }
    }
    return result;
  }, [options, searchQuery]);

  // Filtered flat list for keyboard indexing
  const filteredFlatOptions = useMemo(() => {
    const list: SelectOption<T>[] = [];
    for (const item of filteredItems) {
      if (isGroup(item)) {
        for (const opt of item.options) {
          if (!opt.disabled) list.push(opt);
        }
      } else {
        if (!item.disabled) list.push(item);
      }
    }
    return list;
  }, [filteredItems]);

  // Determine whether to show search bar (if explicit or if flatOptions > 7)
  const showSearch = searchable ?? flatOptions.length > 7;

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      // Find current value index in filtered list
      const idx = filteredFlatOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, showSearch, value, filteredFlatOptions]);

  const handleSelect = useCallback(
    (opt: SelectOption<T>) => {
      if (opt.disabled) return;
      onChange(opt.value);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        containerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredFlatOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredFlatOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredFlatOptions.length) {
          handleSelect(filteredFlatOptions[focusedIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('' as unknown as T);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''} ${error ? 'error' : ''} ${
        isOpen ? 'is-open' : ''
      }`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-select-trigger ${mono ? 'mono' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className="custom-select-value">
          {selectedOption ? (
            <div className="custom-select-selected-content">
              {selectedOption.icon && (
                <span className="custom-select-icon">{selectedOption.icon}</span>
              )}
              {selectedOption.badge ? (
                <span
                  className="custom-select-badge"
                  style={{
                    backgroundColor: selectedOption.badgeColor || 'var(--tungsten-dim)',
                    color: selectedOption.badgeColor ? 'var(--page)' : 'var(--tungsten)',
                  }}
                >
                  {selectedOption.badge}
                </span>
              ) : (
                <span className="custom-select-label">{selectedOption.label}</span>
              )}
            </div>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="custom-select-actions">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              className="custom-select-clear-btn"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`custom-select-chevron ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="custom-select-dropdown" ref={listboxRef} role="listbox">
          {/* Search Box if needed */}
          {showSearch && (
            <div className="custom-select-search-wrapper">
              <Search size={14} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="custom-select-options-list">
            {filteredItems.length === 0 ? (
              <div className="custom-select-empty">No options found</div>
            ) : (
              filteredItems.map((item, groupIdx) => {
                if (isGroup(item)) {
                  return (
                    <div key={`group-${groupIdx}`} className="custom-select-group">
                      <div className="custom-select-group-header">{item.group}</div>
                      {item.options.map((opt) => {
                        const isSelected = opt.value === value;
                        const isFocused =
                          filteredFlatOptions[focusedIndex]?.value === opt.value;
                        return (
                          <div
                            key={String(opt.value)}
                            className={`custom-select-option ${isSelected ? 'selected' : ''} ${
                              isFocused ? 'focused' : ''
                            } ${opt.disabled ? 'disabled' : ''} ${mono ? 'mono' : ''}`}
                            onClick={() => handleSelect(opt)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="custom-select-option-content">
                              {opt.icon && <span className="custom-select-icon">{opt.icon}</span>}
                              <div className="custom-select-option-text">
                                <div className="custom-select-option-main">
                                  {opt.badge ? (
                                    <span
                                      className="custom-select-badge"
                                      style={{
                                        backgroundColor: opt.badgeColor || 'var(--tungsten-dim)',
                                        color: opt.badgeColor ? 'var(--page)' : 'var(--tungsten)',
                                      }}
                                    >
                                      {opt.badge}
                                    </span>
                                  ) : (
                                    <span>{opt.label}</span>
                                  )}
                                </div>
                                {opt.sublabel && (
                                  <div className="custom-select-sublabel">{opt.sublabel}</div>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={15} className="custom-select-check-icon" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  const isSelected = item.value === value;
                  const isFocused = filteredFlatOptions[focusedIndex]?.value === item.value;
                  return (
                    <div
                      key={String(item.value)}
                      className={`custom-select-option ${isSelected ? 'selected' : ''} ${
                        isFocused ? 'focused' : ''
                      } ${item.disabled ? 'disabled' : ''} ${mono ? 'mono' : ''}`}
                      onClick={() => handleSelect(item)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="custom-select-option-content">
                        {item.icon && <span className="custom-select-icon">{item.icon}</span>}
                        <div className="custom-select-option-text">
                          <div className="custom-select-option-main">
                            {item.badge ? (
                              <span
                                className="custom-select-badge"
                                style={{
                                  backgroundColor: item.badgeColor || 'var(--tungsten-dim)',
                                  color: item.badgeColor ? 'var(--page)' : 'var(--tungsten)',
                                }}
                              >
                                {item.badge}
                              </span>
                            ) : (
                              <span>{item.label}</span>
                            )}
                          </div>
                          {item.sublabel && (
                            <div className="custom-select-sublabel">{item.sublabel}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={15} className="custom-select-check-icon" />}
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
