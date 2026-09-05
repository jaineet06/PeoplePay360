import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Pagination({
  meta = { page: 1, limit: 20, total: 0, totalPages: 1 },
  onPageChange,
  onLimitChange,
  className,
}) {
  const { page = 1, limit = 20, total = 0, totalPages = 1 } = meta;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-white border-t border-slate-200 text-xs text-slate-600',
        className
      )}
    >
      {/* Records Count & Limit Select */}
      <div className="flex items-center space-x-3">
        <span>
          Showing <span className="font-semibold text-slate-800">{startRecord}</span> to{' '}
          <span className="font-semibold text-slate-800">{endRecord}</span> of{' '}
          <span className="font-semibold text-slate-800">{total}</span> results
        </span>

        {onLimitChange && (
          <div className="flex items-center space-x-1 pl-3 border-l border-slate-200">
            <span className="text-slate-400">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded border border-slate-200 py-0.5 px-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded border border-slate-200 text-slate-600 bg-white transition-colors',
            'hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          )}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-1 text-slate-400">
                ...
              </span>
            );
          }

          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'inline-flex items-center justify-center h-8 min-w-[32px] px-2 rounded text-xs font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white border border-brand-600'
                  : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded border border-slate-200 text-slate-600 bg-white transition-colors',
            'hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          )}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
