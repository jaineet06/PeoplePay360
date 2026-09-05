import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const response = await employeeApi.list(params);
      return response; // { success: true, data: [...], meta: { page, limit, total, totalPages } }
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });
}
