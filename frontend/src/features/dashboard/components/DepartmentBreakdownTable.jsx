import React from 'react';
import { Building2, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export function DepartmentBreakdownTable({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  const validData = (data || []).filter((d) => Number(d.value) > 0 || d.payslipCount > 0);
  const totalPayroll = validData.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const totalEmployees = validData.reduce((sum, d) => sum + (d.payslipCount || 0), 0);

  if (validData.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-brand-600" />
          Department Headcount &amp; Cost Distribution
        </h3>
        <div className="py-8">
          <EmptyState
            icon={Building2}
            title="No department data"
            description="No department breakdown is available for the active filter."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Department Headcount &amp; Cost Distribution
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Payroll share and headcount allocation across active business units
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {totalEmployees} Processed
          </span>
          <div className="text-[10px] text-slate-400 dark:text-slate-400">Total Headcount</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3 text-right">Processed Headcount</th>
              <th className="py-2.5 px-3 text-right">Net Compensation</th>
              <th className="py-2.5 px-3 text-right w-36">Payroll Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {validData.map((row) => {
              const rowVal = Number(row.value || 0);
              const sharePct = totalPayroll > 0 ? ((rowVal / totalPayroll) * 100).toFixed(1) : 0;

              return (
                <tr key={row.departmentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {row.label}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {row.departmentCode}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {row.payslipCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(rowVal)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-brand-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(2, sharePct))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                        {sharePct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
