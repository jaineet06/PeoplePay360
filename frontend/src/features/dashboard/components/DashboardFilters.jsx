import React from 'react';
import { Filter, X, Calendar, Building2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useDepartmentsLookup } from '@/features/employees/hooks/useLookups';

const PERIOD_OPTIONS = buildPeriodOptions();

function buildPeriodOptions() {
  const options = [{ value: '', label: 'All Periods (Year to Date)' }];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    options.push({
      value,
      label: i === 0 ? `${label} (Current)` : label,
    });
  }
  return options;
}

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
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <Filter className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
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
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 hidden lg:block">
        Real-time financial &amp; attendance data
      </div>
    </div>
  );
}
