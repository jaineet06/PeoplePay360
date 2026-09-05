import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CreditCard,
  Clock,
  FileCheck2,
  Copy,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

const ALERT_CONFIGS = {
  MISSING_BANK_DETAILS: {
    label: 'Missing Bank Details',
    description: 'Active personnel without verified account/IFSC information',
    icon: CreditCard,
    link: '/employees',
    badgeVariant: 'warning',
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  PENDING_TIME_OFF: {
    label: 'Pending Leave Requests',
    description: 'Submitted time-off applications awaiting management decision',
    icon: Clock,
    link: '/time-off',
    badgeVariant: 'primary',
    colorClasses: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  CONTRACTS_EXPIRING_SOON: {
    label: 'Contracts Expiring Soon',
    description: 'Agreements with termination dates within the next 30 days',
    icon: FileCheck2,
    link: '/contracts',
    badgeVariant: 'danger',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  DUPLICATE_PAYSLIPS: {
    label: 'Duplicate Payslip Warnings',
    description: 'Multiple active payslips detected for an employee in single cycle',
    icon: Copy,
    link: '/payroll',
    badgeVariant: 'danger',
    colorClasses: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function OperationalAlertsPanel({ alerts = [], isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const alertMap = Object.fromEntries((alerts || []).map((a) => [a.type, a.count]));

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Operational &amp; Compliance Attention Items
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time validation alerts requiring HR and payroll intervention
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Action Needed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(ALERT_CONFIGS).map(([type, config]) => {
          const count = alertMap[type] ?? 0;
          const Icon = config.icon;
          const hasIssues = count > 0;

          return (
            <button
              key={type}
              type="button"
              onClick={() => navigate(config.link)}
              className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 group hover:shadow-xs ${
                hasIssues
                  ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                  : 'bg-white border-slate-100 hover:bg-slate-50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${config.colorClasses}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <Badge
                  variant={hasIssues ? (config.badgeVariant || 'warning') : 'neutral'}
                  size="sm"
                >
                  {count} {count === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                  <span>{config.label}</span>
                  <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
