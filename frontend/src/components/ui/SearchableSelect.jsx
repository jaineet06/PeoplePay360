import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  error,
  helperText,
  required = false,
  disabled = false,
  className,
  onSearchChange,
  id,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxHeight = 256;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.top + rect.height + 4 }),
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current?.contains(event.target) ||
        event.target.closest('[data-searchable-select-dropdown]')
      ) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const matchLabel = opt.label?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSub = opt.subtext?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLabel || matchSub;
  });

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.('');
    setSearchTerm('');
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  const dropdownPanel = isOpen ? (
    <div
      data-searchable-select-dropdown
      style={dropdownStyle}
      className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-dropdown max-h-64 overflow-hidden flex flex-col animate-in fade-in-50 duration-100"
    >
      <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchInput}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 rounded border border-brand-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-48 overscroll-contain divide-y divide-slate-50 dark:divide-slate-800">
        {filteredOptions.length === 0 ? (
          <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">No options found</div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors',
                  isSelected && 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium'
                )}
              >
                <div className="min-w-0">
                  <div className="text-slate-800 dark:text-slate-200 truncate">{opt.label}</div>
                  {opt.subtext && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{opt.subtext}</div>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 ml-2" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn('w-full relative', className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between rounded-md border text-left bg-white dark:bg-slate-900 py-2 px-3 text-sm shadow-subtle transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400',
            disabled && 'bg-slate-50 dark:disabled:bg-slate-800 text-slate-400 dark:text-slate-400 cursor-not-allowed',
            error
              ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300 bg-rose-50/20 dark:bg-rose-900/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          )}
        >
          <span
            className={cn(
              'truncate font-medium',
              selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400 font-normal'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0 ml-2 transition-transform duration-150',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {selectedOption && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}

      {dropdownPanel && createPortal(dropdownPanel, document.body)}
    </div>
  );
}
