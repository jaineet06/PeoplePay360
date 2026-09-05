import React from 'react';
import { Filter, X, Calendar, Building2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useDepartmentsLookup } from '@/features/employees/hooks/useLookups';

const PERIOD_OPTIONS = [
  { value: '', label: 'All Periods (Year to Date)' },
  { value: '2026-09', label: 'September 2026 (Current)' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-01', label: 'January 2026' },
];

export function DashboardFilters({
  period,
  onPeriodChange,
  departmentId,
  onDepartmentChange,
  onReset,
}) {
  const { data: departments = [] } = useDepartmentsLookup();

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const hasActiveFilters = Boolean(period || departmentId);

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 shrink-0">
          <Filter className="h-3.5 w-3.5 text-brand-600" />
          <span>Filter Report:</span>
        </div>

        {/* Period Selector */}
        <div className="w-56">
          <Select
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
          />
        </div>

        {/* Department Selector */}
        <div className="w-56">
          <Select
            options={departmentOptions}
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
          />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            leftIcon={X}
            onClick={onReset}
            className="text-slate-500 hover:text-slate-800"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="text-[11px] text-slate-500 shrink-0 hidden lg:block">
        Real-time financial &amp; attendance data
      </div>
    </div>
  );
}
