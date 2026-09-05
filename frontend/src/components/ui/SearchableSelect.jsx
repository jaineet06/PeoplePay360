import React, { useState, useRef, useEffect, useId } from 'react';
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
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    e.stopPropagation();
    onChange?.('');
    setSearchTerm('');
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  return (
    <div className={cn('w-full relative', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 mb-1"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-md border text-left bg-white py-2 px-3 text-sm shadow-subtle transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed',
          error
            ? 'border-rose-300 text-rose-900 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-slate-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-150',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white border border-slate-200 shadow-dropdown max-h-64 overflow-hidden flex flex-col animate-in fade-in-50 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchInput}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors',
                      isSelected && 'bg-brand-50 text-brand-700 font-medium'
                    )}
                  >
                    <div>
                      <div className="text-slate-800">{opt.label}</div>
                      {opt.subtext && (
                        <div className="text-[11px] text-slate-400">{opt.subtext}</div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-brand-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
