import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';

export function useEmployeeKanban(params = {}) {
  const { groupBy = 'status', search, departmentId } = params;

  return useQuery({
    queryKey: ['employees-kanban', { groupBy, search, departmentId }],
    queryFn: async () => {
      const response = await employeeApi.list({
        groupBy,
        ...(search ? { search } : {}),
        ...(departmentId ? { departmentId } : {}),
      });
      return response.data;
    },
    staleTime: 30_000,
  });
}
