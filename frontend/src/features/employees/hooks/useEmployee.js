import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';

export function useEmployee(id) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await employeeApi.getById(id);
      return response.data.employee;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useEmployeeMe() {
  return useQuery({
    queryKey: ['employee', 'me'],
    queryFn: async () => {
      const response = await employeeApi.getMe();
      return response.data.employee;
    },
    staleTime: 60_000,
  });
}
