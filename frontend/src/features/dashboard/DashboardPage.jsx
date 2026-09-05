import React, { useState } from 'react';
import {
  LayoutDashboard,
  RotateCw,
  CalendarCheck2,
  CircleDollarSign,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';
import {
  useDashboardSummary,
  useSalaryByDepartment,
  useMonthlyTrend,
  useDashboardAlerts,
} from './hooks/useDashboard';
import { DashboardFilters } from './components/DashboardFilters';
import { KpiCards } from './components/KpiCards';
import { OperationalAlertsPanel } from './components/OperationalAlertsPanel';
import { SalaryByDepartmentChart } from './components/SalaryByDepartmentChart';
import { MonthlySalaryTrendChart } from './components/MonthlySalaryTrendChart';
import { AttendanceTimeOffOverview } from './components/AttendanceTimeOffOverview';
import { DepartmentBreakdownTable } from './components/DepartmentBreakdownTable';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Filters state
  const [period, setPeriod] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Queries (fire independently so fast queries don't wait for slower ones)
  const queryParams = {
    ...(period ? { period } : {}),
    ...(departmentId ? { departmentId } : {}),
  };

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useDashboardSummary(queryParams);

  const {
    data: deptSalaryData = [],
    isLoading: isDeptSalaryLoading,
    refetch: refetchDeptSalary,
  } = useSalaryByDepartment({ period: period || undefined });

  const {
    data: trendData = [],
    isLoading: isTrendLoading,
    refetch: refetchTrend,
  } = useMonthlyTrend({ departmentId: departmentId || undefined, months: 12 });

  const {
    data: alertsData = [],
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useDashboardAlerts();

  const handleRefreshAll = () => {
    refetchSummary();
    refetchDeptSalary();
    refetchTrend();
    refetchAlerts();
  };

  const handleResetFilters = () => {
    setPeriod('');
    setDepartmentId('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-brand-600" />
              Payroll &amp; HR Overview
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce expenditure, disbursement trends, and operational alerts for {user?.role ? user.role.replace(/_/g, ' ') : 'Management'}.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RotateCw}
            onClick={handleRefreshAll}
            isLoading={isSummaryRefetching}
            title="Refresh all metrics"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters
        period={period}
        onPeriodChange={setPeriod}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        onReset={handleResetFilters}
      />

      {/* Top 5 KPI Cards */}
      <KpiCards data={summaryData} isLoading={isSummaryLoading} />

      {/* Operational Attention Alerts */}
      <OperationalAlertsPanel alerts={alertsData} isLoading={isAlertsLoading} />

      {/* Charts Grid: Bar Chart & Monthly Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalaryByDepartmentChart
          data={deptSalaryData}
          isLoading={isDeptSalaryLoading}
        />
        <MonthlySalaryTrendChart
          data={trendData}
          isLoading={isTrendLoading}
        />
      </div>

      {/* Attendance & Activity Status Breakdown */}
      <AttendanceTimeOffOverview
        summaryData={summaryData}
        isLoading={isSummaryLoading}
      />

      {/* Department Headcount & Payroll Expenditure Table */}
      <DepartmentBreakdownTable
        data={deptSalaryData}
        isLoading={isDeptSalaryLoading}
      />
    </div>
  );
}

export default DashboardPage;
