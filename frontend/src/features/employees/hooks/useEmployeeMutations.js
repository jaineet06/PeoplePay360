import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';
import { toast } from '@/components/ui/Toast';
import { handleApiError } from '@/utils/handleApiError';

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await employeeApi.create(payload);
      return response.data; // { employee, user?, tempPassword?, tempPasswordNote? }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      toast.success(
        `Employee "${data.employee.fullName}" (${data.employee.employeeCode}) created successfully.`
      );
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await employeeApi.update(id, payload);
      return response.data.employee;
    },
    onSuccess: (updatedEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['employee', updatedEmployee.id] });
      toast.success(`Employee "${updatedEmployee.fullName}" updated successfully.`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await employeeApi.remove(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-kanban'] });
      toast.success('Employee record removed successfully.');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}
