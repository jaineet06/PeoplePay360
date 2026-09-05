import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';

export function useDashboardSummary(params = {}) {
  return useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: async () => {
      const res = await dashboardApi.getSummary(params);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useSalaryByDepartment(params = {}) {
  return useQuery({
    queryKey: ['dashboard-salary-by-dept', params.period],
    queryFn: async () => {
      const res = await dashboardApi.getSalaryByDepartment(params);
      return res.data?.chart || [];
    },
    staleTime: 30_000,
  });
}

export function useMonthlyTrend(params = {}) {
  return useQuery({
    queryKey: ['dashboard-monthly-trend', params],
    queryFn: async () => {
      const res = await dashboardApi.getMonthlyTrend(params);
      return res.data?.chart || [];
    },
    staleTime: 30_000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const res = await dashboardApi.getAlerts();
      return res.data?.alerts || [];
    },
    staleTime: 30_000,
  });
}
