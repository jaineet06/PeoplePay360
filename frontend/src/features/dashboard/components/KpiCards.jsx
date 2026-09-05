import React from 'react';
import {
  CircleDollarSign,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

export function KpiCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const totalNet = data?.totalNetSalary ?? 0;
  const payslipCount = data?.payslipCount ?? 0;
  const avgSalary = data?.averageSalary ?? 0;
  const approvedLeaves = data?.approvedTimeOffCount ?? 0;
  const attendanceHealth = data?.attendanceHealth || { score: 100, total: 0, breakdown: {} };
  const healthScore = isNaN(attendanceHealth.score) ? 100 : attendanceHealth.score;

  const cards = [
    {
      title: 'Total Net Salary Paid',
      value: formatCurrency(totalNet),
      subtitle: 'Net compensation disbursed',
      icon: CircleDollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
    {
      title: 'Payslips Generated',
      value: payslipCount.toLocaleString(),
      subtitle: 'Issued pay documentation',
      icon: FileText,
      iconBg: 'bg-brand-50 text-brand-600',
      borderAccent: 'border-l-4 border-l-brand-500',
    },
    {
      title: 'Average Net Salary',
      value: formatCurrency(avgSalary),
      subtitle: 'Per employee per pay cycle',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600',
      borderAccent: 'border-l-4 border-l-indigo-500',
    },
    {
      title: 'Approved Time Off',
      value: `${approvedLeaves} days`,
      subtitle: 'Approved leave duration',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      borderAccent: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Attendance Health',
      value: `${healthScore}%`,
      subtitle: `${attendanceHealth.total || 0} total attendance logs`,
      icon: Activity,
      iconBg: healthScore >= 80 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600',
      borderAccent: healthScore >= 80 ? 'border-l-4 border-l-teal-500' : 'border-l-4 border-l-rose-500',
      badge: (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            healthScore >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {healthScore >= 80 ? 'Good' : 'Needs Review'}
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between transition-all duration-150 hover:shadow-xs ${card.borderAccent}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{card.value}</span>
                {card.badge}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
