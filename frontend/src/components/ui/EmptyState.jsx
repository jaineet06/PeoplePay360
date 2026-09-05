import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria at this time.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
