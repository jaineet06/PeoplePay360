import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-subtle border border-transparent focus:ring-brand-500',
  secondary:
    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 border border-slate-200 dark:border-slate-700 focus:ring-slate-400',
  outline:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-subtle focus:ring-brand-500',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent focus:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-subtle border border-transparent focus:ring-rose-500',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-subtle border border-transparent focus:ring-emerald-500',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs font-medium rounded',
  sm: 'h-8 px-3 text-xs font-medium rounded-md',
  md: 'h-9 px-4 text-sm font-medium rounded-md',
  lg: 'h-10 px-5 text-sm font-medium rounded-md',
};

export const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-current" />
        ) : LeftIcon ? (
          <LeftIcon className="h-4 w-4 mr-2 -ml-0.5 text-current shrink-0" />
        ) : null}

        <span>{children}</span>

        {!isLoading && RightIcon ? (
          <RightIcon className="h-4 w-4 ml-2 -mr-0.5 text-current shrink-0" />
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
