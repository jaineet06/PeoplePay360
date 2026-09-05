import React from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between',
        className
      )}
      {...props}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold text-slate-900 dark:text-slate-100', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
