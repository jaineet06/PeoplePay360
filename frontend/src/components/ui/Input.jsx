import React, { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      id,
      required,
      dense = false,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-md shadow-subtle">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-md border text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-400 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 text-sm',
              'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed',
              dense ? 'py-1 px-2.5 text-xs' : 'py-2 px-3',
              LeftIcon ? 'pl-9' : '',
              RightIcon ? 'pr-9' : '',
              error
                ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-900/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
              className
            )}
            {...props}
          />

          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              <RightIcon className="h-4 w-4" />
            </div>
          )}
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

Input.displayName = 'Input';
