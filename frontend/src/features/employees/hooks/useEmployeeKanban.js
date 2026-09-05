import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';

export function useEmployeeKanban({ groupBy = 'status', search = '', departmentId = '' } = {}) {
  return useQuery({
    queryKey: ['employees-kanban', { groupBy, search, departmentId }],
    queryFn: async () => {
      const response = await employeeApi.list({
        groupBy,
        ...(search ? { search } : {}),
        ...(departmentId ? { departmentId } : {}),
      });
      return response.data; // { groupBy, groups: [...], meta }
    },
    staleTime: 30_000,
  });
}
