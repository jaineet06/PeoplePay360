import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TableRowSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  sortBy,
  order = 'asc',
  onSort,
  meta,
  onPageChange,
  onLimitChange,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your filters.',
  emptyAction,
  onRowClick,
  className,
}) {
  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    onSort(col.key);
  };

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Scrollable table container with responsive overflow */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleHeaderClick(col)}
                    className={cn(
                      'py-3 px-4 select-none whitespace-nowrap',
                      col.sortable && 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors',
                      col.headerClassName
                    )}
                  >
                    <div className="inline-flex items-center space-x-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            order === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 hover:text-slate-600 dark:hover:text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <TableRowSkeleton columns={columns.length} rows={5} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-none shadow-none"
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const rowKey = row.id || rowKeyExtractor(row) || rowIdx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-100',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${rowKey}-${col.key}`}
                        className={cn('py-3 px-4 align-middle', col.className)}
                      >
                        {col.render
                          ? col.render(row[col.key], row, rowIdx)
                          : row[col.key] !== null && row[col.key] !== undefined
                          ? String(row[col.key])
                          : '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {meta && (
        <Pagination
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}

function rowKeyExtractor(row) {
  return row?.id || row?.code || row?.employeeCode;
}
