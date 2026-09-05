import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';

export function useEmployeeContracts(id, params = {}) {
  return useQuery({
    queryKey: ['employee-contracts', id, params],
    queryFn: async () => {
      const res = await employeeApi.listContracts(id, params);
      return res; // { data: [...], meta }
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useEmployeeAttendance(id, params = {}) {
  return useQuery({
    queryKey: ['employee-attendance', id, params],
    queryFn: async () => {
      const res = await employeeApi.listAttendance(id, params);
      return res;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useEmployeeTimeOff(id, params = {}) {
  return useQuery({
    queryKey: ['employee-time-off', id, params],
    queryFn: async () => {
      const res = await employeeApi.listTimeOffRequests(id, params);
      return res;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useEmployeeAllocations(id, params = {}) {
  return useQuery({
    queryKey: ['employee-allocations', id, params],
    queryFn: async () => {
      const res = await employeeApi.listAllocations(id, params);
      return res;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
