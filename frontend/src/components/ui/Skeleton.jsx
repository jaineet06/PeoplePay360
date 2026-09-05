import React from 'react';
import { cn } from '@/utils/cn';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/60', className)}
      {...props}
    />
  );
}

export function TableRowSkeleton({ columns = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="py-3 px-4">
              <Skeleton
                className={cn(
                  'h-4',
                  cIdx === 0 ? 'w-24' : cIdx === 1 ? 'w-36' : 'w-20'
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-card">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-3 px-4 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <TableRowSkeleton columns={cols} rows={rows} />
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="h-12 w-full bg-slate-200/60 dark:bg-slate-700/40 rounded-lg" />
      <div className="h-96 w-full bg-slate-200/50 dark:bg-slate-700/30 rounded-xl" />
    </div>
  );
}

/** Skeleton for the notification dropdown list rows */
export function NotifSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" />
          <Skeleton className="h-4 w-4 rounded-full mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
