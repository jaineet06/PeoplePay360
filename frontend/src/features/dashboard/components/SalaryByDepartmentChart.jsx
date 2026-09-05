import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Building2, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const BAR_COLORS = [
  '#4f46e5', // Brand 600
  '#6366f1', // Indigo 500
  '#0d9488', // Teal 600
  '#0284c7', // Sky 600
  '#8b5cf6', // Purple 500
  '#f59e0b', // Amber 500
  '#ec4899', // Pink 500
  '#10b981', // Emerald 500
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-44">
        <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
          <span>{data.label}</span>
          <span className="text-[10px] text-slate-400 font-mono">({data.departmentCode})</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Net Expenditure:</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(data.value)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Payslips Processed:</span>
            <span className="font-medium text-slate-200">{data.payslipCount}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function SalaryByDepartmentChart({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const validData = (data || []).filter((d) => Number(d.value) > 0);
  const hasData = validData.length > 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" />
            Salary Expenditure by Department
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total net compensation allocated per department
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Net INR
        </span>
      </div>

      <div className="pt-4 h-72">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Building2}
              title="No payroll records for this filter"
              description="There are no validated or paid payslips for the selected period."
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={validData}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="departmentCode"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {validData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
