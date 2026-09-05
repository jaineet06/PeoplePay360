import React from 'react';
import {
  CircleDollarSign,
  FileText,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

export function KpiCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalNet = data?.totalNetSalary ?? 0;
  const payslipCount = data?.payslipCount ?? 0;
  const avgSalary = data?.averageSalary ?? 0;
  const approvedLeaves = data?.approvedTimeOffCount ?? 0;
  const attendanceHealth = data?.attendanceHealth || { score: 100, total: 0, breakdown: {} };
  const healthScore = isNaN(attendanceHealth.score) ? 100 : attendanceHealth.score;

  const secondaryCards = [
    {
      title: 'Payslips Generated',
      value: payslipCount.toLocaleString(),
      subtitle: 'Issued pay documentation',
      icon: FileText,
      iconBg: 'bg-brand-50 text-brand-600',
    },
    {
      title: 'Average Net Salary',
      value: formatCurrency(avgSalary),
      subtitle: 'Per employee per pay cycle',
      icon: TrendingUp,
      iconBg: 'bg-brand-100 text-brand-700',
    },
    {
      title: 'Approved Time Off',
      value: approvedLeaves.toLocaleString(),
      subtitle: 'Approved leave requests',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Attendance Health',
      value: `${healthScore}%`,
      subtitle: `${attendanceHealth.total || 0} attendance logs tracked`,
      icon: Activity,
      iconBg: healthScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      badge: healthScore >= 80 ? 'Good' : 'Needs Review',
      badgeClass:
        healthScore >= 80
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-rose-100 text-rose-800',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary KPI — largest visual weight */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-card border border-brand-700/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
              Total Net Salary Paid
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              {formatCurrency(totalNet)}
            </p>
            <p className="text-xs text-brand-100 mt-2">
              Net compensation disbursed across validated and paid payslips
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <CircleDollarSign className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{card.value}</span>
                {card.badge && (
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
