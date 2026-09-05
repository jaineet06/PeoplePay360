import React, { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      className,
      id,
      required,
      dense = false,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-md shadow-subtle">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full rounded-md border text-slate-900 bg-white transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              dense ? 'py-1 pl-2.5 pr-8 text-xs' : 'py-2 pl-3 pr-8',
              error
                ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
        </div>

        {error && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
