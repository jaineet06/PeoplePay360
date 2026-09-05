import React from 'react';
import { CalendarCheck2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function AttendanceTimeOffOverview({ summaryData, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const breakdown = summaryData?.attendanceHealth?.breakdown || {};
  const present = breakdown.PRESENT ?? 0;
  const late = breakdown.LATE ?? 0;
  const overtime = breakdown.OVERTIME ?? 0;
  const earlyLeave = breakdown.EARLY_LEAVE ?? 0;
  const halfDay = breakdown.HALF_DAY ?? 0;
  const absent = breakdown.ABSENT ?? 0;
  const total = (summaryData?.attendanceHealth?.total) || (present + late + overtime + earlyLeave + halfDay + absent) || 0;

  const stats = [
    { label: 'Present (On-Time)', count: present, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', pct: total > 0 ? ((present / total) * 100).toFixed(0) : 0 },
    { label: 'Late Arrival', count: late, color: 'text-amber-700 bg-amber-50 border-amber-200', pct: total > 0 ? ((late / total) * 100).toFixed(0) : 0 },
    { label: 'Overtime Shift', count: overtime, color: 'text-indigo-700 bg-indigo-50 border-indigo-200', pct: total > 0 ? ((overtime / total) * 100).toFixed(0) : 0 },
    { label: 'Early Departure', count: earlyLeave, color: 'text-sky-700 bg-sky-50 border-sky-200', pct: total > 0 ? ((earlyLeave / total) * 100).toFixed(0) : 0 },
    { label: 'Half-Day Shift', count: halfDay, color: 'text-purple-700 bg-purple-50 border-purple-200', pct: total > 0 ? ((halfDay / total) * 100).toFixed(0) : 0 },
    { label: 'Unexcused Absent', count: absent, color: 'text-rose-700 bg-rose-50 border-rose-200', pct: total > 0 ? ((absent / total) * 100).toFixed(0) : 0 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Attendance &amp; Workforce Activity Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Distribution of worked shifts and status classifications across logged attendance
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
          {total} Total Logs
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border flex flex-col justify-between ${s.color}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
              {s.label}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-extrabold">{s.count}</span>
              <span className="text-[10px] font-semibold opacity-75">{s.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
