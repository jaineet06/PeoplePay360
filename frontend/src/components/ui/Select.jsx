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
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
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
              'block w-full rounded-md border text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 text-sm',
              'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed',
              dense ? 'py-1 pl-2.5 pr-8 text-xs' : 'py-2 pl-3 pr-8',
              error
                ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-900/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="dark:bg-slate-900 dark:text-slate-100">
                {opt.label}
              </option>
            ))}
            {children}
          </select>
        </div>

        {error && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
