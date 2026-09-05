import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-44">
        <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
          <span>Cycle: {label}</span>
          <span className="text-[10px] text-brand-400 font-semibold uppercase">Disbursed</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Net Disbursed:</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(data.value)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Active Payslips:</span>
            <span className="font-medium text-slate-200">{data.payslipCount}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function MonthlySalaryTrendChart({ data = [], isLoading }) {
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

  const validData = (data || []).map((d) => ({
    ...d,
    numericValue: Number(d.value) || 0,
  }));
  const hasData = validData.length > 0 && validData.some((d) => d.numericValue > 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            Monthly Net Salary Trend
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Disbursement trajectory across recent pay cycles
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Cycle Trend
        </span>
      </div>

      <div className="pt-4 h-72">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={TrendingUp}
              title="No historical trend data"
              description="Historical payrun data is currently unavailable for this filter selection."
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={validData}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
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
              <Area
                type="monotone"
                dataKey="numericValue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salaryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
